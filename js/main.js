// main.js - DYNAMIC REDESIGN

document.addEventListener('DOMContentLoaded', () => {
    // Custom Cursor
    const cursor = document.getElementById('cursor');
    const cursorFollower = document.getElementById('cursor-follower');

    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

            // Delay for follower for smooth drag effect
            setTimeout(() => {
                cursorFollower.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }, 50);
        });

        // Cursor hover effects on links/buttons
        const hoverables = document.querySelectorAll('a, button, .tilt-card, .step-box, .mockup-wrapper');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorFollower.classList.add('is-hover');
            });
            el.addEventListener('mouseleave', () => {
                cursorFollower.classList.remove('is-hover');
            });
        });
    } else {
        // Hide custom cursor on touch devices
        cursor.style.display = 'none';
        cursorFollower.style.display = 'none';
    }

    // Mouse Parallax for Emojis
    const parallaxLayers = document.querySelectorAll('.emoji-layer');
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX - window.innerWidth / 2);
        const y = (e.clientY - window.innerHeight / 2);

        parallaxLayers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-speed')) || 0;
            const xOffset = x * speed;
            const yOffset = y * speed;
            layer.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });

    // Tilt Card Effect (Vanilla JS Implementation)
    const tiltCard = document.querySelector('.tilt-card');
    if (tiltCard) {
        tiltCard.addEventListener('mousemove', (e) => {
            const rect = tiltCard.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -15; // Max 15deg
            const rotateY = ((x - centerX) / centerX) * 15;

            tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });

        tiltCard.addEventListener('mouseleave', () => {
            tiltCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -15% 0px',
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

    const animatedElements = document.querySelectorAll('.scale-in-view, .slide-in-left, .slide-in-right, .pop-in, .expand-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    // Scroll Parallax for massive title
    const scrollSpeedElements = document.querySelectorAll('[data-scroll-speed]');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        scrollSpeedElements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-scroll-speed'));
            el.style.transform = `translateY(${scrollY * speed * 0.1}px)`;
        });

        // CTA Bg Expand
        const ctaBg = document.querySelector('.cta-circle-bg');
        if (ctaBg) {
            const ctaRect = document.querySelector('.cta').getBoundingClientRect();
            if (ctaRect.top < window.innerHeight) {
                ctaBg.classList.add('is-visible');
            }
        }
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
});
