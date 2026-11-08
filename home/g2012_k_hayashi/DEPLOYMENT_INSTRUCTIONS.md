
# 【初心者向け】デプロイ＆設定手順書（Cloud Shell対応版）

こんにちは！この手順書は、1日の投稿数が上限（100件）に達した場合に、自動で投稿機能を停止し、毎日朝5時に自動で元に戻すためのバックエンド機能（縁の下の力持ち）を設定するためのガイドです。

このガイドは、お客様のPCの環境に左右されない、**Webブラウザだけで完結する「Cloud Shell」**を使った方法です。

**【ご用意いただくもの】**
*   **Webブラウザ**: Google ChromeやSafariなど、普段お使いのもので大丈夫です。
*   **Google Cloudの請求先アカウント**: クレジットカード情報などを登録した支払いアカウントが必要です。
    *   **ご安心ください**: 今回設定する機能は、Googleの**寛大な無料枠の範囲内で動作する**ため、小規模な利用で実際に料金が請求される可能性は極めて低いです。設定のために「請求先アカウント」へのリンクが必須となっています。

---

## ステップ1：Cloud Shellを起動して準備しよう

まず、ブラウザ上でGoogle Cloudに命令を出すためのターミナル（Cloud Shell）を準備します。

1.  **Cloud Shellを起動する**
    *   Webブラウザで、このプロジェクトの[Google Cloudコンソール](https://console.cloud.google.com/)を開きます。
    *   画面右上のヘッダーにある、四角い箱に `>_` と書かれたアイコン（「**ターミナルをアクティブにする**」と表示されます）をクリックしてください。
    *   画面の下部に、黒い背景のターミナル画面（Cloud Shell）が起動します。「続行」をクリックしてください。

2.  **プロジェクトのファイルを作成する**
    *   Cloud Shellが起動したら、以下のコマンドを**1行ずつコピー＆ペースト**して、それぞれEnterキーを押してください。
        ```bash
        mkdir inhouse-app && cd inhouse-app
        ```
    *   **解説**: `inhouse-app`という名前の、作業用の空フォルダを作成して、その中に移動しています。

3.  **Firebaseプロジェクトの「表札」を作成する**
    *   続けて、以下の**2つのコマンドを順番に**実行してください。これは、今いる場所がどのFirebaseプロジェクトに紐づくのかを教えるための「表札」ファイルを作成する作業です。
    *   **コマンド1 (`firebase.json`の作成):**
        ```bash
        cat <<'EOT' > firebase.json
        {
          "functions": {
            "source": "functions"
          }
        }
        EOT
        ```
    *   **コマンド2 (`.firebaserc`の作成):**
        ```bash
        cat <<'EOT' > .firebaserc
        {
          "projects": {
            "default": "inhouse-connect"
          }
        }
        EOT
        ```

4.  **バックエンド機能のコードを作成する**
    *   以下のコマンドで、バックエンド機能のコードが入る `functions` フォルダを作成し、そこに移動します。
        ```bash
        mkdir functions && cd functions
        ```
    *   続けて、以下の**2つの長いコマンドを順番に**実行し、コードの設計図(`package.json`)と本体(`index.js`)を作成します。
    *   **コマンド1 (`package.json`の作成):**
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
    *   **コマンド2 (`index.js`の作成):**
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
        EOT
        ```
    *   **解説**: これで、Cloud Shell上にデプロイに必要な全てのファイルが作成されました。

---

## ステップ2：【重要・手動操作】Firestoreにファイルを手動で作成する

プログラムが正しく動くために、データベース（Firestore）に以下の**2つのファイル（ドキュメント）**を手動で作成する必要があります。

1.  **書き込みスイッチ用のファイルを作成する**
    *   Firebaseコンソールの左側メニュー「構築」＞「**Firestore Database**」に移動します。
    *   「**+ コレクションを開始**」をクリック
        *   コレクションID: `config` →「次へ」
        *   ドキュメントID: `runtime-limits`
        *   フィールドの追加:
            *   フィールド名: `writes_enabled`, タイプ: `boolean`, 値: `true`
            *   フィールド名: `reason`, タイプ: `string`, 値: `Initial setup`
        *   「保存」をクリックします。

2.  **投稿カウンター用のファイルを作成する**
    *   「**+ コレクションを開始**」を再度クリック
        *   コレクションID: `counters` →「次へ」
        *   ドキュメントID: `writes_daily`
        *   フィールドの追加:
            *   フィールド名: `count`, タイプ: `number`, 値: `0`
            *   フィールド名: `lastUpdated`, タイプ: `timestamp`, 値: (現在の日時でOK)
        *   「保存」をクリックします。

---

## ステップ3：プログラムをクラウドにアップロード（デプロイ）しよう

いよいよ、作成したバックエンドのコードをGoogle Cloudにアップロードします。

1.  **Cloud Functionsの準備**
    *   Cloud Shellで、現在`functions`フォルダの中にいることを確認し、以下のコマンドを実行します。
        ```bash
        npm install
        ```
    *   **【何をしているの？】**: `index.js`が動くために必要な「部品（ライブラリ）」をインターネットからダウンロードしています。

2.  **プロジェクトの場所に戻る**
    *   部品の準備が終わったら、一つ上の階層に戻ります。
        ```bash
        cd ..
        ```

3.  **Cloud Functionsをデプロイする**
    *   最後に、以下のコマンドを実行して、作成した機能をクラウドにアップロードします。
    *   **【重要】**: 初回デプロイ時は、いくつかのAPIを有効化する質問や、請求設定に関するエラーが出ることがあります。その場合は、メッセージに従ってリンクを開き、APIを有効化してください。
    *   **完了まで数分かかる場合があります。**
        ```bash
        firebase deploy --only functions
        ```
    *   `✔  Deploy complete!` という緑色の文字が表示されれば成功です！

---

## ステップ4：正しく動くかテストしてみよう

全てが正しく設定されたかを確認します。

1.  **アプリケーションから新規投稿を行う。**
    *   アプリのUIから新しい投稿を1つ作成してみてください。

2.  **カウンターの確認。**
    *   FirebaseコンソールのFirestoreで、先ほど作成した`/counters/writes_daily`ドキュメントを開きます。
    *   `count`フィールドの値が`0`から`1`に増えていることを確認してください。増えていれば、投稿をカウントする機能は正しく動いています！

3.  **（任意）投稿上限のテスト。**
    *   Cloud Shellで `functions/index.js` ファイルを開くには `nano functions/index.js` と入力します。
    *   `DAILY_WRITE_LIMIT` の値を `100` から `2` のような小さい数に変更します。（`Ctrl+X` → `Y` → `Enter`で保存）
    *   `firebase deploy --only functions` を再度実行して変更を反映させます。
    *   アプリから3回目の投稿を試みてください。投稿ボタンが消えているはずです。
    *   同時に、Firestoreの `/config/runtime-limits` ドキュメントの `writes_enabled` が `false` に更新されていることも確認してみてください。
    *   **テストが終わったら、必ず `DAILY_WRITE_LIMIT` を `100` に戻して再度デプロイしてください。**

4.  **自動リセット機能の確認。**
    *   `resetDailyWrites`関数は、毎日日本時間の午前5時に自動実行されるように設定されています。
    *   翌日、カウンター(`count`)が`0`にリセットされ、書き込み停止スイッチ(`writes_enabled`)が`true`に戻っていることを確認してください。

---

以上で全ての設定は完了です！大変お疲れ様でした。
ご不明な点があれば、どのステップで困っているかなど、いつでもお気軽にお尋ねください。
