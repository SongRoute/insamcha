document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button[data-href]');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-href');
            if (targetId) {
                // For internal page links like #menu1
                if (targetId.startsWith('#')) {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        console.warn(`Target element with ID '''${targetId}''' not found.`);
                    }
                } else {
                    // For external URLs
                    window.location.href = targetId;
                }
            }
        });
    });
}); 