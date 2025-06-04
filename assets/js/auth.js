// src/js/auth.js
import { login, signup, logout, verifyToken, isLoggedIn } from './auth-api.js';

// 전역 인증 상태 관리
class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = [];
  }

  // 인증 상태 변경 리스너 등록
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 인증 상태 변경 알림
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.isAuthenticated, this.user));
  }

  // 로그인 상태 설정
  setUser(user) {
    this.user = user;
    this.isAuthenticated = !!user;
    this.notifyListeners();
  }

  // 로그아웃
  logout() {
    this.user = null;
    this.isAuthenticated = false;
    logout(); // auth-api.js의 logout 함수 호출
    this.notifyListeners();
  }

  // 토큰 검증 및 사용자 정보 로드
  async checkAuth() {
    if (isLoggedIn()) {
      const user = await verifyToken();
      this.setUser(user);
      return user;
    } else {
      this.setUser(null);
      return null;
    }
  }
}

// 전역 인증 매니저 인스턴스
export const authManager = new AuthManager();

// 헤더 UI 업데이트 함수
function updateHeaderUI(isAuthenticated, user) {
  const loginButton = document.querySelector('.login-button');
  const signupButton = document.querySelector('.signup-button');
  const navActionsContainer = document.querySelector('.nav-actions-container');

  if (!navActionsContainer) return;

  if (isAuthenticated && user) {
    // 로그인된 상태
    if (loginButton) loginButton.style.display = 'none';
    if (signupButton) signupButton.style.display = 'none';

    // 로그아웃 버튼이 없으면 생성
    let logoutButton = document.querySelector('.logout-button');
    let userInfo = document.querySelector('.user-info');
    
    if (!logoutButton) {
      // 사용자 정보 표시
      userInfo = document.createElement('span');
      userInfo.className = 'user-info';
      userInfo.textContent = `${user.username}님`;
      userInfo.style.marginRight = '10px';
      userInfo.style.color = 'var(--text-color)';
      
      // 로그아웃 버튼 생성
      logoutButton = document.createElement('button');
      logoutButton.className = 'header-button logout-button';
      logoutButton.textContent = '로그아웃';
      logoutButton.addEventListener('click', () => {
        authManager.logout();
      });

      navActionsContainer.appendChild(userInfo);
      navActionsContainer.appendChild(logoutButton);
    }
  } else {
    // 로그아웃된 상태
    if (loginButton) loginButton.style.display = 'inline-block';
    if (signupButton) signupButton.style.display = 'inline-block';

    // 로그아웃 버튼과 사용자 정보 제거
    const logoutButton = document.querySelector('.logout-button');
    const userInfo = document.querySelector('.user-info');
    
    if (logoutButton) logoutButton.remove();
    if (userInfo) userInfo.remove();
  }
}

// 인증 상태 변경 리스너 등록
authManager.addListener(updateHeaderUI);

document.addEventListener('DOMContentLoaded', () => {
  // 페이지 로드 시 인증 상태 확인
  authManager.checkAuth();

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
        // 사용자 정보 로드
        await authManager.checkAuth();
        
        // Check for returnUrl parameter
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');
        
        if (returnUrl) {
          // Redirect to the original page
          window.location.href = decodeURIComponent(returnUrl);
        } else {
          // Default redirect to index
          window.location.href = '/index.html';
        }
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
        window.location.href = '/login.html';
      } else {
        alert('회원가입 실패: ' + result.message);
      }
    });
  }
});

// 전역으로 authManager 노출
window.authManager = authManager;
