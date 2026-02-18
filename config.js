require('dotenv').config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  
  // Admin credentials (in production, use environment variables)
  // ADMIN_PASSWORD_HASH takes precedence over ADMIN_PASSWORD for security
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'changeme123',
    passwordHash: process.env.ADMIN_PASSWORD_HASH || null
  },
  
  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM || 'noreply@showcase.com',
    to: process.env.EMAIL_TO || 'admin@showcase.com'
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    uploadDir: './uploads'
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    maxAge: 3600000 // 1 hour
  },

  // Captcha (clé générique — fonctionne pour Turnstile, reCAPTCHA et hCaptcha)
  // TURNSTILE_SECRET_KEY gardé pour compatibilité ascendante
  captcha: {
    secretKey: process.env.CAPTCHA_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || null,
  },
  // Conservé pour ne pas casser les références existantes dans server.js
  turnstile: {
    secretKey: process.env.CAPTCHA_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || null,
    verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
  }
};
