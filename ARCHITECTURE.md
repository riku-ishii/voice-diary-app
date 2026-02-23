# 音声対話型日記アプリ — システム設計書

## プロジェクト構成

```
音声日記アプリ/
├── frontend/          # React Native (Expo)
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # ホーム（録音開始 / 記録済み表示）
│   │   │   └── weekly.tsx         # 週間振り返り（ローカルデータから生成）
│   │   ├── recording.tsx          # 録音・AI会話画面
│   │   └── summary.tsx            # 感情まとめ画面
│   ├── components/
│   │   ├── MicButton.tsx          # マイクボタン（録音開始/停止・アニメーション）
│   │   ├── ConversationBubble.tsx # AIとユーザーの会話バブル
│   │   ├── EmotionCard.tsx        # 感情まとめカード
│   │   ├── WaveVisualizer.tsx     # 録音中の波形ビジュアライザー
│   │   └── WeeklyChart.tsx        # 週間感情グラフ（色丸＋棒グラフ）
│   ├── stores/
│   │   └── diaryStore.ts          # Zustand ストア（セッション中の一時データ）
│   ├── services/
│   │   ├── api.ts                 # バックエンドAPI呼び出し
│   │   └── storage.ts             # AsyncStorage への日記データ保存・読み込み
│   └── constants/
│       └── emotions.ts            # 感情→色マッピング
└── backend/           # Node.js + Express 5 + TypeScript
    ├── src/
    │   ├── index.ts               # エントリポイント
    │   ├── routes/
    │   │   └── diary.ts           # /api/diary/* エンドポイント
    │   ├── services/
    │   │   ├── claude.ts          # Claude API（共感リフレクト・感情分析）
    │   │   └── whisper.ts         # OpenAI Whisper（音声→テキスト）
    │   └── types/
    │       └── index.ts           # 型定義
    ├── .env
    ├── .env.example
    ├── railway.toml               # Railwayデプロイ設定
    └── package.json
```

---

## データ設計

### ローカルストレージ（AsyncStorage）

データはすべてユーザーの端末内に保存。クラウド不要。

**キー**: `@voice_diary_entries`
**型**: `DiaryEntry[]`

```ts
interface DiaryEntry {
  id: string;           // タイムスタンプベースのID
  date: string;         // YYYY-MM-DD
  transcript: string;   // 全発話の文字起こし（ユーザー発言のみ）
  emotionLabel: string; // 感情ラベル（例: "疲れ"）
  emotionScore: number; // 感情強度 0.0〜1.0
  emotionValence: number; // ポジネガ -1.0〜1.0
  summary: string;      // AIによる一言まとめ（20文字以内）
  createdAt: string;    // ISO 8601
}
```

同じ日付のエントリは上書き（1日1記録）。

---

## APIエンドポイント

バックエンドは**ステートレス**。会話履歴はクライアントが保持して毎回送る。

---

### `POST /api/diary/respond`

音声ファイルと会話履歴を受け取り、文字起こし → AI返答を返す。

**Request**: `multipart/form-data`
| フィールド | 型 | 説明 |
|---|---|---|
| `audio` | File | 録音ファイル（m4a / webm / ogg） |
| `history` | JSON string | これまでの会話履歴 `{role, content}[]` |

**Response**:
```json
{
  "transcript": "今日は仕事が忙しくて疲れました",
  "aiMessage": "それは大変だったね。どんなことがあったの？",
  "isEnding": false
}
```

`isEnding: true` になったらクライアントは `/analyze` を呼ぶ。

---

### `POST /api/diary/analyze`

テキストから感情を分析する。

**Request**:
```json
{ "transcript": "今日は仕事が忙しくて疲れました" }
```

**Response**:
```json
{
  "label": "疲れ",
  "score": 0.7,
  "valence": -0.3,
  "summary": "忙しい一日でお疲れさま"
}
```

---

## データフロー

```
[iPhone]                          [バックエンド]          [外部API]
  │                                    │                      │
  │ 録音開始（expo-av）                │                      │
  │                                    │                      │
  │ 停止 → 音声ファイル + 会話履歴 ──▶│                      │
  │                                    │ 音声ファイル ──────▶ Whisper
  │                                    │ ◀── transcript ──────│
  │                                    │ 会話履歴+transcript ▶ Claude
  │                                    │ ◀── aiMessage ────── │
  │ ◀── { transcript, aiMessage } ─── │                      │
  │                                    │                      │
  │ 「話し終えた」押下                  │                      │
  │                                    │                      │
  │ transcript ─────────────────────▶ │                      │
  │                                    │ transcript ─────────▶ Claude
  │                                    │ ◀── 感情JSON ─────── │
  │ ◀── { label, score, valence, summary } ──               │
  │                                    │                      │
  │ AsyncStorage に保存                │                      │
```

---

## Claude APIプロンプト設計

### 共感リフレクト（会話中）

```
システムプロンプト:
あなたは毎晩ユーザーの話を聞いてくれる、優しい日記の相棒です。

ルール:
- 100文字以内で返答する
- ユーザーの言葉をそのまま使って反射する（リフレクト）
- 「それは大変だったね」「そんな日もあるよね」など共感を示す
- 絶対にアドバイスや解決策を出さない
- 質問は1つまで。深掘りしすぎない
- 最後の返答では「今日も話してくれてありがとう。ゆっくり休んでね」で締める
```

### 感情分析（セッション終了時）

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
