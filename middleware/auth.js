const config = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const adminFile = path.join(__dirname, '..', 'data', 'admin.json');

// Lit le hash depuis data/admin.json (priorité) ou retourne null
function readAdminHash() {
  try {
    return JSON.parse(fs.readFileSync(adminFile, 'utf8')).passwordHash || null;
  } catch { return null; }
}

// Sauvegarde un nouveau hash dans data/admin.json
function writeAdminHash(hash) {
  fs.writeFileSync(adminFile, JSON.stringify({ passwordHash: hash }, null, 2));
}

// Simple session storage (in-memory)
const sessions = new Map();

// Password hash (set by server.js on startup)
let passwordHash = null;

function setPasswordHash(hash) {
  passwordHash = hash;
}

// Génération d'un session ID cryptographiquement sécurisé
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// Clean up expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expires) {
      sessions.delete(sessionId);
    }
  }
}, 60000); // Clean up every minute

// Authentication middleware
function requireAuth(req, res, next) {
  const sessionId = req.cookies && req.cookies.sid;

  if (!sessionId) {
    return res.status(401).json({ error: 'No session provided' });
  }
  
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  if (Date.now() > session.expires) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: 'Session expired' });
  }
  
  // Extend session
  session.expires = Date.now() + config.session.maxAge;
  req.user = session.user;
  next();
}

// Login handler (async to support bcrypt)
async function login(username, password) {
  if (username !== config.admin.username) return { success: false };

  // admin.json en priorité, sinon hash chargé depuis .env au démarrage
  const hash = readAdminHash() || passwordHash;
  try {
    const isMatch = await bcrypt.compare(password, hash);
    
    if (isMatch) {
      const sessionId = generateSessionId();
      const session = {
        user: username,
        expires: Date.now() + config.session.maxAge
      };
      sessions.set(sessionId, session);
      return { success: true, sessionId };
    }
  } catch (error) {
    console.error('Error comparing password:', error);
  }
  
  return { success: false };
}

// Logout handler
function logout(sessionId) {
  sessions.delete(sessionId);
  return { success: true };
}

// Check session validity
function checkSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session && Date.now() <= session.expires) {
    return { valid: true, user: session.user };
  }
  return { valid: false };
}

module.exports = {
  requireAuth,
  login,
  logout,
  checkSession,
  setPasswordHash,
  readAdminHash,
  writeAdminHash
};
