document.addEventListener('DOMContentLoaded', function() {
    const bellIconContainer = document.getElementById('bell-icon-container');
    const notificationsDropdown = document.querySelector('.notifications-dropdown');

    if (bellIconContainer && notificationsDropdown) {
        bellIconContainer.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevents the click from bubbling up to the document listener immediately
            notificationsDropdown.classList.toggle('active');
        });

        // Optional: Close dropdown if clicked outside
        document.addEventListener('click', function(event) {
            // Check if the click is outside the bell icon and outside the dropdown
            if (!bellIconContainer.contains(event.target) && !notificationsDropdown.contains(event.target)) {
                if (notificationsDropdown.classList.contains('active')) {
                    notificationsDropdown.classList.remove('active');
                }
            }
        });
    } else {
        if (!bellIconContainer) {
            console.error('Error: Bell icon container (ID "bell-icon-container") not found.');
        }
        if (!notificationsDropdown) {
            console.error('Error: Notifications dropdown (class "notifications-dropdown") not found.');
        }
    }
}); 