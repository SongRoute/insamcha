/**
 * 암호화폐 뉴스 가져오기 (백엔드 프록시)
 * @param {string} q 검색 키워드 (기본: cryptocurrency)
 * @returns {Promise<Array>} articles 배열
 */
export async function fetchCryptoNews(q = 'cryptocurrency') {
  // 백엔드의 /api/news 엔드포인트를 호출합니다.
  const url = `/api/news?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      // 로그인 시 저장한 JWT 토큰을 함께 전송하여 인증된 사용자만 호출할 수 있도록 합니다.
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!res.ok) {
    throw new Error(`뉴스를 가져오는 데 실패했습니다 (status: ${res.status})`);
  }

  // 백엔드에서 이미 articles 배열만 리턴하도록 구현했으므로, 바로 JSON 파싱 결과를 반환합니다.
  return res.json();
}
