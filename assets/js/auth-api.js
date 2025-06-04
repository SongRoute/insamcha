const BASE = '/api/auth';

export async function signup(username, email, password) {
  const res = await fetch(`${BASE}/signup`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, email, password })
  });
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password })
  });
  return res.json();
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/index.html';
}

export async function verifyToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const res = await fetch('/api/protected', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    } else {
      // 토큰이 유효하지 않으면 제거
      localStorage.removeItem('token');
      return null;
    }
  } catch (error) {
    // 네트워크 오류 등의 경우 토큰 제거
    localStorage.removeItem('token');
    return null;
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}
