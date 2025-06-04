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

// ── Bybit Long/Short Ratio API 프록시 엔드포인트 ───────────────────
app.get('/api/bybit/longshort', async (req, res) => {
    try {
        const { symbol = 'BTCUSDT', limit = 10, period = '1h' } = req.query;
        
        // Bybit API 엔드포인트
        const bybitUrl = `https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${symbol}&period=${period}&limit=${limit}`;
        
        console.log(`Fetching data from Bybit API: ${bybitUrl}`);
        
        const response = await fetch(bybitUrl);
        
        if (!response.ok) {
            throw new Error(`Bybit API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Bybit API 응답 구조에 맞게 데이터 변환
        if (data.retCode !== 0) {
            throw new Error(`Bybit API error: ${data.retMsg}`);
        }
        
        // 데이터 포맷을 기존 구조와 호환되도록 변환
        const transformedData = data.result.list.map(item => ({
            symbol: item.symbol,
            longShortRatio: (parseFloat(item.buyRatio) / parseFloat(item.sellRatio)).toFixed(4),
            longAccount: item.buyRatio,
            shortAccount: item.sellRatio,
            timestamp: parseInt(item.timestamp)
        }));
        
        console.log(`Successfully fetched ${transformedData.length} records for ${symbol} from Bybit`);
        
        res.json(transformedData);
        
    } catch (error) {
        console.error('Error fetching Bybit data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch data from Bybit API',
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

 // ── Bybit Klines 데이터 프록시 엔드포인트 ────────────────
app.get('/api/klines', async (req, res) => {
    const { symbol, interval, startTime, endTime, limit = 500 } = req.query;

    if (!symbol || !interval) {
        return res.status(400).json({ message: 'Symbol and interval are required.' });
    }

    // Bybit interval 형식 변환 (Binance -> Bybit)
    const intervalMapping = {
        '1m': '1',
        '3m': '3',
        '5m': '5',
        '15m': '15',
        '30m': '30',
        '1h': '60',
        '2h': '120',
        '4h': '240',
        '6h': '360',
        '12h': '720',
        '1d': 'D',
        '1w': 'W',
        '1M': 'M'
    };

    const bybitInterval = intervalMapping[interval] || interval;
    
    // Bybit API URL 구성
    let bybitApiUrl = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol.toUpperCase()}&interval=${bybitInterval}&limit=${limit}`;
    
    if (startTime) {
        bybitApiUrl += `&start=${startTime}`;
    }
    if (endTime) {
        bybitApiUrl += `&end=${endTime}`;
    }

    try {
        console.log(`Fetching Klines from Bybit API: ${bybitApiUrl}`);
        
        const apiRes = await fetch(bybitApiUrl);
        if (!apiRes.ok) {
            const errorText = await apiRes.text();
            console.error(`Bybit Klines API error: ${apiRes.status} - ${errorText}`);
            return res.status(apiRes.status).json({ message: `Failed to fetch Klines from Bybit: ${errorText}` });
        }
        
        const data = await apiRes.json();
        
        // Bybit API 응답 처리
        if (data.retCode !== 0) {
            throw new Error(`Bybit API error: ${data.retMsg}`);
        }
        
        // Bybit 응답 형식을 Binance 형식으로 변환
        // Bybit: [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
        // Binance: [openTime, open, high, low, close, volume, closeTime, quoteVolume, count, takerBuyBaseVolume, takerBuyQuoteVolume, ignore]
        
        // interval에 따른 closeTime 계산
        const getCloseTime = (startTime, interval) => {
            const start = parseInt(startTime);
            const intervalMs = {
                '1': 60000,      // 1분
                '3': 180000,     // 3분
                '5': 300000,     // 5분
                '15': 900000,    // 15분
                '30': 1800000,   // 30분
                '60': 3600000,   // 1시간
                '120': 7200000,  // 2시간
                '240': 14400000, // 4시간
                '360': 21600000, // 6시간
                '720': 43200000, // 12시간
                'D': 86400000,   // 1일
                'W': 604800000,  // 1주
                'M': 2592000000  // 1개월 (30일)
            };
            return start + (intervalMs[bybitInterval] || 60000) - 1;
        };
        
        const transformedData = data.result.list.map(item => [
            item[0], // openTime (startTime)
            item[1], // open (openPrice)
            item[2], // high (highPrice)
            item[3], // low (lowPrice)
            item[4], // close (closePrice)
            item[5], // volume
            getCloseTime(item[0], bybitInterval), // closeTime (계산된 값)
            item[6], // quoteVolume (turnover)
            0,       // count (임시값)
            "0",     // takerBuyBaseVolume (임시값)
            "0",     // takerBuyQuoteVolume (임시값)
            "0"      // ignore
        ]);
        
        console.log(`Successfully fetched ${transformedData.length} Klines records for ${symbol} from Bybit`);
        res.json(transformedData);
        
    } catch (err) {
        console.error('Bybit Klines proxy error:', err);
        res.status(500).json({ message: 'Failed to fetch Klines data from Bybit.' });
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
    console.log(`📊 Bybit proxy available at: http://localhost:${PORT}/api/bybit/longshort`);
    console.log(`🔧 Sample data available at: http://localhost:${PORT}/api/sample/longshort`);
    console.log(`💻 Frontend available at: http://localhost:${PORT}`);
});