import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 프로젝트 루트 기준으로 DB 파일 위치 지정
const dbPath = path.resolve(__dirname, 'insamcha.db');
const db     = new Database(dbPath);

// users 테이블이 없으면 만들기
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    username       TEXT    UNIQUE NOT NULL,
    email          TEXT    UNIQUE NOT NULL,
    password_hash  TEXT    NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// favorites 테이블 생성
db.prepare(`
  CREATE TABLE IF NOT EXISTS favorites (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    exchange_id TEXT    NOT NULL,
    UNIQUE(user_id, exchange_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

export default db;
