// src/js/auth.js
import { login, signup } from './auth-api.js';

document.addEventListener('DOMContentLoaded', () => {
  // 로그인
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const username = e.target.username.value;
      const password = e.target.password.value;
      const result   = await login(username, password);
      if (result.success) {
        localStorage.setItem('token', result.token);
        window.location.href = '/html/index.html';
      } else {
        alert('로그인 실패: ' + result.message);
      }
    });
  }

  // 회원가입
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const { username, email, password, 'confirm-password': confirm } = e.target;
      if (password.value !== confirm.value) {
        alert('비밀번호 확인이 일치하지 않습니다.');
        return;
      }
      const result = await signup(username.value, email.value, password.value);
      if (result.success) {
        alert('회원가입 성공!');
        window.location.href = '/html/login.html';
      } else {
        alert('회원가입 실패: ' + result.message);
      }
    });
  }
});
