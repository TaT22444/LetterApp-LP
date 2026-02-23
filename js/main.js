// main.js - Premium LP with Scatter Parallax & Fade-up Animations
import { auth, db } from './firebase-config.js';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {

    // ──────────────────────────────────────────
    // Custom Cursor
    // ──────────────────────────────────────────
    const cursor = document.getElementById('cursor');
    const cursorFollower = document.getElementById('cursor-follower');

    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            setTimeout(() => {
                cursorFollower.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }, 50);
        });

        const hoverables = document.querySelectorAll('a, button, .tilt-card, .step-card, .uc-card, .f-visual, .mockup-wrapper');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => cursorFollower.classList.add('is-hover'));
            el.addEventListener('mouseleave', () => cursorFollower.classList.remove('is-hover'));
        });
    } else {
        cursor.style.display = 'none';
        cursorFollower.style.display = 'none';
    }

    // ──────────────────────────────────────────
    // Mouse Parallax for Floating Emojis
    // ──────────────────────────────────────────
    const parallaxLayers = document.querySelectorAll('.emoji-layer');
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX - window.innerWidth / 2);
        const y = (e.clientY - window.innerHeight / 2);
        parallaxLayers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-speed')) || 0;
            layer.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });

    // ──────────────────────────────────────────
    // Tilt Card Effect (Concept section & Features)
    // ──────────────────────────────────────────
    const tiltElements = document.querySelectorAll('.tilt-card, .f-visual');
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10;
            const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;

            // Adjust perspective and scale based on element type if needed
            const isFeature = el.classList.contains('f-visual');
            const scale = 1.05;
            const translateY = isFeature ? -15 : -10; // Lift effect

            el.style.transform = `perspective(1000px) translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) translateY(0px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // ──────────────────────────────────────────
    // IntersectionObserver — Fade-up & Scroll Animations
    // ──────────────────────────────────────────
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animated elements (both old and new classes)
    const animatedSelectors = [
        '.fade-up',
        '.scale-in-view',
        '.slide-in-left',
        '.slide-in-right',
        '.pop-in',
        '.expand-on-scroll'
    ];
    document.querySelectorAll(animatedSelectors.join(', ')).forEach(el => observer.observe(el));

    // ──────────────────────────────────────────
    // Scroll Parallax — Use Cases scatter cards & massive title
    // ──────────────────────────────────────────
    const scrollSpeedElements = document.querySelectorAll('[data-scroll-speed]');
    const parallaxCards = document.querySelectorAll('[data-parallax-speed]');

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const viewportCenter = window.innerHeight / 2;

                // Massive title parallax (Relative to viewport center)
                scrollSpeedElements.forEach(el => {
                    const speed = parseFloat(el.getAttribute('data-scroll-speed'));
                    const rect = el.getBoundingClientRect();
                    const elementCenter = rect.top + rect.height / 2;
                    // When element is centered in viewport, offset is 0
                    const offset = (elementCenter - viewportCenter) * speed * 0.1;
                    el.style.transform = `translateY(${offset}px)`;
                });

                // Use Cases scatter card parallax (Relative to viewport center)
                parallaxCards.forEach(card => {
                    const speed = parseFloat(card.getAttribute('data-parallax-speed'));
                    const rect = card.getBoundingClientRect();
                    const elementCenter = rect.top + rect.height / 2;
                    const offset = (elementCenter - viewportCenter) * speed;

                    if (window.innerWidth > 768) {
                        card.style.transform = `translateY(${offset}px)`;
                    } else {
                        card.style.transform = 'none';
                    }
                });

                // CTA Bg Expand
                const ctaBg = document.querySelector('.cta-circle-bg');
                if (ctaBg) {
                    const ctaRect = document.querySelector('.cta').getBoundingClientRect();
                    if (ctaRect.top < window.innerHeight) {
                        ctaBg.classList.add('is-visible');
                    }
                }

                ticking = false;
            });
            ticking = true;
        }
    });

    // ──────────────────────────────────────────
    // Smooth Scroll
    // ──────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.getBoundingClientRect().top + window.pageYOffset,
                    behavior: "smooth"
                });
            }
        });
    });

    // ──────────────────────────────────────────
    // Pre-registration (Firebase Auth email link)
    // ──────────────────────────────────────────
    const PRE_REG_STORAGE_KEY = 'chocoleta_preregistered';
    const PRE_REG_EMAIL_KEY = 'chocoleta_prereg_email';
    const preRegFormWrap = document.getElementById('pre-reg-form-wrap');
    const preRegForm = document.getElementById('pre-reg-form');
    const preRegEmail = document.getElementById('pre-reg-email');
    const preRegStatus = document.getElementById('pre-reg-status');
    const preRegDone = document.getElementById('pre-reg-done');
    const preRegPending = document.getElementById('pre-reg-pending');

    function showPreRegDone() {
        if (preRegFormWrap) preRegFormWrap.hidden = true;
        if (preRegPending) preRegPending.hidden = true;
        if (preRegDone) {
            preRegDone.hidden = false;
            preRegDone.setAttribute('aria-hidden', 'false');
        }
    }

    function showPreRegPending() {
        if (preRegFormWrap) preRegFormWrap.hidden = true;
        if (preRegDone) preRegDone.hidden = true;
        if (preRegPending) {
            preRegPending.hidden = false;
            preRegPending.setAttribute('aria-hidden', 'false');
        }
    }

    function showPreRegForm() {
        if (preRegFormWrap) preRegFormWrap.hidden = false;
        if (preRegDone) {
            preRegDone.hidden = true;
            preRegDone.setAttribute('aria-hidden', 'true');
        }
        if (preRegPending) {
            preRegPending.hidden = true;
            preRegPending.setAttribute('aria-hidden', 'true');
        }
    }

    // --- Firebase Auth の認証状態を監視（タブ間同期・リロード対応） ---
    onAuthStateChanged(auth, (user) => {
        const current = localStorage.getItem(PRE_REG_STORAGE_KEY);
        if (user && current) {
            const wasPending = current === 'pending';
            localStorage.setItem(PRE_REG_STORAGE_KEY, '1');
            localStorage.removeItem(PRE_REG_EMAIL_KEY);
            showPreRegDone();
            if (wasPending) showCelebration();
        }
    });

    // --- リンククリック後: メール認証を完了する ---
    async function handleEmailLinkVerification() {
        if (!isSignInWithEmailLink(auth, window.location.href)) return false;

        let email = localStorage.getItem(PRE_REG_EMAIL_KEY);
        if (!email) {
            // 別ブラウザ/デバイスで開いた場合はフォーム表示に戻す
            showPreRegForm();
            if (preRegEmail) {
                preRegEmail.placeholder = "確認用にメールアドレスを再入力";
                preRegEmail.focus();
            }
            if (preRegStatus) {
                preRegStatus.textContent = "メール内のリンクから開きました。登録したメールアドレスを入力して完了してください。";
                preRegStatus.classList.add('is-visible');
            }
            // フォーム送信時に再度この関数を呼ぶためフラグを立てる
            localStorage.setItem('chocoleta_awaiting_link_verify', '1');
            return false;
        }

        try {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            const trimmed = email.trim().toLowerCase();

            try {
                await setDoc(doc(db, "pre-registrations", result.user.uid), {
                    email: trimmed,
                    verified: true,
                    createdAt: serverTimestamp(),
                    verifiedAt: serverTimestamp(),
                    uid: result.user.uid,
                });
            } catch (firestoreErr) {
                console.warn("Firestore write failed (non-critical):", firestoreErr);
            }

            localStorage.setItem(PRE_REG_STORAGE_KEY, '1');
            localStorage.removeItem(PRE_REG_EMAIL_KEY);
            window.history.replaceState(null, '', window.location.pathname);
            return true;
        } catch (err) {
            console.error("Email link verification failed:", err);
            // 認証自体が失敗した場合のみ false
            return false;
        }
    }

    // ──────────────────────────────────────────
    // Celebration Overlay + Confetti
    // ──────────────────────────────────────────
    function showCelebration() {
        const overlay = document.getElementById('celebration-overlay');
        const canvas = document.getElementById('confetti-canvas');
        if (!overlay || !canvas) return;

        overlay.hidden = false;
        requestAnimationFrame(() => overlay.classList.add('is-active'));
        launchConfetti(canvas);

        const dismiss = () => {
            overlay.classList.add('is-fading');
            setTimeout(() => {
                overlay.hidden = true;
                overlay.classList.remove('is-active', 'is-fading');
            }, 600);
        };

        overlay.addEventListener('click', dismiss, { once: true });
        setTimeout(dismiss, 4500);
    }

    function launchConfetti(canvas) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width = window.innerWidth;
        const H = canvas.height = window.innerHeight;
        const colors = ['#FF8BA7', '#A0C4FF', '#5dee6e', '#FFD670', '#CDB4DB', '#fff'];
        const shapes = [];
        const count = 120;

        for (let i = 0; i < count; i++) {
            shapes.push({
                x: Math.random() * W,
                y: Math.random() * -H,
                w: 6 + Math.random() * 8,
                h: 4 + Math.random() * 6,
                rot: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                vx: (Math.random() - 0.5) * 3,
                vy: 2 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 0.8 + Math.random() * 0.2,
            });
        }

        let frame = 0;
        const maxFrames = 240;

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const progress = frame / maxFrames;

            for (const s of shapes) {
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.04;
                s.vx *= 0.999;
                s.rot += s.rotSpeed;

                const fade = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate((s.rot * Math.PI) / 180);
                ctx.globalAlpha = s.opacity * fade;
                ctx.fillStyle = s.color;
                ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
                ctx.restore();
            }

            frame++;
            if (frame < maxFrames) requestAnimationFrame(draw);
        }

        draw();
    }

    const verified = await handleEmailLinkVerification();

    // 初期表示: localStorage で即座に UI を出す（onAuthStateChanged が後から上書き可能）
    const stored = localStorage.getItem(PRE_REG_STORAGE_KEY);
    if (verified) {
        showPreRegDone();
        showCelebration();
    } else if (stored === '1') {
        showPreRegDone();
    } else if (stored === 'pending') {
        showPreRegPending();
    }

    // --- フォーム送信: 確認メールを送る or リンク検証を完了する ---
    if (preRegForm) {
        const submitBtn = preRegForm.querySelector('button[type="submit"]');

        preRegForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = preRegEmail.value.trim();
            if (!email) return;

            if (submitBtn) submitBtn.disabled = true;
            preRegStatus.textContent = "送信中...";
            preRegStatus.classList.remove('success', 'error');
            preRegStatus.classList.add('is-visible');

            // リンクから来て email がなかった場合 → ここで認証完了
            if (localStorage.getItem('chocoleta_awaiting_link_verify') === '1'
                && isSignInWithEmailLink(auth, window.location.href)) {
                try {
                    const result = await signInWithEmailLink(auth, email, window.location.href);
                    const trimmed = email.trim().toLowerCase();
                    try {
                        await setDoc(doc(db, "pre-registrations", result.user.uid), {
                            email: trimmed,
                            verified: true,
                            createdAt: serverTimestamp(),
                            verifiedAt: serverTimestamp(),
                            uid: result.user.uid,
                        });
                    } catch (err) {
                        console.warn("Firestore write failed (non-critical):", err);
                    }
                    localStorage.setItem(PRE_REG_STORAGE_KEY, '1');
                    localStorage.removeItem(PRE_REG_EMAIL_KEY);
                    localStorage.removeItem('chocoleta_awaiting_link_verify');
                    window.history.replaceState(null, '', window.location.pathname);
                    showPreRegDone();
                    showCelebration();
                    return;
                } catch (err) {
                    console.error("Email link verification failed:", err);
                    preRegStatus.textContent = "認証に失敗しました。メールアドレスが正しいか確認してください。";
                    preRegStatus.classList.add('error');
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                }
            }

            try {
                const actionCodeSettings = {
                    url: window.location.origin + window.location.pathname,
                    handleCodeInApp: true,
                };

                await sendSignInLinkToEmail(auth, email, actionCodeSettings);

                localStorage.setItem(PRE_REG_EMAIL_KEY, email);
                localStorage.setItem(PRE_REG_STORAGE_KEY, 'pending');
                showPreRegPending();
            } catch (error) {
                console.error("Error submitting pre-registration:", error);
                preRegStatus.textContent = "エラーが発生しました。時間を置いて再度お試しください。";
                preRegStatus.classList.add('error');
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
});
