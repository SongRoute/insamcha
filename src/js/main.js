import { populateFooter } from './coinData.js';
import BinanceChart from './binanceChart.js'; // NEW: 새 BinanceChart 클래스 가져오기
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
            console.error(`ID '${placeholderId}'를 가진 플레이스홀더를 찾을 수 없습니다.`);
        }
    } catch (error) {
        console.error("HTML 컴포넌트를 로드할 수 없습니다:", error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // HTML 컴포넌트 로드
    await loadHTMLComponent('./components/nav.html', 'nav-placeholder');
    await loadHTMLComponent('./components/header.html', 'header-placeholder');
    await loadHTMLComponent('./components/main_content.html', 'main-content-placeholder');
    await loadHTMLComponent('./components/footer.html', 'footer-placeholder');

    // 헤더 로드 후 로그인 버튼에 이벤트 리스너 추가
    const loginButton = document.querySelector('.login-btn'); // 로그인 버튼이 'login-btn' 클래스를 가진다고 가정
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // 네비게이션 로드 후 로고에 이벤트 리스너 추가
    const logo = document.querySelector('.logo'); // 로고가 'logo' 클래스를 가진다고 가정
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // 모든 컴포넌트, 특히 푸터와 메인 콘텐츠(차트용) 로드 후
    // 관련 요소를 채우거나 이벤트 리스너를 첨부하는 함수를 호출합니다.
    // 관련 HTML이 DOM에 로드된 후에 이러한 함수가 호출되는지 확인합니다.
    populateFooter();

    // NEW: main_content가 로드된 후 바이낸스 차트 초기화
    if (document.getElementById('priceChart')) { // 캔버스 요소가 존재하는지 확인
        const binanceChart = new BinanceChart();
        // 페이지 언로드 시 정리 확인
        window.addEventListener('beforeunload', () => {
            binanceChart.disconnect();
        });
    } else {
        console.error("main_content.html 로드 후 ID 'priceChart'를 가진 캔버스를 찾을 수 없습니다. 바이낸스 차트가 초기화되지 않습니다.");
    }

    renderNews();
    const searchBtn   = document.getElementById('news-search-btn');
    const searchInput = document.getElementById('news-search-input');

    if (searchBtn) { // searchBtn에 대한 검사 추가
        searchBtn.addEventListener('click', () => {
            const keyword = searchInput.value.trim();
            if (keyword) {
            renderNews(keyword);
            }
        });
    }

    // Enter 키로도 검색
    if (searchInput) { // searchInput에 대한 검사 추가
        searchInput.addEventListener('keyup', e => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
            renderNews(searchInput.value.trim());
            }
        });
    }
});

/**
 * 뉴스 렌더링: query 키워드를 받아서 제목만 출력
 * @param {string} query 검색 키워드
 */
async function renderNews(query = 'bitcoin') {
  const container = document.getElementById('news-container');
  if (!container) { // 컨테이너에 대한 검사 추가
      console.error("뉴스 컨테이너를 찾을 수 없습니다.");
      return;
  }
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