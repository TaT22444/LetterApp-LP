# 事前登録の運用について

## 実装済みのフロー（確認メール＋ダブルオプトイン）

```
[LP] メール入力 → 「事前登録する」ボタン
       ↓
[Cloud Functions] submitPreRegistration (callable)
  → Firestore に未確認 (verified: false) で保存
  → Resend で確認メール送信
       ↓
[ユーザー] メール受信 → リンクをクリック
       ↓
[Cloud Functions] verify (onRequest / GET)
  → トークンで Firestore を検索
  → verified: true に更新
  → 完了ページ HTML を返す（localStorage にも保存、3秒後にトップへリダイレクト）
       ↓
[LP] ページ読み込み時に localStorage を参照
  → 「事前登録済み」バッジを表示
```

### Firestore ドキュメント構造 (`pre-registrations`)

| フィールド | 型 | 説明 |
|---|---|---|
| `email` | string | メールアドレス（小文字正規化済み） |
| `verificationToken` | string | 確認用ランダムトークン |
| `verified` | boolean | 確認済みかどうか |
| `createdAt` | timestamp | 登録日時 |
| `verifiedAt` | timestamp | 確認完了日時（verified 時のみ） |

### Cloud Functions の環境変数

| 変数名 | 説明 |
|--------|------|
| `RESEND_API_KEY` | Resend の API キー |
| `BASE_URL` | Cloud Functions の verify エンドポイントの**ベース URL**（例: `https://asia-northeast1-ggl-login-f3407.cloudfunctions.net`）。確認メール内のリンクは `BASE_URL/verify?token=xxx` になる。 |
| `LP_URL` | LP のトップページ URL（例: `https://your-lp-domain.com`）。確認完了後のリダイレクト先。未設定時は `BASE_URL` をフォールバック。 |
| `FROM_EMAIL` | （任意）送信元メール。本番では Resend でドメイン認証した自ドメインのアドレスを指定。 |

---

## 一般的なアプリの事前登録

**はい、多くのアプリ・サービスで行われています。**

- リリース前のLPで「メールアドレスを登録するとリリース時に通知」という形
- ニュースレター・ベータ参加・先行案内のリスト収集と同じ考え方です

---

## Firestore のみでよいか？ Authentication は必要？

**事前登録リストの収集だけなら、現状の「Firestore のみ」で問題ありません。**

| 目的 | Firestore のみ | Firebase Authentication |
|------|----------------|--------------------------|
| 事前登録リスト（メール収集・リリース時通知） | ✅ 十分 | 不要 |
| アプリ内で「誰がログインしているか」管理する | 不向き | ✅ 必要 |
| メールの「本人確認」をしたい（確認メールで完了させる） | 別途仕組みが必要 | メールリンク認証なら Auth または 自前実装 |

**Authentication を使う場面の例**

- アプリ正式リリース後、ユーザーが「アカウント作成・ログイン」するとき
- 事前登録時点では「リストにメールを足すだけ」なので、Auth までしなくてよいケースが一般的です

---

## 確認メール（ダブルオプトイン）の一般的な運用

「メールを入力 → 確認メール送信 → リンクをクリックして登録完了」は、**よくあるベストプラクティス**です。

### メリット

- **宛先の正当性**: そのメールアドレスに届く＝本人が持っているアドレスと確認できる
- **スパム・打ち間違いの削減**: 架空や誤入力の登録を減らせる
- **GDPR・プライバシー**: 「登録した」意思を明確にできる

### 実装の選択肢

1. **Firebase Authentication の「メールリンク認証」**
   - メール送信は Firebase が用意（`sendSignInLinkToEmail`）
   - リンククリックで「認証済み」になり、Auth のユーザーとして扱える
   - 事前登録を「Auth のユーザーリスト」で管理する場合に向く

2. **Firebase Cloud Functions + メール送信**
   - Firestore に `pre-registrations` を「未確認」で保存
   - Cloud Functions で「確認用トークン付きリンク」を生成し、SendGrid / Mailgun / Resend 等でメール送信
   - リンクのクリックで別の Function が呼ばれ、該当ドキュメントを「確認済み」に更新
   - 今の「Firestore の pre-registrations のみ」の形を活かしつつ、確認メールだけ追加する場合に適している

3. **Firebase Extensions**
   - 「Trigger Email」などの拡張で、Firestore の書き込みをトリガーにメール送信する構成も可能

### まとめ

- **現状**: メールを入れて送信 → 即 Firestore に保存 → 「登録ありがとうございます」  
  → **実装として成立しており、多くのLPで同じような簡易パターンが使われています。**
- **より一般的な運用に寄せるなら**:  
  「確認メールを送り、リンクをクリックしたら登録完了（ダブルオプトイン）」を、Cloud Functions + メール送信で追加する形がおすすめです。
- **Authentication**: 事前登録リスト収集だけなら必須ではなく、アプリでログイン機能を用意する段階で導入で十分です。
