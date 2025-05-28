import { populateFooter } from './coinData.js';
import { fetchChartData } from './chart.js';
import { fetchCryptoNews } from './news.js';

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
    renderNews();
    const searchBtn   = document.getElementById('news-search-btn');
    const searchInput = document.getElementById('news-search-input');

    searchBtn.addEventListener('click', () => {
        const keyword = searchInput.value.trim();
        if (keyword) {
        renderNews(keyword);
        }
    });

    // Enter 키로도 검색 
    searchInput.addEventListener('keyup', e => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
        renderNews(searchInput.value.trim());
        }
    });
}); 

/**
 * 뉴스 렌더링: query 키워드를 받아서 제목만 출력
 * @param {string} query 검색 키워드
 */
// 뉴스 랜더 함수, 새로운 div를 생성하여 뉴스를 받아옴
async function renderNews(query = 'bitcoin') {
  const container = document.getElementById('news-container');
  container.innerHTML = '';      // 이전 결과 초기화

  let articles;
  try {
    articles = await fetchCryptoNews(query);
  } catch (e) {
    container.textContent = '❌ 뉴스를 불러오는 중 오류가 발생했습니다.';
    return;
  }

  if (!articles || articles.length === 0) {
    container.textContent = '🔍 관련 뉴스가 없습니다.';
    return;
  }

  articles.forEach(a => {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
      <div class="news-content">
        <a href="${a.url}" target="_blank">
          <h3>${a.title}</h3>
        </a>
      </div>`;
    container.appendChild(card);
  });
}
