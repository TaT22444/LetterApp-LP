import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { randomBytes } from "crypto";

const resendApiKey = defineSecret("RESEND_API_KEY");
const baseUrl = defineString("BASE_URL", { default: "https://your-lp-domain.com" });
const lpUrl = defineString("LP_URL", { default: "" });
const fromEmail = defineString("FROM_EMAIL", { default: "Chocoleta!? <noreply@resend.dev>" });

initializeApp();
const db = getFirestore();

function getLpUrl() {
    return lpUrl.value() || baseUrl.value();
}

async function sendVerificationEmail(to, token) {
    const key = resendApiKey.value();
    if (!key) {
        console.warn("RESEND_API_KEY not set; skipping email send.");
        return;
    }
    const verifyUrl = `${baseUrl.value().replace(/\/$/, "")}/verify?token=${encodeURIComponent(token)}`;
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: fromEmail.value(),
            to: [to],
            subject: "【Chocoleta!?】事前登録の確認",
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #e91e63;">Chocoleta!? 事前登録の確認</h2>
  <p>ご登録ありがとうございます。以下のリンクをクリックして、事前登録を完了してください。</p>
  <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #e91e63; color: #fff; text-decoration: none; border-radius: 8px;">事前登録を完了する</a></p>
  <p style="font-size: 12px; color: #666;">このリンクは24時間有効です。心当たりがない場合はこのメールを無視してください。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="font-size: 12px; color: #999;">Chocoleta!? — 想いを、ちょこっと届けよう。</p>
</body>
</html>`,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new HttpsError("internal", "Failed to send email: " + err);
    }
}

// --- Callable: LP から呼ばれる ---
export const submitPreRegistration = onCall(
    { region: "asia-northeast1", secrets: [resendApiKey] },
    async (request) => {
        const email = request.data?.email;
        if (!email || typeof email !== "string") {
            throw new HttpsError("invalid-argument", "メールアドレスを入力してください。");
        }
        const trimmed = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            throw new HttpsError("invalid-argument", "有効なメールアドレスを入力してください。");
        }

        const existing = await db.collection("pre-registrations")
            .where("email", "==", trimmed).limit(1).get();
        if (!existing.empty) {
            const doc = existing.docs[0].data();
            if (doc.verified) {
                return { success: true, alreadyVerified: true };
            }
        }

        const token = randomBytes(32).toString("hex");
        const col = db.collection("pre-registrations");

        const ref = await col.add({
            email: trimmed,
            verificationToken: token,
            verified: false,
            createdAt: FieldValue.serverTimestamp(),
        });

        try {
            await sendVerificationEmail(trimmed, token);
        } catch (e) {
            await ref.delete();
            throw e;
        }

        return { success: true };
    }
);

// --- HTTP: 確認メール内のリンクから直接 GET で呼ばれる ---
function buildResultPage(title, message, isSuccess) {
    const color = isSuccess ? "#0d9488" : "#e74c3c";
    const lp = getLpUrl().replace(/\/$/, "");
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Chocoleta!?</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Outfit', 'Noto Sans JP', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #FDFBF7; padding: 24px; }
    .box { text-align: center; max-width: 420px; }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    h1 { font-size: 1.5rem; font-weight: 900; color: ${color}; margin-bottom: 12px; }
    p { font-size: 1rem; color: #6E6E73; margin-bottom: 24px; line-height: 1.6; }
    a { display: inline-block; padding: 0.75rem 2rem; background: #1C1C1E; color: #fff; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 0.95rem; }
    a:hover { opacity: 0.85; }
  </style>
  ${isSuccess ? `<script>localStorage.setItem("chocoleta_preregistered","1");setTimeout(()=>location.href="${lp}",3000);</script>` : ""}
</head>
<body>
  <div class="box">
    <div class="icon">${isSuccess ? "✅" : "⚠️"}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${lp}">トップへ戻る</a>
  </div>
</body>
</html>`;
}

export const verify = onRequest(
    { region: "asia-northeast1", secrets: [resendApiKey] },
    async (req, res) => {
        const token = req.query.token;
        if (!token || typeof token !== "string") {
            res.status(400).send(buildResultPage(
                "無効なリンクです",
                "リンクが正しくありません。メール内のリンクから再度お試しください。",
                false
            ));
            return;
        }

        try {
            const col = db.collection("pre-registrations");
            const snap = await col.where("verificationToken", "==", token).limit(1).get();
            if (snap.empty) {
                res.status(404).send(buildResultPage(
                    "リンクが無効です",
                    "リンクの有効期限が切れているか、すでに使用されています。再度事前登録からお試しください。",
                    false
                ));
                return;
            }
            const doc = snap.docs[0];
            if (doc.data().verified) {
                res.send(buildResultPage(
                    "すでに登録済みです",
                    "事前登録は完了しています。リリース時にご連絡します！",
                    true
                ));
                return;
            }
            await doc.ref.update({
                verified: true,
                verifiedAt: FieldValue.serverTimestamp(),
            });
            res.send(buildResultPage(
                "事前登録が完了しました！",
                "登録ありがとうございます。リリース時にご連絡します。お楽しみに！",
                true
            ));
        } catch (e) {
            console.error("Verification error:", e);
            res.status(500).send(buildResultPage(
                "エラーが発生しました",
                "時間を置いて再度お試しください。",
                false
            ));
        }
    }
);
