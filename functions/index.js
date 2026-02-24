import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();
const db = getFirestore();

/**
 * メールアドレスが事前登録済みかどうかを Firestore で判定する。
 * クライアントは確認メール送信前にこれを呼び、true なら送信せず「事前登録済み」表示にする。
 */
export const checkPreRegistration = onCall(
    { region: "asia-northeast1" },
    async (request) => {
        const email = request.data?.email;
        if (typeof email !== "string" || !email.trim()) {
            throw new HttpsError("invalid-argument", "email is required");
        }
        const normalized = email.trim().toLowerCase();

        const snap = await db
            .collection("pre-registrations")
            .where("email", "==", normalized)
            .limit(1)
            .get();

        return { alreadyRegistered: !snap.empty };
    }
);
