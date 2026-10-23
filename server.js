const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20kb' }));

app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://callofdutygamesstart-ux.github.io'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, age, telegram, level, device, phoneModel } = req.body || {};

    if (
      typeof name !== 'string' ||
      (typeof age !== 'string' && typeof age !== 'number') ||
      typeof telegram !== 'string' ||
      typeof level !== 'string' ||
      typeof device !== 'string'
    ) {
      return res.status(400).json({
        ok: false,
        error: 'اطلاعات ارسالی معتبر نیست.'
      });
    }

    const cleanName = name.trim();
    const cleanAge = String(age).trim();
    const cleanTelegram = telegram.trim();
    const cleanLevel = level.trim();
    const cleanDevice = device.trim();
    const cleanPhoneModel =
      typeof phoneModel === 'string' ? phoneModel.trim() : '';

    if (
      !cleanName ||
      !cleanAge ||
      !cleanTelegram ||
      !cleanLevel ||
      !cleanDevice
    ) {
      return res.status(400).json({
        ok: false,
        error: 'لطفاً همه فیلدهای ضروری را تکمیل کنید.'
      });
    }

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing BOT_TOKEN or CHAT_ID');
      return res.status(500).json({
        ok: false,
        error: 'تنظیمات سرور کامل نیست.'
      });
    }

    const message = [
      '🎯 درخواست جدید تست کلن XeN FAMILY',
      '',
      '👤 نام: ' + cleanName,
      '🔢 سن: ' + cleanAge,
      '📱 آیدی تلگرام: ' + cleanTelegram,
      '⭐ لول در بازی: ' + cleanLevel,
      '💻 دیوایس: ' + cleanDevice,
      ...(
        cleanDevice === 'Android' || cleanDevice === 'iOS'
          ? ['📱 مدل گوشی: ' + cleanPhoneModel]
          : []
      ),
      '🕒 زمان: ' + new Date().toLocaleString('fa-IR')
    ].join('\n');

    const telegramResponse = await fetch(
      'https://api.telegram.org/bot' + botToken + '/sendMessage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error('Telegram error:', telegramResult);

      return res.status(502).json({
        ok: false,
        error: 'ارسال پیام به تلگرام ناموفق بود.'
      });
    }

    return res.json({
      ok: true,
      message: 'درخواست با موفقیت ارسال شد.'
    });

  } catch (error) {
    console.error('Registration error:', error);

    return res.status(500).json({
      ok: false,
      error: 'خطای داخلی سرور.'
    });
  }
});

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log('XeN FAMILY server running on port ' + PORT);
});
