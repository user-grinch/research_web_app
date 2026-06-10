import { v4 as uuidv4 } from 'uuid';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const createSession = async (userId: string) => {
    const sessionId = uuidv4();
    const sessionRef = doc(db, `sessions/${sessionId}`);
    
    const savePromise = setDoc(sessionRef, {
        user_id: userId,
        started_at: serverTimestamp(),
        ended_at: null,
        mode: "experiment",
        ifi: null,
        recommended_ui: null,
        applied_ui: null
    });

    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore write timed out after 5 seconds.")), 5000)
    );

    await Promise.race([savePromise, timeoutPromise]);

    return sessionId;
};
