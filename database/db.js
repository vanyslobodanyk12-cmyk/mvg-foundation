
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "chat.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      sender TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS session_map (
      telegram_chat_id TEXT PRIMARY KEY,
      web_session_id   TEXT NOT NULL,
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = {
    db,
    saveMessage,
    getMessages
  };
function saveMessage(sessionId, sender, message) {
    return new Promise((resolve, reject) => {
  
      db.run(
        `
        INSERT INTO messages (
          session_id,
          sender,
          message
        )
        VALUES (?, ?, ?)
        `,
        [sessionId, sender, message],
  
        function (err) {
  
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              sessionId,
              sender,
              message
            });
          }
  
        }
      );
  
    });
  }
  
  function getMessages(sessionId) {
    return new Promise((resolve, reject) => {
  
      db.all(
        `
        SELECT *
        FROM messages
        WHERE session_id = ?
        ORDER BY created_at ASC
        `,
        [sessionId],
  
        (err, rows) => {
  
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
  
        }
      );
  
    });
  }