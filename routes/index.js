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

module.exports = router;
