// Disable browser scroll restoration and scroll to the top on load
window.addEventListener('load', () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual'; // Disable automatic scroll restoration
    }

    if (!window.location.hash) {
        setTimeout(() => {
            window.scrollTo(0, 0); // Scroll to the top
        }, 0);
    } else {
        history.replaceState(null, '', window.location.pathname); // Remove the hash
    }
});

// ScrollReveal Animations
import ScrollReveal from 'scrollreveal';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed.');

    // ScrollReveal Animations
    if (typeof ScrollReveal !== 'undefined') {
        const revealElements = ['.hero', '.intro', '.projects', '.experience', '.contact'];
        revealElements.forEach(selector => {
            ScrollReveal().reveal(selector, {
                delay: 200,
                distance: '50px',
                origin: 'bottom',
                duration: 1000,
            });
        });

        ScrollReveal().reveal('.card', {
            distance: '30px',
            duration: 800,
            easing: 'ease-in-out',
            origin: 'bottom',
            interval: 150,
        });
    } else {
        console.error('ScrollReveal is not defined.');
    }

    // GSAP Animations for Sections
    gsap.from('section', {
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.2,
        ease: 'power2.out',
        onStart: () => console.log('GSAP section animations started.'),
    });

    // GSAP Animations for Cards
    gsap.from('.card', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        onStart: () => console.log('GSAP card animations started.'),
    });

    // Smooth Scrolling for Navigation Links
    const tabLinks = document.querySelectorAll<HTMLAnchorElement>('.tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href === '#' || !document.querySelector(href)) return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                console.log(`Scrolling to ${href}`);
                target.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, '', href); // Optional: visually update URL
            }
        });
    });
});
