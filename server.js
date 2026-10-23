const express = require('express');
const path = require('path');

const app = express();

const ALLOWED_ORIGIN = 'https://callofdutygamesstart-ux.github.io';
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limit
const hits = new Map();

app.use('/api/register', (req, res, next) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';

  const now = Date.now();
  const entry = hits.get(ip) || {
    count: 0,
    resetAt: now + 60_000
  };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60_000;
  }

  entry.count += 1;
  hits.set(ip, entry);

  if (entry.count > 8) {
    return res.status(429).json({
      ok: false,
      error: 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.'
    });
  }

  next();
});

// Register
app.post('/api/register', async (req, res) => {
  console.log('REGISTER REQUEST RECEIVED');

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('BOT_TOKEN or CHAT_ID is missing');

    return res.status(500).json({
      ok: false,
      error: 'تنظیمات سرور کامل نیست.'
    });
  }

  const {
    name,
    age,
    telegram,
    level,
    device,
    phoneModel
  } = req.body || {};

  if (
    ![name, age, telegram, level, device].every(
      value => typeof value === 'string' && value.trim()
    )
  ) {
    return res.status(400).json({
      ok: false,
      error: 'لطفاً همه فیلدهای ضروری را کامل کنید.'
    });
  }

  if (
    name.length > 100 ||
    telegram.length > 100 ||
    Number(age) < 10 ||
    Number(age) > 60 ||
    !Number.isFinite(Number(age)) ||
    Number(level) < 1 ||
    Number(level) > 500 ||
    !Number.isFinite(Number(level)) ||
    !['PC', 'Android', 'iOS'].includes(device) ||
    (
      (device === 'Android' || device === 'iOS') &&
      (typeof phoneModel !== 'string' || !phoneModel.trim())
    )
  ) {
    return res.status(400).json({
      ok: false,
      error: 'اطلاعات واردشده معتبر نیست.'
    });
  }

  const message = [
  '🎯 درخواست جدید تست کلن XeN FAMILY',
  '',
  👤 نام: ${name.trim()},
  🔢 سن: ${age.trim()},
  📱 آیدی تلگرام: ${telegram.trim()},
  ⭐ لول در بازی: ${level.trim()},
  💻 دیوایس: ${device},
  ...(
    device === 'Android' || device === 'iOS'
      ? [📱 مدل گوشی: ${phoneModel.trim()}]
      : []
  ),
  🕒 زمان: ${new Date().toLocaleString('fa-IR')}
].join('\n');

  try {
    const tg = await fetch(
      https://api.telegram.org/bot${BOT_TOKEN}/sendMessage,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    const data = await tg.json();

    if (!tg.ok || !data.ok) {
      console.error(
        'Telegram send failed:',
        data.description || tg.status
      );

      return res.status(502).json({
        ok: false,
        error: 'سرور نتوانست پیام را به تلگرام ارسال کند.'
      });
    }

    console.log('TELEGRAM MESSAGE SENT SUCCESSFULLY');

    return res.json({ ok: true });

  } catch (err) {
    console.error('Telegram request error:', err.message);

    return res.status(502).json({
      ok: false,
      error: 'اتصال سرور به تلگرام برقرار نشد.'
    });
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(XeN FAMILY server listening on ${PORT});
});
