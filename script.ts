// Keep scroll restoration predictable without forcing scroll position
window.addEventListener('load', () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
}, { once: true });

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links (desktop + mobile tab bar)
    const tabLinks = document.querySelectorAll<HTMLAnchorElement>('.tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector<HTMLElement>(href);
            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Keep the URL hash in sync (optional)
            if (history.pushState) history.pushState(null, '', href);
            else location.hash = href;
        }, { passive: false });
    });

    // Lightweight intersection-based reveal (no external libs)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const revealTargets = document.querySelectorAll<HTMLElement>('section, .card');
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    // Apply a subtle reveal without heavy paints
                    el.style.willChange = 'opacity, transform';
                    // Only set initial styles if not already visible
                    if (!el.dataset.revealed) {
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                        el.style.transition = 'opacity 400ms ease, transform 400ms ease';
                        el.dataset.revealed = 'true';
                    }
                    observer.unobserve(el);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

        revealTargets.forEach(el => {
            // If CSS already handles initial state, do nothing; otherwise ensure hidden start
            if (!el.dataset.revealed) {
                el.style.opacity = el.style.opacity || '0';
                el.style.transform = el.style.transform || 'translateY(20px)';
            }
            obs.observe(el);
        });
    }
});

export {};
