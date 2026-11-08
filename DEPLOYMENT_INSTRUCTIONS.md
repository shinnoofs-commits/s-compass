# 【最終版】バックエンド機能 デプロイ＆設定手順書

こんにちは！この手順書は、1日の投稿数が上限（100件）に達した場合に、自動で投稿機能を停止し、毎日朝5時に自動でリセットするバックエンド機能（Cloud Functions）を設定するための、最終的なガイドです。

このガイドは、PCの環境に左右されず、**Webブラウザだけで完結する「Cloud Shell」**を使用します。

**【ご用意いただくもの】**
*   **Webブラウザ**: Google ChromeやSafariなど。
*   **Google Cloudの請求先アカウント**: クレジットカード情報などを登録した支払いアカウントが必要です。
    *   **ご安心ください**: 今回設定する機能は、Googleの寛大な**無料枠の範囲内で十分に動作します**。料金が請求される可能性は極めて低いです。

---

## ステップ1：Cloud Shellで作業環境を準備する

まず、まっさらな状態で作業を開始します。

1.  **Cloud Shellを起動する**
    *   Webブラウザで、このプロジェクトの[Google Cloudコンソール](https://console.cloud.google.com/)を開きます。
    *   画面右上の `>_` アイコンをクリックし、画面下部にCloud Shellを起動します。「続行」をクリックしてください。

2.  **（もしあれば）古い作業フォルダを完全に削除する**
    *   以下のコマンドを実行して、以前の作業フォルダを完全に削除し、問題をリセットします。存在しない場合はエラーが出ますが、問題ありません。
        ```bash
        rm -rf ~/inhouse-app
        ```

3.  **新しい作業フォルダを作成し、そこに移動する**
    *   以下のコマンドを実行します。
        ```bash
        mkdir ~/inhouse-app && cd ~/inhouse-app
        ```

---

## ステップ2：設定ファイルとコードを配置する

`cat`コマンドを使い、コピー＆ペーストでファイルを作成していきます。

1.  **Firebaseの基本設定ファイルを作成する**
    *   `firebase.json` を作成します。
        ```bash
        cat <<'EOT' > firebase.json
        {
          "functions": {
            "source": "functions"
          }
        }
        EOT
        ```
    *   `.firebaserc` を作成します。
        ```bash
        cat <<'EOT' > .firebaserc
        {
          "projects": {
            "default": "inhouse-connect"
          }
        }
        EOT
        ```

2.  **Cloud Functionsのコードを配置する**
    *   `functions`フォルダを作成し、そこに移動します。
        ```bash
        mkdir functions && cd functions
        ```
    *   `package.json`（機能の設計図）を作成します。
        ```bash
        cat <<'EOT' > package.json
        {
          "name": "functions",
          "description": "Cloud Functions for Firebase",
          "scripts": {
            "serve": "firebase emulators:start --only functions",
            "shell": "firebase functions:shell",
            "start": "npm run shell",
            "deploy": "firebase deploy --only functions",
            "logs": "firebase functions:log"
          },
          "engines": {
            "node": "20"
          },
          "main": "index.js",
          "dependencies": {
            "firebase-admin": "^12.0.0",
            "firebase-functions": "^5.0.0"
          },
          "devDependencies": {
            "firebase-functions-test": "^3.1.0"
          },
          "private": true
        }
        EOT
        ```
    *   `index.js`（機能の本体）を作成します。
        ```bash
        cat <<'EOT' > index.js
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
        EOT
        ```

---

## ステップ3：【重要・手動操作】Firestoreにファイルを手動で作成する

プログラムが正しく動くために、データベース（Firestore）に以下の**2つのファイル（ドキュメント）**が正しく存在することを確認してください。存在しない場合は、必ず作成してください。

1.  **書き込みスイッチ用のファイル (`runtime-limits`)**
    *   Firebaseコンソールの左側メニュー「構築」＞「**Firestore Database**」に移動します。
    *   「**+ コレクションを開始**」をクリック
        *   コレクションID: `config` →「次へ」
        *   ドキュメントID: `runtime-limits`
        *   フィールドの追加 (1つ目):
            *   フィールド名: `writes_enabled`, タイプ: `boolean`, 値: `true`
        *   フィールドの追加 (2つ目):
            *   フィールド名: `reason`, タイプ: `string`, 値: `Initial setup`
        *   「保存」をクリックします。

2.  **投稿カウンター用のファイル (`writes_daily`)**
    *   「**+ コレクションを開始**」を再度クリック
        *   コレクションID: `counters` →「次へ」
        *   ドキュメントID: `writes_daily`
        *   フィールドの追加 (1つ目):
            *   フィールド名: `count`, タイプ: `number`, 値: `0`
        *   フィールドの追加 (2つ目):
            *   フィールド名: `lastUpdated`, タイプ: `timestamp`, 値: (現在の日時でOK)
        *   「保存」をクリックします。

---

## ステップ4：プログラムをクラウドにアップロード（デプロイ）する

最後に、作成したバックエンドのコードをGoogle Cloudにアップロードします。

1.  **Cloud Functionsの準備**
    *   Cloud Shellで、現在`inhouse-app/functions`フォルダの中にいることを確認し、以下のコマンドを実行します。
        ```bash
        npm install
        ```

2.  **Cloud Functionsをデプロイする**
    *   最後に、以下のコマンドを実行して、作成した機能をクラウドにアップロードします。
    *   **【重要】**: 初回デプロイ時は、いくつかのAPIを有効化する質問が表示されることがあります。その場合は、メッセージに従ってリンクを開き、APIを有効化してください。
    *   **完了まで数分かかる場合があります。**
        ```bash
        firebase deploy --only functions
        ```
    *   `✔  Deploy complete!` という緑色の文字が表示されれば成功です！

---

## ステップ5：動作テスト

全てが正しく設定されたかを確認します。

1.  **カウンターの手動更新テスト**
    *   この実装では、**投稿の作成に連動して**上限チェックが行われます。
    *   テストを行うには、まずFirebaseコンソールのFirestoreで、`/counters/writes_daily`ドキュメントを開きます。
    *   `count`フィールドの値を**`99`**に変更して保存します。
    *   次に、アプリケーションから**新規投稿を1件作成**します。
    *   投稿後、`/counters/writes_daily`の`count`が`100`になり、同時に`/config/runtime-limits`の`writes_enabled`が`false`に変わることを確認してください。

2.  **アプリケーションの表示テスト**
    *   `writes_enabled`が`false`の状態で、社内連絡ツールのホーム画面を再読み込みします。
    *   「新規投稿」ボタンが非表示になっていることを確認してください。

---

以上で全ての設定は完了です！大変お疲れ様でした。
ご不明な点があれば、いつでもお気軽にお尋ねください。
