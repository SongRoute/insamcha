// assets/js/main.js

import { populateFooter } from './coinData.js';
import BinanceChart from './binanceChart.js'; // Binance Chart 클래스
import { renderNews, fetchCryptoNews } from './news.js';
import { renderExchanges, fetchExchanges } from './exchanges.js';
import { initializeProfitCalculator } from './profitCalculator.js'; // 새로 추가된 import
import './nav.js'; // Navigation script including dark mode toggle

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
            console.error(`ID '${placeholderId}'를 가진 플레이스홀더를 찾을 수 없습니다.`);
        }
    } catch (error) {
        console.error("HTML 컴포넌트를 로드할 수 없습니다:", error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Load HTML components
    await loadHTMLComponent('assets/components/nav.html', 'nav-placeholder');
    await loadHTMLComponent('assets/components/header.html', 'header-placeholder');
    await loadHTMLComponent('assets/components/main_content.html', 'main-content-placeholder');
    await loadHTMLComponent('assets/components/footer.html', 'footer-placeholder');

    // Nav 컴포넌트 로드 후 nav.js 스크립트 실행을 위한 이벤트 발생
    const navLoadedEvent = new Event('navLoaded');
    document.dispatchEvent(navLoadedEvent);

    // 헤더 로드 후 로그인 버튼에 이벤트 리스너 추가
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // 네비게이션 로드 후 로고에 이벤트 리스너 추가
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // 푸터 초기화 - footer HTML 로드 후 실행
    await populateFooter();

    // Binance 차트 초기화
    if (document.getElementById('priceChart')) {
        const binanceChart = new BinanceChart();
        window.addEventListener('beforeunload', () => {
            binanceChart.disconnect();
        });
    } else {
        console.error("main_content.html 로드 후 ID 'priceChart'를 가진 캔버스를 찾을 수 없습니다. 바이낸스 차트가 초기화되지 않습니다.");
    }

    // 뉴스 렌더링 및 검색 기능
    renderNews();
    const newsSearchInput = document.getElementById('news-search-input');
    if (newsSearchInput) {
        newsSearchInput.addEventListener('input', () => {
            const keyword = newsSearchInput.value.trim();
            if (keyword === '') {
                renderNews(); // 빈 칸 시 기본값 사용
            } else {
                renderNews(keyword);
            }
        });
    }

    // 뉴스 검색 버튼 기능
    const searchBtn = document.getElementById('news-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('input', () => {
            const keyword = newsSearchInput.value.trim();
            if (keyword) {
                renderNews(keyword);
            }
        });
    }

    // Enter 키로도 검색
    if (newsSearchInput) {
        newsSearchInput.addEventListener('keyup', e => {
            if (e.key === 'Enter' && newsSearchInput.value.trim()) {
                renderNews(newsSearchInput.value.trim());
            }
        });
    }

    // 거래소 정보 가져와서 렌더 + 검색 필터 연결
    try {
        allExchanges = await fetchExchanges(); // 전체 배열 저장
        renderExchanges(allExchanges);

        // 거래소 검색창 요소
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

    // ✨ 새로 추가된 부분: 손익 계산기 초기화
    initializeProfitCalculator();
});