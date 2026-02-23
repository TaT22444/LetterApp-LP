# LetterApp LP - Cloud Functions

事前登録の「確認メール送信」と「リンク検証」を行います。

## デプロイ

```bash
cd LetterApp-LP
npm install -g firebase-tools   # 未インストールの場合
firebase login
firebase use ggl-login-f3407    # プロジェクトIDに合わせる
cd functions && npm install && cd ..
firebase deploy --only functions
```

## 環境変数（確認メール送信用）

デプロイ後、[Firebase Console](https://console.firebase.google.com) → プロジェクト → Functions → 設定 で以下を設定するか、Google Cloud Console の Cloud Functions の「環境変数」で設定してください。

| 名前 | 説明 |
|------|------|
| `RESEND_API_KEY` | [Resend](https://resend.com) の API キー |
| `BASE_URL` | LP の URL（例: `https://your-domain.com`）。確認リンクのベースに使います。 |
| `FROM_EMAIL` | （任意）送信元。未設定時は `Chocoleta!? <onboarding@resend.dev>` |

`RESEND_API_KEY` が未設定の場合、Function はメール送信をスキップし、登録データのみ Firestore に保存します（開発時の動作確認用）。

## ローカルエミュレータ

```bash
firebase emulators:start --only functions
```

LP を Vite で起動している場合、開発時は自動で `localhost:5001` の Functions エミュレータに接続します（`firebase-config.js` の `connectFunctionsEmulator`）。
