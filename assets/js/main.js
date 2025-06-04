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

// Header initialization function
function initializeHeader() {
  // Bell icon notification functionality
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
      notificationsPopup.style.left = (rect.left - 200) + 'px';
      notificationsPopup.style.transform = 'none';

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
  }

  // Page title setting
  const pageTitleElement = document.getElementById('page-title');
  if (pageTitleElement) {
    // 페이지별 제목 매핑
    const pageTitles = {
      'longshort.html': '📊 롱/숏 포지션 비율',
      'price.html': '💰 암호화폐 실시간 시세',
      'index.html': '🏠 홈',
      'login.html': '🔐 로그인',
      'welcome.html': '👋 환영합니다',
      'favorite.html': '⭐ 즐겨찾기',
      'signup.html': '📝 회원가입',
      'ex.html': '🪙 거래소 정보',
      // 필요에 따라 더 추가 가능
    };
    
    // 현재 페이지 파일명 가져오기
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // 페이지 제목 설정 (매핑된 제목이 있으면 사용, 없으면 document.title 사용)
    const pageTitle = pageTitles[currentPage] || document.title || '인삼차';
    pageTitleElement.textContent = pageTitle;
  }
}

// ✅ 검색 필터 함수 (즐겨찾기 전용)
export async function applyFilters() {
  const searchInput = document.getElementById('exchange-search-input');

  let filtered = allExchanges;
  const query = searchInput?.value.trim().toLowerCase() || '';

  if (query) {
    // 먼저 즐겨찾기된 거래소들을 가져오기
    const token = localStorage.getItem('token');
    if (token) {
      const favorites = await fetchFavorites();
      const favoritedExchanges = allExchanges.filter(ex => favorites.includes(ex.id));
      filtered = favoritedExchanges.filter(ex => ex.name.toLowerCase().includes(query));
    } else {
      filtered = [];
    }
  }

  await renderExchanges(filtered.length > 0 || !query ? filtered : allExchanges);
}

document.addEventListener('DOMContentLoaded', async function () {
  // 컴포넌트 로드
  await loadHTMLComponent('assets/components/nav.html', 'nav-placeholder');
  await loadHTMLComponent('assets/components/header.html', 'header-placeholder');
  await loadHTMLComponent('assets/components/main_content.html', 'main-content-placeholder');
  await loadHTMLComponent('assets/components/footer.html', 'footer-placeholder');

  // 헤더 초기화 (헤더 컴포넌트 로드 후)
  initializeHeader();

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

    searchInput?.addEventListener('input', applyFilters);

  } catch (err) {
    console.error(err);
    const exchContainer = document.getElementById('exchange-container');
    if (exchContainer) {
      exchContainer.textContent = '거래소 정보를 불러오는 중 오류가 발생했습니다.';
    }
  }

  // 수익 계산기 초기화
  initializeProfitCalculator();
});

// applyFilters 함수를 전역으로 노출
window.applyFilters = applyFilters;