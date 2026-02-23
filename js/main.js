// main.js - Premium LP with Scatter Parallax & Fade-up Animations

document.addEventListener('DOMContentLoaded', () => {

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
});
