// src/js/exchanges.js

/**
 * 거래소 정보 가져오기 (백엔드 프록시 호출)
 * @returns {Promise<Array>} CoinGecko 에서 받아온 거래소 배열
 */
export async function fetchExchanges() {
  const res = await fetch('/api/exchanges', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!res.ok) {
    throw new Error(`거래소 정보를 가져오지 못했습니다. (status: ${res.status})`);
  }
  return res.json();
}

/**
 * 거래소 정보를 카드 형태로 렌더링
 * @param {Array} exchanges CoinGecko에서 받아온 거래소 배열
 */
export function renderExchanges(exchanges) {
  const container = document.getElementById('exchange-container');
  if (!container) return;

  container.innerHTML = ''; // 이전 렌더링 초기화

  exchanges.forEach(ex => {
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
