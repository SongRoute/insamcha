import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './db.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// JWT 인증 미들웨어
function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '토큰 필요', code: 'NO_TOKEN' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // 사용자 정보 요청 객체에 저장
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: '토큰이 만료되었습니다', code: 'TOKEN_EXPIRED' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: '유효하지 않은 토큰', code: 'INVALID_TOKEN' });
    } else {
      return res.status(403).json({ message: '토큰 검증 실패', code: 'TOKEN_ERROR' });
    }
  }
}

// ── 정적 파일 서빙: 프로젝트 루트 전체를 노출 ─────────────────────
app.use('/', express.static(path.resolve(__dirname, '../')));

// 미들웨어
app.use(cors());
app.use(express.json());

// ── 회원가입 엔드포인트 ─────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // 1. DB 조회로 중복 체크
    const exists = db.prepare(`SELECT id FROM users WHERE username = ? OR email = ?`).get(username, email);
    if (exists) {
        return res.status(400).json({
            success: false,
            message: '이미 사용 중인 사용자명 또는 이메일입니다.'
        });
    }

    // 2) 비밀번호 해싱 & 저장
    const hash = await bcrypt.hash(password, 10);
    const info = db.prepare(`INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?) `).run(username, email, hash);
    // 2. 회원가입 완료 처리 -> 사용자 저장 (DB insert)
    return res.json({ success: true, message: '회원가입 완료', userId: info.lastInsertRowid });
});

// ── 로그인 엔드포인트 ───────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // 1. DB에서 사용자 조회
    const row = db.prepare(`SELECT id, password_hash FROM users WHERE username = ?`).get(username);
    if (!row) return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

    // 2. 비밀번호 검증
    const { id, password_hash } = row;
    const ok = await bcrypt.compare(password, password_hash);
    if (!ok) return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });

    // 3. JWT 발급
    const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ success: true, token });
});

// ── 로그아웃 엔드포인트 ───────────────────────────────────
app.post('/api/auth/logout', (req, res) => {
    // 클라이언트 사이드에서 토큰을 제거하는 것이 주된 로그아웃 처리
    // 서버에서는 블랙리스트를 관리할 수도 있지만, 간단한 구현에서는 성공 응답만 반환
    return res.json({ success: true, message: '로그아웃 되었습니다.' });
});

// ── 보호된 테스트 API ────────────────────────────────────
app.get('/api/protected', (req, res) => {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.status(401).json({ message: '토큰 필요' });
    try {
        const payload = jwt.verify(auth, JWT_SECRET);
        return res.json({ message: '인증됨', user: payload });
    } catch {
        return res.status(401).json({ message: '토큰 만료 또는 유효하지 않음' });
    }
});

// ── Binance Futures 롱/숏 비율 API 프록시 엔드포인트 ───────────────────
app.get('/api/binance/longshort', async (req, res) => {
    try {
        const { symbol = 'BTCUSDT', limit = 10 } = req.query;
        
        const binanceUrl = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&limit=${limit}`;
        
        console.log(`Fetching data from Binance API: ${binanceUrl}`);
        
        const response = await fetch(binanceUrl);
        
        if (!response.ok) {
            throw new Error(`Binance API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log(`Successfully fetched ${data.length} records for ${symbol}`);
        
        res.json(data);
        
    } catch (error) {
        console.error('Error fetching Binance data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch data from Binance API',
            message: error.message 
        });
    }
});

// ── 샘플 데이터 생성 엔드포인트 (백업용) ──────────────────────────
app.get('/api/sample/longshort', (req, res) => {
    const { symbol = 'BTCUSDT' } = req.query;
    
    const data = [];
    const now = Date.now();
    
    for (let i = 9; i >= 0; i--) {
        const timestamp = now - (i * 5 * 60 * 1000); // 5분 간격
        const longRatio = 0.45 + Math.random() * 0.2; // 45-65% 범위
        const shortRatio = 1 - longRatio;
        
        data.push({
            symbol: symbol,
            longShortRatio: (longRatio / shortRatio).toFixed(4),
            longAccount: longRatio.toFixed(4),
            shortAccount: shortRatio.toFixed(4),
            timestamp: timestamp
        });
    }
    
    console.log(`Generated sample data for ${symbol}`);
    res.json(data);
});

// ── 헬스 체크 엔드포인트 ─────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ── 뉴스 프록시 엔드포인트 ───────────────────────────────
app.get('/api/news', async (req, res) => {
    const { q = 'bitcoin' } = req.query;
    const key = process.env.NEWS_API_KEY;
    const params = new URLSearchParams({
        apiKey: key,
        q,
        sortBy: 'publishedAt',
        pageSize: '10'
    });
    params.set('language', 'en');
    const url = `https://newsapi.org/v2/everything?${params}`;

    try {
        const apiRes = await fetch(url);
        const json = await apiRes.json();
        res.json(json.articles);
    } catch (err) {
        console.error(err);
        res.status(502).json({ message: '뉴스 API 호출 실패' });
    }
});

// ── 거래소 목록 프록시 엔드포인트 ───────────────────────────────
app.get('/api/exchanges', async (req, res) => {
    try {
        const cgUrl = 'https://api.coingecko.com/api/v3/exchanges?per_page=100&page=1';
        const apiRes = await fetch(cgUrl);
        if (!apiRes.ok) {
            return res.status(apiRes.status).json({ message: 'CoinGecko 거래소 API 에러' });
        }
        const exchanges = await apiRes.json();
        return res.json(exchanges);
    } catch (err) {
        console.error('Exchange proxy error:', err);
        return res.status(502).json({ message: '거래소 정보 호출 실패' });
    }
});

// ── Binance Klines 데이터 프록시 엔드포인트 추가 ────────────────
app.get('/api/klines', async (req, res) => {
    const { symbol, interval, startTime, endTime, limit = 500 } = req.query; // limit 기본값 500

    if (!symbol || !interval) {
        return res.status(400).json({ message: 'Symbol and interval are required.' });
    }

    const binanceApiUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}${startTime ? `&startTime=${startTime}` : ''}${endTime ? `&endTime=${endTime}` : ''}`;

    try {
        const apiRes = await fetch(binanceApiUrl);
        if (!apiRes.ok) {
            const errorText = await apiRes.text();
            console.error(`Binance Klines API error: ${apiRes.status} - ${errorText}`);
            return res.status(apiRes.status).json({ message: `Failed to fetch Klines from Binance: ${errorText}` });
        }
        const klinesData = await apiRes.json();
        // Klines 데이터 형식: [
        //   [
        //     1499040000000,      // Open time
        //     "0.00000100",     // Open
        //     "0.00000100",     // High
        //     "0.00000100",     // Low
        //     "0.00000100",     // Close
        //     "0.00000000",     // Volume
        //     1499644799999,      // Close time
        //     "0.00000000",     // Quote asset volume
        //     0,                // Number of trades
        //     "0.00000000",     // Taker buy base asset volume
        //     "0.00000000",     // Taker buy quote asset volume
        //     "0"               // Ignore
        //   ]
        // ]
        res.json(klinesData);
    } catch (err) {
        console.error('Binance Klines proxy error:', err);
        res.status(500).json({ message: 'Failed to fetch Klines data.' });
    }
});

// ── CoinMarketCap 암호화폐 가격 프록시 엔드포인트 ───────────────────
app.get('/api/crypto/prices', async (req, res) => {
    const cmcApiKey = process.env.CMC_API_KEY;
    
    if (!cmcApiKey) {
        return res.status(500).json({ 
            error: 'CoinMarketCap API key is not configured',
            message: 'CMC_API_KEY 환경 변수를 설정해주세요.'
        });
    }

    const cmcUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
    const params = new URLSearchParams({
        start: '1',
        limit: '20',
        convert: 'KRW',
        sort: 'market_cap',
        sort_dir: 'desc'
    });

    try {
        const apiRes = await fetch(`${cmcUrl}?${params}`, {
            headers: {
                'X-CMC_PRO_API_KEY': cmcApiKey,
                'Accept': 'application/json'
            }
        });
        
        if (!apiRes.ok) {
            const errorText = await apiRes.text();
            console.error(`CoinMarketCap API error: ${apiRes.status} - ${errorText}`);
            return res.status(apiRes.status).json({ 
                error: 'Failed to fetch crypto prices',
                message: 'CoinMarketCap API 호출 실패'
            });
        }
        
        const data = await apiRes.json();
        return res.json(data);
    } catch (err) {
        console.error('CoinMarketCap proxy error:', err);
        return res.status(502).json({ 
            error: 'Internal server error',
            message: '암호화폐 가격 정보 호출 실패'
        });
    }
});

// 즐겨찾기 목록 조회
app.get('/api/favorites', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const rows = db.prepare('SELECT exchange_id FROM favorites WHERE user_id = ?').all(userId);
  const favorites = rows.map(row => row.exchange_id);
  res.json({ favorites });
});

app.post('/api/favorites', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const { exchangeId } = req.body;
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, exchange_id) VALUES (?, ?)').run(userId, exchangeId);
  res.json({ success: true });
});

app.delete('/api/favorites', authenticateJWT, (req, res) => {
  const userId = req.user.id;
  const { exchangeId } = req.body;
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND exchange_id = ?').run(userId, exchangeId);
  res.json({ success: true });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📊 Binance proxy available at: http://localhost:${PORT}/api/binance/longshort`);
    console.log(`🔧 Sample data available at: http://localhost:${PORT}/api/sample/longshort`);
    console.log(`💻 Frontend available at: http://localhost:${PORT}`);
});