// assets/js/main.js
import { populateFooter } from './coinData.js';
import BinanceChart from './binanceChart.js';
import { renderNews, fetchCryptoNews } from './news.js';
import { renderExchanges, fetchExchanges, fetchFavorites } from './exchanges.js';
import { initializeProfitCalculator } from './profitCalculator.js';
import { authManager } from './auth.js';
import './nav.js';

let allExchanges = [];

async function loadHTMLComponent(url, placeholderId) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const placeholder = document.getElementById(placeholderId);
    if (placeholder) placeholder.innerHTML = html;
  } catch (error) {
    console.error("HTML 컴포넌트를 로드할 수 없습니다:", error);
  }
}

// ✅ 검색 & 즐겨찾기 통합 필터 함수
export async function applyFilters() {
  const searchInput = document.getElementById('exchange-search-input');
  const favOnlyCheckbox = document.getElementById('show-favorites-only');

  let filtered = allExchanges;
  const query = searchInput?.value.trim().toLowerCase() || '';

  if (query) {
    filtered = filtered.filter(ex => ex.name.toLowerCase().includes(query));
  }

  if (favOnlyCheckbox?.checked) {
    if (!authManager.isAuthenticated) {
      alert('즐겨찾기는 로그인 후 이용 가능합니다.');
      favOnlyCheckbox.checked = false;
      return renderExchanges(allExchanges);
    }
    const favorites = await fetchFavorites();
    filtered = filtered.filter(ex => favorites.includes(ex.id));
  }

  await renderExchanges(filtered);
}

document.addEventListener('DOMContentLoaded', async function () {
  // 컴포넌트 로드
  await loadHTMLComponent('assets/components/nav.html', 'nav-placeholder');
  await loadHTMLComponent('assets/components/header.html', 'header-placeholder');
  await loadHTMLComponent('assets/components/main_content.html', 'main-content-placeholder');
  await loadHTMLComponent('assets/components/footer.html', 'footer-placeholder');

  document.dispatchEvent(new Event('navLoaded'));

  // 인증 상태 확인 (컴포넌트 로드 후)
  await authManager.checkAuth();

  const loginButton = document.querySelector('.login-btn');
  if (loginButton) {
    loginButton.addEventListener('click', () => window.location.href = 'login.html');
  }

  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', () => window.location.href = 'index.html');
  }

  await populateFooter();

  if (document.getElementById('priceChart')) {
    const binanceChart = new BinanceChart();
    window.addEventListener('beforeunload', () => binanceChart.disconnect());
  } else {
    console.error("바이낸스 차트가 초기화되지 않습니다.");
  }

  // 뉴스 검색
  renderNews();
  const newsSearchInput = document.getElementById('news-search-input');
  const searchBtn = document.getElementById('news-search-btn');

  newsSearchInput?.addEventListener('input', () => {
    const keyword = newsSearchInput.value.trim();
    renderNews(keyword || undefined);
  });

  searchBtn?.addEventListener('click', () => {
    const keyword = newsSearchInput.value.trim();
    renderNews(keyword);
  });

  newsSearchInput?.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      const keyword = newsSearchInput.value.trim();
      renderNews(keyword);
    }
  });

  // 거래소 로딩 및 이벤트 연결
  try {
    allExchanges = await fetchExchanges();
    await renderExchanges(allExchanges);

    const searchInput = document.getElementById('exchange-search-input');
    const favOnlyCheckbox = document.getElementById('show-favorites-only');

    searchInput?.addEventListener('input', applyFilters);
    favOnlyCheckbox?.addEventListener('change', applyFilters);

  } catch (err) {
    console.error(err);
    const exchContainer = document.getElementById('exchange-container');
    if (exchContainer) {
      exchContainer.textContent = '거래소 정보를 불러오는 중 오류가 발생했습니다.';
    }
  }

  initializeProfitCalculator();
});

// applyFilters 함수를 전역으로 노출
window.applyFilters = applyFilters;