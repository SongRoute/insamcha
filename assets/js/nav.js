// Dark mode toggle functionality
function initializeDarkModeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    const html = document.documentElement;

    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // Apply the current theme
    if (currentTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        body.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.src = 'assets/icons/moon.svg';
        }
    } else {
        html.setAttribute('data-theme', 'light');
        body.setAttribute('data-theme', 'light');
        if (themeIcon) {
            themeIcon.src = 'assets/icons/sun.svg';
        }
    }

    // Theme toggle event listener
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = html.getAttribute('data-theme') === 'dark';
            
            if (isDark) {
                // Switch to light mode
                html.setAttribute('data-theme', 'light');
                body.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if (themeIcon) {
                    themeIcon.src = 'assets/icons/sun.svg';
                }
            } else {
                // Switch to dark mode
                html.setAttribute('data-theme', 'dark');
                body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if (themeIcon) {
                    themeIcon.src = 'assets/icons/moon.svg';
                }
            }
        });
    }
}

// Navigation functionality
function initializeNavigation() {
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
}

document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeDarkModeToggle();
});

// Listen for nav loaded event from main.js
document.addEventListener('navLoaded', () => {
    initializeDarkModeToggle();
}); 