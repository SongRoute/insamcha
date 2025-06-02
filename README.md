# 인삼차 (Insamcha) - 암호화폐 정보 플랫폼

암호화폐 시장 정보를 실시간으로 제공하는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **실시간 차트**: Binance API를 통한 암호화폐 가격 차트
- **최신 뉴스**: 암호화폐 관련 최신 뉴스 피드
- **거래소 정보**: 주요 암호화폐 거래소 정보
- **롱/숏 비율**: Binance Futures의 실시간 롱/숏 포지션 비율 시각화
- **손익 계산기**: 가상 투자 시뮬레이션
- **다크/라이트 모드**: 사용자 환경 설정
- **반응형 디자인**: 모바일 최적화

## 📊 새로운 기능: 롱/숏 포지션 비율

nav에서 두번째 heart 버튼을 클릭하면 Binance Futures API를 사용한 롱/숏 포지션 비율 차트를 볼 수 있습니다.

### 기능
- **실시간 데이터**: Binance Futures globalLongShortAccountRatio API 사용
- **시각화**: Chart.js를 사용한 막대그래프
- **코인 선택**: BTCUSDT, ETHUSDT 지원
- **시간 형식**: MM/DD HH:mm 형식으로 표시
- **색상 구분**: 롱(초록색), 숏(빨간색)

## 🛠️ 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Chart.js (차트 라이브러리)
- 반응형 CSS Grid/Flexbox

### Backend
- Node.js
- Express.js
- CORS 처리
- Binance API 프록시

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/insamcha.git
cd insamcha
```

### 2. 백엔드 서버 설정
```bash
cd backend
npm install
```

### 3. 백엔드 서버 실행
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 또는 일반 실행
npm start
```

백엔드 서버가 `http://localhost:3000`에서 실행됩니다.

### 4. 프론트엔드 실행

#### 옵션 1: Live Server (권장)
VS Code의 Live Server 확장을 사용하여 `index.html`을 실행합니다.

#### 옵션 2: 백엔드 서버에서 직접 서빙
백엔드 서버가 실행 중이면 `http://localhost:3000`에서 프론트엔드에 접근할 수 있습니다.

#### 옵션 3: Python HTTP 서버
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

## 🔧 API 엔드포인트

### 백엔드 API
- `GET /api/binance/longshort` - Binance Futures 롱/숏 비율 (실시간)
- `GET /api/sample/longshort` - 샘플 데이터
- `GET /api/health` - 서버 상태 확인

### 쿼리 파라미터
- `symbol`: 암호화폐 심볼 (예: BTCUSDT, ETHUSDT)
- `limit`: 데이터 개수 (기본값: 10)

## 🌐 사용 방법

1. **로그인**: 회원가입 후 로그인
2. **대시보드**: 실시간 차트 및 시장 정보 확인
3. **롱/숏 비율**: nav 두번째 버튼을 통해 포지션 비율 확인
   - 🔄 **실시간 데이터**: 백엔드 서버를 통한 실제 Binance 데이터
   - 📋 **샘플 데이터**: 시연용 가상 데이터
4. **가격 정보**: nav 첫번째 버튼을 통해 실시간 시세 확인

## 🔐 보안 및 인증

- JWT 기반 인증 시스템
- 로그인 가드를 통한 페이지 보호
- 토큰 기반 세션 관리

## 📱 반응형 디자인

- 모바일 우선 설계
- 태블릿 및 데스크톱 최적화
- 터치 친화적 인터페이스

## 🎨 테마

- **라이트 모드**: 기본 밝은 테마
- **다크 모드**: 눈에 편한 어두운 테마
- **자동 감지**: 시스템 설정에 따른 자동 테마 적용

## 🚨 CORS 이슈 해결

Binance API는 CORS 정책으로 인해 브라우저에서 직접 접근할 수 없습니다. 
이 프로젝트는 다음과 같은 해결책을 제공합니다:

1. **백엔드 프록시 서버**: Express.js를 통한 API 프록시
2. **샘플 데이터**: 시연용 가상 데이터
3. **에러 처리**: 우아한 폴백 시스템

## 📈 차트 기능

- **실시간 업데이트**: 최신 시장 데이터
- **인터랙티브**: 마우스 호버로 상세 정보
- **반응형**: 모든 화면 크기에 최적화
- **애니메이션**: 부드러운 전환 효과

## 🛣️ 로드맵

- [ ] 더 많은 암호화폐 지원
- [ ] 고급 차트 분석 도구
- [ ] 가격 알림 기능
- [ ] 포트폴리오 추적
- [ ] 모바일 앱 개발

## 🤝 기여하기

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 이슈를 통해 남겨주세요.

---

**인삼차 팀** 🚀
