document.addEventListener('DOMContentLoaded', function() {
    const bellIconContainer = document.getElementById('bell-icon-container');
    const notificationsPopup = document.querySelector('.notifications-dropdown');
    const notificationOverlay = document.querySelector('.notification-overlay');
    const mainContentPlaceholder = document.getElementById('main-content-placeholder');

    if (bellIconContainer && notificationsPopup && notificationOverlay && mainContentPlaceholder) {
        bellIconContainer.addEventListener('click', function(event) {
            event.stopPropagation();

            // Move popup to main content area if it's not already there
            if (notificationsPopup.parentNode !== mainContentPlaceholder) {
                mainContentPlaceholder.appendChild(notificationsPopup);
            }

            notificationsPopup.classList.toggle('active');
            notificationOverlay.classList.toggle('active');
        });

        notificationOverlay.addEventListener('click', function() {
            notificationsPopup.classList.remove('active');
            notificationOverlay.classList.remove('active');
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
        if (!mainContentPlaceholder) {
            console.error('Error: Main content placeholder (ID "main-content-placeholder") not found.');
        }
    }
}); 