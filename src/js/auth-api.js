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
