// assets/js/main.js
import { populateFooter } from './coinData.js';
import BinanceChart from './binanceChart.js';
import { renderNews, fetchCryptoNews } from './news.js';
import { renderExchanges, fetchExchanges, fetchFavorites } from './exchanges.js';
import { initializeProfitCalculator } from './profitCalculator.js';
import { authManager } from './auth.js';
import './nav.js';

let allExchanges = [];
let allCryptoData = [];

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

// 즐겨찾기 암호화폐 렌더링 함수
async function renderFavoriteCryptos() {
  const container = document.getElementById('crypto-favorites-container');
  if (!container) return;

  try {
    // 인증 상태 확인
    if (!authManager.isAuthenticated) {
      container.innerHTML = '<p class="no-data">로그인 후 즐겨찾기를 확인할 수 있습니다.</p>';
      return;
    }

    // 즐겨찾기 목록 가져오기
    const favorites = await fetchFavorites();
    const cryptoFavorites = favorites.filter(fav => 
      // 암호화폐 심볼은 보통 3-5자리 영문 대문자
      /^[A-Z]{3,5}$/.test(fav)
    );

    if (cryptoFavorites.length === 0) {
      container.innerHTML = '<p class="no-data">즐겨찾기한 암호화폐가 없습니다.</p>';
      return;
    }

    // 암호화폐 데이터 가져오기 (간단한 표시용)
    let cryptoHTML = '<div class="favorites-list">';
    
    for (const symbol of cryptoFavorites.slice(0, 10)) { // 최대 10개만 표시
      cryptoHTML += `
        <div class="favorite-item crypto-item">
          <div class="crypto-info">
            <div class="crypto-icon">${symbol.substring(0, 2)}</div>
            <div class="crypto-details">
              <div class="crypto-name">${symbol}</div>
              <div class="crypto-symbol">${symbol}</div>
            </div>
          </div>
          <div class="crypto-actions">
            <button class="view-btn" onclick="window.location.href='price.html'">
              보기
            </button>
          </div>
        </div>
      `;
    }
    
    cryptoHTML += '</div>';
    container.innerHTML = cryptoHTML;

  } catch (error) {
    console.error('즐겨찾기 암호화폐 로딩 실패:', error);
    container.innerHTML = '<p class="error-message">즐겨찾기 암호화폐를 불러올 수 없습니다.</p>';
  }
}

// 즐겨찾기 거래소 렌더링 함수 (기존 로직 활용)
async function renderFavoriteExchanges() {
  const container = document.getElementById('exchange-container');
  if (!container) return;

  try {
    // 인증 상태 확인
    if (!authManager.isAuthenticated) {
      container.innerHTML = '<p class="no-data">로그인 후 즐겨찾기를 확인할 수 있습니다.</p>';
      return;
    }

    // 즐겨찾기 목록 가져오기
    const favorites = await fetchFavorites();
    const exchangeFavorites = favorites.filter(fav => 
      // 거래소 ID는 보통 하이픈이나 긴 문자열
      fav.includes('-') || fav.length > 10
    );

    if (exchangeFavorites.length === 0) {
      container.innerHTML = '<p class="no-data">즐겨찾기한 거래소가 없습니다.</p>';
      return;
    }

    // 전체 거래소 목록에서 즐겨찾기한 거래소만 필터링
    const favoriteExchangeData = allExchanges.filter(exchange => 
      exchangeFavorites.includes(exchange.id)
    );

    await renderExchanges(favoriteExchangeData, 'exchange-container');

  } catch (error) {
    console.error('즐겨찾기 거래소 로딩 실패:', error);
    container.innerHTML = '<p class="error-message">즐겨찾기 거래소를 불러올 수 없습니다.</p>';
  }
}

// 검색 필터 함수들
async function applyCryptoFilters() {
  const searchInput = document.getElementById('crypto-search-input');
  if (!searchInput) return;

  const query = searchInput.value.trim().toLowerCase();
  
  // 검색어가 있으면 필터링, 없으면 전체 즐겨찾기 표시
  await renderFavoriteCryptos();
}

async function applyExchangeFilters() {
  const searchInput = document.getElementById('exchange-search-input');
  if (!searchInput) return;

  const query = searchInput.value.trim().toLowerCase();
  
  try {
    if (!authManager.isAuthenticated) return;

    const favorites = await fetchFavorites();
    const exchangeFavorites = favorites.filter(fav => 
      fav.includes('-') || fav.length > 10
    );

    let filteredExchanges = allExchanges.filter(exchange => 
      exchangeFavorites.includes(exchange.id)
    );

    if (query) {
      filteredExchanges = filteredExchanges.filter(exchange =>
        exchange.name.toLowerCase().includes(query)
      );
    }

    await renderExchanges(filteredExchanges, 'exchange-container');

  } catch (error) {
    console.error('거래소 필터링 실패:', error);
  }
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

  // 거래소 데이터 로딩
  try {
    allExchanges = await fetchExchanges();
    
    // 즐겨찾기 섹션들 초기화
    await renderFavoriteCryptos();
    await renderFavoriteExchanges();

    // 검색 이벤트 연결
    const cryptoSearchInput = document.getElementById('crypto-search-input');
    const exchangeSearchInput = document.getElementById('exchange-search-input');

    cryptoSearchInput?.addEventListener('input', applyCryptoFilters);
    exchangeSearchInput?.addEventListener('input', applyExchangeFilters);

  } catch (err) {
    console.error('초기화 중 오류 발생:', err);
    
    // 각 컨테이너에 오류 메시지 표시
    const cryptoContainer = document.getElementById('crypto-favorites-container');
    const exchangeContainer = document.getElementById('exchange-container');
    
    if (cryptoContainer) {
      cryptoContainer.innerHTML = '<p class="error-message">암호화폐 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
    
    if (exchangeContainer) {
      exchangeContainer.innerHTML = '<p class="error-message">거래소 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
  }

  // 수익 계산기 초기화
  initializeProfitCalculator();

  // 인증 상태 변경 시 즐겨찾기 다시 로드
  document.addEventListener('authStateChanged', async () => {
    await renderFavoriteCryptos();
    await renderFavoriteExchanges();
  });
});

// 함수들을 전역으로 노출 (필요시)
window.applyCryptoFilters = applyCryptoFilters;
window.applyExchangeFilters = applyExchangeFilters;