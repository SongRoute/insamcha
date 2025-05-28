import { populateFooter } from './coinData.js';
import { fetchChartData } from './chart.js';

async function loadHTMLComponent(url, placeholderId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }
        const html = await response.text();
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = html;
        } else {
            console.error(`Placeholder with ID '${placeholderId}' not found.`);
        }
    } catch (error) {
        console.error("Could not load HTML component:", error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Load HTML components
    await loadHTMLComponent('./components/nav.html', 'nav-placeholder');
    await loadHTMLComponent('./components/header.html', 'header-placeholder');
    await loadHTMLComponent('./components/main_content.html', 'main-content-placeholder');
    await loadHTMLComponent('./components/footer.html', 'footer-placeholder');

    // After loading all components, especially footer and main_content (for chart),
    // call the functions that populate them or attach event listeners.
    // Ensure these functions are called after the relevant HTML is in the DOM.
    populateFooter();
    fetchChartData();
}); 