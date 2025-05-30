document.addEventListener('DOMContentLoaded', function() {
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
}); 