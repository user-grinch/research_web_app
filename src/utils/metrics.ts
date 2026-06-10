import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export const saveMetrics = async (sessionId: string, gameId: string, derivedMetrics: any) => {
    const metricId = uuidv4();
    const metricRef = doc(db, `sessions/${sessionId}/metrics/${metricId}`);
    
    await setDoc(metricRef, {
        game_id: gameId,
        derived_metrics: derivedMetrics,
        computed_at: serverTimestamp()
    });
};
