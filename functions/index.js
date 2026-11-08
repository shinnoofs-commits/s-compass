const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();

const DAILY_WRITE_LIMIT = 100;
const THROTTLE_CONFIG_PATH = "config/runtime-limits";
const WRITE_COUNTER_PATH = "counters/writes_daily";
const JAPAN_REGION = "asia-northeast1";

// This single function now handles both incrementing the counter and checking the limit in a safe transaction.
exports.countWrites = onDocumentCreated({document: "posts/{postId}", region: JAPAN_REGION}, async (event) => {
    logger.info(`New post created: ${event.params.postId}. Running countWrites function.`);

    const counterRef = db.doc(WRITE_COUNTER_PATH);
    const throttleRef = db.doc(THROTTLE_CONFIG_PATH);

    try {
        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let currentCount = 0;
            // If counter document exists and has a valid count, use it. Otherwise, start from 0.
            if (counterDoc.exists && typeof counterDoc.data().count === 'number') {
                currentCount = counterDoc.data().count;
            }
            
            const newCount = currentCount + 1;

            // Update the counter with the new count.
            transaction.set(counterRef, {count: newCount, lastUpdated: FieldValue.serverTimestamp()}, {merge: true});
            logger.info(`Counter updated in transaction. New count is ${newCount}.`);

            // Immediately check if the new count has reached the limit.
            if (newCount >= DAILY_WRITE_LIMIT) {
                logger.warn(`Daily write limit of ${DAILY_WRITE_LIMIT} reached. Disabling writes within the same transaction.`);
                // If limit is reached, disable writes in the same transaction.
                transaction.set(throttleRef, {writes_enabled: false, updatedAt: FieldValue.serverTimestamp(), reason: `Daily limit of ${DAILY_WRITE_LIMIT} reached.`}, {merge: true});
            }
        });
        
        logger.info("countWrites transaction completed successfully.");

    } catch (error) {
        logger.error("Error in countWrites transaction:", error);
    }
});


exports.resetDailyWrites = onSchedule({schedule: "every day 05:00", timeZone: "Asia/Tokyo", region: JAPAN_REGION}, async (event) => {
    logger.info("Running daily job to re-enable writes and reset counter.");

    const counterRef = db.doc(WRITE_COUNTER_PATH);
    const throttleRef = db.doc(THROTTLE_CONFIG_PATH);

    try {
        // Re-enable writes and reset the counter to 0.
        await throttleRef.set({writes_enabled: true, updatedAt: FieldValue.serverTimestamp(), reason: "Daily reset."}, {merge: true});
        await counterRef.set({count: 0, lastUpdated: FieldValue.serverTimestamp()}, {merge: true});
        logger.info("Successfully re-enabled writes and reset counter.");
    } catch (error) {
        logger.error("Error in resetDailyWrites:", error);
    }
});

exports.webhookReceiveProductionUpdate = onRequest({ region: JAPAN_REGION }, async (req, res) => {
    // 1. セキュリティチェック（APIキーの検証）
    const authHeader = req.headers.authorization;
    // セキュリティのため、環境変数から共通の秘密鍵（APIキー）を取得（未設定時はデフォルト値）
    const EXPECTED_KEY = process.env.S_COMPASS_API_KEY || 'your_secret_key_here';
    
    if (!authHeader || authHeader !== `Bearer ${EXPECTED_KEY}`) {
      logger.warn('Unauthorized access attempt to webhook');
      res.status(401).send('Unauthorized');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { title, content, targetScope, category, authorInfo } = req.body;

      if (!title || !content) {
        res.status(400).send('Bad Request: title and content are required');
        return;
      }

      // 2. /posts コレクションへ新規投稿を作成
      const newPostRef = db.collection('posts').doc();
      await newPostRef.set({
        title,
        body: content,
        category: category || 'システム通知',
        authorName: authorInfo || 'System Bot',
        authorId: 'system-bot', // 投稿者を区別するためのID
        authorDepartment: '本部',
        status: 'published',
        targetAudience: targetScope ? 'department' : 'all',
        targetDepartment: targetScope || 'all',
        sendToDepartmentMode: 'allInDepartment',
        isImportant: false,
        isPinned: false,
        viewCount: 0,
        commentCount: 0,
        likeCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      logger.info(`Webhook successfully created post ${newPostRef.id} for ${targetScope}`);

      res.status(200).send({ success: true, postId: newPostRef.id });
    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.status(500).send('Internal Server Error');
    }
});
