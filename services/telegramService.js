const { saveMessage, findSessionByPrefix } = require('./chatService');
const { validateMessage }                  = require('../utils/chatValidation');

async function notifyNewMessage(sessionId, text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const body = [
    '📩 New Client Message',
    '',
    'Session:',
    sessionId,
    '',
    'Message:',
    text,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text: body }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
}

async function handleWebhookUpdate(update) {
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) return;

  const text = msg.text.trim();
  if (!text.startsWith('/reply ')) return;

  // parse: /reply SESSION_PREFIX message text
  const after = text.slice(7).trim();
  const space = after.indexOf(' ');

  if (space === -1) {
    console.warn('[telegram] /reply: missing message text');
    return;
  }

  const sessionPrefix = after.slice(0, space).trim();
  const replyText     = after.slice(space + 1).trim();

  if (!sessionPrefix || !replyText) return;

  const sessionId = await findSessionByPrefix(sessionPrefix);
  if (!sessionId) {
    console.warn('[telegram] /reply: session not found for prefix:', sessionPrefix);
    return;
  }

  const validation = validateMessage(replyText);
  if (!validation.ok) {
    console.warn('[telegram] /reply: invalid message:', validation.error);
    return;
  }

  await saveMessage(sessionId, 'admin', validation.cleanMessage);
  console.log('[telegram] admin reply saved for session:', sessionId);
}

module.exports = { notifyNewMessage, handleWebhookUpdate };
