const navEntry = (typeof performance !== 'undefined' && performance.getEntriesByType)
    ? performance.getEntriesByType('navigation')[0]
    : null;
let navigationType = navEntry && navEntry.type ? navEntry.type : 'navigate';

// Older Safari / legacy browsers may not support PerformanceNavigationTiming.
if ((!navEntry || !navEntry.type) && typeof performance !== 'undefined' && performance.navigation) {
    const legacyTypeMap = {
        0: 'navigate',
        1: 'reload',
        2: 'back_forward'
    };
    navigationType = legacyTypeMap[performance.navigation.type] || navigationType;
}
const shouldResetInitialScroll =
    !window.location.hash &&
    (navigationType === 'navigate' || navigationType === 'reload');

if (shouldResetInitialScroll && 'scrollRestoration' in history) {
    try {
        history.scrollRestoration = 'manual';
    } catch (e) {
        // Ignore browsers that block scrollRestoration writes.
    }
}

const resetScrollToTop = () => {
    window.scrollTo(0, 0);
};

// Ensure deep links like #projects land on the correct section after layout settles.
const alignToHashTarget = () => {
    const { hash } = window.location;
    if (!hash) return;

    let target = null;
    const rawId = hash.slice(1);
    try {
        target =
            document.getElementById(decodeURIComponent(rawId)) ||
            document.querySelector(hash);
    } catch (e) {
        target = document.getElementById(rawId);
    }

    if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
};

window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';

    // Start at the top on direct visits/reloads unless a hash target is intentional.
    if (shouldResetInitialScroll) {
        resetScrollToTop();
        window.requestAnimationFrame(resetScrollToTop);
        setTimeout(resetScrollToTop, 0);
    } else if (window.location.hash) {
        alignToHashTarget();
        window.requestAnimationFrame(alignToHashTarget);
        setTimeout(alignToHashTarget, 120);
    }
});

// Failsafe: never leave the loading overlay visible indefinitely.
setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
}, 2500);

// Some browsers restore scroll after load; re-assert top on first page show.
window.addEventListener('pageshow', (event) => {
    if (!shouldResetInitialScroll) return;
    if (event && event.persisted) return; // Preserve bfcache restoration (Safari/Firefox)
    resetScrollToTop();
    setTimeout(resetScrollToTop, 0);
}, { once: true });

// Performance-minded UI interactions
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Throttled (rAF) and passive scroll listener for Back-to-Top visibility
(function backToTopVisibility() {
    const backToTopButton = document.getElementById('back-to-top');
    if (!backToTopButton) return;

    let ticking = false;
    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 300) {
                    backToTopButton.classList.add('show');
                } else {
                    backToTopButton.classList.remove('show');
                }
                ticking = false;
            });
            ticking = true;
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Smooth scroll to top on click
    backToTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
})();

// Note: Native image lazy-loading is used via loading="lazy"; legacy data-src observer removed.

// Smooth in-page navigation with active tab state sync
(function navScrollAndActiveState() {
    const tabLinks = Array.from(document.querySelectorAll('.tab-link'));
    if (!tabLinks.length) return;

    const hrefToLinks = new Map();
    const hrefToTarget = new Map();

    tabLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const target = hrefToTarget.get(href) || document.querySelector(href);
        if (!target) return;

        hrefToTarget.set(href, target);
        if (!hrefToLinks.has(href)) hrefToLinks.set(href, []);
        hrefToLinks.get(href).push(link);
    });

    const pairs = Array.from(hrefToTarget.entries()).map(([href, target]) => ({ href, target }));
    if (!pairs.length) return;

    const setActiveLink = (activeHref) => {
        hrefToLinks.forEach((links, href) => {
            const isActive = href === activeHref;
            links.forEach((link) => link.classList.toggle('active', isActive));
        });
    };

    const scrollToSection = (target) => {
        try {
            target.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });
        } catch (err) {
            target.scrollIntoView(true);
        }
    };

    hrefToLinks.forEach((links, href) => {
        const target = hrefToTarget.get(href);
        if (!target) return;

        links.forEach((link) => link.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection(target);
            setActiveLink(href);
            if (history.pushState) {
                // Keep URL clean (Apple/Tesla-style nav) so refresh opens at page top.
                try {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                } catch (err) {
                    // Ignore browsers that restrict history writes in some contexts.
                }
            }
        }));
    });

    let ticking = false;
    const updateActiveFromScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            const marker = window.innerHeight * 0.35;
            let best = pairs[0];

            pairs.forEach((pair) => {
                const rect = pair.target.getBoundingClientRect();
                if (rect.top <= marker) best = pair;
            });

            setActiveLink(best.href);
            ticking = false;
        });
    };

    window.addEventListener('scroll', updateActiveFromScroll, { passive: true });
    window.addEventListener('resize', updateActiveFromScroll, { passive: true });

    const initialHash = window.location.hash;
    const initialPair = pairs.find(({ href }) => href === initialHash) || pairs[0];
    setActiveLink(initialPair.href);

    // Sync active state to the actual viewport on first paint/load (handles restored scroll).
    window.requestAnimationFrame(updateActiveFromScroll);
    window.addEventListener('load', updateActiveFromScroll, { once: true });
})();

// Copy Credential ID handler
(function copyCredentialId() {
    const btn = document.querySelector('.copy-id-btn');
    if (!btn) return;
    const targetSel = btn.getAttribute('data-target');
    const target = targetSel ? document.querySelector(targetSel) : null;
    if (!target) return;

    const copy = async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.position = 'absolute';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            const prevHTML = btn.innerHTML;
            btn.innerHTML = '<span style="font-size:0.85rem;padding:0 6px;">Copied!</span>';
            btn.disabled = true;
            setTimeout(() => {
                btn.innerHTML = prevHTML;
                btn.disabled = false;
            }, 1200);
        } catch (e) {
            console.warn('Copy failed', e);
        }
    };

    btn.addEventListener('click', () => {
        copy(target.textContent.trim());
    });
})();
