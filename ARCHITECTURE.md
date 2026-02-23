# 音声対話型日記アプリ — システム設計書

## プロジェクト構成

```
音声日記アプリ/
├── APP_OVERVIEW.md
├── ARCHITECTURE.md
├── frontend/          # React Native (Expo)
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # ホーム（録音開始）
│   │   │   └── weekly.tsx         # 週間振り返り
│   │   ├── recording.tsx          # 録音・AI会話画面
│   │   └── summary.tsx            # 感情まとめ画面
│   ├── components/
│   │   ├── MicButton.tsx          # マイクボタン（録音開始/停止）
│   │   ├── ConversationBubble.tsx # AIとユーザーの会話バブル
│   │   ├── EmotionCard.tsx        # 感情まとめカード
│   │   ├── WaveVisualizer.tsx     # 録音中の波形ビジュアライザー
│   │   └── WeeklyChart.tsx        # 週間感情グラフ
│   ├── stores/
│   │   └── diaryStore.ts          # Zustand ストア
│   ├── services/
│   │   └── api.ts                 # バックエンドAPI呼び出し
│   └── constants/
│       └── emotions.ts            # 感情→色マッピング
└── backend/           # Node.js + Express + TypeScript
    ├── src/
    │   ├── index.ts               # エントリポイント
    │   ├── routes/
    │   │   ├── diary.ts           # 日記セッションAPI
    │   │   └── weekly.ts          # 週間データAPI
    │   ├── services/
    │   │   ├── claude.ts          # Claude API（会話・感情分析）
    │   │   ├── whisper.ts         # OpenAI Whisper（文字起こし）
    │   │   └── supabase.ts        # DB操作
    │   └── types/
    │       └── index.ts           # 型定義
    ├── .env.example
    └── package.json
```

---

## DBスキーマ（Supabase / PostgreSQL）

### users テーブル
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,  -- デバイスIDで匿名管理
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### diary_sessions テーブル
```sql
CREATE TABLE diary_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  transcript TEXT,                 -- 全発話の文字起こし
  ai_summary TEXT,                 -- AIによる一言まとめ
  emotion_label TEXT,              -- 感情ラベル（例: "疲れ"）
  emotion_score FLOAT,             -- 感情強度 0.0〜1.0
  emotion_valence FLOAT,           -- ポジネガ -1.0〜1.0
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### session_messages テーブル
```sql
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES diary_sessions(id),
  role TEXT NOT NULL,              -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## APIエンドポイント

### `POST /api/diary/start`
セッション開始。AIの最初の問いかけを返す。

**Request**: `{ deviceId: string }`
**Response**: `{ sessionId: string, aiMessage: string }`

---

### `POST /api/diary/respond`
音声データを受け取り、文字起こし→AI返答を返す。

**Request**: `multipart/form-data` — `audio: File, sessionId: string`
**Response**: `{ transcript: string, aiMessage: string, isEnding: boolean }`

---

### `POST /api/diary/end`
セッション終了。感情分析してDB保存。

**Request**: `{ sessionId: string }`
**Response**: `{ emotionLabel: string, emotionScore: number, summary: string }`

---

### `GET /api/weekly-review?deviceId=xxx`
過去7日分の感情データを返す。

**Response**:
```json
{
  "days": [
    {
      "date": "2026-02-17",
      "emotionLabel": "疲れ",
      "emotionScore": 0.7,
      "emotionValence": -0.4,
      "color": "#7B68EE"
    }
  ]
}
```

---

## Claude APIプロンプト設計

### 共感リフレクト用（会話中）

```
システムプロンプト:
あなたは毎晩ユーザーの話を聞いてくれる、優しい日記の相棒です。
ユーザーが今日あったことや気持ちを話してくれます。

ルール:
- 100文字以内で返答する
- ユーザーの言葉をそのまま使って反射する（リフレクト）
- 「それは大変だったね」「そんな日もあるよね」など共感を示す
- 絶対にアドバイスや解決策を出さない
- 質問は1つまで。深掘りしすぎない
- 最後の返答では「今日も話してくれてありがとう。ゆっくり休んでね」で締める
```

### 感情分析用（セッション終了時）

```
以下のユーザーの発話から感情を分析してください。
JSON形式のみで返答してください。

発話内容: {transcript}

返答形式:
{
  "label": "疲れ|悲しみ|不安|怒り|喜び|平和|充実|空虚",
  "score": 0.0〜1.0,
  "valence": -1.0〜1.0,
  "summary": "今日の気持ちを一言で（20文字以内）"
}
```

---

## 感情→色マッピング

| 感情ラベル | 色 | HEX |
|---|---|---|
| 喜び | ゴールド | `#FFD700` |
| 充実 | サンセットオレンジ | `#FF8C42` |
| 平和 | スカイブルー | `#87CEEB` |
| 疲れ | ラベンダー | `#7B68EE` |
| 不安 | グレーパープル | `#9B8EA8` |
| 悲しみ | ディープブルー | `#4A5568` |
| 怒り | ダークレッド | `#C53030` |
| 空虚 | ライトグレー | `#CBD5E0` |

---

## フロントエンドのタスク

1. `npx create-expo-app frontend --template blank-typescript` でプロジェクト作成
2. パッケージ追加: `expo-av zustand axios expo-linear-gradient @react-navigation/native @react-navigation/stack`
3. `constants/emotions.ts` — 感情→色マッピング定数を作成
4. `services/api.ts` — バックエンドAPI呼び出し関数を作成
5. `stores/diaryStore.ts` — Zustandストア（sessionId, messages, currentEmotion）
6. `components/MicButton.tsx` — 録音開始/停止ボタン（アニメーション付き）
7. `components/WaveVisualizer.tsx` — 録音中の波形アニメーション
8. `components/ConversationBubble.tsx` — AI・ユーザーの会話バブル
9. `app/(tabs)/index.tsx` — ホーム画面
10. `app/recording.tsx` — 録音・会話画面
11. `app/summary.tsx` — 感情まとめ画面
12. `app/(tabs)/weekly.tsx` — 週間振り返り画面

## バックエンドのタスク

1. `mkdir backend && cd backend && npm init -y` でプロジェクト作成
2. パッケージ追加: `express @anthropic-ai/sdk openai @supabase/supabase-js multer cors dotenv zod`
3. TypeScript設定: `tsconfig.json`
4. `.env.example` 作成（ANTHROPIC_API_KEY, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY）
5. `src/services/supabase.ts` — Supabaseクライアント + DB操作
6. `src/services/whisper.ts` — 音声→テキスト変換
7. `src/services/claude.ts` — 共感リフレクト + 感情分析
8. `src/routes/diary.ts` — /api/diary/* エンドポイント
9. `src/routes/weekly.ts` — /api/weekly-review エンドポイント
10. `src/index.ts` — Express サーバー起動
