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

  const res = await fetch('/api/exchanges', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!res.ok) {
    throw new Error(`거래소 정보를 가져오지 못했습니다. (status: ${res.status})`);
  }

  const data = await res.json();
  exchangeCache = data;
  cacheTime = now;
  return data;
}

/**
 * 거래소 정보를 카드 형태로 렌더링
 * @param {Array} exchanges CoinGecko에서 받아온 거래소 배열
 */
export async function renderExchanges(exchanges) {
  const container = document.getElementById('exchange-container');
  if (!container) return;

  const token = localStorage.getItem('token');
  const favorites = token ? await fetchFavorites() : [];

  container.innerHTML = ''; // 초기화

  exchanges.forEach(ex => {
    const isFavorited = favorites.includes(ex.id);
    const card = document.createElement('div');
    card.className = 'exchange-card';
    card.style.position = 'relative';

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
      <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-id="${ex.id}" title="즐겨찾기">
        ${isFavorited ? '★' : '☆'}
      </button>
    `;

    container.appendChild(card);
  });

  // 이벤트 등록
  document.querySelectorAll('.favorite-btn').forEach(btn => {
   btn.addEventListener('click', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('즐겨찾기는 로그인 후 이용 가능합니다.');
      return;
    }

    const exchangeId = btn.dataset.id;
    const isNowFavorited = btn.classList.contains('favorited');

    let success;
    if (isNowFavorited) {
      success = await removeFavorite(exchangeId);
      if (success) {
        btn.classList.remove('favorited');
        btn.textContent = '☆';
      }
    } else {
      success = await addFavorite(exchangeId);
      if (success) {
        btn.classList.add('favorited');
        btn.textContent = '★';
      }
    }

    if (!success) return;

    // ✅ 필터 체크 여부를 기준으로 목록 다시 표시
    const favOnly = document.getElementById('show-favorites-only')?.checked;
    
    if (favOnly) {
      // main.js의 applyFilters 함수 호출
      if (window.applyFilters) {
        await window.applyFilters(); 
      }
    } else {
      const allExchanges = await fetchExchanges();
      await renderExchanges(allExchanges);
    }
  });
  });
}