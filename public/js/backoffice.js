// Check authentication on load — le cookie HttpOnly est envoyé automatiquement
document.addEventListener('DOMContentLoaded', async () => {
  initBackThemeToggle();

  const isValid = await checkSession();
  if (isValid) {
    showDashboard();
    await loadCarousels();
  } else {
    showLogin();
  }
});

// Init toggle dark/light une seule fois (évite l'accumulation de listeners)
function initBackThemeToggle() {
  const toggleBtn = document.getElementById('back-theme-toggle');
  if (!toggleBtn) return;

  const applyBackTheme = () => {
    const isDark = document.documentElement.getAttribute('data-back-theme') === 'dark';
    toggleBtn.textContent = isDark ? '☀️' : '🌙';
    toggleBtn.title = isDark ? 'Passer en mode clair' : 'Passer en mode sombre';
  };

  applyBackTheme();

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-back-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-back-theme');
      localStorage.removeItem('back-theme');
    } else {
      document.documentElement.setAttribute('data-back-theme', 'dark');
      localStorage.setItem('back-theme', 'dark');
    }
    applyBackTheme();
  });
}

// Login form handler
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showDashboard();
      await loadCarousels();
    } else {
      errorDiv.textContent = result.error || 'Login failed';
      errorDiv.classList.add('show');
    }
  } catch (error) {
    errorDiv.textContent = 'Connection error';
    errorDiv.classList.add('show');
  }
});

// Logout handler
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  showLogin();
});

// Check session validity — le cookie est envoyé automatiquement par le navigateur
async function checkSession() {
  try {
    const response = await fetch('/api/auth/check');
    const result = await response.json();
    return result.valid;
  } catch (error) {
    return false;
  }
}

// Show/hide screens
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'flex';
}

// Table de routage : ID de section → ID du container cible
const SECTION_CONTAINERS = {
  'theme-section':    'container-design',
  'logo-section':     'container-design',
  'border-section':   'container-design',
  'pages-section':    'container-content',
  'layouts-section':  'container-content',
  'site-section':     'container-identity',
  'footer-section':   'container-identity',
  'config-section':   'container-config',
  'security-section': 'container-security',
  'captcha-section':  'container-security',
};

// Load theme + logo + site identity + pages + security + captcha + carousels
async function loadCarousels() {
  await renderThemeSection();
  await renderLogoSection();
  await renderSiteSection();
  await renderSocialSection();
  await renderFooterSection();
  await renderConfigSection();
  await renderPagesSection();
  await renderSecuritySection();
  await renderCaptchaSection();
  await renderBorderSection();
  await renderLayoutsSection();
  initTabs();
  return _loadCarousels();
}

// ============================================================
//  ONGLETS HORIZONTAUX + SIDEBAR VERTICALE
// ============================================================

function initTabs() {
  // Onglets horizontaux
  document.querySelectorAll('.main-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Mise en évidence du lien sidebar actif selon la position de scroll du panel-content
  function updateSideNavActive(panelContent) {
    const sections = panelContent.querySelectorAll('.carousel-section[id]');
    if (!sections.length) return;

    // Trouver la section dont le haut est le plus proche du haut du panel-content
    let closest = null;
    let closestDist = Infinity;
    sections.forEach(s => {
      const top = s.getBoundingClientRect().top - panelContent.getBoundingClientRect().top;
      // Sections déjà passées (top légèrement négatif) ou juste en haut
      const dist = Math.abs(top);
      if (top <= 40 && dist < closestDist) {
        closestDist = dist;
        closest = s;
      }
    });
    // Si aucune section n'est "passée", prendre la première visible
    if (!closest) closest = sections[0];

    const activeHref = '#' + closest.id;
    document.querySelectorAll('.side-nav-link').forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === activeHref);
    });
  }

  // Scroll fluide vers les sections + feedback immédiat au clic
  document.querySelectorAll('.side-nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (!target) return;

      // Feedback immédiat
      const panel = link.closest('.tab-panel');
      panel.querySelectorAll('.side-nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Scroll dans le panel-content
      const panelContent = panel.querySelector('.panel-content');
      const offset = target.offsetTop - panelContent.offsetTop;
      panelContent.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });

  // Mise à jour au scroll de chaque panel-content
  document.querySelectorAll('.panel-content').forEach(pc => {
    pc.addEventListener('scroll', () => updateSideNavActive(pc), { passive: true });
  });

}

// ============================================================
//  MOTEUR DE COULEURS (HSL pur — zéro dépendance npm)
// ============================================================

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      default: h = ((r-g)/d + 4)/6;
    }
  }
  return [h*360, s, l];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const a = s * Math.min(l, 1-l);
  const f = n => {
    const k = (n + h/30) % 12;
    const c = l - a * Math.max(-1, Math.min(k-3, 9-k, 1));
    return Math.round(255*c).toString(16).padStart(2,'0');
  };
  return '#' + f(0) + f(8) + f(4);
}

function darken(hex, amount) {
  const [h,s,l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

function lighten(hex, amount) {
  const [h,s,l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(1, l + amount));
}

// Luminance relative WCAG pour le calcul automatique du contraste
function relativeLuminance(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const lin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Couleur de texte automatique selon le fond (contraste WCAG)
function autoTextColor(fondHex) {
  return relativeLuminance(fondHex) > 0.35 ? '#1a2332' : '#f0f4f8';
}

// Convertit #rrggbb en #rgb si possible, sinon null
function hexToShort(hex) {
  const r = hex.slice(1,3), g = hex.slice(3,5), b = hex.slice(5,7);
  return (r[0]===r[1] && g[0]===g[1] && b[0]===b[1])
    ? '#' + r[0] + g[0] + b[0]
    : null;
}

// Formats d'affichage des codes couleurs
function hexToRgbStr(hex) {
  return `rgb(${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)})`;
}

function hexToHslStr(hex) {
  const [h, s, l] = hexToHsl(hex);
  return `hsl(${Math.round(h)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
}

// Calcul des 11 variables CSS depuis 4 couleurs de base (texte calculé automatiquement)
function computeVars(primary, secondary, accent, fond) {
  const texte = autoTextColor(fond);
  return {
    '--primary':       primary,
    '--primary-dark':  darken(primary,  0.18),
    '--primary-light': lighten(primary, 0.15),
    '--secondary':     secondary,
    '--secondary-dark':darken(secondary, 0.18),
    '--accent':        accent,
    '--accent-dark':   darken(accent,   0.18),
    '--bg':       fond,
    '--bg-light':       lighten(fond,    0.03),
    '--text':   texte,
    '--text-muted':  lighten(texte,   0.25),
  };
}

// Génère 5 couleurs depuis une couleur de base et un type d'harmonie
function applyHarmony(baseHex, harmonyType) {
  const [h, s, l] = hexToHsl(baseHex);
  let hues;
  switch (harmonyType) {
    case 'complementaire':  hues = [h, h+180, h+150, h, h]; break;
    case 'analogue':        hues = [h, h+30,  h-30,  h, h]; break;
    case 'triadique':       hues = [h, h+120, h+240, h, h]; break;
    case 'split':           hues = [h, h+150, h+210, h, h]; break;
    default:                hues = [h, h+180, h+150, h, h];
  }
  const primary   = hslToHex(hues[0], s,       l);
  const secondary = hslToHex(hues[1], s*0.7,   l*0.9);
  const accent    = hslToHex(hues[2], s*0.8,   l);
  const fond      = hslToHex(hues[3], s*0.1,   0.96);
  return { primary, secondary, accent, fond };
}

// ============================================================
//  RENDER THEME SECTION (thèmes natifs + customs + bouton créer)
// ============================================================

async function renderThemeSection() {
  const nativeThemes = [
    { id: 'alpine',     label: 'Alpine',     colors: ['#4a7c59', '#2d5016', '#8d6e63', '#faf7f2'] },
    { id: 'pro',        label: 'Pro',        colors: ['#1e40af', '#1e3a8a', '#6b7280', '#ffffff'] },
    { id: 'craft',      label: 'Craft',      colors: ['#8b6f47', '#6b5639', '#d4a574', '#f5f1e8'] },
    { id: 'industrial', label: 'Industrial', colors: ['#ff6b35', '#e55a2a', '#f7931e', '#ffffff'] },
    { id: 'provence',   label: 'Provence',   colors: ['#967bb6', '#7c6ba6', '#d4a76a', '#faf8f3'] },
  ];

  let active = 'alpine';
  let customThemes = {};
  try {
    const r = await fetch('/api/theme');
    const d = await r.json();
    active = d.theme;
    customThemes = d.customThemes || {};
  } catch {}

  const container = document.getElementById('container-design');

  const section = document.createElement('div');
  section.className = 'carousel-section theme-section';
  section.id = 'theme-section';

  // Construire le HTML des thèmes customs
  const customCards = Object.entries(customThemes).map(([id, t]) => {
    const swatches = t.vars ? [
      t.vars['--primary'], t.vars['--secondary'], t.vars['--accent'], t.vars['--bg']
    ].filter(Boolean) : [];
    return `
      <div class="theme-card-wrapper">
        <button class="theme-card ${id === active ? 'active' : ''}" data-theme="${id}">
          <div class="theme-swatches">
            ${swatches.map(c => `<span class="swatch" style="background:${c}"></span>`).join('')}
          </div>
          <span class="theme-label">${t.label}</span>
          ${id === active ? '<span class="theme-badge">Actif</span>' : ''}
        </button>
        <button class="btn-delete-theme" data-theme-id="${id}" title="Supprimer ce thème">🗑</button>
      </div>
    `;
  }).join('');

  section.innerHTML = `
    <div class="carousel-section-header">
      <div>
        <h2>Apparence</h2>
        <div class="carousel-info">Palette de couleurs du site</div>
      </div>
      <button class="btn btn-success" id="btn-create-theme">＋ Créer un thème</button>
    </div>
    <div class="theme-grid" id="theme-grid-native">
      ${nativeThemes.map(t => `
        <button class="theme-card ${t.id === active ? 'active' : ''}" data-theme="${t.id}">
          <div class="theme-swatches">
            ${t.colors.map(c => `<span class="swatch" style="background:${c}"></span>`).join('')}
          </div>
          <span class="theme-label">${t.label}</span>
          ${t.id === active ? '<span class="theme-badge">Actif</span>' : ''}
        </button>
      `).join('')}
    </div>
    ${Object.keys(customThemes).length > 0 ? `
      <div class="theme-custom-label">Thèmes personnalisés</div>
      <div class="theme-grid theme-grid-custom" id="theme-grid-custom">
        ${customCards}
      </div>
    ` : ''}
    <div id="theme-message" class="form-message"></div>
  `;

  const existing = document.getElementById('theme-section');
  if (existing) {
    container.replaceChild(section, existing);
  } else {
    container.innerHTML = '';
    container.appendChild(section);
  }

  // Activer un thème au clic
  section.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => activateTheme(card, section));
  });

  // Supprimer un thème custom
  section.querySelectorAll('.btn-delete-theme').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCustomTheme(btn.dataset.themeId);
    });
  });

  // Ouvrir la modale créateur
  document.getElementById('btn-create-theme').addEventListener('click', openThemeCreator);
}

async function activateTheme(card, section) {
  const theme = card.dataset.theme;
  const msg = document.getElementById('theme-message');
  try {
    const r = await fetch('/api/admin/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    });
    if (!r.ok) throw new Error();
    // Mettre à jour l'UI
    section.querySelectorAll('.theme-card').forEach(c => {
      c.classList.remove('active');
      c.querySelector('.theme-badge')?.remove();
    });
    card.classList.add('active');
    const badge = document.createElement('span');
    badge.className = 'theme-badge';
    badge.textContent = 'Actif';
    card.appendChild(badge);
    // Appliquer en live
    const themeData = await fetch('/api/theme').then(r => r.json());
    if (themeData.vars) {
      Object.entries(themeData.vars).forEach(([k, v]) =>
        document.documentElement.style.setProperty(k, v));
      localStorage.setItem('site-theme-vars', JSON.stringify(themeData.vars));
    } else {
      // Thème natif : supprimer les vars custom éventuelles
      ['--primary','--primary-dark','--primary-light','--secondary','--secondary-dark','--accent','--accent-dark','--bg','--bg-light','--text','--text-muted'].forEach(k =>
        document.documentElement.style.removeProperty(k));
      localStorage.removeItem('site-theme-vars');
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('site-theme', theme);
    msg.className = 'form-message success';
    msg.textContent = `Thème "${card.querySelector('.theme-label').textContent}" activé`;
  } catch {
    msg.className = 'form-message error';
    msg.textContent = 'Erreur lors du changement de thème';
  }
}

async function deleteCustomTheme(id) {
  if (!confirm(`Supprimer le thème "${id}" ?`)) return;
  try {
    const r = await fetch(`/api/admin/theme/custom/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!r.ok) throw new Error();
    await renderThemeSection();
  } catch {
    alert('Erreur lors de la suppression du thème');
  }
}

// ============================================================
//  MODALE CRÉATEUR DE THÈME
// ============================================================

function openThemeCreator() {
  // Couleurs initialisées à zéro pour un nouveau thème vierge

  // Injecter la modale dans le DOM si absente
  if (!document.getElementById('theme-creator-modal')) {
    const modal = document.createElement('div');
    modal.id = 'theme-creator-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content theme-creator-content">
        <span class="close" id="theme-creator-close">&times;</span>
        <h2>Créer un thème</h2>

        <div class="form-group">
          <label for="tc-name">Nom du thème</label>
          <input type="text" id="tc-name" placeholder="Mon thème montagne" maxlength="40">
        </div>

        <div class="tc-pickers-label">Couleurs de base</div>
        <div class="color-pickers-grid">
          <div class="color-picker-item" data-role="primary">
            <input type="color" id="tc-primary" class="tc-color-input">
            <label>Primaire</label>
            <div class="color-codes" id="codes-primary"></div>
          </div>
          <div class="color-picker-item" data-role="secondary">
            <input type="color" id="tc-secondary" class="tc-color-input">
            <label>Secondaire</label>
            <div class="color-codes" id="codes-secondary"></div>
          </div>
          <div class="color-picker-item" data-role="accent">
            <input type="color" id="tc-accent" class="tc-color-input">
            <label>Accent</label>
            <div class="color-codes" id="codes-accent"></div>
          </div>
          <div class="color-picker-item" data-role="fond">
            <input type="color" id="tc-fond" class="tc-color-input">
            <label>Fond</label>
            <div class="color-codes" id="codes-fond"></div>
          </div>
        </div>

        <div class="tc-pickers-label">Harmonie chromatique</div>
        <div class="harmony-radio-group">
          <label><input type="radio" name="tc-harmony" value="complementaire" checked> Complémentaire</label>
          <label><input type="radio" name="tc-harmony" value="analogue"> Analogue</label>
          <label><input type="radio" name="tc-harmony" value="triadique"> Triadique</label>
          <label><input type="radio" name="tc-harmony" value="split"> Split-complémentaire</label>
        </div>
        <button class="btn btn-harmony" id="tc-apply-harmony">Appliquer l'harmonie</button>

        <div class="modal-actions">
          <button class="btn btn-secondary" id="tc-cancel">Annuler</button>
          <button class="btn btn-success" id="tc-save">Enregistrer</button>
        </div>
        <div id="tc-message" class="form-message"></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('theme-creator-close').addEventListener('click', closeThemeCreator);
    document.getElementById('tc-cancel').addEventListener('click', closeThemeCreator);
    modal.addEventListener('click', e => { if (e.target === modal) closeThemeCreator(); });
    document.getElementById('tc-apply-harmony').addEventListener('click', handleApplyHarmony);
    document.getElementById('tc-save').addEventListener('click', saveCustomTheme);

    // Marquer les couleurs "ancrées" quand l'utilisateur les modifie
    document.querySelectorAll('.tc-color-input').forEach(input => {
      input.addEventListener('input', () => {
        input.closest('.color-picker-item').classList.add('anchored');
        updateColorDisplays();
      });
    });
  }

  // Toujours démarrer avec des couleurs à zéro (noir)
  document.getElementById('tc-primary').value   = '#000000';
  document.getElementById('tc-secondary').value = '#000000';
  document.getElementById('tc-accent').value    = '#000000';
  document.getElementById('tc-fond').value      = '#000000';

  // Supprimer les ancres de la session précédente
  document.querySelectorAll('.color-picker-item').forEach(el => el.classList.remove('anchored'));

  document.getElementById('tc-name').value = '';
  document.getElementById('tc-message').textContent = '';
  document.getElementById('tc-message').className = 'form-message';
  updateColorDisplays();

  document.getElementById('theme-creator-modal').classList.add('show');
}

function closeThemeCreator() {
  document.getElementById('theme-creator-modal')?.classList.remove('show');
}

// Normalise une couleur CSS vers #rrggbb (compatible input[type=color])
function normalizeHex(color) {
  if (!color) return null;
  color = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  // Cas #rgb → #rrggbb
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    return '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3];
  }
  return null;
}

function updateColorDisplays() {
  const pickers = [
    { inputId: 'tc-primary',   codesId: 'codes-primary' },
    { inputId: 'tc-secondary', codesId: 'codes-secondary' },
    { inputId: 'tc-accent',    codesId: 'codes-accent' },
    { inputId: 'tc-fond',      codesId: 'codes-fond' },
  ];
  pickers.forEach(({ inputId, codesId }) => {
    const input = document.getElementById(inputId);
    const codesEl = document.getElementById(codesId);
    if (!input || !codesEl) return;
    const hex = input.value;
    const shortHex = hexToShort(hex);
    codesEl.innerHTML =
      `<span class="color-code">${hex}</span>` +
      (shortHex ? `<span class="color-code">${shortHex}</span>` : '') +
      `<span class="color-code">${hexToRgbStr(hex)}</span>` +
      `<span class="color-code">${hexToHslStr(hex)}</span>`;
  });
}

function handleApplyHarmony() {
  const harmonyType = document.querySelector('input[name="tc-harmony"]:checked')?.value || 'complementaire';

  // Décalages de teinte (en degrés) de chaque rôle par rapport à la teinte de base
  const harmonyOffsets = {
    complementaire: { primary: 0, secondary: 180, accent: 150, fond: 0 },
    analogue:       { primary: 0, secondary: 30,  accent: -30, fond: 0 },
    triadique:      { primary: 0, secondary: 120, accent: 240, fond: 0 },
    split:          { primary: 0, secondary: 150, accent: 210, fond: 0 },
  };
  const offsets = harmonyOffsets[harmonyType] || harmonyOffsets.complementaire;

  const roleMap = {
    primary: 'tc-primary', secondary: 'tc-secondary', accent: 'tc-accent', fond: 'tc-fond',
  };

  // Trouver la première couleur ancrée comme référence (sinon primaire par défaut)
  let refRole = 'primary';
  for (const role of ['primary', 'secondary', 'accent', 'fond']) {
    const item = document.querySelector(`.color-picker-item[data-role="${role}"]`);
    if (item?.classList.contains('anchored')) { refRole = role; break; }
  }

  const refHex = document.getElementById(roleMap[refRole]).value;
  const [refH, refS, refL] = hexToHsl(refHex);

  // Teinte de base = teinte de la référence moins son propre décalage
  const baseH = refH - offsets[refRole];

  // Générer les 4 couleurs depuis la teinte de base
  const computed = {
    primary:   hslToHex(baseH + offsets.primary,   refS,       refL),
    secondary: hslToHex(baseH + offsets.secondary, refS * 0.7, refL * 0.9),
    accent:    hslToHex(baseH + offsets.accent,    refS * 0.8, refL),
    fond:      hslToHex(baseH + offsets.fond,      refS * 0.1, 0.96),
  };

  // Appliquer uniquement les couleurs non ancrées
  for (const role of ['primary', 'secondary', 'accent', 'fond']) {
    const item = document.querySelector(`.color-picker-item[data-role="${role}"]`);
    if (!item?.classList.contains('anchored')) {
      document.getElementById(roleMap[role]).value = computed[role];
    }
  }

  updateColorDisplays();
}

async function saveCustomTheme() {
  const name = document.getElementById('tc-name').value.trim();
  const msg  = document.getElementById('tc-message');

  if (!name) {
    msg.className = 'form-message error';
    msg.textContent = 'Le nom du thème est requis';
    return;
  }

  // Générer un id slug depuis le nom
  const id = name.toLowerCase()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[ç]/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

  const primary   = document.getElementById('tc-primary').value;
  const secondary = document.getElementById('tc-secondary').value;
  const accent    = document.getElementById('tc-accent').value;
  const fond      = document.getElementById('tc-fond').value;
  const vars      = computeVars(primary, secondary, accent, fond);

  try {
    const r = await fetch('/api/admin/theme/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, label: name, vars })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erreur');
    msg.className = 'form-message success';
    msg.textContent = `Thème "${name}" enregistré !`;
    setTimeout(async () => {
      closeThemeCreator();
      await renderThemeSection();
    }, 800);
  } catch (err) {
    msg.className = 'form-message error';
    msg.textContent = err.message;
  }
}

async function _loadCarousels() {
  try {
    const response = await fetch('/api/admin/images');
    
    if (!response.ok) {
      if (response.status === 401) {
        showLogin();
        return;
      }
      throw new Error('Failed to load images');
    }
    
    const data = await response.json();
    renderCarousels(data);
  } catch (error) {
    console.error('Error loading carousels:', error);
  }
}

// Render carousel sections (images uploadées — onglet Contenu)
function renderCarousels(data) {
  const container = document.getElementById('container-content');
  // Supprimer uniquement les anciennes sections carousel dynamiques
  container.querySelectorAll('.carousel-section:not(#pages-section):not(#layouts-section)').forEach(el => el.remove());

  for (const [key, carouselData] of Object.entries(data)) {
    const section = createCarouselSection(key, carouselData);
    container.appendChild(section);
  }
}

// Specs techniques recommandées par carousel
const IMAGE_SPECS = {
  hero:         { dims: '1920 × 1080 px', ratio: '16/9',  usage: 'Plein écran accueil' },
  gallery:      { dims: '800 × 500 px',   ratio: '16/10', usage: 'Grille galerie accueil' },
  testimonials: { dims: '600 × 600 px',   ratio: '1/1',   usage: 'Témoignages clients' },
  hero_travaux: { dims: '1920 × 900 px',  ratio: '21/9',  usage: 'Plein écran Nos Travaux' },
  maconnerie:   { dims: '900 × 650 px (grande) · 500 × 320 px (petites)', ratio: '—', usage: 'Bento grid maçonnerie' },
  renovation:   { dims: '1200 × 700 px',  ratio: '16/9',  usage: 'Split cinématique rénovation' },
  exterieur:    { dims: '400 × 300 px',   ratio: '4/3',   usage: 'Polaroids extérieur' },
};

// Create carousel section HTML
function createCarouselSection(carouselId, data) {
  const { carousel, images } = data;
  const spec = IMAGE_SPECS[carouselId];
  const specHtml = spec
    ? `<div class="carousel-spec">
        <span class="spec-dims">📐 ${spec.dims}</span>
        <span class="spec-sep">·</span>
        <span class="spec-format">WebP recommandé · max 5 Mo</span>
        <span class="spec-sep">·</span>
        <span class="spec-usage">${spec.usage}</span>
       </div>`
    : '';

  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.innerHTML = `
    <div class="carousel-section-header">
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <button class="btn-collapse" id="btn-collapse-${carouselId}" title="Réduire/Agrandir">▶</button>
        <div>
          <h2>${carousel.title}</h2>
          <div class="carousel-info">${images.length} / ${carousel.maxImages} images</div>
          ${specHtml}
        </div>
      </div>
      <button class="btn btn-secondary btn-sm btn-pick-media" data-carousel="${carouselId}" title="Choisir parmi les images existantes">
        📂 Depuis le site
      </button>
    </div>
    <div id="carousel-body-${carouselId}" style="display:none;">
      <div class="images-grid" id="grid-${carouselId}"></div>
      <div class="section-footer">
        <div class="section-upload-msg" id="msg-${carouselId}"></div>
        ${images.length > 0 ? `<button class="btn-delete-all" id="del-all-${carouselId}">🗑 Tout supprimer</button>` : ''}
      </div>
      <input type="file" id="file-${carouselId}" class="section-file-input"
             accept="image/jpeg,image/jpg,image/png,image/webp" multiple>
    </div>
  `;

  section.querySelector(`#btn-collapse-${carouselId}`).addEventListener('click', () => {
    const body = section.querySelector(`#carousel-body-${carouselId}`);
    const btn  = section.querySelector(`#btn-collapse-${carouselId}`);
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    btn.textContent   = collapsed ? '▼' : '▶';
  });

  const grid      = section.querySelector(`#grid-${carouselId}`);
  const fileInput = section.querySelector(`#file-${carouselId}`);

  renderGridContent(grid, carouselId, images, fileInput);

  section.querySelector(`#del-all-${carouselId}`)
    ?.addEventListener('click', () => deleteAllImages(carouselId, images, section));

  section.querySelector('.btn-pick-media')
    ?.addEventListener('click', () => openMediaPicker(carouselId, section));

  // Sélection via input caché
  fileInput.addEventListener('change', e => {
    uploadFilesToSection(carouselId, e.target.files, section);
    e.target.value = '';
  });

  // Drag & drop sur la grille
  grid.addEventListener('dragover', e => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      grid.classList.add('dragover');
      return;
    }
    // Réordonnancement en temps réel avec FLIP
    if (!dragState || dragState.carouselId !== carouselId) return;
    const nonDragging = [...grid.querySelectorAll('.image-card:not(.dragging)')];
    const insertBefore = getInsertBefore(nonDragging, e.clientX, e.clientY);
    if (dragState.lastInsert === insertBefore) return; // même position, rien à faire
    dragState.lastInsert = insertBefore;
    flipMove(grid, dragState.card, insertBefore);
  });
  grid.addEventListener('dragleave', e => {
    if (!e.relatedTarget || !grid.contains(e.relatedTarget)) grid.classList.remove('dragover');
  });
  grid.addEventListener('drop', e => {
    e.preventDefault();
    grid.classList.remove('dragover');
    if (e.dataTransfer.types.includes('Files')) {
      uploadFilesToSection(carouselId, e.dataTransfer.files, section);
    }
  });

  return section;
}

// Rendu du contenu de la grille (état vide ou images + bouton +)
function renderGridContent(grid, carouselId, images, fileInput) {
  grid.innerHTML = '';

  if (images.length === 0) {
    // État vide : deux zones côte à côte
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-empty-wrapper';

    const fromPc = document.createElement('label');
    fromPc.className = 'grid-empty-state';
    fromPc.htmlFor = fileInput.id;
    fromPc.innerHTML =
      `<span class="empty-icon">⬆</span>` +
      `<span class="empty-text">Depuis le PC</span>` +
      `<span class="empty-hint">JPG, PNG, WebP · max 5 Mo</span>`;

    const fromSite = document.createElement('button');
    fromSite.className = 'grid-empty-state grid-empty-state--secondary';
    fromSite.type = 'button';
    fromSite.innerHTML =
      `<span class="empty-icon">📂</span>` +
      `<span class="empty-text">Depuis le site</span>` +
      `<span class="empty-hint">Réutiliser une image existante</span>`;
    fromSite.addEventListener('click', () => openMediaPicker(carouselId, grid.closest('.carousel-section')));

    wrapper.appendChild(fromPc);
    wrapper.appendChild(fromSite);
    grid.appendChild(wrapper);
  } else {
    images.forEach(image => grid.appendChild(createImageCard(carouselId, image)));

    // Bouton "+" upload depuis PC
    const addBtn = document.createElement('label');
    addBtn.className = 'grid-add-btn';
    addBtn.htmlFor = fileInput.id;
    addBtn.title = 'Uploader depuis le PC';
    addBtn.innerHTML = `<span>+</span>`;
    grid.appendChild(addBtn);

    // Bouton "📂" depuis le site
    const pickBtn = document.createElement('button');
    pickBtn.className = 'grid-add-btn grid-add-btn--pick';
    pickBtn.type = 'button';
    pickBtn.title = 'Choisir depuis le site';
    pickBtn.innerHTML = `<span>📂</span>`;
    pickBtn.addEventListener('click', () => openMediaPicker(carouselId, grid.closest('.carousel-section')));
    grid.appendChild(pickBtn);
  }
}

// Upload inline — envoie les fichiers un par un dans la section
async function uploadFilesToSection(carouselId, files, section) {
  const msgEl   = section.querySelector(`#msg-${carouselId}`);
  const fileArr = Array.from(files);
  if (fileArr.length === 0) return;

  let success = 0, lastError = null;

  for (let i = 0; i < fileArr.length; i++) {
    msgEl.className = 'section-upload-msg';
    msgEl.textContent = `Upload ${i + 1} / ${fileArr.length}…`;

    const formData = new FormData();
    formData.append('image', fileArr[i]);

    try {
      const res  = await fetch(`/api/admin/upload/${encodeURIComponent(carouselId)}`, { method: 'POST', body: formData });
      const body = await res.json();
      if (res.ok) { success++; } else { lastError = body.error || 'Erreur inconnue'; }
    } catch { lastError = 'Erreur réseau'; }
  }

  const errors = fileArr.length - success;
  if (errors === 0) {
    msgEl.className = 'section-upload-msg success';
    msgEl.textContent = `${success} image${success > 1 ? 's' : ''} uploadée${success > 1 ? 's' : ''} ✓`;
  } else if (success === 0) {
    msgEl.className = 'section-upload-msg error';
    msgEl.textContent = lastError;
  } else {
    msgEl.className = 'section-upload-msg error';
    msgEl.textContent = `${success} uploadée${success > 1 ? 's' : ''} — ${lastError}`;
  }

  setTimeout(() => { msgEl.textContent = ''; _loadCarousels(); }, 1500);
}

// Suppression de toutes les images d'une section
async function deleteAllImages(carouselId, images, section) {
  if (!confirm(`Supprimer les ${images.length} image${images.length > 1 ? 's' : ''} de cette section ?`)) return;

  const msgEl = section.querySelector(`#msg-${carouselId}`);
  let success = 0, errors = 0;

  for (let i = 0; i < images.length; i++) {
    msgEl.className = 'section-upload-msg';
    msgEl.textContent = `Suppression ${i + 1} / ${images.length}…`;
    try {
      const res = await fetch('/api/admin/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carouselId, filename: images[i].filename })
      });
      if (res.ok) { success++; } else { errors++; }
    } catch { errors++; }
  }

  if (errors === 0) {
    msgEl.className = 'section-upload-msg success';
    msgEl.textContent = `${success} image${success > 1 ? 's' : ''} supprimée${success > 1 ? 's' : ''} ✓`;
  } else {
    msgEl.className = 'section-upload-msg error';
    msgEl.textContent = `${success} supprimée${success > 1 ? 's' : ''}, ${errors} erreur${errors > 1 ? 's' : ''}`;
  }

  setTimeout(() => { msgEl.textContent = ''; _loadCarousels(); }, 1500);
}

// ─── État global du drag ────────────────────────────────────────────────────
let dragState = null; // { carouselId, card, lastInsert }

// Calcule le point d'insertion : retourne la carte devant laquelle insérer, ou null (fin)
function getInsertBefore(cards, x, y) {
  for (const card of cards) {
    const r = card.getBoundingClientRect();
    if (y < r.bottom && x < r.left + r.width / 2) return card;
    if (y < r.top) return card;
  }
  return null;
}

// FLIP : enregistre les positions, déplace la carte, anime les autres vers leur nouvelle position
function flipMove(grid, draggedCard, insertBefore) {
  const all   = [...grid.querySelectorAll('.image-card')];
  const first = new Map(all.map(c => [c, c.getBoundingClientRect()]));

  // Déplacer dans le DOM
  const addBtn = grid.querySelector('.grid-add-btn');
  grid.insertBefore(draggedCard, insertBefore || addBtn || null);

  // Animer chaque carte (sauf celle qu'on est en train de drag)
  all.forEach(c => {
    if (c === draggedCard) return;
    const f  = first.get(c);
    const l  = c.getBoundingClientRect();
    const dx = f.left - l.left;
    const dy = f.top  - l.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    c.style.transition = 'none';
    c.style.transform  = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      c.style.transition = 'transform 0.2s ease';
      c.style.transform  = '';
    }));
  });
}

// Sauvegarde l'ordre sur le serveur
async function saveOrder(carouselId, order) {
  try {
    await fetch(`/api/admin/carousel/${encodeURIComponent(carouselId)}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
  } catch { /* sera corrigé au prochain rechargement */ }
}

// Create image card
function createImageCard(carouselId, image) {
  const card = document.createElement('div');
  card.className = 'image-card';
  card.draggable = true;
  card.dataset.filename = image.filename;
  card.innerHTML = `
    <div class="drag-handle" title="Déplacer">⠿</div>
    <img src="${image.url}" alt="${image.filename}" draggable="false">
    <div class="image-card-actions">
      <button class="btn btn-danger">Supprimer</button>
    </div>
  `;
  card.querySelector('.btn-danger')
    .addEventListener('click', () => deleteImage(carouselId, image.filename));

  card.addEventListener('dragstart', e => {
    dragState = { carouselId, card, lastInsert: undefined };
    e.dataTransfer.setData('text/plain', image.filename);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('dragging'), 0);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    card.style.transition = '';
    card.style.transform  = '';
    if (dragState?.card === card) {
      const grid     = document.getElementById(`grid-${carouselId}`);
      const newOrder = [...grid.querySelectorAll('.image-card')].map(c => c.dataset.filename);
      saveOrder(carouselId, newOrder);
      dragState = null;
    }
  });

  return card;
}


// ============================================================
//  MEDIA PICKER (sélectionner une image existante)
// ============================================================

async function openMediaPicker(targetCarouselId, section) {
  // Charger toutes les images
  let allData = {};
  try {
    const r = await fetch('/api/admin/images');
    if (!r.ok) throw new Error();
    allData = await r.json();
  } catch {
    alert('Impossible de charger les images existantes.');
    return;
  }

  // Construire la liste à plat (source + image) en excluant le carousel cible
  const allImages = [];
  for (const [cid, data] of Object.entries(allData)) {
    if (cid === targetCarouselId) continue;
    for (const img of (data.images || [])) {
      allImages.push({ carouselId: cid, carouselTitle: data.carousel.title, ...img });
    }
  }

  // Créer ou réutiliser la modale
  let modal = document.getElementById('media-picker-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'media-picker-modal';
    modal.className = 'modal media-picker-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
  }

  modal.innerHTML = `
    <div class="modal-content media-picker-content">
      <div class="media-picker-header">
        <h3>Choisir une image existante</h3>
        <button class="help-modal-close" id="media-picker-close">✕</button>
      </div>
      <div class="media-picker-toolbar">
        <input type="text" id="media-picker-search" placeholder="Filtrer par nom ou section…" class="media-picker-search">
        <span class="media-picker-count" id="media-picker-count">${allImages.length} image${allImages.length !== 1 ? 's' : ''}</span>
      </div>
      ${allImages.length === 0
        ? '<p class="media-picker-empty">Aucune image disponible dans les autres sections.</p>'
        : '<div class="media-picker-grid" id="media-picker-grid"></div>'
      }
      <div class="media-picker-status" id="media-picker-status"></div>
    </div>
  `;

  modal.style.display = 'flex';
  modal.querySelector('#media-picker-close').addEventListener('click', () => modal.style.display = 'none');

  if (allImages.length === 0) return;

  const grid   = modal.querySelector('#media-picker-grid');
  const search = modal.querySelector('#media-picker-search');
  const count  = modal.querySelector('#media-picker-count');

  function renderPickerGrid(filter) {
    const filtered = filter
      ? allImages.filter(img =>
          img.filename.toLowerCase().includes(filter) ||
          img.carouselTitle.toLowerCase().includes(filter) ||
          img.carouselId.toLowerCase().includes(filter)
        )
      : allImages;

    count.textContent = `${filtered.length} image${filtered.length !== 1 ? 's' : ''}`;
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="media-picker-empty">Aucun résultat.</p>';
      return;
    }

    // Grouper par carousel
    const groups = {};
    filtered.forEach(img => {
      if (!groups[img.carouselId]) groups[img.carouselId] = { title: img.carouselTitle, images: [] };
      groups[img.carouselId].images.push(img);
    });

    for (const [cid, group] of Object.entries(groups)) {
      const groupEl = document.createElement('div');
      groupEl.className = 'picker-group';
      groupEl.innerHTML = `<div class="picker-group-title">${escJs(group.title)}</div>`;

      const imgGrid = document.createElement('div');
      imgGrid.className = 'picker-img-grid';

      group.images.forEach(img => {
        const thumb = document.createElement('div');
        thumb.className = 'picker-thumb';
        thumb.title = img.filename;
        thumb.innerHTML = `<img src="${img.webpUrl || img.url}" alt="${escJs(img.filename)}" loading="lazy">`;
        thumb.addEventListener('click', () => copyImageToCarousel(img, targetCarouselId, section, modal));
        imgGrid.appendChild(thumb);
      });

      groupEl.appendChild(imgGrid);
      grid.appendChild(groupEl);
    }
  }

  renderPickerGrid('');

  search.addEventListener('input', e => renderPickerGrid(e.target.value.toLowerCase().trim()));
  search.focus();
}

async function copyImageToCarousel(img, targetCarouselId, section, modal) {
  const status = modal.querySelector('#media-picker-status');
  status.className = 'media-picker-status';
  status.textContent = 'Copie en cours…';

  try {
    const r = await fetch(`/api/admin/carousel/${encodeURIComponent(targetCarouselId)}/copy-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceCarouselId: img.carouselId, filename: img.filename }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erreur');

    status.className = 'media-picker-status success';
    status.textContent = 'Image ajoutée ✓';

    // Mettre à jour le message de la section d'origine
    const msgEl = section?.querySelector(`#msg-${targetCarouselId}`);
    if (msgEl) {
      msgEl.className = 'section-upload-msg success';
      msgEl.textContent = 'Image ajoutée depuis le site ✓';
      setTimeout(() => { msgEl.textContent = ''; }, 2000);
    }

    setTimeout(() => {
      modal.style.display = 'none';
      _loadCarousels();
    }, 800);
  } catch (err) {
    status.className = 'media-picker-status error';
    status.textContent = err.message;
  }
}

// ============================================================
//  SECTION PAGES
// ============================================================

const SECTION_TYPES = [
  { type: 'hero',             label: 'Hero plein ecran',    needsCarousel: true },
  { type: 'hero-simple',      label: 'Hero bandeau',        needsCarousel: true },
  { type: 'about',            label: 'A propos',            needsCarousel: false },
  { type: 'services',         label: 'Services',            needsCarousel: false },
  { type: 'gallery',          label: 'Galerie',             needsCarousel: true },
  { type: 'contact',          label: 'Contact',             needsCarousel: false },
  { type: 'bento-grid',       label: 'Bento grid',          needsCarousel: true },
  { type: 'cinematic-split',  label: 'Cinematique split',   needsCarousel: true },
  { type: 'polaroids',        label: 'Polaroids',           needsCarousel: true },
  { type: 'stats',            label: 'Statistiques',        needsCarousel: false },
  { type: 'custom-layout',    label: 'Layout personnalise', needsCarousel: true, isCustomLayout: true },
];

const DIVIDER_TYPES = [
  { value: 'none',        label: 'Aucun' },
  { value: 'wave',        label: 'Vague douce' },
  { value: 'wave-double', label: 'Double vague' },
  { value: 'diagonal',    label: 'Diagonale' },
  { value: 'curve',       label: 'Courbe' },
  { value: 'triangle',    label: 'Triangle' },
  { value: 'zigzag',      label: 'Zigzag' },
  { value: 'torn',        label: 'Papier déchiré' },
];

const DIVIDER_SVG_PATHS = {
  'wave':        'M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z',
  'wave-double': 'M0,40 C240,0 480,80 720,40 C960,0 1200,80 1440,40 L1440,80 L0,80 Z',
  'diagonal':    'M0,80 L1440,0 L1440,80 Z',
  'curve':       'M0,80 Q720,0 1440,80 Z',
  'triangle':    'M0,80 L720,0 L1440,80 Z',
  'zigzag':      'M0,40 L120,0 L240,40 L360,0 L480,40 L600,0 L720,40 L840,0 L960,40 L1080,0 L1200,40 L1320,0 L1440,40 L1440,80 L0,80 Z',
  'torn':        'M0,60 C80,40 100,70 180,50 C260,30 280,65 360,45 C440,25 460,60 540,42 C620,24 640,58 720,40 C800,22 820,55 900,37 C980,19 1000,52 1080,35 C1160,18 1180,50 1260,33 C1340,16 1380,48 1440,30 L1440,80 L0,80 Z',
};

function _getDividerPreviewSvg(type, flip) {
  if (!type || type === 'none' || !DIVIDER_SVG_PATHS[type]) return '';
  const path = `<path d="${DIVIDER_SVG_PATHS[type]}" fill="currentColor"/>`;
  const inner = flip
    ? `<g transform="scale(1,-1) translate(0,-80)">${path}</g>`
    : path;
  return `<svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block;width:100%;height:100%;">${inner}</svg>`;
}

function _updateDividerPreview(row) {
  const preview = row.querySelector('.section-divider-preview');
  if (!preview) return;
  const type  = row.querySelector('.section-divider-type')?.value  || 'none';
  const color = row.querySelector('.section-divider-color')?.value || 'var(--primary)';
  const flip  = row.querySelector('.section-divider-flip')?.checked || false;
  const isNone = type === 'none';
  preview.style.display = isNone ? 'none' : '';
  if (!isNone) {
    preview.style.color = color;
    preview.innerHTML   = _getDividerPreviewSvg(type, flip);
  }
}

// Insère ou remplace une section dans le bon container selon SECTION_CONTAINERS
function _makePanelSep() {
  const sep = document.createElement('div');
  sep.className = 'bo-panel-sep';
  return sep;
}

function _insertSection(newSection, newId, afterId) {
  const containerId = SECTION_CONTAINERS[newId] || 'container-content';
  const container   = document.getElementById(containerId);
  const existing    = document.getElementById(newId);
  if (existing) {
    existing.replaceWith(newSection);
    return;
  }
  const after = document.getElementById(afterId);
  if (after && container.contains(after)) {
    // Insérer séparateur entre after et newSection
    const sep = _makePanelSep();
    after.insertAdjacentElement('afterend', sep);
    sep.insertAdjacentElement('afterend', newSection);
  } else {
    // Séparateur si le container a déjà du contenu
    if (container.children.length > 0) container.appendChild(_makePanelSep());
    container.appendChild(newSection);
  }
}

async function renderPagesSection() {
  let pagesData = { pages: [] };
  try {
    const r = await fetch('/api/pages');
    pagesData = await r.json();
  } catch {}

  const pages = pagesData.pages || [];
  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'pages-section';

  const sectionTypeOptions = SECTION_TYPES.map(t =>
    `<option value="${t.type}">${t.label}</option>`
  ).join('');

  section.innerHTML = `
    <div class="carousel-section-header">
      <div>
        <h2>Pages</h2>
        <div class="carousel-info">${pages.length} page${pages.length !== 1 ? 's' : ''}</div>
      </div>
      <button class="btn btn-success" id="btn-add-page">+ Nouvelle page</button>
    </div>
    <div id="pages-list"></div>
    <div id="new-page-form" class="new-page-form" style="display:none;">
      <h3 class="site-form-category" style="margin-top:1.2rem;">Nouvelle page</h3>
      <div class="form-row-2">
        <div class="form-group">
          <label>Titre</label>
          <input type="text" id="new-page-title" placeholder="Nos Realisations">
        </div>
        <div class="form-group">
          <label>Slug (URL) <button class="help-btn" data-help="slug">ⓘ</button></label>
          <input type="text" id="new-page-slug" placeholder="/nos-realisations">
        </div>
      </div>
      <div class="form-group">
        <label class="checkbox-label checkbox-inline">
          Afficher dans la navigation
          <input type="checkbox" id="new-page-nav" checked>
        </label>
      </div>
      <div class="page-edit-actions">
        <button class="btn btn-secondary" id="btn-cancel-new-page">Annuler</button>
        <button class="btn btn-success" id="btn-confirm-new-page">Creer la page</button>
      </div>
      <div id="new-page-message" class="form-message"></div>
    </div>
    <div id="pages-message" class="form-message"></div>
  `;

  _insertSection(section, 'pages-section', 'site-section');

  renderPageCards(pages);

  document.getElementById('btn-add-page').addEventListener('click', () => {
    document.getElementById('new-page-form').style.display = 'block';
    document.getElementById('btn-add-page').style.display = 'none';
  });
  document.getElementById('btn-cancel-new-page').addEventListener('click', () => {
    document.getElementById('new-page-form').style.display = 'none';
    document.getElementById('btn-add-page').style.display = '';
  });
  document.getElementById('btn-confirm-new-page').addEventListener('click', createNewPage);

  // Auto-slug depuis le titre
  document.getElementById('new-page-title').addEventListener('input', e => {
    const slug = '/' + e.target.value.toLowerCase()
      .replace(/[àáâ]/g,'a').replace(/[éèêë]/g,'e').replace(/[ùûü]/g,'u')
      .replace(/[ôö]/g,'o').replace(/[îï]/g,'i').replace(/[ç]/g,'c')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    document.getElementById('new-page-slug').value = slug;
  });
}

function renderPageCards(pages) {
  const list = document.getElementById('pages-list');
  if (!list) return;
  list.innerHTML = '';
  pages.forEach(page => list.appendChild(createPageCard(page, pages)));
}

function createPageCard(page, allPages) {
  const card = document.createElement('div');
  card.className = 'page-card';
  card.dataset.pageId = page.id;

  const sectionsHtml = (page.sections || []).map((s, i, arr) =>
    createSectionRowHtml(s, i, arr.length)
  ).join('');

  const sectionTypeOptions = SECTION_TYPES.map(t =>
    `<option value="${t.type}">${t.label}</option>`
  ).join('');

  const canDelete = allPages.length > 1;

  card.innerHTML = `
    <div class="page-card-header">
      <div class="page-card-info">
        <span class="page-card-title">${escJs(page.title)}</span>
        <span class="page-card-slug">${escJs(page.slug)}</span>
        ${page.showInNav ? '<span class="page-nav-badge">Nav</span>' : ''}
      </div>
      <div class="page-card-actions">
        <button class="btn btn-secondary btn-sm btn-edit-page">Modifier</button>
        ${canDelete ? `<button class="btn btn-danger btn-sm btn-delete-page">Supprimer</button>` : ''}
      </div>
    </div>
    <div class="page-card-edit" style="display:none;">
      <div class="form-row-2" style="margin:1rem 0;">
        <div class="form-group">
          <label>Titre</label>
          <input type="text" class="page-edit-title" value="${escJs(page.title)}">
        </div>
        <div class="form-group">
          <label>Slug (URL) <button class="help-btn" data-help="slug">ⓘ</button></label>
          <input type="text" class="page-edit-slug" value="${escJs(page.slug)}">
        </div>
      </div>
      <div class="form-group">
        <label class="checkbox-label checkbox-inline">
          Afficher dans la navigation
          <input type="checkbox" class="page-edit-nav" ${page.showInNav ? 'checked' : ''}>
        </label>
      </div>
      <details class="seo-details">
        <summary class="page-sections-label" style="cursor:pointer;list-style:none;">SEO ▸</summary>
        <div class="seo-fields">
          <div class="form-group">
            <label>Titre SEO <button class="help-btn" data-help="seoTitle">ⓘ</button></label>
            <input type="text" class="page-seo-title" value="${escJs(page.seo && page.seo.title || '')}">
          </div>
          <div class="form-group">
            <label>Description SEO <button class="help-btn" data-help="seoDescription">ⓘ</button></label>
            <input type="text" class="page-seo-desc" value="${escJs(page.seo && page.seo.description || '')}">
          </div>
          <div class="form-group">
            <label>og:image (URL absolue)</label>
            <input type="text" class="page-seo-image" placeholder="https://..." value="${escJs(page.seo && page.seo.ogImage || '')}">
          </div>
        </div>
      </details>
      <div class="page-sections-label" style="margin-top:1rem;">Sections</div>
      <div class="page-sections-list" id="sections-${page.id}">${sectionsHtml}</div>
      <div class="add-section-row">
        <select class="add-section-select" id="select-${page.id}">${sectionTypeOptions}</select>
        <button class="btn btn-secondary btn-sm btn-add-section">+ Ajouter</button>
      </div>
      <div class="page-edit-actions">
        <button class="btn btn-secondary btn-sm btn-cancel-edit">Annuler</button>
        <div style="display:flex;align-items:center;gap:0.8rem;">
          <span class="page-edit-message form-message"></span>
          <button class="btn btn-success btn-sm btn-save-page">Enregistrer</button>
        </div>
      </div>
    </div>
  `;

  const editDiv  = card.querySelector('.page-card-edit');
  const editBtn  = card.querySelector('.btn-edit-page');

  editBtn.addEventListener('click', () => {
    const open = editDiv.style.display !== 'none';
    editDiv.style.display = open ? 'none' : 'block';
    editBtn.textContent   = open ? 'Modifier' : 'Fermer';
  });

  card.querySelector('.btn-cancel-edit').addEventListener('click', () => {
    editDiv.style.display = 'none';
    editBtn.textContent   = 'Modifier';
  });

  card.querySelector('.btn-delete-page')?.addEventListener('click', () => deletePage(page.id));
  card.querySelector('.btn-add-section').addEventListener('click', () => addSectionToPage(card, page.id));
  card.querySelector('.btn-save-page').addEventListener('click', () => savePageEdit(card, page.id));

  bindSectionRowEvents(card, page.id);

  return card;
}

const DIVIDER_COLOR_OPTIONS = [
  { value: 'var(--primary)',      label: 'Principale' },
  { value: 'var(--primary-dark)', label: 'Principale sombre' },
  { value: 'var(--secondary)',    label: 'Secondaire' },
  { value: 'var(--accent)',       label: 'Accent' },
  { value: 'var(--text)',         label: 'Texte' },
  { value: '#ffffff',             label: 'Blanc' },
  { value: '#000000',             label: 'Noir' },
];

function _buildDividerRow(section) {
  const d = section.dividerAfter || {};
  const currentType  = d.type  || 'none';
  const currentColor = d.color || 'var(--primary)';
  const currentFlip  = d.flip  || false;
  const isNone = currentType === 'none';

  const typeOptions = DIVIDER_TYPES.map(t =>
    `<option value="${t.value}"${t.value === currentType ? ' selected' : ''}>${t.label}</option>`
  ).join('');

  const colorOptions = DIVIDER_COLOR_OPTIONS.map(c =>
    `<option value="${c.value}"${c.value === currentColor ? ' selected' : ''}>${c.label}</option>`
  ).join('');

  return `
    <div class="section-divider-row">
      <div class="section-divider-controls">
        <select class="section-divider-type">${typeOptions}</select>
        <select class="section-divider-color" style="${isNone ? 'display:none' : ''}">${colorOptions}</select>
        <label class="section-divider-flip-label" style="${isNone ? 'display:none' : ''}">
          <input type="checkbox" class="section-divider-flip"${currentFlip ? ' checked' : ''}> Inverser
        </label>
      </div>
      <div class="section-divider-preview" style="${isNone ? 'display:none' : `color:${currentColor}`}">${_getDividerPreviewSvg(currentType, currentFlip)}</div>
    </div>`;
}

function _bindDividerRowEvents(row) {
  const typeSel  = row.querySelector('.section-divider-type');
  const colorSel = row.querySelector('.section-divider-color');
  const flipChk  = row.querySelector('.section-divider-flip');
  if (typeSel)  typeSel.addEventListener('change',  () => _toggleDividerControls(typeSel));
  if (colorSel) colorSel.addEventListener('change', () => _updateDividerPreview(row));
  if (flipChk)  flipChk.addEventListener('change',  () => _updateDividerPreview(row));
}

function _toggleDividerControls(sel) {
  const row    = sel.closest('.section-divider-row');
  const isNone = sel.value === 'none';
  row.querySelector('.section-divider-color').style.display      = isNone ? 'none' : '';
  row.querySelector('.section-divider-flip-label').style.display = isNone ? 'none' : '';
  _updateDividerPreview(row);
}

function createSectionRowHtml(section, idx, total) {
  const info    = SECTION_TYPES.find(t => t.type === section.type);
  const label   = info ? info.label : section.type;

  let extraHtml = '';
  if (section.type === 'custom-layout') {
    return `
      <div class="section-row" data-type="custom-layout" data-needs-carousel="1"
           ${section.layoutId ? `data-layout-id="${escJs(section.layoutId)}"` : ''}>
        <div class="section-row-top">
          <span class="section-row-label">${label}</span>
          <div style="display:flex;flex-direction:column;gap:0.3rem;">
            <select class="section-layout-id">
              <option value="">-- Choisir un layout --</option>
            </select>
            <div style="display:flex;align-items:center;gap:0.3rem;">
              <input type="text" class="section-carousel-id" placeholder="prefixe-carousel" value="${escJs(section.carouselId || '')}">
              <button class="help-btn" data-help="carouselId" style="flex-shrink:0;">ⓘ</button>
            </div>
          </div>
          <div class="section-row-btns">
            <button class="btn-section-up" ${idx === 0 ? 'disabled' : ''} title="Monter">↑</button>
            <button class="btn-section-down" ${idx === total - 1 ? 'disabled' : ''} title="Descendre">↓</button>
            <button class="btn-section-remove" title="Supprimer">×</button>
          </div>
        </div>
        <div class="layout-block-uploads"></div>
        ${_buildDividerRow(section)}
      </div>
    `;
  } else if (info?.needsCarousel) {
    extraHtml = `<div style="display:flex;align-items:center;gap:0.3rem;">
         <input type="text" class="section-carousel-id" placeholder="id-carousel" value="${escJs(section.carouselId || '')}">
         <button class="help-btn" data-help="carouselId" style="flex-shrink:0;">ⓘ</button>
       </div>`;
  } else {
    extraHtml = `<span class="section-no-carousel">—</span>`;
  }

  return `
    <div class="section-row" data-type="${section.type}" data-needs-carousel="${info?.needsCarousel ? '1' : '0'}"
         ${section.layoutId ? `data-layout-id="${escJs(section.layoutId)}"` : ''}>
      <div class="section-row-top">
        <span class="section-row-label">${label}</span>
        ${extraHtml}
        <div class="section-row-btns">
          <button class="btn-section-up" ${idx === 0 ? 'disabled' : ''} title="Monter">↑</button>
          <button class="btn-section-down" ${idx === total - 1 ? 'disabled' : ''} title="Descendre">↓</button>
          <button class="btn-section-remove" title="Supprimer">×</button>
        </div>
      </div>
      ${_buildDividerRow(section)}
    </div>
  `;
}

function bindSectionRowEvents(card, pageId) {
  const list = card.querySelector(`#sections-${pageId}`);
  list.querySelectorAll('.btn-section-remove').forEach(btn =>
    btn.addEventListener('click', () => { btn.closest('.section-row').remove(); refreshRowIndexes(list); })
  );
  list.querySelectorAll('.btn-section-up').forEach(btn =>
    btn.addEventListener('click', () => {
      const row = btn.closest('.section-row'), prev = row.previousElementSibling;
      if (prev) { list.insertBefore(row, prev); refreshRowIndexes(list); }
    })
  );
  list.querySelectorAll('.btn-section-down').forEach(btn =>
    btn.addEventListener('click', () => {
      const row = btn.closest('.section-row'), next = row.nextElementSibling;
      if (next) { list.insertBefore(next, row); refreshRowIndexes(list); }
    })
  );
  // Peupler les dropdowns de layouts pour les sections custom-layout
  populateLayoutSelects(list);
  // Bind upload events pour les sections custom-layout existantes
  list.querySelectorAll('.section-row[data-type="custom-layout"]').forEach(row => _bindLayoutBlockUploadEvents(row));
  // Bind contrôles divider (forme, couleur, flip)
  list.querySelectorAll('.section-divider-row').forEach(row => _bindDividerRowEvents(row));
}

async function populateLayoutSelects(container) {
  const selects = container.querySelectorAll('.section-layout-id');
  if (selects.length === 0) return;
  let layoutsData = { layouts: {} };
  try { const r = await fetch('/api/layouts'); layoutsData = await r.json(); } catch {}
  const layouts = Object.values(layoutsData.layouts || {});
  selects.forEach(sel => {
    const row = sel.closest('.section-row');
    const currentId = row?.dataset.layoutId || '';
    layouts.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = l.label;
      if (l.id === currentId) opt.selected = true;
      sel.appendChild(opt);
    });
    // Afficher les zones d'upload si un layout est déjà sélectionné
    if (sel.value && row) renderLayoutBlockUploads(row);
  });
}

// ---- Inline block uploads pour les layouts personnalisés ----

function _bindLayoutBlockUploadEvents(row) {
  row.querySelector('.section-layout-id')?.addEventListener('change', () => renderLayoutBlockUploads(row));
  let _t;
  row.querySelector('.section-carousel-id')?.addEventListener('input', () => {
    clearTimeout(_t);
    _t = setTimeout(() => renderLayoutBlockUploads(row), 400);
  });
}

async function renderLayoutBlockUploads(row) {
  const layoutId  = row.querySelector('.section-layout-id')?.value;
  const prefix    = (row.querySelector('.section-carousel-id')?.value || '').trim();
  const container = row.querySelector('.layout-block-uploads');
  if (!container) return;
  container.innerHTML = '';
  if (!layoutId) return;

  let layoutsData = { layouts: {} };
  try { const r = await fetch('/api/layouts'); layoutsData = await r.json(); } catch {}
  const layout = layoutsData.layouts && layoutsData.layouts[layoutId];
  if (!layout) return;

  const mediaBlocks = (layout.blocks || []).filter(b => b.type === 'image' || b.type === 'carousel');
  if (mediaBlocks.length === 0) return;

  if (!prefix) {
    container.innerHTML = '<p class="lbu-hint">Renseignez un préfixe carousel pour uploader les images</p>';
    return;
  }

  mediaBlocks.forEach(block => {
    const carouselId = prefix + '-' + block.blockId;
    const blockEl = _createBlockUploadEl(block, carouselId);
    container.appendChild(blockEl);
    _loadBlockImages(blockEl, carouselId);
  });
}

function _createBlockUploadEl(block, carouselId) {
  const isImage = block.type === 'image';
  const icon    = isImage ? '🖼' : '🎞';
  const label   = isImage ? 'Image' : 'Carrousel';
  const fileId  = 'lbu-' + carouselId;

  const el = document.createElement('div');
  el.className = 'lbu-block';
  el.dataset.carouselId = carouselId;
  el.dataset.blockType  = block.type;
  el.innerHTML = `
    <div class="lbu-header">
      <span class="lbu-label">${icon} ${label}</span>
      <span class="lbu-id">${carouselId}</span>
      <label class="lbu-add-btn" for="${fileId}" title="Ajouter${isImage ? ' une image' : ' des images'}">+</label>
    </div>
    <div class="lbu-grid"></div>
    <input type="file" id="${fileId}" class="section-file-input"
           accept="image/jpeg,image/jpg,image/png,image/webp"${isImage ? '' : ' multiple'}>
  `;

  el.querySelector('.section-file-input').addEventListener('change', async e => {
    const grid  = el.querySelector('.lbu-grid');
    const files = isImage ? [e.target.files[0]] : [...e.target.files];
    for (const file of files) {
      await _uploadBlockFile(carouselId, file, grid, el);
    }
    e.target.value = '';
  });

  return el;
}

async function _loadBlockImages(blockEl, carouselId) {
  const grid = blockEl.querySelector('.lbu-grid');
  try {
    const r      = await fetch('/api/carousel/' + carouselId + '/images');
    const data   = await r.json();
    const images = data.images || [];
    images.forEach(img => grid.appendChild(_createBlockImgCard(carouselId, img, blockEl)));
    // Bloc image : masquer le bouton + si une image est déjà présente
    if (blockEl.dataset.blockType === 'image' && images.length >= 1) {
      _toggleLbuAddBtn(blockEl, false);
    }
  } catch {}
}

function _toggleLbuAddBtn(blockEl, visible) {
  const btn   = blockEl.querySelector('.lbu-add-btn');
  const input = blockEl.querySelector('.section-file-input');
  if (btn)   btn.style.display   = visible ? '' : 'none';
  if (input) input.style.display = visible ? '' : 'none';
}

function _createBlockImgCard(carouselId, img, blockEl) {
  const card = document.createElement('div');
  card.className = 'lbu-img-card';
  card.innerHTML = `
    <img src="${img.webpUrl || img.url}" alt="" loading="lazy">
    <button class="lbu-del" title="Supprimer">×</button>
  `;
  card.querySelector('.lbu-del').addEventListener('click', async () => {
    try {
      const r = await fetch('/api/admin/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carouselId, filename: img.filename })
      });
      if (r.ok) {
        card.remove();
        // Bloc image : réafficher le bouton + après suppression
        if (blockEl && blockEl.dataset.blockType === 'image') {
          _toggleLbuAddBtn(blockEl, true);
        }
      }
    } catch {}
  });
  return card;
}

async function _uploadBlockFile(carouselId, file, grid, blockEl) {
  const formData = new FormData();
  formData.append('image', file);
  try {
    const r = await fetch('/api/admin/upload/' + carouselId, { method: 'POST', body: formData });
    if (!r.ok) return;
    const data    = await r.json();
    const webpUrl = data.url.replace(/\.[^.]+$/, '.webp');
    grid.appendChild(_createBlockImgCard(carouselId, { filename: data.filename, url: data.url, webpUrl }, blockEl));
    // Bloc image : masquer le bouton + après l'upload
    if (blockEl && blockEl.dataset.blockType === 'image') {
      _toggleLbuAddBtn(blockEl, false);
    }
  } catch {}
}

// ---- Fin inline block uploads ----

function refreshRowIndexes(list) {
  const rows = [...list.querySelectorAll('.section-row')];
  rows.forEach((row, i) => {
    row.querySelector('.btn-section-up').disabled   = i === 0;
    row.querySelector('.btn-section-down').disabled = i === rows.length - 1;
  });
}

function addSectionToPage(card, pageId) {
  const type = document.getElementById(`select-${pageId}`).value;
  const list = card.querySelector(`#sections-${pageId}`);
  const info = SECTION_TYPES.find(t => t.type === type);

  const div = document.createElement('div');
  div.innerHTML = createSectionRowHtml({ type, carouselId: '' }, list.children.length, list.children.length + 1);
  const row = div.firstElementChild;
  list.appendChild(row);
  refreshRowIndexes(list);

  row.querySelector('.btn-section-remove').addEventListener('click', () => { row.remove(); refreshRowIndexes(list); });
  row.querySelector('.btn-section-up').addEventListener('click', () => {
    const prev = row.previousElementSibling;
    if (prev) { list.insertBefore(row, prev); refreshRowIndexes(list); }
  });
  row.querySelector('.btn-section-down').addEventListener('click', () => {
    const next = row.nextElementSibling;
    if (next) { list.insertBefore(next, row); refreshRowIndexes(list); }
  });

  // Peupler le dropdown layout si c'est un custom-layout
  if (type === 'custom-layout') {
    _bindLayoutBlockUploadEvents(row);
    populateLayoutSelects(list);
  }

  // Binder les contrôles divider de la nouvelle row
  const divRow = row.querySelector('.section-divider-row');
  if (divRow) _bindDividerRowEvents(divRow);
}

async function savePageEdit(card, pageId) {
  const msg       = card.querySelector('.page-edit-message');
  const title     = card.querySelector('.page-edit-title').value.trim();
  const slug      = card.querySelector('.page-edit-slug').value.trim();
  const showInNav = card.querySelector('.page-edit-nav').checked;

  if (!title || !slug) {
    msg.className = 'page-edit-message form-message error';
    msg.textContent = 'Titre et slug requis';
    return;
  }

  const seo = {
    title:       card.querySelector('.page-seo-title')?.value.trim()  || '',
    description: card.querySelector('.page-seo-desc')?.value.trim()   || '',
    ogImage:     card.querySelector('.page-seo-image')?.value.trim()  || null,
  };

  // Charger les layouts pour auto-générer blockCarousels
  let layoutsData = { layouts: {} };
  try { const lr = await fetch('/api/layouts'); layoutsData = await lr.json(); } catch {}

  const sections = [...card.querySelectorAll('.section-row')].map(row => {
    const s = { type: row.dataset.type };
    if (s.type === 'custom-layout') {
      const layoutId = row.querySelector('.section-layout-id')?.value || '';
      s.layoutId = layoutId;
      s.carouselId = row.querySelector('.section-carousel-id')?.value.trim() || '';
      // Auto-générer blockCarousels à partir de la définition du layout
      if (layoutId && s.carouselId && layoutsData.layouts[layoutId]) {
        const blocks = layoutsData.layouts[layoutId].blocks || [];
        s.blockCarousels = {};
        blocks.forEach(b => {
          if (b.type === 'image' || b.type === 'carousel') {
            s.blockCarousels[b.blockId] = s.carouselId + '-' + b.blockId;
          }
        });
      }
    } else if (row.dataset.needsCarousel === '1') {
      s.carouselId = row.querySelector('.section-carousel-id')?.value.trim() || '';
    }
    // Collecter le séparateur SVG
    const divSel = row.querySelector('.section-divider-type');
    if (divSel && divSel.value !== 'none') {
      s.dividerAfter = {
        type:  divSel.value,
        color: row.querySelector('.section-divider-color')?.value || 'var(--bg)',
      };
      if (row.querySelector('.section-divider-flip')?.checked) s.dividerAfter.flip = true;
    }
    return s;
  });

  // Validation : les sections custom-layout doivent avoir un layoutId et un carouselId
  const invalidLayout = sections.find(s => s.type === 'custom-layout' && (!s.layoutId || !s.carouselId));
  if (invalidLayout) {
    msg.className = 'page-edit-message form-message error';
    msg.textContent = 'Layout personnalise : choisissez un layout ET un prefixe carousel';
    return;
  }

  let pagesData = { pages: [] };
  try { const r = await fetch('/api/pages'); pagesData = await r.json(); } catch {}

  const idx = pagesData.pages.findIndex(p => p.id === pageId);
  if (idx === -1) { msg.textContent = 'Page introuvable'; return; }
  pagesData.pages[idx] = { ...pagesData.pages[idx], title, slug, showInNav, seo, sections };

  await _savePagesJson(pagesData, msg);
  if (msg.classList.contains('success')) {
    card.querySelector('.page-card-title').textContent = title;
    card.querySelector('.page-card-slug').textContent  = slug;
  }
}

async function createNewPage() {
  const title     = document.getElementById('new-page-title').value.trim();
  const slug      = document.getElementById('new-page-slug').value.trim();
  const showInNav = document.getElementById('new-page-nav').checked;
  const msg       = document.getElementById('new-page-message');

  if (!title || !slug) {
    msg.className = 'form-message error'; msg.textContent = 'Titre et slug requis'; return;
  }

  let pagesData = { pages: [] };
  try { const r = await fetch('/api/pages'); pagesData = await r.json(); } catch {}

  if (pagesData.pages.find(p => p.slug === slug)) {
    msg.className = 'form-message error'; msg.textContent = 'Ce slug existe deja'; return;
  }

  const id = slug.replace(/^\//, '').replace(/\//g, '-') || 'page-' + Date.now();
  pagesData.pages.push({ id, title, slug, showInNav, navOrder: pagesData.pages.length, sections: [] });

  await _savePagesJson(pagesData, msg);
  if (msg.classList.contains('success')) setTimeout(() => renderPagesSection(), 800);
}

async function deletePage(pageId) {
  if (!confirm('Supprimer cette page definitivement ?')) return;
  let pagesData = { pages: [] };
  try { const r = await fetch('/api/pages'); pagesData = await r.json(); } catch {}
  pagesData.pages = pagesData.pages.filter(p => p.id !== pageId);
  const msg = document.getElementById('pages-message');
  await _savePagesJson(pagesData, msg);
  if (msg.classList.contains('success')) renderPagesSection();
}

async function _savePagesJson(pagesData, msgEl) {
  try {
    const r = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pagesData)
    });
    if (!r.ok) throw new Error();
    msgEl.className = 'form-message success';
    msgEl.textContent = 'Enregistre ✓';
    // Rafraîchir les carousels pour afficher les nouveaux blockCarousels des layouts
    _loadCarousels();
    setTimeout(() => { msgEl.textContent = ''; msgEl.className = 'form-message'; }, 3000);
  } catch {
    msgEl.className = 'form-message error';
    msgEl.textContent = 'Erreur lors de la sauvegarde';
  }
}

// ============================================================
//  SECTION LAYOUTS (Générateur de sections)
// ============================================================

const BLOCK_TYPES = [
  { type: 'title',        label: 'Titre',            icon: 'T' },
  { type: 'richtext',     label: 'Texte riche',      icon: '¶' },
  { type: 'image',        label: 'Image',            icon: '🖼' },
  { type: 'carousel',     label: 'Carousel',         icon: '◫' },
  { type: 'social-links', label: 'Réseaux sociaux',  icon: '◉' },
  { type: 'map',          label: 'Carte',            icon: '🗺' },
];

async function renderLayoutsSection() {
  let layoutsData = { layouts: {} };
  try { const r = await fetch('/api/layouts'); layoutsData = await r.json(); } catch {}

  const layouts = Object.values(layoutsData.layouts || {});
  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'layouts-section';

  section.innerHTML = `
    <div class="carousel-section-header">
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <button class="btn-collapse" id="btn-collapse-layouts" title="Réduire/Agrandir">▶</button>
        <div>
          <h2>Layouts personnalises</h2>
          <div class="carousel-info">${layouts.length} layout${layouts.length !== 1 ? 's' : ''} — Structures reutilisables pour vos pages</div>
        </div>
      </div>
      <button class="btn btn-success" id="btn-new-layout">+ Nouveau layout</button>
    </div>
    <div id="layouts-body" style="display:none;">
      <div id="layouts-list"></div>
      <div id="layout-editor" class="layout-editor" style="display:none;"></div>
      <div id="layouts-message" class="form-message"></div>
    </div>
  `;

  _insertSection(section, 'layouts-section', 'border-section');

  renderLayoutCards(layouts);

  document.getElementById('btn-collapse-layouts').addEventListener('click', () => {
    const body = document.getElementById('layouts-body');
    const btn  = document.getElementById('btn-collapse-layouts');
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    btn.textContent   = collapsed ? '▼' : '▶';
  });

  document.getElementById('btn-new-layout').addEventListener('click', () => openLayoutEditor(null));
}

function renderLayoutCards(layouts) {
  const list = document.getElementById('layouts-list');
  if (!list) return;
  list.innerHTML = '';
  if (layouts.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Aucun layout cree. Cliquez sur "+ Nouveau layout" pour commencer.</p>';
    return;
  }
  layouts.forEach(layout => {
    const card = document.createElement('div');
    card.className = 'layout-card';
    card.innerHTML = `
      <div class="layout-card-info">
        <span class="layout-card-name">${escJs(layout.label)}</span>
        <span class="layout-card-meta">${layout.blocks.length} bloc${layout.blocks.length !== 1 ? 's' : ''} — ID: ${escJs(layout.id)}</span>
      </div>
      <div class="layout-card-actions">
        <button class="btn btn-secondary btn-sm btn-edit-layout" data-id="${layout.id}">Modifier</button>
        <button class="btn btn-danger btn-sm btn-delete-layout" data-id="${layout.id}">Supprimer</button>
      </div>
    `;
    card.querySelector('.btn-edit-layout').addEventListener('click', () => openLayoutEditor(layout));
    card.querySelector('.btn-delete-layout').addEventListener('click', () => deleteLayout(layout.id));
    list.appendChild(card);
  });
}

async function deleteLayout(layoutId) {
  if (!confirm('Supprimer ce layout ?')) return;
  const msg = document.getElementById('layouts-message');
  try {
    const r = await fetch('/api/admin/layouts/' + layoutId, { method: 'DELETE' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erreur');
    msg.className = 'form-message success';
    msg.textContent = 'Layout supprime ✓';
    setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 3000);
    renderLayoutsSection();
  } catch (err) {
    msg.className = 'form-message error';
    msg.textContent = err.message;
  }
}

let _layoutEditorBlockCounter = 0;

function openLayoutEditor(existingLayout) {
  const editor = document.getElementById('layout-editor');
  const isNew = !existingLayout;
  _layoutEditorBlockCounter = 0;

  const blocks = existingLayout ? existingLayout.blocks.map(b => ({ ...b })) : [];
  // Migration : blocs sans row/col → auto-placement
  _migrateBlocksToRowCol(blocks);
  blocks.forEach(b => { if (!b._idx) b._idx = ++_layoutEditorBlockCounter; });

  // S'assurer que le body est visible (au cas où la section est repliée)
  const layoutsBody = document.getElementById('layouts-body');
  if (layoutsBody && layoutsBody.style.display === 'none') {
    layoutsBody.style.display = '';
    const colBtn = document.getElementById('btn-collapse-layouts');
    if (colBtn) colBtn.textContent = '▼';
  }

  editor.style.display = 'block';
  editor.innerHTML = `
    <h3 class="site-form-category" style="margin-top:1rem;">${isNew ? 'Nouveau layout' : 'Modifier : ' + escJs(existingLayout.label)}</h3>
    <div class="form-row-2">
      <div class="form-group">
        <label>Nom du layout</label>
        <input type="text" id="layout-edit-label" value="${escJs(existingLayout ? existingLayout.label : '')}" placeholder="Presentation equipe">
      </div>
      <div class="form-group">
        <label>ID (auto-genere) <button class="help-btn" data-help="layoutId">ⓘ</button></label>
        <input type="text" id="layout-edit-id" value="${escJs(existingLayout ? existingLayout.id : '')}" placeholder="presentation-equipe" ${isNew ? '' : 'readonly'}>
      </div>
    </div>

    <div class="layout-builder">
      <div class="layout-palette">
        <div class="layout-palette-title">Blocs disponibles</div>
        ${BLOCK_TYPES.map(bt => `
          <div class="palette-block" data-block-type="${bt.type}">
            <span class="palette-icon">${bt.icon}</span> ${bt.label}
            <button class="palette-add-btn" title="Ajouter">+</button>
          </div>
        `).join('')}
      </div>

      <div class="layout-canvas-wrapper">
        <div class="layout-canvas-title">Blocs du layout</div>
        <div class="layout-canvas" id="layout-canvas">
          <div class="layout-canvas-drop-hint" id="canvas-drop-hint">Cliquez sur un bloc a gauche pour l'ajouter</div>
        </div>
        <div class="layout-overlap-warning" id="layout-overlap-warning" style="display:none;"></div>
      </div>
    </div>

    <div class="layout-preview-panel" id="layout-preview-panel">
      <div class="layout-preview-title">Apercu de la grille</div>
      <div class="layout-preview-grid" id="layout-preview-grid"></div>
    </div>

    <div class="page-edit-actions" style="margin-top:1rem;">
      <button class="btn btn-secondary" id="btn-cancel-layout">Annuler</button>
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <span id="layout-edit-message" class="form-message"></span>
        <button class="btn btn-success" id="btn-save-layout">Enregistrer</button>
      </div>
    </div>
  `;

  // Auto-slug ID depuis le nom
  if (isNew) {
    document.getElementById('layout-edit-label').addEventListener('input', e => {
      const id = e.target.value.toLowerCase()
        .replace(/[àáâ]/g,'a').replace(/[éèêë]/g,'e').replace(/[ùûü]/g,'u')
        .replace(/[ôö]/g,'o').replace(/[îï]/g,'i').replace(/[ç]/g,'c')
        .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      document.getElementById('layout-edit-id').value = id;
    });
  }

  // Ajouter les blocs existants au canvas
  const canvas = document.getElementById('layout-canvas');
  blocks.forEach(b => canvas.appendChild(createCanvasBlock(b)));
  updateDropHint();
  updatePreview();

  // Clic sur palette → ajoute un bloc
  editor.querySelectorAll('.palette-block').forEach(pb => {
    pb.addEventListener('click', () => {
      const blockType = pb.dataset.blockType;
      const nextPos = _findNextFreePosition();
      const newBlock = {
        blockId: 'b' + (++_layoutEditorBlockCounter),
        type: blockType,
        row: nextPos.row,
        col: nextPos.col,
        colSpan: blockType === 'title' ? 3 : 1,
        _idx: _layoutEditorBlockCounter,
      };
      if (blockType === 'title') { newBlock.tag = 'h2'; newBlock.col = 1; }
      if (blockType === 'image') newBlock.display = 'column';
      if (blockType === 'social-links') { newBlock.shape = 'round'; newBlock.direction = 'horizontal'; newBlock.size = 'md'; }
      if (blockType === 'map') { newBlock.provider = 'leaflet'; newBlock.height = '300'; }

      canvas.appendChild(createCanvasBlock(newBlock));
      updateDropHint();
      updatePreview();
    });
  });

  document.getElementById('btn-cancel-layout').addEventListener('click', () => {
    editor.style.display = 'none';
    editor.innerHTML = '';
  });

  document.getElementById('btn-save-layout').addEventListener('click', () => saveLayout(isNew, existingLayout?.id));
}

// Migration auto des anciens blocs (order+colSpan) vers le nouveau format (row+col+colSpan)
function _migrateBlocksToRowCol(blocks) {
  const needsMigration = blocks.some(b => b.row === undefined);
  if (!needsMigration) return;

  blocks.sort((a, b) => (a.order || 0) - (b.order || 0));
  let currentRow = 1;
  let currentCol = 1;
  blocks.forEach(b => {
    const span = b.colSpan || 1;
    if (currentCol + span - 1 > 3) {
      currentRow++;
      currentCol = 1;
    }
    b.row = currentRow;
    b.col = currentCol;
    currentCol += span;
    if (currentCol > 3) {
      currentRow++;
      currentCol = 1;
    }
  });
}

// Trouve la prochaine position libre dans la grille
function _findNextFreePosition() {
  const canvas = document.getElementById('layout-canvas');
  if (!canvas) return { row: 1, col: 1 };
  const blocks = [...canvas.querySelectorAll('.canvas-block')];
  if (blocks.length === 0) return { row: 1, col: 1 };

  // Construire une carte d'occupation
  const occupied = new Set();
  blocks.forEach(el => {
    const row = parseInt(el.querySelector('.cb-row')?.value || 1);
    const col = parseInt(el.querySelector('.cb-col')?.value || 1);
    const span = parseInt(el.querySelector('.cb-colspan')?.value || 1);
    for (let c = col; c < col + span && c <= 3; c++) {
      occupied.add(row + '-' + c);
    }
  });

  // Chercher le premier emplacement libre
  for (let r = 1; r <= 20; r++) {
    for (let c = 1; c <= 3; c++) {
      if (!occupied.has(r + '-' + c)) return { row: r, col: c };
    }
  }
  return { row: 1, col: 1 };
}

// Vérifie les chevauchements et affiche un warning
function _checkOverlaps() {
  const canvas = document.getElementById('layout-canvas');
  const warning = document.getElementById('layout-overlap-warning');
  if (!canvas || !warning) return false;

  const blocks = [...canvas.querySelectorAll('.canvas-block')];
  const cells = {};
  let hasOverlap = false;

  blocks.forEach(el => {
    const row = parseInt(el.querySelector('.cb-row')?.value || 1);
    const col = parseInt(el.querySelector('.cb-col')?.value || 1);
    const span = parseInt(el.querySelector('.cb-colspan')?.value || 1);
    const id = el.dataset.blockId;

    for (let c = col; c < col + span && c <= 3; c++) {
      const key = row + '-' + c;
      if (cells[key]) {
        hasOverlap = true;
        el.classList.add('canvas-block-overlap');
        const other = canvas.querySelector(`[data-block-id="${cells[key]}"]`);
        if (other) other.classList.add('canvas-block-overlap');
      } else {
        cells[key] = id;
      }
    }
    if (!hasOverlap) el.classList.remove('canvas-block-overlap');
  });

  if (hasOverlap) {
    warning.style.display = 'block';
    warning.textContent = 'Chevauchement detecte ! Deux blocs ne peuvent pas occuper la meme case.';
  } else {
    warning.style.display = 'none';
    blocks.forEach(el => el.classList.remove('canvas-block-overlap'));
  }
  return hasOverlap;
}

function createCanvasBlock(block) {
  const info = BLOCK_TYPES.find(bt => bt.type === block.type);
  const el = document.createElement('div');
  el.className = 'canvas-block';
  el.dataset.blockId = block.blockId;
  el.dataset.type = block.type;

  const row = block.row || 1;
  const col = block.col || 1;
  const colSpan = block.colSpan || 1;

  let extraOptions = '';
  if (block.type === 'title') {
    extraOptions += `<label class="canvas-block-opt">Balise
      <select class="cb-tag">
        <option value="h2" ${block.tag === 'h2' ? 'selected' : ''}>H2</option>
        <option value="h3" ${block.tag === 'h3' ? 'selected' : ''}>H3</option>
      </select>
    </label>`;
  }
  if (block.type === 'image') {
    extraOptions += `<label class="canvas-block-opt">Affichage
      <select class="cb-display">
        <option value="column" ${block.display === 'column' ? 'selected' : ''}>Colonne</option>
        <option value="float" ${block.display === 'float' ? 'selected' : ''}>Flottant</option>
      </select>
    </label>`;
  }
  if (block.type === 'social-links') {
    const shape = block.shape || 'round';
    const direction = block.direction || 'horizontal';
    const size = block.size || 'md';
    extraOptions += `
      <label class="canvas-block-opt">Forme
        <select class="cb-social-shape">
          <option value="round"   ${shape === 'round'   ? 'selected' : ''}>Rond</option>
          <option value="square"  ${shape === 'square'  ? 'selected' : ''}>Carré</option>
          <option value="rounded" ${shape === 'rounded' ? 'selected' : ''}>Arrondi</option>
        </select>
      </label>
      <label class="canvas-block-opt">Direction
        <select class="cb-social-direction">
          <option value="horizontal" ${direction === 'horizontal' ? 'selected' : ''}>Horizontal</option>
          <option value="vertical"   ${direction === 'vertical'   ? 'selected' : ''}>Vertical</option>
        </select>
      </label>
      <label class="canvas-block-opt">Taille
        <select class="cb-social-size">
          <option value="sm" ${size === 'sm' ? 'selected' : ''}>Petit</option>
          <option value="md" ${size === 'md' ? 'selected' : ''}>Moyen</option>
          <option value="lg" ${size === 'lg' ? 'selected' : ''}>Grand</option>
        </select>
      </label>`;
  }
  if (block.type === 'map') {
    const provider = block.provider || 'leaflet';
    const address = block.address || '';
    const embedUrl = block.embedUrl || '';
    const height = block.height || '300';
    extraOptions += `
      <label class="canvas-block-opt">Fournisseur
        <select class="cb-map-provider">
          <option value="leaflet"      ${provider === 'leaflet'      ? 'selected' : ''}>OpenStreetMap</option>
          <option value="google-embed" ${provider === 'google-embed' ? 'selected' : ''}>Google Maps</option>
        </select>
      </label>
      <label class="canvas-block-opt cb-map-address-wrap" style="${provider === 'google-embed' ? 'display:none' : ''}">Adresse
        <input type="text" class="cb-map-address" value="${escJs(address)}" placeholder="123 rue Example, Paris">
      </label>
      <label class="canvas-block-opt cb-map-embed-wrap" style="${provider !== 'google-embed' ? 'display:none' : ''}">URL embed
        <input type="text" class="cb-map-embed" value="${escJs(embedUrl)}" placeholder="https://maps.google.com/maps?...">
      </label>
      <label class="canvas-block-opt">Hauteur
        <select class="cb-map-height">
          <option value="200" ${height === '200' ? 'selected' : ''}>200px</option>
          <option value="300" ${height === '300' ? 'selected' : ''}>300px</option>
          <option value="400" ${height === '400' ? 'selected' : ''}>400px</option>
        </select>
      </label>`;
  }

  // Note pour les blocs image/carousel
  const uploadNote = (block.type === 'image' || block.type === 'carousel')
    ? '<div class="canvas-block-note">Images : section Carousels (apres sauvegarde de la page)</div>'
    : '';

  // Propriétés de style du bloc
  const bg           = block.bg || '';
  const color        = block.color || '';
  const borderWidth  = block.borderWidth || 'none';
  const borderColor  = block.borderColor || '';
  const borderRadius = block.borderRadius || 'none';

  const styleOptions = `
    <div class="canvas-block-style-row">
      <label class="canvas-block-opt" title="Couleur de fond">
        Fond
        <input type="color" class="cb-bg-color" value="${bg || '#1e2c3a'}" ${bg ? '' : 'disabled'}>
        <input type="checkbox" class="cb-bg-enabled" title="Activer" ${bg ? 'checked' : ''}>
      </label>
      <label class="canvas-block-opt" title="Couleur du texte">
        Texte
        <input type="color" class="cb-color-color" value="${color || '#c9d1d9'}" ${color ? '' : 'disabled'}>
        <input type="checkbox" class="cb-color-enabled" title="Activer" ${color ? 'checked' : ''}>
      </label>
      <label class="canvas-block-opt">Bordure
        <select class="cb-border-width">
          <option value="none"   ${borderWidth === 'none'   ? 'selected' : ''}>Aucune</option>
          <option value="thin"   ${borderWidth === 'thin'   ? 'selected' : ''}>Fine</option>
          <option value="normal" ${borderWidth === 'normal' ? 'selected' : ''}>Normale</option>
          <option value="thick"  ${borderWidth === 'thick'  ? 'selected' : ''}>Épaisse</option>
        </select>
      </label>
      <label class="canvas-block-opt cb-border-color-wrap" style="${borderWidth === 'none' ? 'display:none' : ''}">
        Couleur bordure
        <input type="color" class="cb-border-color" value="${borderColor || '#4a7c59'}">
      </label>
      <label class="canvas-block-opt">Coins
        <select class="cb-border-radius">
          <option value="none" ${borderRadius === 'none' ? 'selected' : ''}>Carré</option>
          <option value="sm"   ${borderRadius === 'sm'   ? 'selected' : ''}>Arrondi S</option>
          <option value="md"   ${borderRadius === 'md'   ? 'selected' : ''}>Arrondi M</option>
          <option value="lg"   ${borderRadius === 'lg'   ? 'selected' : ''}>Arrondi L</option>
          <option value="pill" ${borderRadius === 'pill' ? 'selected' : ''}>Pilule</option>
        </select>
      </label>
    </div>
  `;

  el.innerHTML = `
    <div class="canvas-block-header">
      <span class="canvas-block-icon">${info ? info.icon : '?'}</span>
      <span class="canvas-block-label">${info ? info.label : block.type}</span>
      <span class="canvas-block-id">${block.blockId}</span>
      <button class="btn-section-remove canvas-block-remove" title="Supprimer">×</button>
    </div>
    <div class="canvas-block-options">
      <label class="canvas-block-opt">Ligne
        <select class="cb-row">
          ${[1,2,3,4,5,6,7,8].map(r => `<option value="${r}" ${r === row ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </label>
      <label class="canvas-block-opt">Colonne
        <select class="cb-col">
          <option value="1" ${col === 1 ? 'selected' : ''}>1</option>
          <option value="2" ${col === 2 ? 'selected' : ''}>2</option>
          <option value="3" ${col === 3 ? 'selected' : ''}>3</option>
        </select>
      </label>
      <label class="canvas-block-opt">Largeur
        <select class="cb-colspan">
          <option value="1" ${colSpan === 1 ? 'selected' : ''}>1 col</option>
          <option value="2" ${colSpan === 2 ? 'selected' : ''}>2 col</option>
          <option value="3" ${colSpan === 3 ? 'selected' : ''}>3 col</option>
        </select>
      </label>
      ${extraOptions}
    </div>
    ${styleOptions}
    ${uploadNote}
  `;

  // Supprimer
  el.querySelector('.canvas-block-remove').addEventListener('click', () => {
    el.remove();
    updateDropHint();
    updatePreview();
  });

  // Activation/désactivation des color pickers de fond et texte
  el.querySelector('.cb-bg-enabled').addEventListener('change', function() {
    el.querySelector('.cb-bg-color').disabled = !this.checked;
  });
  el.querySelector('.cb-color-enabled').addEventListener('change', function() {
    el.querySelector('.cb-color-color').disabled = !this.checked;
  });

  // Toggle provider carte : afficher/masquer adresse ou URL embed
  const providerSel = el.querySelector('.cb-map-provider');
  if (providerSel) {
    providerSel.addEventListener('change', function() {
      const isGoogle = this.value === 'google-embed';
      const addrWrap  = el.querySelector('.cb-map-address-wrap');
      const embedWrap = el.querySelector('.cb-map-embed-wrap');
      if (addrWrap)  addrWrap.style.display  = isGoogle ? 'none' : '';
      if (embedWrap) embedWrap.style.display = isGoogle ? '' : 'none';
    });
  }

  // Affichage conditionnel du color picker de bordure
  el.querySelector('.cb-border-width').addEventListener('change', function() {
    const wrap = el.querySelector('.cb-border-color-wrap');
    wrap.style.display = this.value === 'none' ? 'none' : '';
    updatePreview();
  });

  // Mise à jour preview + validation quand les selects changent
  el.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', () => {
      // Validation : col + colSpan - 1 <= 3
      const selCol = parseInt(el.querySelector('.cb-col').value);
      const selSpan = parseInt(el.querySelector('.cb-colspan').value);
      if (selCol + selSpan - 1 > 3) {
        // Ajuster la largeur automatiquement
        el.querySelector('.cb-colspan').value = 3 - selCol + 1;
      }
      _checkOverlaps();
      updatePreview();
    });
  });

  return el;
}

function updateDropHint() {
  const canvas = document.getElementById('layout-canvas');
  const hint = document.getElementById('canvas-drop-hint');
  if (!canvas || !hint) return;
  const hasBlocks = canvas.querySelectorAll('.canvas-block').length > 0;
  hint.style.display = hasBlocks ? 'none' : 'block';
}

function updatePreview() {
  const canvas = document.getElementById('layout-canvas');
  const preview = document.getElementById('layout-preview-grid');
  if (!canvas || !preview) return;

  const blocks = [...canvas.querySelectorAll('.canvas-block')];
  if (blocks.length === 0) {
    preview.innerHTML = '<div style="color:var(--text-muted);padding:1rem;text-align:center;">Ajoutez des blocs pour voir l\'apercu</div>';
    return;
  }

  preview.innerHTML = '';
  blocks.forEach(el => {
    const type = el.dataset.type;
    const row = parseInt(el.querySelector('.cb-row')?.value || 1);
    const col = parseInt(el.querySelector('.cb-col')?.value || 1);
    const colSpan = parseInt(el.querySelector('.cb-colspan')?.value || 1);
    const info = BLOCK_TYPES.find(bt => bt.type === type);

    const previewBlock = document.createElement('div');
    previewBlock.className = 'preview-block preview-block-' + type;
    previewBlock.style.gridRow = row;
    previewBlock.style.gridColumn = col + ' / span ' + colSpan;

    if (type === 'title') {
      const tag = el.querySelector('.cb-tag')?.value || 'h2';
      previewBlock.innerHTML = `<div class="preview-title ${tag}">Titre</div>`;
    } else if (type === 'richtext') {
      previewBlock.innerHTML = '<div class="preview-richtext"><div class="preview-line"></div><div class="preview-line" style="width:80%"></div><div class="preview-line" style="width:60%"></div></div>';
    } else if (type === 'image') {
      previewBlock.innerHTML = '<div class="preview-image">' + (info ? info.icon : '') + '</div>';
    } else if (type === 'carousel') {
      previewBlock.innerHTML = '<div class="preview-carousel"><span></span><span></span><span></span></div>';
    } else if (type === 'social-links') {
      previewBlock.innerHTML = '<div class="preview-social"><span class="preview-social-dot"></span><span class="preview-social-dot"></span><span class="preview-social-dot"></span></div>';
    } else if (type === 'map') {
      previewBlock.innerHTML = '<div class="preview-map">🗺</div>';
    }

    preview.appendChild(previewBlock);
  });

  _checkOverlaps();
}

function collectCanvasBlocks() {
  const canvas = document.getElementById('layout-canvas');
  if (!canvas) return [];
  return [...canvas.querySelectorAll('.canvas-block')].map(el => {
    const block = {
      blockId: el.dataset.blockId,
      type: el.dataset.type,
      row: parseInt(el.querySelector('.cb-row')?.value || 1),
      col: parseInt(el.querySelector('.cb-col')?.value || 1),
      colSpan: parseInt(el.querySelector('.cb-colspan')?.value || 1),
    };
    if (block.type === 'title') block.tag = el.querySelector('.cb-tag')?.value || 'h2';
    if (block.type === 'image') block.display = el.querySelector('.cb-display')?.value || 'column';
    if (block.type === 'social-links') {
      block.shape     = el.querySelector('.cb-social-shape')?.value     || 'round';
      block.direction = el.querySelector('.cb-social-direction')?.value || 'horizontal';
      block.size      = el.querySelector('.cb-social-size')?.value      || 'md';
    }
    if (block.type === 'map') {
      block.provider = el.querySelector('.cb-map-provider')?.value || 'leaflet';
      block.address  = el.querySelector('.cb-map-address')?.value  || '';
      block.embedUrl = el.querySelector('.cb-map-embed')?.value    || '';
      block.height   = el.querySelector('.cb-map-height')?.value   || '300';
    }

    // Style du bloc
    const bgEnabled    = el.querySelector('.cb-bg-enabled')?.checked;
    const colorEnabled = el.querySelector('.cb-color-enabled')?.checked;
    const borderWidth  = el.querySelector('.cb-border-width')?.value || 'none';
    const radius       = el.querySelector('.cb-border-radius')?.value || 'none';

    if (bgEnabled)            block.bg = el.querySelector('.cb-bg-color')?.value || '';
    if (colorEnabled)         block.color = el.querySelector('.cb-color-color')?.value || '';
    if (borderWidth !== 'none') {
      block.borderWidth = borderWidth;
      block.borderColor = el.querySelector('.cb-border-color')?.value || '';
    }
    if (radius !== 'none') block.borderRadius = radius;

    return block;
  });
}

async function saveLayout(isNew, existingId) {
  const label = document.getElementById('layout-edit-label').value.trim();
  const id = document.getElementById('layout-edit-id').value.trim();
  const msg = document.getElementById('layout-edit-message');
  const blocks = collectCanvasBlocks();

  if (!label || !id) {
    msg.className = 'form-message error';
    msg.textContent = 'Nom et ID requis';
    return;
  }
  if (blocks.length === 0) {
    msg.className = 'form-message error';
    msg.textContent = 'Ajoutez au moins un bloc';
    return;
  }
  if (_checkOverlaps()) {
    msg.className = 'form-message error';
    msg.textContent = 'Corrigez les chevauchements avant de sauvegarder';
    return;
  }

  try {
    const url = isNew ? '/api/admin/layouts' : '/api/admin/layouts/' + existingId;
    const method = isNew ? 'POST' : 'PUT';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, label, blocks })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erreur');
    msg.className = 'form-message success';
    msg.textContent = 'Layout enregistre ✓';
    setTimeout(() => {
      document.getElementById('layout-editor').style.display = 'none';
      document.getElementById('layout-editor').innerHTML = '';
      renderLayoutsSection();
    }, 800);
  } catch (err) {
    msg.className = 'form-message error';
    msg.textContent = err.message;
  }
}

// ============================================================
//  SECTION CAPTCHA
// ============================================================

const CAPTCHA_PROVIDERS = [
  { id: 'none',      label: 'Aucun captcha' },
  { id: 'turnstile', label: 'Cloudflare Turnstile (recommande)' },
  { id: 'recaptcha', label: 'Google reCAPTCHA v2' },
  { id: 'hcaptcha',  label: 'hCaptcha' },
];

const CAPTCHA_INSTRUCTIONS = {
  none:      { steps: [], link: null },
  turnstile: {
    label: 'Cloudflare Turnstile',
    steps: [
      '1. Allez sur dash.cloudflare.com → Turnstile',
      '2. Cliquez "Add site" et entrez votre domaine',
      '3. Copiez la "Site Key" dans le champ ci-dessous',
      '4. Copiez la "Secret Key" dans votre fichier .env → TURNSTILE_SECRET_KEY',
    ],
    link: 'https://dash.cloudflare.com/?to=/:account/turnstile',
  },
  recaptcha: {
    label: 'Google reCAPTCHA v2',
    steps: [
      '1. Allez sur google.com/recaptcha/admin',
      '2. Creez un nouveau site (type : "Checkbox")',
      '3. Copiez la "Site key" dans le champ ci-dessous',
      '4. Copiez la "Secret key" dans votre fichier .env → RECAPTCHA_SECRET_KEY',
    ],
    link: 'https://www.google.com/recaptcha/admin',
  },
  hcaptcha: {
    label: 'hCaptcha',
    steps: [
      '1. Creez un compte sur dashboard.hcaptcha.com',
      '2. Ajoutez votre site et copiez la "Site Key"',
      '3. Dans Account Settings, copiez la "Secret Key" dans .env → HCAPTCHA_SECRET_KEY',
    ],
    link: 'https://dashboard.hcaptcha.com',
  },
};

async function renderCaptchaSection() {
  let site = {};
  try { const r = await fetch('/api/site'); site = await r.json(); } catch {}

  const current = (site.captcha && site.captcha.provider) || 'none';
  const siteKey = (site.captcha && site.captcha.siteKey)  || '';

  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'captcha-section';

  section.innerHTML = `
    <div class="carousel-section-header">
      <div>
        <h2>Captcha</h2>
        <div class="carousel-info">Protection du formulaire de contact</div>
      </div>
      <button class="btn btn-success" id="btn-save-captcha">Enregistrer</button>
    </div>
    <div class="site-form" style="max-width:520px;">
      <div class="site-form-group">
        <h3 class="site-form-category">Provider</h3>
        <div class="form-group">
          <label>Service</label>
          <select id="captcha-provider">
            ${CAPTCHA_PROVIDERS.map(p =>
              `<option value="${p.id}" ${p.id === current ? 'selected' : ''}>${p.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group" id="captcha-sitekey-group" ${current === 'none' ? 'style="display:none"' : ''}>
          <label>Site Key <small>(cle publique, visible dans le HTML)</small></label>
          <input type="text" id="captcha-sitekey" value="${escJs(siteKey)}" placeholder="Votre site key">
        </div>
        <div class="captcha-instructions" id="captcha-instructions">
          ${buildCaptchaInstructions(current)}
        </div>
      </div>
    </div>
    <div id="captcha-message" class="form-message"></div>
  `;

  _insertSection(section, 'captcha-section', 'security-section');

  // Afficher/masquer les champs selon le provider
  document.getElementById('captcha-provider').addEventListener('change', e => {
    const val = e.target.value;
    document.getElementById('captcha-sitekey-group').style.display = val === 'none' ? 'none' : '';
    document.getElementById('captcha-instructions').innerHTML = buildCaptchaInstructions(val);
  });

  document.getElementById('btn-save-captcha').addEventListener('click', saveCaptchaConfig);
}

function buildCaptchaInstructions(provider) {
  const info = CAPTCHA_INSTRUCTIONS[provider];
  if (!info || !info.steps || info.steps.length === 0) return '';
  return `
    <div class="captcha-guide">
      <div class="captcha-guide-title">Comment configurer ${info.label} :</div>
      <ol class="captcha-guide-steps">
        ${info.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      ${info.link ? `<a href="${info.link}" target="_blank" rel="noopener" class="captcha-guide-link">Ouvrir le tableau de bord →</a>` : ''}
    </div>
  `;
}

async function saveCaptchaConfig() {
  const provider = document.getElementById('captcha-provider').value;
  const siteKey  = document.getElementById('captcha-sitekey')?.value.trim() || '';
  const msg      = document.getElementById('captcha-message');

  let site = {};
  try { const r = await fetch('/api/site'); site = await r.json(); } catch {}

  site.captcha = { provider, siteKey: provider !== 'none' ? siteKey : '' };

  try {
    const r = await fetch('/api/admin/site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site)
    });
    if (!r.ok) throw new Error();
    msg.className = 'form-message success';
    msg.textContent = 'Captcha mis a jour ✓ — Les pages doivent etre rechargees pour prendre effet.';
    setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 5000);
  } catch {
    msg.className = 'form-message error';
    msg.textContent = 'Erreur lors de la sauvegarde';
  }
}

// ============================================================
//  SECTION SÉCURITÉ
// ============================================================

async function renderSecuritySection() {
  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'security-section';

  section.innerHTML = `
    <div class="carousel-section-header">
      <div>
        <h2>Securite</h2>
        <div class="carousel-info">Changer le mot de passe du back office</div>
      </div>
    </div>
    <div class="site-form" style="max-width:420px;">
      <div class="site-form-group">
        <h3 class="site-form-category">Mot de passe</h3>
        <div class="form-group">
          <label>Mot de passe actuel</label>
          <input type="password" id="pwd-current" autocomplete="current-password">
        </div>
        <div class="form-group">
          <label>Nouveau mot de passe</label>
          <input type="password" id="pwd-new" autocomplete="new-password">
          <div class="pwd-strength-bar" id="pwd-strength-bar">
            <div class="pwd-strength-fill" id="pwd-strength-fill"></div>
          </div>
          <ul class="pwd-criteria" id="pwd-criteria">
            <li class="pwd-criterion" id="crit-length">8 caractères minimum</li>
            <li class="pwd-criterion" id="crit-upper">1 majuscule</li>
            <li class="pwd-criterion" id="crit-digit">1 chiffre</li>
            <li class="pwd-criterion" id="crit-special">1 caractère spécial (!@#$...)</li>
          </ul>
        </div>
        <div class="form-group">
          <label>Confirmer le nouveau mot de passe</label>
          <input type="password" id="pwd-confirm" autocomplete="new-password">
        </div>
        <div style="text-align:right;">
          <button class="btn btn-success" id="btn-save-password">Changer le mot de passe</button>
        </div>
        <div id="pwd-message" class="form-message"></div>
      </div>
    </div>
  `;

  _insertSection(section, 'security-section', 'pages-section');

  // Indicateur de force en temps réel
  function checkPwdCriteria(pwd) {
    return {
      length:  pwd.length >= 8,
      upper:   /[A-Z]/.test(pwd),
      digit:   /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };
  }

  document.getElementById('pwd-new').addEventListener('input', e => {
    const pwd    = e.target.value;
    const crit   = checkPwdCriteria(pwd);
    const score  = Object.values(crit).filter(Boolean).length;
    const fill   = document.getElementById('pwd-strength-fill');
    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
    const colors = ['', '#e53935', '#fb8c00', '#fdd835', '#43a047'];

    fill.style.width     = pwd.length ? `${score * 25}%` : '0';
    fill.style.background = colors[score] || '';
    fill.dataset.label   = pwd.length ? labels[score] : '';

    document.getElementById('crit-length').classList.toggle('ok',  crit.length);
    document.getElementById('crit-upper').classList.toggle('ok',   crit.upper);
    document.getElementById('crit-digit').classList.toggle('ok',   crit.digit);
    document.getElementById('crit-special').classList.toggle('ok', crit.special);
  });

  document.getElementById('btn-save-password').addEventListener('click', async () => {
    const current    = document.getElementById('pwd-current').value;
    const newPwd     = document.getElementById('pwd-new').value;
    const confirm    = document.getElementById('pwd-confirm').value;
    const msg        = document.getElementById('pwd-message');

    if (!current || !newPwd || !confirm) {
      msg.className = 'form-message error'; msg.textContent = 'Tous les champs sont requis'; return;
    }
    if (newPwd !== confirm) {
      msg.className = 'form-message error'; msg.textContent = 'Les mots de passe ne correspondent pas'; return;
    }
    const crit = checkPwdCriteria(newPwd);
    if (!crit.length)  { msg.className = 'form-message error'; msg.textContent = 'Minimum 8 caractères'; return; }
    if (!crit.upper)   { msg.className = 'form-message error'; msg.textContent = 'Au moins 1 majuscule requise'; return; }
    if (!crit.digit)   { msg.className = 'form-message error'; msg.textContent = 'Au moins 1 chiffre requis'; return; }
    if (!crit.special) { msg.className = 'form-message error'; msg.textContent = 'Au moins 1 caractère spécial requis'; return; }

    try {
      const r = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, newPassword: newPwd })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur');
      msg.className = 'form-message success';
      msg.textContent = 'Mot de passe mis a jour ✓';
      document.getElementById('pwd-current').value = '';
      document.getElementById('pwd-new').value     = '';
      document.getElementById('pwd-confirm').value = '';
      setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 4000);
    } catch (err) {
      msg.className = 'form-message error';
      msg.textContent = err.message;
    }
  });
}

// ============================================================
//  SECTION LOGO
// ============================================================

async function renderLogoSection() {
  let logoUrl = null;
  let logoMode = 'logo-only';
  let logoPosition = 'left';
  let faviconUrl = null;
  try { const r = await fetch('/api/logo'); logoUrl = (await r.json()).url; } catch {}
  try { const r = await fetch('/api/favicon'); faviconUrl = (await r.json()).url; } catch {}
  try {
    const siteData = await (await fetch('/api/site')).json();
    logoMode     = siteData.logoMode     || 'logo-only';
    logoPosition = siteData.logoPosition || 'left';
  } catch {}

  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'logo-section';

  const modes = [
    { value: 'logo-only', label: 'Logo seul' },
    { value: 'name-only', label: 'Nom seul' },
    { value: 'logo-name', label: 'Logo + Nom' },
  ];

  const positions = [
    { value: 'left',   label: '← Gauche' },
    { value: 'center', label: '⊙ Centre' },
    { value: 'right',  label: 'Droite →' },
  ];

  section.innerHTML = `
    <div class="carousel-section-header">
      <div>
        <h2>Logo</h2>
        <div class="carousel-info">Affiche dans le header et le footer</div>
      </div>
    </div>
    <div class="logo-upload-area">
      <div class="logo-mode-group">
        <label class="form-label">Mode d'affichage</label>
        <div class="logo-mode-radios">
          ${modes.map(m => `
            <label class="logo-mode-option${m.value === logoMode ? ' active' : ''}">
              <input type="radio" name="logo-mode" value="${m.value}" ${m.value === logoMode ? 'checked' : ''}>
              ${m.label}
            </label>
          `).join('')}
        </div>
        <div id="logo-mode-message" class="form-message"></div>
      </div>
      <div class="logo-mode-group">
        <label class="form-label">Position dans le header</label>
        <div class="logo-mode-radios">
          ${positions.map(p => `
            <label class="logo-mode-option${p.value === logoPosition ? ' active' : ''}">
              <input type="radio" name="logo-position" value="${p.value}" ${p.value === logoPosition ? 'checked' : ''}>
              ${p.label}
            </label>
          `).join('')}
        </div>
        <div id="logo-position-message" class="form-message"></div>
      </div>
      ${logoUrl
        ? `<div class="logo-preview">
             <img src="${logoUrl}" alt="Logo actuel" class="logo-preview-img">
             <button class="btn btn-danger btn-sm" id="btn-delete-logo">Supprimer</button>
           </div>`
        : `<p class="logo-placeholder">Aucun logo — le nom de l'entreprise s'affiche a la place.</p>`
      }
      <div class="logo-upload-row">
        <input type="file" id="logo-file-input" accept="image/jpeg,image/jpg,image/png,image/webp" style="display:none;">
        <label for="logo-file-input" class="btn btn-secondary" style="cursor:pointer;">
          ${logoUrl ? 'Remplacer le logo' : 'Uploader un logo'}
        </label>
        <span class="logo-hint">JPG, PNG ou WebP · recommande 200×80 px max</span>
      </div>
      <div id="logo-message" class="form-message"></div>

      <hr class="logo-separator">

      <div class="favicon-area">
        <div class="favicon-header">
          <h3>Favicon</h3>
          <div class="carousel-info">Icône affichée dans l'onglet du navigateur</div>
        </div>
        ${faviconUrl
          ? `<div class="favicon-preview">
               <img src="${faviconUrl}" alt="Favicon actuel" class="favicon-preview-img">
               <button class="btn btn-danger btn-sm" id="btn-delete-favicon">Supprimer</button>
             </div>`
          : `<p class="logo-placeholder">Aucun favicon — l'icone par defaut du navigateur s'affiche.</p>`
        }
        <div class="logo-upload-row">
          <input type="file" id="favicon-file-input" accept="image/x-icon,image/png,image/svg+xml,image/jpeg,image/webp,.ico" style="display:none;">
          <label for="favicon-file-input" class="btn btn-secondary" style="cursor:pointer;">
            ${faviconUrl ? 'Remplacer le favicon' : 'Uploader un favicon'}
          </label>
          <span class="logo-hint">ICO, PNG ou SVG · recommande 32×32 px</span>
        </div>
        <div id="favicon-message" class="form-message"></div>
      </div>
    </div>
  `;

  _insertSection(section, 'logo-section', 'theme-section');

  // Changement de position du logo
  section.querySelectorAll('input[name="logo-position"]').forEach(radio => {
    radio.addEventListener('change', async () => {
      const msg = document.getElementById('logo-position-message');
      section.querySelectorAll('.logo-mode-option').forEach(el => {
        if (el.querySelector('input[name="logo-position"]')) el.classList.remove('active');
      });
      radio.closest('.logo-mode-option').classList.add('active');
      try {
        const r = await fetch('/api/admin/logo-position', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: radio.value }),
        });
        if (!r.ok) throw new Error();
        msg.className = 'form-message success';
        msg.textContent = 'Position mise a jour ✓';
        setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 2000);
      } catch {
        msg.className = 'form-message error';
        msg.textContent = 'Erreur sauvegarde';
      }
    });
  });

  // Changement de mode d'affichage du logo
  section.querySelectorAll('input[name="logo-mode"]').forEach(radio => {
    radio.addEventListener('change', async () => {
      const msg = document.getElementById('logo-mode-message');
      // Mise à jour visuelle des labels
      section.querySelectorAll('.logo-mode-option').forEach(el => el.classList.remove('active'));
      radio.closest('.logo-mode-option').classList.add('active');
      try {
        const r = await fetch('/api/admin/logo-mode', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: radio.value }),
        });
        if (!r.ok) throw new Error();
        msg.className = 'form-message success';
        msg.textContent = 'Mode mis a jour ✓';
        setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 2000);
      } catch {
        msg.className = 'form-message error';
        msg.textContent = 'Erreur sauvegarde';
      }
    });
  });

  document.getElementById('logo-file-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const msg = document.getElementById('logo-message');
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const r = await fetch('/api/admin/logo', { method: 'POST', body: formData });
      if (!r.ok) throw new Error((await r.json()).error || 'Erreur');
      msg.className = 'form-message success';
      msg.textContent = 'Logo mis a jour ✓';
      setTimeout(() => renderLogoSection(), 800);
    } catch (err) {
      msg.className = 'form-message error';
      msg.textContent = err.message;
    }
    e.target.value = '';
  });

  document.getElementById('btn-delete-logo')?.addEventListener('click', async () => {
    if (!confirm('Supprimer le logo ?')) return;
    const msg = document.getElementById('logo-message');
    try {
      const r = await fetch('/api/admin/logo', { method: 'DELETE' });
      if (!r.ok) throw new Error();
      msg.className = 'form-message success';
      msg.textContent = 'Logo supprime ✓';
      setTimeout(() => renderLogoSection(), 800);
    } catch {
      msg.className = 'form-message error';
      msg.textContent = 'Erreur lors de la suppression';
    }
  });

  // Upload favicon
  document.getElementById('favicon-file-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const msg = document.getElementById('favicon-message');
    const formData = new FormData();
    formData.append('favicon', file);
    try {
      const r = await fetch('/api/admin/favicon', { method: 'POST', body: formData });
      if (!r.ok) throw new Error((await r.json()).error || 'Erreur');
      msg.className = 'form-message success';
      msg.textContent = 'Favicon mis a jour ✓';
      setTimeout(() => renderLogoSection(), 800);
    } catch (err) {
      msg.className = 'form-message error';
      msg.textContent = err.message;
    }
    e.target.value = '';
  });

  // Suppression favicon
  document.getElementById('btn-delete-favicon')?.addEventListener('click', async () => {
    if (!confirm('Supprimer le favicon ?')) return;
    const msg = document.getElementById('favicon-message');
    try {
      const r = await fetch('/api/admin/favicon', { method: 'DELETE' });
      if (!r.ok) throw new Error();
      msg.className = 'form-message success';
      msg.textContent = 'Favicon supprime ✓';
      setTimeout(() => renderLogoSection(), 800);
    } catch {
      msg.className = 'form-message error';
      msg.textContent = 'Erreur lors de la suppression';
    }
  });
}

// ============================================================
//  MODALE D'AIDE CONTEXTUELLE
// ============================================================

const HELP_TEXTS = {
  slug: {
    title: 'Slug (URL de la page)',
    html: `<p>Le slug est la partie de l'URL après le domaine.</p>
           <p><strong>Exemples :</strong><br>
           <code>/nos-realisations</code> → <em>monsite.fr/nos-realisations</em><br>
           <code>/</code> → page d'accueil</p>
           <p>Règles : minuscules, tirets, pas d'espaces ni d'accents.</p>`
  },
  carouselId: {
    title: 'Identifiant du carousel (carousel ID)',
    html: `<p>Nom du dossier où seront stockées les images de cette section.</p>
           <p><strong>Exemples :</strong> <code>hero</code>, <code>gallery</code>, <code>travaux-maconnerie</code></p>
           <p>Règles : minuscules, tirets, pas d'espaces. Un nouveau dossier est créé automatiquement.</p>`
  },
  seoTitle: {
    title: 'Titre SEO',
    html: `<p>Titre affiché dans les résultats Google et dans l'onglet du navigateur.</p>
           <p><strong>Conseil :</strong> 50-60 caractères max. Ex : <em>"Nos Réalisations | Rénovation Alpine"</em></p>
           <p>Si vide, le titre par défaut du site est utilisé.</p>`
  },
  seoDescription: {
    title: 'Description SEO',
    html: `<p>Texte affiché sous le titre dans les résultats Google.</p>
           <p><strong>Conseil :</strong> 120-160 caractères. Décris le contenu de la page en 1-2 phrases.</p>
           <p>Si vide, la description par défaut du site est utilisée.</p>`
  },
  langs: {
    title: 'Codes de langue (ISO 639-1)',
    html: `<p>Codes à 2 lettres séparés par des virgules.</p>
           <p><strong>Exemples :</strong> <code>fr</code>, <code>en</code>, <code>de</code>, <code>it</code></p>
           <p>La première langue de la liste est utilisée par défaut si "Langue par défaut" n'est pas renseignée.</p>`
  },
  layoutId: {
    title: 'ID du layout',
    html: `<p>Identifiant unique du layout. Généré automatiquement depuis le nom.</p>
           <p><strong>Règles :</strong> minuscules, chiffres, tirets. Ne peut pas être modifié après création.</p>
           <p>Cet ID est utilisé comme clé dans <code>layouts.json</code> et référencé par les pages.</p>`
  }
};

function showHelpModal(title, html) {
  let modal = document.getElementById('help-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:480px;">
        <div class="help-modal-header">
          <h3 id="help-modal-title"></h3>
          <button class="help-modal-close" id="help-modal-close">✕</button>
        </div>
        <div class="help-modal-body" id="help-modal-body"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    document.getElementById('help-modal-close').addEventListener('click', () => modal.style.display = 'none');
  }
  document.getElementById('help-modal-title').textContent = title;
  document.getElementById('help-modal-body').innerHTML = html;
  modal.style.display = 'flex';
}

// Listener délégué pour les boutons ⓘ dans tout le backoffice
document.addEventListener('click', e => {
  const btn = e.target.closest('.help-btn');
  if (!btn) return;
  const key = btn.dataset.help;
  if (HELP_TEXTS[key]) showHelpModal(HELP_TEXTS[key].title, HELP_TEXTS[key].html);
});

// ============================================================
//  SECTION IDENTITÉ DU SITE
// ============================================================

async function renderSiteSection() {
  let site = {};
  try {
    const r = await fetch('/api/site');
    site = await r.json();
  } catch {}

  const b = site.business || {};
  const h = b.hours    || {};
  const l = b.legal    || {};

  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'site-section';

  section.innerHTML = `
    <div class="carousel-section-header">
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <button class="btn-collapse" id="btn-collapse-site" title="Réduire/Agrandir">▼</button>
        <div>
          <h2>Identite du site</h2>
          <div class="carousel-info">Informations affichees dans le header, footer et emails</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <div id="site-message-top" class="form-message"></div>
        <button class="btn btn-success" id="btn-save-site-top">Enregistrer</button>
      </div>
    </div>

    <div id="site-form-body">
      <div class="site-form">
        <div class="site-form-group">
          <h3 class="site-form-category">Identite</h3>
          <div class="form-row-2">
            <div class="form-group">
              <label>Nom de l'entreprise</label>
              <input type="text" id="site-name" value="${escJs(b.name)}">
            </div>
            <div class="form-group">
              <label>Slogan</label>
              <input type="text" id="site-tagline" value="${escJs(b.tagline)}">
            </div>
          </div>
          <div class="form-group">
            <label>Description courte</label>
            <input type="text" id="site-description" value="${escJs(b.description)}">
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;align-items:center;gap:0.8rem;margin-top:1rem;">
        <div id="site-message-bottom" class="form-message"></div>
        <button class="btn btn-success" id="btn-save-site-bottom">Enregistrer</button>
      </div>
    </div>
  `;

  const existing  = document.getElementById('site-section');
  const container = document.getElementById('container-identity');
  if (existing) {
    existing.replaceWith(section);
  } else {
    container.appendChild(section);
  }

  // Collapse/expand
  document.getElementById('btn-collapse-site').addEventListener('click', () => {
    const body = document.getElementById('site-form-body');
    const btn  = document.getElementById('btn-collapse-site');
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    btn.textContent   = collapsed ? '▼' : '▶';
  });

  document.getElementById('btn-save-site-top').addEventListener('click', () => saveSiteConfig('top'));
  document.getElementById('btn-save-site-bottom').addEventListener('click', () => saveSiteConfig('bottom'));
}

// Échappe les valeurs pour les attributs HTML value=""
function escJs(val) {
  if (!val) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function saveSiteConfig(origin = 'top') {
  const msg = document.getElementById(`site-message-${origin}`);
  const btn = document.getElementById(`btn-save-site-${origin}`);

  let existing = {};
  try { const r = await fetch('/api/site'); existing = await r.json(); } catch {}

  const updated = {
    ...existing,
    business: {
      ...existing.business,
      name:        document.getElementById('site-name').value.trim(),
      tagline:     document.getElementById('site-tagline').value.trim(),
      description: document.getElementById('site-description').value.trim(),
    },
  };

  btn.disabled = true;
  try {
    const r = await fetch('/api/admin/site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (!r.ok) throw new Error();
    msg.className = 'form-message success';
    msg.textContent = 'Informations enregistrees ✓';
  } catch {
    msg.className = 'form-message error';
    msg.textContent = 'Erreur lors de la sauvegarde';
  } finally {
    btn.disabled = false;
    setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 3000);
  }
}

// ============================================================
//  SECTION RÉSEAUX SOCIAUX
// ============================================================

const SOCIAL_NETWORKS = [
  { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/...' },
  { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'x',         label: 'X (Twitter)', placeholder: 'https://x.com/...' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@...' },
  { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@...' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/...' },
  { key: 'github',    label: 'GitHub',    placeholder: 'https://github.com/...' },
];

async function renderSocialSection() {
  let site = {};
  try { const r = await fetch('/api/site'); site = await r.json(); } catch {}

  const social = site.social || {};

  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'social-section';

  section.innerHTML = `
    <div class="carousel-section-header">
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <button class="btn-collapse" id="btn-collapse-social" title="Réduire/Agrandir">▶</button>
        <div>
          <h2>Réseaux sociaux</h2>
          <div class="carousel-info">URLs utilisées dans les widgets réseaux sociaux (laisser vide = réseau masqué)</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <div id="social-message" class="form-message"></div>
        <button class="btn btn-success" id="btn-save-social">Enregistrer</button>
      </div>
    </div>
    <div id="social-form-body" style="display:none;">
      <div class="site-form">
        <div class="site-form-group">
          <div class="social-inputs-grid">
            ${SOCIAL_NETWORKS.map(n => `
              <div class="form-group">
                <label>${escJs(n.label)}</label>
                <input type="url" id="social-${n.key}" value="${escJs(social[n.key] || '')}" placeholder="${escJs(n.placeholder)}">
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  const existing  = document.getElementById('social-section');
  const container = document.getElementById('container-identity');
  if (existing) {
    existing.replaceWith(section);
  } else {
    // Insérer après site-section
    const siteSection = document.getElementById('site-section');
    if (siteSection && siteSection.parentNode === container) {
      siteSection.after(section);
    } else {
      container.appendChild(section);
    }
  }

  document.getElementById('btn-collapse-social').addEventListener('click', () => {
    const body = document.getElementById('social-form-body');
    const btn  = document.getElementById('btn-collapse-social');
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    btn.textContent   = collapsed ? '▼' : '▶';
  });

  document.getElementById('btn-save-social').addEventListener('click', saveSocialConfig);
}

async function saveSocialConfig() {
  const msg = document.getElementById('social-message');
  const btn = document.getElementById('btn-save-social');

  let existing = {};
  try { const r = await fetch('/api/site'); existing = await r.json(); } catch {}

  const socialData = {};
  SOCIAL_NETWORKS.forEach(n => {
    socialData[n.key] = document.getElementById('social-' + n.key)?.value.trim() || '';
  });

  const updated = { ...existing, social: socialData };

  btn.disabled = true;
  try {
    const r = await fetch('/api/admin/site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!r.ok) throw new Error();
    msg.className = 'form-message success';
    msg.textContent = 'Réseaux sociaux enregistrés ✓';
  } catch {
    msg.className = 'form-message error';
    msg.textContent = 'Erreur lors de la sauvegarde';
  } finally {
    btn.disabled = false;
    setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 3000);
  }
}

// ============================================================
//  SECTION FOOTER (layout editor configurable)
// ============================================================

const FOOTER_BLOCK_TYPES = [
  { type: 'logo-desc', label: 'Logo + Description', icon: '🏠' },
  { type: 'contact',   label: 'Contact',            icon: '📞' },
  { type: 'hours',     label: 'Horaires',           icon: '🕐' },
  { type: 'legal',     label: 'Mentions légales',   icon: '⚖' },
  { type: 'richtext',  label: 'Texte libre',        icon: '¶' },
  { type: 'social-links', label: 'Réseaux sociaux', icon: '◉' },
  { type: 'map',       label: 'Carte',              icon: '🗺' },
];

let _footerBlockCounter = 0;

async function renderFooterSection() {
  let site = {};
  try { const r = await fetch('/api/site'); site = await r.json(); } catch {}

  const b = site.business || {};
  const h = b.hours || {};
  const l = b.legal || {};
  const footer = site.footer || { cols: 3, blocks: [] };

  _footerBlockCounter = (footer.blocks || []).length;

  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'footer-section';

  section.innerHTML = `
    <div class="carousel-section-header">
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <button class="btn-collapse" id="btn-collapse-footer" title="Réduire/Agrandir">▼</button>
        <div>
          <h2>Footer</h2>
          <div class="carousel-info">Layout en grille + données contact / horaires / mentions légales</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <div id="footer-message-top" class="form-message"></div>
        <button class="btn btn-success" id="btn-save-footer-top">Enregistrer</button>
      </div>
    </div>

    <div id="footer-form-body">

      <!-- ── Layout grille ── -->
      <div class="site-form-group" style="margin-top:1rem;">
        <h3 class="site-form-category" style="margin-top:0;">Layout du footer</h3>
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
          <label style="display:flex;align-items:center;gap:0.5rem;font-weight:600;">
            Colonnes :
            <select id="footer-cols" style="width:70px;">
              ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${footer.cols === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </label>
          <div style="position:relative;">
            <button class="btn btn-secondary btn-sm" id="btn-add-footer-block">+ Ajouter un bloc ▾</button>
            <div id="footer-block-dropdown" class="footer-block-dropdown" style="display:none;">
              ${FOOTER_BLOCK_TYPES.map(bt => `
                <div class="footer-block-option" data-type="${bt.type}">${bt.icon} ${bt.label}</div>
              `).join('')}
            </div>
          </div>
        </div>
        <div id="footer-blocks-list"></div>
      </div>

      <!-- ── Données business ── -->
      <div class="site-form">
        <div class="site-form-group">
          <h3 class="site-form-category">Contact</h3>
          <div class="form-row-2">
            <div class="form-group">
              <label>Telephone</label>
              <input type="text" id="site-phone" value="${escJs(b.phone)}">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="site-email" value="${escJs(b.email)}">
            </div>
          </div>
          <div class="form-group">
            <label>Adresse / Zone d'intervention</label>
            <input type="text" id="site-address" value="${escJs(b.address)}">
          </div>
        </div>

        <div class="site-form-group">
          <h3 class="site-form-category">Horaires</h3>
          <div class="form-row-2">
            <div class="form-group">
              <label>Semaine</label>
              <input type="text" id="site-hours-weekdays" value="${escJs(h.weekdays)}">
            </div>
            <div class="form-group">
              <label>Samedi</label>
              <input type="text" id="site-hours-saturday" value="${escJs(h.saturday)}">
            </div>
          </div>
          <div class="form-group">
            <label>Note complementaire</label>
            <input type="text" id="site-hours-note" value="${escJs(h.note)}">
          </div>
        </div>

        <div class="site-form-group">
          <h3 class="site-form-category">Mentions legales</h3>
          <div class="form-row-2">
            <div class="form-group">
              <label>SIRET</label>
              <input type="text" id="site-siret" value="${escJs(l.siret)}">
            </div>
            <div class="form-group">
              <label>Certifications</label>
              <input type="text" id="site-certifications" value="${escJs(l.certifications)}">
            </div>
          </div>
          <div class="form-group">
            <label>Copyright</label>
            <input type="text" id="site-copyright" value="${escJs(l.copyright)}">
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;align-items:center;gap:0.8rem;margin-top:1rem;">
        <div id="footer-message-bottom" class="form-message"></div>
        <button class="btn btn-success" id="btn-save-footer-bottom">Enregistrer</button>
      </div>
    </div>
  `;

  _insertSection(section, 'footer-section', 'site-section');

  // Remplir la liste de blocs existants
  const list = document.getElementById('footer-blocks-list');
  (footer.blocks || []).forEach(b => list.appendChild(createFooterBlockRow(b)));

  // Collapse/expand
  document.getElementById('btn-collapse-footer').addEventListener('click', () => {
    const body = document.getElementById('footer-form-body');
    const btn  = document.getElementById('btn-collapse-footer');
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    btn.textContent   = collapsed ? '▼' : '▶';
  });

  // Dropdown "Ajouter un bloc"
  const addBtn = document.getElementById('btn-add-footer-block');
  const dropdown = document.getElementById('footer-block-dropdown');
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? '' : 'none';
  });
  document.addEventListener('click', () => { dropdown.style.display = 'none'; });
  dropdown.querySelectorAll('.footer-block-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const type = opt.dataset.type;
      const cols = parseInt(document.getElementById('footer-cols')?.value || 3);
      const newBlock = {
        blockId: 'f' + (++_footerBlockCounter),
        type,
        row: 1, col: 1, colSpan: 1,
      };
      if (type === 'social-links') { newBlock.shape = 'round'; newBlock.direction = 'horizontal'; newBlock.size = 'md'; }
      if (type === 'map') { newBlock.provider = 'leaflet'; newBlock.height = '300'; }
      list.appendChild(createFooterBlockRow(newBlock));
      dropdown.style.display = 'none';
    });
  });

  document.getElementById('btn-save-footer-top').addEventListener('click', () => saveFooterConfig('top'));
  document.getElementById('btn-save-footer-bottom').addEventListener('click', () => saveFooterConfig('bottom'));
}

function createFooterBlockRow(block) {
  const info = FOOTER_BLOCK_TYPES.find(bt => bt.type === block.type);
  const row = block.row || 1;
  const col = block.col || 1;
  const colSpan = block.colSpan || 1;

  let typeOptions = '';
  if (block.type === 'social-links') {
    const shape = block.shape || 'round';
    const direction = block.direction || 'horizontal';
    const size = block.size || 'md';
    typeOptions = `
      <label class="canvas-block-opt">Forme
        <select class="fb-social-shape">
          <option value="round"   ${shape === 'round'   ? 'selected' : ''}>Rond</option>
          <option value="square"  ${shape === 'square'  ? 'selected' : ''}>Carré</option>
          <option value="rounded" ${shape === 'rounded' ? 'selected' : ''}>Arrondi</option>
        </select>
      </label>
      <label class="canvas-block-opt">Direction
        <select class="fb-social-direction">
          <option value="horizontal" ${direction === 'horizontal' ? 'selected' : ''}>Horizontal</option>
          <option value="vertical"   ${direction === 'vertical'   ? 'selected' : ''}>Vertical</option>
        </select>
      </label>
      <label class="canvas-block-opt">Taille
        <select class="fb-social-size">
          <option value="sm" ${size === 'sm' ? 'selected' : ''}>Petit</option>
          <option value="md" ${size === 'md' ? 'selected' : ''}>Moyen</option>
          <option value="lg" ${size === 'lg' ? 'selected' : ''}>Grand</option>
        </select>
      </label>`;
  }
  if (block.type === 'map') {
    const provider = block.provider || 'leaflet';
    const address = block.address || '';
    const embedUrl = block.embedUrl || '';
    const height = block.height || '300';
    typeOptions = `
      <label class="canvas-block-opt">Fournisseur
        <select class="fb-map-provider">
          <option value="leaflet"      ${provider === 'leaflet'      ? 'selected' : ''}>OpenStreetMap</option>
          <option value="google-embed" ${provider === 'google-embed' ? 'selected' : ''}>Google Maps</option>
        </select>
      </label>
      <label class="canvas-block-opt fb-map-address-wrap" style="${provider === 'google-embed' ? 'display:none' : ''}">Adresse
        <input type="text" class="fb-map-address" value="${escJs(address)}" placeholder="Adresse...">
      </label>
      <label class="canvas-block-opt fb-map-embed-wrap" style="${provider !== 'google-embed' ? 'display:none' : ''}">URL embed
        <input type="text" class="fb-map-embed" value="${escJs(embedUrl)}" placeholder="https://...">
      </label>
      <label class="canvas-block-opt">Hauteur
        <select class="fb-map-height">
          <option value="200" ${height === '200' ? 'selected' : ''}>200px</option>
          <option value="300" ${height === '300' ? 'selected' : ''}>300px</option>
          <option value="400" ${height === '400' ? 'selected' : ''}>400px</option>
        </select>
      </label>`;
  }

  const el = document.createElement('div');
  el.className = 'footer-block-row';
  el.dataset.blockId = block.blockId;
  el.dataset.type = block.type;
  el.innerHTML = `
    <div class="footer-block-row-header">
      <span class="footer-block-type-badge">${info ? info.icon + ' ' + info.label : block.type}</span>
      <div class="canvas-block-options" style="flex:1;">
        <label class="canvas-block-opt">Ligne
          <select class="fb-row">
            ${[1,2,3,4,5,6,7,8].map(r => `<option value="${r}" ${r === row ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </label>
        <label class="canvas-block-opt">Colonne
          <select class="fb-col">
            ${[1,2,3,4,5,6].map(c => `<option value="${c}" ${c === col ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </label>
        <label class="canvas-block-opt">Largeur
          <select class="fb-colspan">
            ${[1,2,3,4,5,6].map(c => `<option value="${c}" ${c === colSpan ? 'selected' : ''}>${c} col</option>`).join('')}
          </select>
        </label>
        ${typeOptions}
      </div>
      <button class="btn-section-remove fb-block-remove" title="Supprimer ce bloc">×</button>
    </div>
  `;

  el.querySelector('.fb-block-remove').addEventListener('click', () => el.remove());

  // Toggle provider carte
  const provSel = el.querySelector('.fb-map-provider');
  if (provSel) {
    provSel.addEventListener('change', function() {
      const isGoogle = this.value === 'google-embed';
      const addrW  = el.querySelector('.fb-map-address-wrap');
      const embedW = el.querySelector('.fb-map-embed-wrap');
      if (addrW)  addrW.style.display  = isGoogle ? 'none' : '';
      if (embedW) embedW.style.display = isGoogle ? '' : 'none';
    });
  }

  return el;
}

function collectFooterBlocks() {
  const list = document.getElementById('footer-blocks-list');
  if (!list) return [];
  return [...list.querySelectorAll('.footer-block-row')].map(el => {
    const block = {
      blockId: el.dataset.blockId,
      type:    el.dataset.type,
      row:     parseInt(el.querySelector('.fb-row')?.value    || 1),
      col:     parseInt(el.querySelector('.fb-col')?.value    || 1),
      colSpan: parseInt(el.querySelector('.fb-colspan')?.value || 1),
    };
    if (block.type === 'social-links') {
      block.shape     = el.querySelector('.fb-social-shape')?.value     || 'round';
      block.direction = el.querySelector('.fb-social-direction')?.value || 'horizontal';
      block.size      = el.querySelector('.fb-social-size')?.value      || 'md';
    }
    if (block.type === 'map') {
      block.provider = el.querySelector('.fb-map-provider')?.value || 'leaflet';
      block.address  = el.querySelector('.fb-map-address')?.value  || '';
      block.embedUrl = el.querySelector('.fb-map-embed')?.value    || '';
      block.height   = el.querySelector('.fb-map-height')?.value   || '300';
    }
    return block;
  });
}

async function saveFooterConfig(origin = 'top') {
  const msg = document.getElementById(`footer-message-${origin}`);
  const btn = document.getElementById(`btn-save-footer-${origin}`);

  let existing = {};
  try { const r = await fetch('/api/site'); existing = await r.json(); } catch {}

  const cols = parseInt(document.getElementById('footer-cols')?.value || 3);
  const blocks = collectFooterBlocks();

  const updated = {
    ...existing,
    footer: { cols, blocks },
    business: {
      ...existing.business,
      phone:   document.getElementById('site-phone').value.trim(),
      email:   document.getElementById('site-email').value.trim(),
      address: document.getElementById('site-address').value.trim(),
      hours: {
        weekdays: document.getElementById('site-hours-weekdays').value.trim(),
        saturday: document.getElementById('site-hours-saturday').value.trim(),
        note:     document.getElementById('site-hours-note').value.trim(),
      },
      legal: {
        siret:          document.getElementById('site-siret').value.trim(),
        certifications: document.getElementById('site-certifications').value.trim(),
        copyright:      document.getElementById('site-copyright').value.trim(),
      },
    },
  };

  btn.disabled = true;
  try {
    const r = await fetch('/api/admin/site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!r.ok) throw new Error();
    msg.className = 'form-message success';
    msg.textContent = 'Footer enregistré ✓';
  } catch {
    msg.className = 'form-message error';
    msg.textContent = 'Erreur lors de la sauvegarde';
  } finally {
    btn.disabled = false;
    setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 3000);
  }
}

async function renderConfigSection() {
  let site = {};
  try { const r = await fetch('/api/site'); site = await r.json(); } catch {}

  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'config-section';

  section.innerHTML = `
    <div class="carousel-section-header">
      <div>
        <h2>Langues</h2>
        <div class="carousel-info">Langues disponibles sur le site et langue par défaut</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <div id="config-message-top" class="form-message"></div>
        <button class="btn btn-success" id="btn-save-config-top">Enregistrer</button>
      </div>
    </div>

    <div class="site-form" style="margin-top:0;">
      <div class="site-form-group">
        <h3 class="site-form-category">Langues</h3>
        <div class="form-row-2">
          <div class="form-group">
            <label>Langues disponibles <small>(codes ISO séparés par virgule : fr,en,de)</small> <button class="help-btn" data-help="langs">ⓘ</button></label>
            <input type="text" id="site-langs-available" value="${escJs(((site.languages && site.languages.available) || ['fr']).join(','))}">
          </div>
          <div class="form-group">
            <label>Langue par défaut</label>
            <input type="text" id="site-langs-default" value="${escJs((site.languages && site.languages.default) || 'fr')}" maxlength="5">
          </div>
        </div>
      </div>
    </div>
  `;

  _insertSection(section, 'config-section', null);

  document.getElementById('btn-save-config-top').addEventListener('click', () => saveLangsConfig());
}

async function saveLangsConfig() {
  const msg = document.getElementById('config-message-top');
  const btn = document.getElementById('btn-save-config-top');

  let existing = {};
  try { const r = await fetch('/api/site'); existing = await r.json(); } catch {}

  const langsAvailable = document.getElementById('site-langs-available').value
    .split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
  const langsDefault = document.getElementById('site-langs-default').value.trim().toLowerCase() || 'fr';

  const updated = {
    ...existing,
    languages: {
      available: langsAvailable.length > 0 ? langsAvailable : ['fr'],
      default:   langsDefault,
    },
  };

  btn.disabled = true;
  try {
    const r = await fetch('/api/admin/site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (!r.ok) throw new Error();
    msg.className = 'form-message success';
    msg.textContent = 'Langues enregistrees ✓';
  } catch {
    msg.className = 'form-message error';
    msg.textContent = 'Erreur lors de la sauvegarde';
  } finally {
    btn.disabled = false;
    setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 3000);
  }
}

// ============================================================
//  SECTION DESIGN BORDURES
// ============================================================

async function renderBorderSection() {
  let site = {};
  try { const r = await fetch('/api/site'); site = await r.json(); } catch {}

  const current = (site.design && site.design.borderStyle) || 'angular';
  const savedCr  = (site.design && site.design.customRadius) || { tl: 8, tr: 8, br: 8, bl: 8 };

  const STYLES = [
    { id: 'angular',  label: 'Angulaire',    radius: '0',    clip: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)' },
    { id: 'flat',     label: 'Flat',         radius: '0',    clip: 'none' },
    { id: 'rounded',  label: 'Arrondi',      radius: '8px',  clip: 'none' },
    { id: 'pill',     label: 'Pilule',       radius: '24px', clip: 'none' },
    { id: 'custom',   label: 'Personnalisé', radius: null,   clip: 'none' },
  ];

  const section = document.createElement('div');
  section.className = 'carousel-section';
  section.id = 'border-section';

  const previewCards = STYLES.map(s => {
    const r = s.radius !== null ? s.radius : `${savedCr.tl}px ${savedCr.tr}px ${savedCr.br}px ${savedCr.bl}px`;
    return `
      <div class="border-preview-card ${s.id === current ? 'active' : ''}" data-style="${s.id}" title="${s.label}">
        <div class="border-preview-demo" style="border-radius:${r};clip-path:${s.clip}">Aa</div>
        <div class="border-preview-label">${s.label}</div>
      </div>`;
  }).join('');

  section.innerHTML = `
    <div class="carousel-section-header">
      <div>
        <h2>Design — Bordures</h2>
        <p class="carousel-subtitle">Style des boutons, cards et champs de formulaire</p>
      </div>
    </div>
    <div class="border-preview-grid">${previewCards}</div>

    <div id="border-custom-editor" class="border-custom-editor" style="display:${current === 'custom' ? 'block' : 'none'}">
      <div class="border-custom-preview-wrap">
        <div id="border-custom-preview" class="border-custom-preview" style="border-radius:${savedCr.tl}px ${savedCr.tr}px ${savedCr.br}px ${savedCr.bl}px">Aperçu</div>
      </div>
      <div class="border-lock-row">
        <input type="checkbox" id="border-lock">
        <label for="border-lock">Verrouiller tous les coins</label>
      </div>
      <div class="border-corners-grid">
        <div class="border-corner">
          <label>↖ Haut gauche</label>
          <div class="border-corner-input-row">
            <input type="range" min="0" max="48" value="${savedCr.tl}" id="border-tl">
            <span class="border-corner-val" id="border-tl-val">${savedCr.tl}px</span>
          </div>
        </div>
        <div class="border-corner">
          <label>↗ Haut droit</label>
          <div class="border-corner-input-row">
            <input type="range" min="0" max="48" value="${savedCr.tr}" id="border-tr">
            <span class="border-corner-val" id="border-tr-val">${savedCr.tr}px</span>
          </div>
        </div>
        <div class="border-corner">
          <label>↙ Bas gauche</label>
          <div class="border-corner-input-row">
            <input type="range" min="0" max="48" value="${savedCr.bl}" id="border-bl">
            <span class="border-corner-val" id="border-bl-val">${savedCr.bl}px</span>
          </div>
        </div>
        <div class="border-corner">
          <label>↘ Bas droit</label>
          <div class="border-corner-input-row">
            <input type="range" min="0" max="48" value="${savedCr.br}" id="border-br">
            <span class="border-corner-val" id="border-br-val">${savedCr.br}px</span>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" id="border-custom-save" style="font-size:0.85rem;padding:0.6rem 1.5rem">Enregistrer</button>
    </div>

    <div id="border-msg" class="form-message"></div>
  `;

  _insertSection(section, 'border-section', 'captcha-section');

  // ── Helpers ──
  function getCornerValues() {
    return {
      tl: parseInt(document.getElementById('border-tl').value),
      tr: parseInt(document.getElementById('border-tr').value),
      br: parseInt(document.getElementById('border-br').value),
      bl: parseInt(document.getElementById('border-bl').value),
    };
  }

  function updatePreview() {
    const cr = getCornerValues();
    const val = `${cr.tl}px ${cr.tr}px ${cr.br}px ${cr.bl}px`;
    document.getElementById('border-custom-preview').style.borderRadius = val;
    document.documentElement.style.setProperty('--radius', val);
    document.getElementById('border-tl-val').textContent = cr.tl + 'px';
    document.getElementById('border-tr-val').textContent = cr.tr + 'px';
    document.getElementById('border-br-val').textContent = cr.br + 'px';
    document.getElementById('border-bl-val').textContent = cr.bl + 'px';
  }

  async function saveStyle(style, customRadius) {
    const msg = document.getElementById('border-msg');
    try {
      const r = await fetch('/api/site');
      const siteData = await r.json();
      siteData.design = siteData.design || {};
      siteData.design.borderStyle = style;
      if (customRadius) siteData.design.customRadius = customRadius;
      const res = await fetch('/api/admin/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      });
      if (!res.ok) throw new Error();
      msg.className = 'form-message success';
      msg.textContent = 'Style sauvegardé.';
      setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 3000);
    } catch {
      msg.className = 'form-message error';
      msg.textContent = 'Erreur lors de la sauvegarde';
    }
  }

  // ── Preset cards ──
  section.querySelectorAll('.border-preview-card').forEach(card => {
    card.addEventListener('click', async () => {
      const style = card.dataset.style;
      section.querySelectorAll('.border-preview-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      document.documentElement.setAttribute('data-border', style);

      const editor = document.getElementById('border-custom-editor');
      if (style === 'custom') {
        editor.style.display = 'block';
        updatePreview();
      } else {
        editor.style.display = 'none';
        document.documentElement.style.removeProperty('--radius');
        await saveStyle(style);
      }
    });
  });

  // ── Sliders ──
  ['tl', 'tr', 'br', 'bl'].forEach(corner => {
    document.getElementById('border-' + corner).addEventListener('input', function() {
      if (document.getElementById('border-lock').checked) {
        const v = this.value;
        ['tl', 'tr', 'br', 'bl'].forEach(c => {
          document.getElementById('border-' + c).value = v;
        });
      }
      updatePreview();
    });
  });

  // ── Save custom ──
  document.getElementById('border-custom-save').addEventListener('click', async () => {
    const cr = getCornerValues();
    await saveStyle('custom', cr);
  });
}

// Delete image
async function deleteImage(carouselId, filename) {
  if (!confirm(`Delete ${filename}?`)) return;
  
  try {
    const response = await fetch('/api/admin/image', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carouselId, filename })
    });
    
    if (response.ok) {
      await loadCarousels();
    } else {
      const result = await response.json();
      alert(result.error || 'Delete failed');
    }
  } catch (error) {
    alert('Error deleting image');
  }
}
