import { collection, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { db } from './firebase';
import { EVENT_BATCH_FLUSH_INTERVAL_MS } from '../utils/config';

export interface BaseEvent {
    game_id: string;
    event_type: string;
    payload: any;
    client_ts: number;
}

let eventBuffer: BaseEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

export const bufferEvent = (sessionId: string, event: BaseEvent) => {
    eventBuffer.push(event);

    if (!flushTimeout) {
        flushTimeout = setTimeout(() => {
            flushEvents(sessionId);
        }, EVENT_BATCH_FLUSH_INTERVAL_MS);
    }
};

export const flushEvents = async (sessionId: string) => {
    if (eventBuffer.length === 0) return;

    if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
    }

    const eventsToFlush = [...eventBuffer];
    eventBuffer = []; // Clear buffer

    try {
        const batch = writeBatch(db);
        const eventsRef = collection(db, `sessions/${sessionId}/events`);

        eventsToFlush.forEach(event => {
            const newEventRef = doc(eventsRef);
            batch.set(newEventRef, {
                ...event,
                server_ts: serverTimestamp()
            });
        });

        await batch.commit();
        console.log(`Flushed ${eventsToFlush.length} events to Firestore`);
    } catch (error) {
        console.error("Failed to flush events, requeueing...", error);
        // Put them back at the beginning of the buffer
        eventBuffer = [...eventsToFlush, ...eventBuffer];
        
        // Retry with exponential backoff logic would go here
        if (!flushTimeout) {
            flushTimeout = setTimeout(() => {
                flushEvents(sessionId);
            }, EVENT_BATCH_FLUSH_INTERVAL_MS * 2); // Simple backoff
        }
    }
};
