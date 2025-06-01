// src/js/main.js

import { populateFooter } from './coinData.js';
import { fetchChartData } from './chart.js';
import { renderNews, fetchCryptoNews } from './news.js';
import { renderExchanges, fetchExchanges } from './exchanges.js';

let allExchanges = []; // 전체 거래소 정보를 저장해 둘 전역 변수

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

document.addEventListener('DOMContentLoaded', async () => {
  // 1) 컴포넌트 로드
  await loadHTMLComponent('./components/nav.html', 'nav-placeholder');
  await loadHTMLComponent('./components/header.html', 'header-placeholder');
  await loadHTMLComponent('./components/main_content.html', 'main-content-placeholder');
  await loadHTMLComponent('./components/footer.html', 'footer-placeholder');

  // 2) 로그인 버튼 이벤트
  const loginButton = document.querySelector('.login-btn');
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  // 3) 로고 클릭 이벤트
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // 4) 푸터·차트 초기화
  populateFooter();
  fetchChartData();

  // 5) 뉴스 렌더링
  renderNews();
renderNews(); // 기본 키워드 = 'bitcoin'
const newsSearchInput = document.getElementById('news-search-input');
if (newsSearchInput) {
  newsSearchInput.addEventListener('input', () => {
      const keyword = newsSearchInput.value.trim();
      // 입력창이 비어 있으면 기본(‘bitcoin’) 뉴스, 아니면 입력된 키워드로 검색
      if (keyword === '') {
        renderNews(); // 빈 칸 시 기본값 사용
      } else {
        renderNews(keyword);
      }
    });
  }

  // 6) 거래소 정보 가져와서 렌더 + 검색 필터 연결
  try {
    allExchanges = await fetchExchanges(); // 전체 배열 저장
    renderExchanges(allExchanges);

    // 검색창(input) 요소
    const exchangeSearchInput = document.getElementById('exchange-search-input');
    if (exchangeSearchInput) {
      exchangeSearchInput.addEventListener('input', () => {
        const query = exchangeSearchInput.value.trim().toLowerCase();
        if (!query) {
          // 입력값이 비어 있으면 전체 목록 렌더
          renderExchanges(allExchanges);
        } else {
          // 이름에 검색어 포함된 항목만 필터링
          const filtered = allExchanges.filter(ex =>
            ex.name.toLowerCase().includes(query)
          );
          renderExchanges(filtered);
        }
      });
    }
  } catch (err) {
    console.error(err);
    const exchContainer = document.getElementById('exchange-container');
    if (exchContainer) {
      exchContainer.textContent = '거래소 정보를 불러오는 중 오류가 발생했습니다.';
    }
  }
});
