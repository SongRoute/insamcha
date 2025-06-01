// src/js/news.js

/**
 * 암호화폐 뉴스 가져오기 (백엔드 프록시)
 * @param {string} q 검색 키워드 (기본: cryptocurrency)
 * @returns {Promise<Array>} articles 배열
 */
export async function fetchCryptoNews(q = 'cryptocurrency') {
  const url = `/api/news?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!res.ok) {
    throw new Error(`뉴스를 가져오는 데 실패했습니다 (status: ${res.status})`);
  }
  return res.json(); // articles 배열만 반환함
}

/**
 * 뉴스 렌더링: query 키워드를 받아서 제목만 출력
 * @param {string} query 검색 키워드
 */
export async function renderNews(query = 'bitcoin') {
  const container = document.getElementById('news-container');
  if (!container) return;

  container.innerHTML = ''; // 이전 결과 초기화

  let articles;
  try {
    articles = await fetchCryptoNews(query);
  } catch (e) {
    container.textContent = '❌ 뉴스를 불러오는 중 오류가 발생했습니다.';
    console.error(e);
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
