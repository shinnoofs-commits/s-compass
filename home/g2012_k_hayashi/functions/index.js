
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();

const DAILY_WRITE_LIMIT = 100;
const THROTTLE_CONFIG_PATH = "config/runtime-limits";
const WRITE_COUNTER_PATH = "counters/writes_daily";
const JAPAN_REGION = "asia-northeast1";

exports.countWrites = onDocumentCreated({document: "posts/{postId}", region: JAPAN_REGION}, async (event) => {
    logger.info(`New post created: ${event.params.postId}. Incrementing daily write counter.`);

    const counterRef = db.doc(WRITE_COUNTER_PATH);
    const throttleRef = db.doc(THROTTLE_CONFIG_PATH);

    try {
        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let currentCount = 0;
            if (counterDoc.exists) {
                currentCount = counterDoc.data().count || 0;
            }
            
            const newCount = currentCount + 1;

            transaction.set(counterRef, {count: newCount, lastUpdated: FieldValue.serverTimestamp()}, {merge: true});

            if (newCount >= DAILY_WRITE_LIMIT) {
                logger.warn(`Daily write limit of ${DAILY_WRITE_LIMIT} reached. Disabling writes.`);
                transaction.set(throttleRef, {writes_enabled: false, updatedAt: FieldValue.serverTimestamp(), reason: `Daily limit of ${DAILY_WRITE_LIMIT} reached.`}, {merge: true});
            }
        });
        
    } catch (error) {
        logger.error("Error in countWrites transaction:", error);
    }
});


exports.resetDailyWrites = onSchedule({schedule: "every day 05:00", timeZone: "Asia/Tokyo", region: JAPAN_REGION}, async (event) => {
    logger.info("Running daily job to re-enable writes and reset counter.");

    const counterRef = db.doc(WRITE_COUNTER_PATH);
    const throttleRef = db.doc(THROTTLE_CONFIG_PATH);

    try {
        await throttleRef.set({writes_enabled: true, updatedAt: FieldValue.serverTimestamp(), reason: "Daily reset."}, {merge: true});
        await counterRef.set({count: 0, lastUpdated: FieldValue.serverTimestamp()}, {merge: true});
        logger.info("Successfully re-enabled writes and reset counter.");
    } catch (error) {
        logger.error("Error in resetDailyWrites:", error);
    }
});
