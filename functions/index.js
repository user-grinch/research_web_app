const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onCall} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { BigQuery } = require('@google-cloud/bigquery');

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Weights from spec
const IFI_WEIGHTS = {
  ALPHA: 0.35,
  BETA: 0.30,
  GAMMA: 0.20,
  DELTA: 0.15
};

async function computeIFI(sessionId) {
  const metricsSnap = await admin.firestore().collection(`sessions/${sessionId}/metrics`).get();
  
  let totalTaps = 0;
  let totalHits = 0;
  let doubleTapCount = 0;
  let avgReactionTimeSum = 0;
  let tapGamesCount = 0;
  let avgHesitationTimeSum = 0;
  let hesitationGamesCount = 0;
  
  let navConfusion = 0;
  let navGamesCount = 0;

  metricsSnap.forEach(doc => {
    const data = doc.data();
    const m = data.derived_metrics || {};
    const gameId = data.game_id;

    if (gameId === 'tap_accuracy_easy' || gameId === 'tap_accuracy_hard') {
      totalTaps += m.total_taps || 0;
      totalHits += m.successful_taps || 0;
      doubleTapCount += m.double_tap_count || 0;
      if (m.avg_reaction_time_ms) {
        avgReactionTimeSum += m.avg_reaction_time_ms;
        tapGamesCount++;
        avgHesitationTimeSum += m.avg_reaction_time_ms;
        hesitationGamesCount++;
      }
    }

    if (gameId === 'thumb_zone_easy' || gameId === 'thumb_zone_hard') {
        if (m.avg_time_to_first_touch_ms) {
            avgHesitationTimeSum += m.avg_time_to_first_touch_ms;
            hesitationGamesCount++;
        }
    }

    if (gameId === 'nav_maze_easy' || gameId === 'nav_maze_hard') {
      navConfusion += m.navigation_confusion || 0;
      navGamesCount++;
    }
  });

  // Calculate TAS (Touch Accuracy Score)
  const tas = totalTaps > 0 ? (totalHits / totalTaps) : 1.0;
  
  // Calculate RR (Retry Rate normalized)
  // Assuming retry rate is double taps / total taps
  const rr = totalTaps > 0 ? Math.min(doubleTapCount / totalTaps, 1.0) : 0;
  
  // Calculate HT_norm (Hesitation Time normalized)
  // Using avg hesitation time vs a baseline of 500ms for demo
  const avgHesitationTime = hesitationGamesCount > 0 ? (avgHesitationTimeSum / hesitationGamesCount) : 0;
  const htNorm = Math.min(avgHesitationTime / 500.0, 1.0);
  
  // Calculate NC (Navigation Confusion normalized)
  const nc = navGamesCount > 0 ? (navConfusion / navGamesCount) : 0;

  // IFI = 0.35(1 - TAS) + 0.30*RR + 0.20*HT_norm + 0.15*NC
  const ifi = IFI_WEIGHTS.ALPHA * (1 - tas) + 
              IFI_WEIGHTS.BETA * rr + 
              IFI_WEIGHTS.GAMMA * htNorm + 
              IFI_WEIGHTS.DELTA * nc;

  return Math.min(Math.max(ifi, 0), 1);
}

function evaluateRulesOrModel(metrics, ifi) {
  if (ifi >= 0.75) {
    return {
      label: "Accessibility_UI",
      rule: { action: "enable_high_contrast", params: { theme: "high_contrast" } }
    };
  } else if (ifi >= 0.5) {
    if (metrics.tap_accuracy !== undefined && metrics.tap_accuracy < 0.6) {
      return {
        label: "Large_Button_UI",
        rule: { action: "increase_button_size", params: { scale: 1.25 } }
      };
    }
    return {
      label: "Simplified_UI",
      rule: { action: "flatten_navigation", params: { maxDepth: 1 } }
    };
  } else if (ifi >= 0.25) {
    return {
      label: "Large_Font_UI",
      rule: { action: "increase_font_size", params: { fontSizeDeltaPx: 2 } }
    };
  }

  return {
    label: "Default_UI",
    rule: null
  };
}

exports.onMetricsWrite = onDocumentCreated("sessions/{sessionId}/metrics/{metricId}", async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const latestMetrics = data.derived_metrics || {};
    const sessionId = event.params.sessionId;
    const sessionRef = admin.firestore().doc(`sessions/${sessionId}`);

    // Compute IFI across all metrics for this session
    const updatedIfi = await computeIFI(sessionId);

    await sessionRef.update({ ifi: updatedIfi });

    // ML inference / Rule engine evaluation
    const recommendation = evaluateRulesOrModel(latestMetrics, updatedIfi);

    await sessionRef.update({
      recommended_ui: recommendation.label,
      recommendation_details: recommendation
    });
});

exports.generateRecommendation = onCall(async (request) => {
    const features = request.data.features || {};
    const ifi = request.data.ifi || 0;
    return evaluateRulesOrModel(features, ifi);
});

exports.exportToBigQuery = onSchedule("every 24 hours", async (event) => {
    console.log("Running export to BigQuery...");
    const bigquery = new BigQuery();
    const datasetId = 'research_dataset';
    const tableId = 'sessions';
    
    // In a real scenario we would query recent closed sessions and stream them to BQ.
    // This is a stub implementation as requested by spec.
    try {
        const sessionsSnap = await admin.firestore().collection('sessions')
          .where('applied_ui', '!=', null).get();
        
        const rows = [];
        for (const doc of sessionsSnap.docs) {
            const data = doc.data();
            const userSnap = await admin.firestore().doc(`users/${data.user_id}`).get();
            const userData = userSnap.data() || {};
            
            rows.push({
                user_id: data.user_id,
                session_id: doc.id,
                ifi: data.ifi,
                label: data.applied_ui,
                age: userData.age,
                device_os: userData.device_os
            });
        }

        if (rows.length > 0) {
            await bigquery.dataset(datasetId).table(tableId).insert(rows);
            console.log(`Inserted ${rows.length} rows into BigQuery`);
        }
    } catch (err) {
        console.error('BigQuery export error:', err);
    }
});
