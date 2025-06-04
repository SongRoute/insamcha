document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');

    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.2 // 20% of the section must be visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
            } else {
                // entry.target.classList.remove('section-visible'); // Optional: remove when out of view
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Hero section 텍스트에 애니메이션 클래스 추가 (초기 로드 시)
    const heroTitle = document.querySelector('.hero-section h1');
    const heroParagraph = document.querySelector('.hero-section p');
    const heroButton = document.querySelector('.hero-section .welcome-button');

    if (heroTitle) {
        heroTitle.style.animation = 'slideInFromTop 1s ease-out forwards';
    }
    if (heroParagraph) {
        heroParagraph.style.animation = 'slideInFromBottom 1s ease-out forwards 0.5s'; // 0.5초 지연
    }
    if (heroButton) {
        heroButton.style.animation = 'fadeInUp 1s ease-out forwards 1s'; // 1초 지연
    }
});