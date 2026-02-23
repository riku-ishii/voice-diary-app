# おやすみ前の1分 — 音声対話型日記アプリ

寝る前に約1分、声で今日の気持ちを話すだけで感情を整理できるアプリ。

## スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React Native (Expo) + expo-router |
| バックエンド | Node.js + Express 5 + TypeScript |
| AI 会話 | Claude Haiku 4.5 (Anthropic) |
| 音声認識 | Whisper (OpenAI) |
| データ保存 | AsyncStorage（端末ローカル） |
| 状態管理 | Zustand |

---

## 必要なもの

| サービス | 用途 | 取得先 |
|----------|------|--------|
| `ANTHROPIC_API_KEY` | AI会話・感情分析 | [console.anthropic.com](https://console.anthropic.com) |
| `OPENAI_API_KEY` | 音声→テキスト変換 | [platform.openai.com](https://platform.openai.com) |

APIキーを持っていない場合は **デモモード** で動作確認できます（後述）。

---

## セットアップ

### 1. バックエンド

```bash
cd backend
npm install
cp .env.example .env
```

`.env` を開いて API キーを入力：

```
ANTHROPIC_API_KEY=sk-ant-xxxx
OPENAI_API_KEY=sk-xxxx
PORT=3000
```

```bash
npm run dev
# → Server running on port 3000
```

### 2. フロントエンド

```bash
cd frontend
npm install
npm start
```

QRコードが表示されたら iPhone の **Expo Go** アプリで読み込む。

> **実機テストの場合**、`frontend/services/api.ts` の `BASE_URL` を Mac のローカル IP に変更：
> ```ts
> const BASE_URL = 'http://192.168.x.x:3000'; // ← Mac と同じ Wi-Fi が必要
> ```

---

## デモモード（APIキーなしで動作確認）

`.env` に以下を設定するとダミーレスポンスで全画面を確認できます：

```
DEMO_MODE=true
ANTHROPIC_API_KEY=dummy
OPENAI_API_KEY=dummy
PORT=3000
```

| 操作 | デモの動き |
|------|-----------|
| マイクを押す | 固定テキストが発話として処理される |
| AIの返答 | 共感メッセージが順番に返ってくる |
| 「話し終えた」 | 感情カード（疲れ / 平和 / 充実）がランダムで表示 |

---

## 環境変数一覧 (backend/.env)

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Claude API キー | 本番のみ |
| `OPENAI_API_KEY` | OpenAI API キー | 本番のみ |
| `DEMO_MODE` | `true` でダミーレスポンスを返す | デモ時のみ |
| `PORT` | サーバーポート（デフォルト: 3000） | — |

---

## API エンドポイント

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/diary/respond` | 音声ファイルと会話履歴を受け取り、文字起こし＋AI返答を返す |
| POST | `/api/diary/analyze` | テキストから感情ラベル・強度・一言まとめを返す |

---

## 画面構成

```
ホーム (tabs/index)          ← 今日すでに記録済みなら「今日はもう話したね 🌙」表示
  └─ 録音・AI会話 (recording) ← マイクで話す → AI返答 → 「話し終えた」で終了
       └─ 感情まとめ (summary) ← 感情カード表示
            └─ ホームに戻る

週間振り返り (tabs/weekly)   ← 7日分の感情を色丸＋棒グラフで表示（ローカルデータから生成）
```

---

## 感情→色マッピング

| 感情 | 色 | HEX |
|------|-----|-----|
| 喜び | ゴールド | `#FFD700` |
| 充実 | サンセットオレンジ | `#FF8C42` |
| 平和 | スカイブルー | `#87CEEB` |
| 疲れ | ラベンダー | `#7B68EE` |
| 不安 | グレーパープル | `#9B8EA8` |
| 悲しみ | ディープブルー | `#4A5568` |
| 怒り | ダークレッド | `#C53030` |
| 空虚 | ライトグレー | `#CBD5E0` |

---

## リリースロードマップ

### STEP 1：バックエンドをRailwayにデプロイ

家の外・Wi-Fi外でも使えるようにクラウドに上げる。

1. [railway.app](https://railway.app) でアカウント作成（GitHub連携）
2. 「New Project」→「Deploy from GitHub repo」→ このリポジトリを選択
3. Root Directory に `backend` を指定
4. Variables タブで環境変数を設定：
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `PORT` = `3000`
   - ※ `DEMO_MODE` は**設定しない**（本番はリアルAPIを使う）
5. デプロイ完了後、発行された URL を `frontend/services/api.ts` の `BASE_URL` に設定

### STEP 2：Apple Developer登録

App Storeに出すために必要（年間$99）。

1. [developer.apple.com](https://developer.apple.com) でApple IDでログイン
2. Enroll → 個人（Individual）を選択 → 支払い
3. 審査通過まで数日〜1週間

### STEP 3：EAS Buildでアプリをビルド

```bash
npm install -g eas-cli
eas login
cd frontend
eas build --platform ios
```

### STEP 4：TestFlightで動作確認

[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → TestFlight → iPhoneにインストールして確認。

### STEP 5：App Store審査・公開

アプリ情報（説明文・スクリーンショット・プライバシーポリシー）を入力して審査提出。通常1〜3日で結果が届く。

---

## コスト目安

### API使用料（毎日使った場合）

| サービス | 1セッション | 月30回 | 年間 |
|----------|-----------|-------|------|
| Claude Haiku 4.5 | 約1.1円 | 約34円 | 約405円 |
| OpenAI Whisper | 約0.9円 | 約27円 | 約324円 |
| **API合計** | **約2.0円** | **約61円** | **約730円** |

### リリース・運用費用（年間）

| 項目 | 費用 | 備考 |
|------|------|------|
| Apple Developer登録 | 約14,850円（$99） | App Store公開に必須。毎年更新 |
| Railway（バックエンド） | 約9,000円（$5/月） | 小規模なら無料枠内に収まる可能性あり |
| API使用料 | 約730円 | 毎日使った場合の上限 |
| **年間合計** | **約24,600円** | 自分だけで使うならApple不要で約1,000円以下 |
