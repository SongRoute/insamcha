// src/js/news.js
const API_KEY = '키 추가';  // newsAPI 키 설정
const ENDPOINT = 'https://newsapi.org/v2/everything';

export async function fetchCryptoNews(q = 'cryptocurrency') {
  const url = `${ENDPOINT}?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=10&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('뉴스를 가져오는 데 실패했습니다');
  const { articles } = await res.json();
  return articles;
}
