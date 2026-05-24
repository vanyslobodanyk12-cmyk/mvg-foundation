const {
  saveMessage,
  getMessages,
  mapTelegramToSession,
  getWebSessionForTelegram
} = require("../services/chatService");
const { notifyNewMessage, handleWebhookUpdate } = require("../services/telegramService");
const express = require("express");
const router = express.Router();

// ── EN routes ──────────────────────────────────────────
router.get("/", (req, res) => {
  res.render("index", { title: "Home", page: "home", lang: "en", enUrl: "/", uaUrl: "/ua" });
});

router.get("/about", (req, res) => {
  res.render("about", { title: "About Us", page: "about", lang: "en", enUrl: "/about", uaUrl: "/ua/about" });
});

router.get("/programs", (req, res) => {
  res.render("programs", { title: "Our Programs", page: "programs", lang: "en", enUrl: "/programs", uaUrl: "/ua/programs" });
});

router.get("/donate", (req, res) => {
  res.render("donate", { title: "Donate", page: "donate", lang: "en", enUrl: "/donate", uaUrl: "/ua/donate" });
});

router.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact", page: "contact", lang: "en", enUrl: "/contact", uaUrl: "/ua/contact" });
});

// ── UA routes ──────────────────────────────────────────
router.get("/ua", (req, res) => {
  res.render("ua-index", { title: "Головна", page: "home", lang: "ua", enUrl: "/", uaUrl: "/ua" });
});

router.get("/ua/about", (req, res) => {
  res.render("ua-about", { title: "Про нас", page: "about", lang: "ua", enUrl: "/about", uaUrl: "/ua/about" });
});

router.get("/ua/programs", (req, res) => {
  res.render("ua-programs", { title: "Програми", page: "programs", lang: "ua", enUrl: "/programs", uaUrl: "/ua/programs" });
});

router.get("/ua/donate", (req, res) => {
  res.render("ua-donate", { title: "Пожертвувати", page: "donate", lang: "ua", enUrl: "/donate", uaUrl: "/ua/donate" });
});

router.get("/ua/contact", (req, res) => {
  res.render("ua-contact", { title: "Контакти", page: "contact", lang: "ua", enUrl: "/contact", uaUrl: "/ua/contact" });
});

// ── Donation notification ──────────────────────────────
router.post('/donate-request', async (req, res) => {
  console.log('[donate-request] route triggered');
  console.log('[donate-request] body:', req.body);

  const { name, email, pkg, quantity, total } = req.body;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;

  console.log('[donate-request] botToken set:', !!botToken, '| chatId:', chatId);

  if (!botToken || !chatId) {
    console.log('[donate-request] ERROR: Telegram not configured — add TELEGRAM_BOT_TOKEN to .env');
    return res.status(500).json({ ok: false, error: 'Telegram not configured' });
  }

  const text =
    `💰 New Donation Request\n\n` +
    `Name: ${name || '—'}\n` +
    `Email: ${email || '—'}\n` +
    `Package: ${pkg}\n` +
    `Quantity: ${quantity}\n` +
    `Total: $${total}`;

  try {
    console.log('[donate-request] sending to Telegram…');
    const tgRes  = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text }),
    });
    const tgData = await tgRes.json();

    console.log('[donate-request] Telegram response:', tgData);

    if (!tgData.ok) {
      return res.status(502).json({ ok: false, error: tgData.description });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[donate-request] fetch error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to send notification' });
  }
});

router.post("/test-chat", async (req, res) => {
  try {

    const { sessionId, message } = req.body;

    const validation = validateMessage(message);

    if (!validation.ok) {
      return res.status(400).json(validation);
    }

    const result = await saveMessage(
      sessionId,
      "client",
      validation.cleanMessage
    );
    res.json({
      ok: true,
      result
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }
});
const { validateMessage } = require("../utils/chatValidation");
router.post("/chat/send", async (req, res) => {

  try {

    const {
      sessionId,
      message
    } = req.body;

    const validation = validateMessage(message);

    if (!validation.ok) {
      return res.status(400).json(validation);
    }

    const saved = await saveMessage(
      sessionId,
      "client",
      validation.cleanMessage
    );

    notifyNewMessage(sessionId, message.trim()).catch(err => {
      console.error('[telegram] notify failed:', err.message);
    });

    const tgChatId = process.env.TELEGRAM_CHAT_ID;
    if (tgChatId) {
      mapTelegramToSession(tgChatId, sessionId).catch(err => {
        console.error('[session-map] failed:', err.message);
      });
    }

    res.json({
      ok: true,
      message: saved
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});
router.get("/chat/messages/:sessionId", async (req, res) => {

  try {

    const { sessionId } = req.params;

    const messages = await getMessages(sessionId);

    res.json({
      ok: true,
      messages
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});
router.post('/telegram/webhook', (req, res) => {
  console.log('TG UPDATE:', JSON.stringify(req.body, null, 2));   
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.sendStatus(403);
  }

  res.sendStatus(200); // відповідаємо Telegram одразу, не чекаємо обробки

  handleWebhookUpdate(req.body).catch(err => {
    console.error('[telegram] webhook error:', err.message);
  });
});

router.post("/telegram-webhook", async (req, res) => {
    console.log("Telegram webhook hit");

    try {
        const msg = req.body.message;

        if (msg && msg.text) {
            const chatId    = msg.chat.id;
            const text      = msg.text;

            const webSession = await getWebSessionForTelegram(chatId);
            const sessionId  = webSession || ('tg_' + chatId);

            await saveMessage(sessionId, "telegram", text);

            console.log("Telegram message saved");
            console.log("sessionId:", sessionId, webSession ? '(web session)' : '(no mapping yet)');
            console.log("text:", text);
        }

        return res.sendStatus(200);
    } catch (err) {
        console.error(err);
        return res.sendStatus(500);
    }
});

module.exports = router;
