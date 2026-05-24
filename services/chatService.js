const { db } = require("../database/db");

function saveMessage(sessionId, sender, message) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO messages (session_id, sender, message)
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
function findSessionByPrefix(prefix) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT DISTINCT session_id FROM messages WHERE session_id LIKE ? LIMIT 1`,
      [prefix + '%'],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.session_id : null);
      }
    );
  });
}

function mapTelegramToSession(telegramChatId, webSessionId) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO session_map (telegram_chat_id, web_session_id, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [String(telegramChatId), webSessionId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getWebSessionForTelegram(telegramChatId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT web_session_id FROM session_map WHERE telegram_chat_id = ?`,
      [String(telegramChatId)],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.web_session_id : null);
      }
    );
  });
}

module.exports = {
  saveMessage,
  getMessages,
  findSessionByPrefix,
  mapTelegramToSession,
  getWebSessionForTelegram
};