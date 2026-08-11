const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DATABASE_PATH || './pharmaplus.db';
const dbPath = path.resolve(DB_PATH);

let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? null : null,
    });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

module.exports = { getDb };
