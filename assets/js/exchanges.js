// src/js/exchanges.js

let exchangeCache = null;
let cacheTime = 0;

export async function fetchFavorites() {
  const token = localStorage.getItem('token');
  if (!token) return [];

  try {
    const res = await fetch('/api/favorites', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 403 || res.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      localStorage.removeItem('token');
      if (window.authManager) {
        window.authManager.setUser(null);
      }
      return [];
    }
    
    if (res.ok) {
      const data = await res.json();
      return data.favorites || [];
    }
    return [];
  } catch (error) {
    console.error('즐겨찾기 조회 실패:', error);
    return [];
  }
}

export async function addFavorite(exchangeId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('로그인이 필요합니다.');
    return false;
  }

  try {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ exchangeId })
    });

    if (res.status === 403 || res.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      localStorage.removeItem('token');
      if (window.authManager) {
        window.authManager.setUser(null);
      }
      alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      return false;
    }

    return res.ok;
  } catch (error) {
    console.error('즐겨찾기 추가 실패:', error);
    return false;
  }
}

export async function removeFavorite(exchangeId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('로그인이 필요합니다.');
    return false;
  }

  try {
    const res = await fetch('/api/favorites', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ exchangeId })
    });

    if (res.status === 403 || res.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      localStorage.removeItem('token');
      if (window.authManager) {
        window.authManager.setUser(null);
      }
      alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      return false;
    }

    return res.ok;
  } catch (error) {
    console.error('즐겨찾기 제거 실패:', error);
    return false;
  }
}

/**
 * 거래소 정보 가져오기 (백엔드 프록시 호출)
 * @returns {Promise<Array>} CoinGecko 에서 받아온 거래소 배열
 */
export async function fetchExchanges() {
  const now = Date.now();

  // 30초 캐시 유지
  if (exchangeCache && now - cacheTime < 30000) {
    return exchangeCache;
  }

  const res = await fetch('/api/exchanges');

  if (!res.ok) {
    throw new Error(`거래소 정보를 가져오지 못했습니다. (status: ${res.status})`);
  }

  const data = await res.json();
  exchangeCache = data;
  cacheTime = now;
  return data;
}

/**
 * 거래소 정보를 테이블 형태로 렌더링 (즐겨찾기만 표시)
 * @param {Array} exchanges CoinGecko에서 받아온 거래소 배열
 */
export async function renderExchanges(exchanges) {
  const container = document.getElementById('exchange-container');
  if (!container) return;

  const token = localStorage.getItem('token');
  
  // 로그인하지 않은 경우 안내 메시지 표시
  if (!token) {
    container.innerHTML = `
      <tr>
        <td colspan="2">
          <div class="no-favorites-message">
            <p>즐겨찾기 거래소를 보려면 로그인이 필요합니다.</p>
            <button onclick="window.location.href='/login.html'" class="login-prompt-btn">로그인하기</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const favorites = await fetchFavorites();
  
  // 즐겨찾기된 거래소만 필터링
  const favoritedExchanges = exchanges.filter(ex => favorites.includes(ex.id));

  container.innerHTML = ''; // 초기화

  // 즐겨찾기가 없는 경우
  if (favoritedExchanges.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="2">
          <div class="no-favorites-message">
            <p>아직 즐겨찾기에 추가된 거래소가 없습니다.</p>
            <p>거래소 정보 페이지에서 관심있는 거래소를 즐겨찾기에 추가해보세요.</p>
            <button onclick="window.location.href='/ex.html'" class="go-to-exchanges-btn">거래소 정보 보기</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  favoritedExchanges.forEach(ex => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td class="name">
        <div class="exchange-info">
          <img src="${ex.image}" alt="${ex.name}" class="exchange-logo" />
          <div class="exchange-name">${ex.name}</div>
        </div>
      </td>
      <td class="volume">${Number(ex.trade_volume_24h_btc).toLocaleString()} BTC</td>
    `;

    // 클릭 이벤트 추가
    row.addEventListener('click', () => {
      window.open(ex.url, '_blank');
    });

    row.style.cursor = 'pointer';
    container.appendChild(row);
  });
}