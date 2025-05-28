document.addEventListener('DOMContentLoaded', () => {
    const bellIconContainer = document.getElementById('bell-icon-container');
    const notificationsDropdown = document.querySelector('.notifications-dropdown');

    if (bellIconContainer && notificationsDropdown) {
        bellIconContainer.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from bubbling up to document
            const isHidden = notificationsDropdown.style.display === 'none';
            notificationsDropdown.style.display = isHidden ? 'block' : 'none';
        });

        // Close dropdown if clicked outside
        document.addEventListener('click', (event) => {
            if (!notificationsDropdown.contains(event.target) && notificationsDropdown.style.display === 'block') {
                notificationsDropdown.style.display = 'none';
            }
        });
    }
}); 