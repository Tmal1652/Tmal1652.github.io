window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none'; // Hide loading screen after page loads
});

// Ripple effect for glassy-hover elements

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