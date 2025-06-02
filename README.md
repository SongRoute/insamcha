# Insamcha

암호화폐 웹 소프트웨어 프로젝트입니다.

## 프로젝트 구조

```
/
├── index.html              # 메인 페이지
├── login.html              # 로그인 페이지  
├── signup.html             # 회원가입 페이지
├── favorite.html           # 즐겨찾기 페이지
├── price.html              # 암호화폐 실시간 시세 페이지
├── assets/                 # 정적 자산
│   ├── css/               # 스타일시트
│   ├── js/                # JavaScript 파일
│   ├── components/        # HTML 컴포넌트
│   ├── icons/             # SVG 아이콘
│   └── data/              # 데이터 파일
├── backend/               # 백엔드 서버
│   ├── server.js          # Express 서버
│   ├── db.js              # 데이터베이스 설정
│   └── package.json       # 백엔드 의존성
└── README.md              # 프로젝트 문서
```

## 환경 설정

백엔드 서버 실행을 위한 환경 변수 설정:

```bash
# backend/.env 파일 생성
JWT_SECRET=your_jwt_secret_key
NEWS_API_KEY=your_news_api_key
CMC_API_KEY=your_coinmarketcap_api_key
```

### API 키 발급
- CoinMarketCap API: https://pro.coinmarketcap.com/signup 에서 무료 계정 생성 후 API 키 발급

## 실행 방법

1. 백엔드 서버 실행:
```bash
cd backend
npm install
npm start
```

2. 브라우저에서 `http://localhost:3000` 접속

## 주요 기능

- 암호화폐 실시간 차트
- 거래소 정보 조회 및 검색
- 암호화폐 뉴스 조회 및 검색  
- 암호화폐 실시간 시세 조회 (상위 20개)
- 사용자 인증 (회원가입/로그인)
- 반응형 UI/UX

## 중간 발표
https://www.canva.com/design/DAGpHWI4Swg/Oda3vEd-tXk-JDopab3Q3w/edit
