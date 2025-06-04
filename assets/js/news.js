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
 * 뉴스 렌더링: query 키워드를 받아서 테이블 형식으로 출력
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
    container.innerHTML = '<tr><td class="error-message">❌ 뉴스를 불러오는 중 오류가 발생했습니다.</td></tr>';
    console.error(e);
    return;
  }

  if (!articles || articles.length === 0) {
    container.innerHTML = '<tr><td class="no-data">🔍 관련 뉴스가 없습니다.</td></tr>';
    return;
  }

  // 최대 15개 뉴스로 제한
  const limitedArticles = articles.slice(0, 15);

  limitedArticles.forEach(article => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="news-title">
        <a href="${article.url}" target="_blank" class="news-link">
          ${article.title}
        </a>
      </td>
    `;
    
    // 호버 효과
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = 'var(--bg-tertiary)';
    });
    
    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = '';
    });

    container.appendChild(row);
  });
}
