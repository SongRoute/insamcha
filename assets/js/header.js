import { fetchCryptoNews } from './news.js';

document.addEventListener('DOMContentLoaded', async () => {
    const bellIconContainer = document.getElementById('bell-icon-container');
    const notificationsPopup = document.querySelector('.notifications-dropdown');
    const notificationOverlay = document.querySelector('.notification-overlay');

    if (bellIconContainer && notificationsPopup && notificationOverlay) {
        bellIconContainer.addEventListener('click', function(event) {
            event.stopPropagation();
            
            // 팝업 위치를 bell 아이콘 근처로 설정
            const rect = bellIconContainer.getBoundingClientRect();
            notificationsPopup.style.position = 'fixed';
            notificationsPopup.style.top = (rect.bottom + 10) + 'px';
            notificationsPopup.style.left = (rect.left - 200) + 'px'; // 팝업 너비를 고려하여 왼쪽으로 이동
            notificationsPopup.style.transform = 'none'; // 기존 transform 제거

            notificationsPopup.classList.toggle('active');
            notificationOverlay.classList.toggle('active');
        });

        notificationOverlay.addEventListener('click', function() {
            notificationsPopup.classList.remove('active');
            notificationOverlay.classList.remove('active');
        });

        // ESC 키로 팝업 닫기
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                notificationsPopup.classList.remove('active');
                notificationOverlay.classList.remove('active');
            }
        });

    } else {
        if (!bellIconContainer) {
            console.error('Error: Bell icon container (ID "bell-icon-container") not found.');
        }
        if (!notificationsPopup) {
            console.error('Error: Notifications popup (class "notifications-dropdown") not found.');
        }
        if (!notificationOverlay) {
            console.error('Error: Notification overlay (class "notification-overlay") not found.');
        }
    }

    // 페이지 제목 설정
    const pageTitleElement = document.getElementById('page-title');
    if (pageTitleElement) {
        // 페이지별 제목 매핑
        const pageTitles = {
            'longshort.html': '롱/숏 포지션 비율',
            'index.html': '홈',
            'login.html': '로그인',
            'welcome.html': '환영합니다',
            'price.html': '암호화계 실시간 가격'
            // 필요에 따라 더 추가 가능
        };
        
        // 현재 페이지 파일명 가져오기
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // 페이지 제목 설정 (매핑된 제목이 있으면 사용, 없으면 document.title 사용)
        const pageTitle = pageTitles[currentPage] || document.title || '인삼차';
        pageTitleElement.textContent = pageTitle;
    }
}); 