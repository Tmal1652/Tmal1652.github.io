window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.style.display = 'none'; // Hide loading screen after page loads
});

// Optimized JavaScript for Performance

// Debounced scroll event listener for better performance
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
        const backToTopButton = document.getElementById('back-to-top');
        if (window.scrollY > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    }, 100); // Debounce delay
});

// Lazy load images for better performance
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
        }
    });
});

lazyImages.forEach(img => {
    imageObserver.observe(img);
});

// Optimized ripple effect for glassy-hover elements
document.querySelectorAll('.glassy-hover').forEach(el => {
    function triggerRipple(e) {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100 + '%';
        const y = ((e.clientY - rect.top) / rect.height) * 100 + '%';

        el.style.setProperty('--ripple-x', x);
        el.style.setProperty('--ripple-y', y);

        el.classList.remove('rippling');
        void el.offsetWidth; // reflow to restart animation
        el.classList.add('rippling');
    }

    el.addEventListener('mouseenter', triggerRipple);
    el.addEventListener('click', triggerRipple);
});