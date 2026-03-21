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

const loadingScreen = document.getElementById('loading-screen');
const hideLoadingScreen = () => {
    if (loadingScreen) loadingScreen.style.display = 'none';
};

const loadingScreenFailsafeTimer = window.setTimeout(hideLoadingScreen, 2500);
let hashLayoutOverrides = [];

const getHashTarget = () => {
    const { hash } = window.location;
    if (!hash) return null;

    const rawId = hash.slice(1);
    let target = null;
    try {
        target =
            document.getElementById(decodeURIComponent(rawId)) ||
            document.querySelector(hash);
    } catch (e) {
        target = document.getElementById(rawId);
    }
    return target;
};

const getVisibleTopNavOffset = () => {
    const bars = Array.from(document.querySelectorAll('.floating-tab-bar, .mobile-tab-dock'));
    const topBar = bars.find((bar) => {
        const rect = bar.getBoundingClientRect();
        const style = window.getComputedStyle(bar);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0;
        if (!isVisible) return false;
        // Only apply offset for bars pinned near the top edge.
        return rect.top <= 24;
    });

    if (!topBar) return 16;
    return Math.ceil(topBar.getBoundingClientRect().height + 12);
};

const getElementDocumentTop = (element) => {
    let top = 0;
    let current = element;
    while (current) {
        top += current.offsetTop || 0;
        current = current.offsetParent;
    }
    return top;
};

const scrollToAnchorTarget = (target, behavior = 'auto') => {
    if (!target) return;
    const top = getElementDocumentTop(target) - getVisibleTopNavOffset();
    const nextTop = Math.max(0, top);
    try {
        window.scrollTo({ top: nextTop, behavior });
    } catch (err) {
        window.scrollTo(0, nextTop);
    }
};

const prepareSectionLayoutForAnchors = () => {
    // No-op: section geometry is now kept stable in CSS.
};

const restoreSectionLayoutForAnchors = () => {
    // No-op: section geometry is now kept stable in CSS.
    hashLayoutOverrides = [];
};

const prepareHashLayout = () => {
    if (!window.location.hash) return;
    prepareSectionLayoutForAnchors();
};

const restoreHashLayout = () => {
    restoreSectionLayoutForAnchors();
};

// Ensure deep links like #projects land on the correct section after layout settles.
const alignToHashTarget = () => {
    const target = getHashTarget();
    if (!target) return;

    scrollToAnchorTarget(target, 'auto');
};

const runHashAlignmentPasses = () => {
    if (!window.location.hash) return;
    [0, 80, 220, 420, 800].forEach((delay) => {
        window.setTimeout(alignToHashTarget, delay);
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            alignToHashTarget();
            window.setTimeout(alignToHashTarget, 120);
        });
    }
};

window.addEventListener('load', () => {
    hideLoadingScreen();
    window.clearTimeout(loadingScreenFailsafeTimer);

    // Start at the top on direct visits/reloads unless a hash target is intentional.
    if (shouldResetInitialScroll) {
        resetScrollToTop();
        window.requestAnimationFrame(resetScrollToTop);
        setTimeout(resetScrollToTop, 0);
    } else if (window.location.hash) {
        runHashAlignmentPasses();
    }
});

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
    onScroll();

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
            links.forEach((link) => {
                link.classList.toggle('active', isActive);
                if (isActive) {
                    link.setAttribute('aria-current', 'location');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        });
    };

    hrefToLinks.forEach((links, href) => {
        links.forEach((link) => link.addEventListener('click', (e) => {
            // Use native anchor behavior for maximum browser consistency.
            setActiveLink(href);
            // Let browser perform default hash scrolling.
        }));
    });

    let ticking = false;
    const updateActiveFromScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            // Keep active state aligned to the section nearest the top reading edge.
            const marker = getVisibleTopNavOffset() + 26;
            let best = null;

            // Prefer the section that currently spans the marker line.
            for (const pair of pairs) {
                const rect = pair.target.getBoundingClientRect();
                if (rect.top <= marker && rect.bottom >= marker) {
                    best = pair;
                    break;
                }
            }

            // Fallback to nearest section top if marker is between sections.
            if (!best) {
                best = pairs.reduce((closest, pair) => {
                    const distance = Math.abs(pair.target.getBoundingClientRect().top - marker);
                    if (!closest || distance < closest.distance) {
                        return { pair, distance };
                    }
                    return closest;
                }, null)?.pair || pairs[0];
            }

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
