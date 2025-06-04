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
      // 암호화폐 심볼은 보통 3-5자리 영문 대문자이고 거래소 ID가 아닌 것들
      /^[A-Z]{2,8}$/.test(fav) && !fav.includes('-') && fav.length <= 10
    );

    if (cryptoFavorites.length === 0) {
      container.innerHTML = `
        <div class="no-favorites-message">
          <p>아직 즐겨찾기에 추가된 암호화폐가 없습니다.</p>
          <p>시세 정보 페이지에서 관심있는 암호화폐를 즐겨찾기에 추가해보세요.</p>
          <button onclick="window.location.href='/price.html'" class="go-to-price-btn">시세 정보 보기</button>
        </div>
      `;
      return;
    }

    // 즐겨찾기한 암호화폐 데이터 표시
    let cryptoHTML = '<div class="favorites-list">';
    
    for (const symbol of cryptoFavorites.slice(0, 8)) { // 최대 8개만 표시
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
              시세보기
            </button>
            <button class="remove-btn" onclick="removeCryptoFromFavorites('${symbol}')">
              제거
            </button>
          </div>
        </div>
      `;
    }
    
    if (cryptoFavorites.length > 8) {
      cryptoHTML += `
        <div class="more-items">
          <p>외 ${cryptoFavorites.length - 8}개 더...</p>
          <button onclick="window.location.href='price.html'" class="view-all-btn">전체 보기</button>
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

    // exchanges.js의 renderExchanges 함수를 직접 호출
    // 이 함수는 이미 즐겨찾기 필터링과 렌더링을 모두 처리합니다
    await renderExchanges(allExchanges);

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

    let filteredExchanges = allExchanges.filter(exchange => 
      favorites.includes(exchange.id)
    );

    if (query) {
      filteredExchanges = filteredExchanges.filter(exchange =>
        exchange.name.toLowerCase().includes(query)
      );
    }

    // exchanges.js의 renderExchanges는 자체적으로 즐겨찾기 필터링을 하므로
    // 검색이 있을 때만 필터된 데이터를 사용하고, 없으면 전체 데이터를 넘김
    if (query) {
      // 검색이 있을 때는 수동으로 렌더링
      const container = document.getElementById('exchange-container');
      if (container) {
        container.innerHTML = '';
        
        if (filteredExchanges.length === 0) {
          container.innerHTML = '<p class="no-data">검색 결과가 없습니다.</p>';
          return;
        }

        filteredExchanges.forEach(ex => {
          const card = document.createElement('div');
          card.className = 'exchange-card';

          card.innerHTML = `
            <a href="${ex.url}" target="_blank" class="exchange-link">
              <div class="exchange-logo-wrapper">
                <img src="${ex.image}" alt="${ex.name}" class="exchange-logo" />
              </div>
              <div class="exchange-text">
                <div class="exchange-name">${ex.name}</div>
                <div class="exchange-volume">24h 거래량: ${Number(ex.trade_volume_24h_btc).toLocaleString()} BTC</div>
                <div class="exchange-score">신뢰 점수: ${ex.trust_score_rank}위</div>
              </div>
            </a>
          `;

          container.appendChild(card);
        });
      }
    } else {
      // 검색이 없으면 기본 renderExchanges 함수 사용
      await renderExchanges(allExchanges);
    }

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

// 암호화폐 즐겨찾기 제거 함수
window.removeCryptoFromFavorites = async function(symbol) {
  try {
    const success = await removeFavorite(symbol);
    if (success) {
      await renderFavoriteCryptos(); // 다시 렌더링
      showTemporaryMessage(`${symbol}이(가) 즐겨찾기에서 제거되었습니다.`);
    } else {
      alert('즐겨찾기 제거에 실패했습니다.');
    }
  } catch (error) {
    console.error('즐겨찾기 제거 실패:', error);
    alert('즐겨찾기 제거 중 오류가 발생했습니다.');
  }
};

// 임시 메시지 표시 함수
function showTemporaryMessage(message) {
  const existingMessage = document.querySelector('.temp-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageElement = document.createElement('div');
  messageElement.className = 'temp-message';
  messageElement.textContent = message;
  messageElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    font-size: 14px;
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(messageElement);
  
  setTimeout(() => {
    messageElement.style.opacity = '0';
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 300);
  }, 3000);
}