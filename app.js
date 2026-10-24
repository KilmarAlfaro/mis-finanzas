'use strict';
/* app.js: pantalla y lógica de uso. Los datos los maneja store.js */

/* Categorías de gastos que trae una cuenta nueva (el usuario puede editarlas o eliminarlas) */
const DEFAULT_CATS = [
  { id: 'comida', name: 'Comida', icon: 'utensils', color: '#E0A63B' },
  { id: 'ropa', name: 'Ropa', icon: 'shirt', color: '#8E6BB0' },
  { id: 'transporte', name: 'Transporte', icon: 'car', color: '#4C7FB5' },
  { id: 'salud', name: 'Salud', icon: 'cross', color: '#C0392B' },
  { id: 'hogar', name: 'Hogar', icon: 'home', color: '#1F6F5C' },
  { id: 'viajes', name: 'Viajes', icon: 'plane', color: '#2BA3C9' },
  { id: 'otros', name: 'Otros', icon: 'dots', color: '#8A9C96' }
];
/* Categorías de la versión anterior que ya no se ofrecen: solo se conservan si tienen gastos registrados */
const LEGACY_CATS = {
  'suscripciones': { icon: 'repeat', color: '#4C7FB5' },
  'gastos hormiga': { icon: 'tag', color: '#B4432F' },
  'ocio': { icon: 'gamepad', color: '#D9825B' }
};
const SWATCHES = [['#C0392B', 'Rojo'], ['#E4785A', 'Coral'], ['#E8892B', 'Naranja'], ['#E0A63B', 'Ámbar'], ['#E8C83B', 'Amarillo'],
  ['#8DB43A', 'Lima'], ['#3E9B4F', 'Verde'], ['#1F6F5C', 'Verde bosque'], ['#1FA39A', 'Turquesa'], ['#2BA3C9', 'Cian'],
  ['#4C7FB5', 'Azul'], ['#2F5FC4', 'Azul fuerte'], ['#5B5BC9', 'Índigo'], ['#8E6BB0', 'Violeta'], ['#C2519B', 'Magenta'],
  ['#E0709A', 'Rosa'], ['#8B6544', 'Marrón'], ['#8A9C96', 'Gris'], ['#4F655F', 'Gris oscuro'], ['#17302B', 'Verde noche']];
const HEX = /^#[0-9a-f]{6}$/i;
const PERIODS = { week: 'Última semana', month: 'Último mes', m3: 'Últimos 3 meses', m6: 'Últimos 6 meses', year: 'Último año', all: 'Todos' };
const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const localISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const today = () => localISO(new Date());
const sum = a => a.reduce((t, x) => t + x.amount, 0);
const sumBy = (a, f) => a.reduce((t, x) => t + f(x), 0);
const fdate = d => new Date(d + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const TRASH = svg('<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>');
const CASH = svg('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>');
const BANK = svg('<path d="M3 10l9-6 9 6"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 21h18"/>');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const getBack = l => (l.back != null ? l.back : l.amount);          // lo que se espera recibir
const lPaid = l => r2((l.pays || []).reduce((t, a) => t + a.amount, 0));  // lo que ya abonó (pagos parciales)
const lLeft = l => Math.max(0, r2(getBack(l) - lPaid(l)));                // lo que todavía te debe
const byCat = list => D.cats.map(c => sum(list.filter(e => e.cat === c.id)));   // mismo orden que D.cats
const CN = i => D.cats[i].name;
const PENCIL = svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>');
const icon = k => svg(ICONS[k] || ICONS.tag);
const SHIELD = svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>');
const CHECK = svg('<path d="M5 12l5 5 9-10"/>');
const CHECKC = svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>');
const CLOCK = svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>');
const FLAG = svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>');
const EXCL = svg('<path d="M12 8v5"/><path d="M12 17h.01"/>');
const LOGOUT = svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>');
const UNDO = svg('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>');
/* Color del ícono (blanco u oscuro) según el que tenga más contraste con el fondo */
const lum = hex => { const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); })
    .reduce((t, v, i) => t + v * [.2126, .7152, .0722][i], 0); };
const inkOn = hex => { const L = lum(hex); return 1.05 / (L + .05) >= (L + .05) / (lum('#17302B') + .05) ? '#fff' : '#17302B'; };
const badge = (c, cls = '') => `<span class="cbadge ${cls}" style="background:${c.color};color:${inkOn(c.color)}">${icon(c.icon)}</span>`;
/* Etiqueta de categoría con su mismo color e ícono (para el texto y la cuadrícula del resumen) */
const ctag = c => `<span class="ctag" style="background:${c.color}22;border-color:${c.color}66"><span class="cbadge sm" style="background:${c.color};color:${inkOn(c.color)}">${icon(c.icon)}</span><span class="nm">${esc(c.name)}</span></span>`;
const svgStatic = (k, color, px) => svg(ICONS[k] || ICONS.tag).replace(/currentColor/g, color).replace('<svg ', `<svg width="${px}" height="${px}" style="display:block" `);
const ctagPdf = c => `<span style="display:inline-block;padding:2px 9px 2px 3px;border-radius:99px;background:${c.color}22;border:1px solid ${c.color}66;font-weight:bold;color:#17302B;white-space:nowrap"><span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:${c.color};vertical-align:middle;margin-right:5px">${svgStatic(c.icon, inkOn(c.color), 10)}</span><span style="vertical-align:middle">${esc(c.name)}</span></span>`;
const FMT_UI = { cat: i => ctag(D.cats[i]) };
const FMT_PDF = { cat: i => ctagPdf(D.cats[i]) };
const monthName = ym => new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1).toLocaleDateString('es', { month: 'long' });
const prevYm = ym => { let y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 2; if (m < 0) { m = 11; y--; } return y + '-' + String(m + 1).padStart(2, '0'); };

const B = (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) ? Cloud : Local;
let D = null, mode = 'in', pending = null, per = 'month';

/* ---------- Avisos arriba (verdes) ---------- */
function toast(text, kind = 'ok') {
  const box = $('#toasts');
  if (!box || !text) return;
  [...box.children].forEach(t => { if (t.dataset.t === text) t.remove(); });
  const t = document.createElement('div');
  t.className = 'toast' + (kind === 'warn' ? ' warn' : ''); t.dataset.t = text;
  t.setAttribute('role', kind === 'warn' ? 'alert' : 'status');
  t.innerHTML = `<span class="ti">${kind === 'warn' ? EXCL : CHECK}</span><span>${esc(text)}</span>`;
  const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 220); };
  t.onclick = close;
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(close, kind === 'warn' ? 5000 : 3200);
}

/* ---------- Mensajes de error del acceso ---------- */
const ERR = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'Escribe un correo válido.',
  'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Usa "Entrar".',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
  'auth/unauthorized-domain': 'Este sitio no está autorizado en Firebase. Agrégalo en Authentication > Settings > Authorized domains.',
  'auth/operation-not-allowed': 'Este método de acceso no está activado en Firebase.',
  'auth/admin-restricted-operation': 'La creación de cuentas nuevas está desactivada.'
};
const msg = (t, ok) => { $('#msg').textContent = t || ''; $('#msg').className = ok ? 'ok' : ''; };
const showErr = e => msg(e && e.user ? e.message : (ERR[e && e.code] || 'Error: ' + ((e && (e.code || e.message)) || 'desconocido')));
window.addEventListener('error', e => msg('Error: ' + e.message));
window.addEventListener('unhandledrejection', e => showErr(e.reason));

/* ---------- Mantener sesión activa (6 meses) ----------
   Con la casilla marcada se guarda una fecha límite (fin-keep, localStorage) y la sesión sobrevive aunque cierres el navegador.
   Sin la casilla solo vale para esta pestaña (fin-sess, sessionStorage). Si Firebase restaura una sesión que no cumple ninguna
   de las dos (vencida, o de otra visita sin casilla), se cierra y se muestra el acceso, así se puede entrar con otra cuenta.
   Cerrar sesión a mano borra todo. */
const KEEP_KEY = 'fin-keep', SESS_KEY = 'fin-sess', KEEP_DAYS = 183;
const keepValid = () => { try { const k = JSON.parse(localStorage.getItem(KEEP_KEY)); if (k && k.until > Date.now()) return true; localStorage.removeItem(KEEP_KEY); } catch {} return false; };
const sessionAllowed = () => { if (keepValid()) return true; try { return sessionStorage.getItem(SESS_KEY) === '1'; } catch { return false; } };
const rememberLogin = keep => { try {
  if (keep) { localStorage.setItem(KEEP_KEY, JSON.stringify({ until: Date.now() + KEEP_DAYS * 864e5 })); sessionStorage.removeItem(SESS_KEY); }
  else { localStorage.removeItem(KEEP_KEY); sessionStorage.setItem(SESS_KEY, '1'); } } catch {} };
const forgetLogin = () => { try { localStorage.removeItem(KEEP_KEY); sessionStorage.removeItem(SESS_KEY); } catch {} };
const keepWanted = () => !$('#keepl').hidden && $('#keep').checked;
/* Mientras Firebase confirma una sesión guardada se muestra "Entrando…" en vez del acceso (evita el parpadeo del login) */
let bootTimer = null;
function beginBoot() { $('#lock').classList.add('booting'); $('#boot').hidden = false; bootTimer = setTimeout(endBoot, 20000); }
function endBoot() { clearTimeout(bootTimer); $('#lock').classList.remove('booting'); $('#boot').hidden = true; }

/* ---------- Pantalla de acceso ---------- */
function setMode(m) {
  mode = m;
  const local = B.mode === 'local', up = m === 'up', reset = m === 'reset';
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
  $('#seg').hidden = reset;
  $('#eml').hidden = reset;
  $('#codel').hidden = !reset;
  $('#pw2l').hidden = !(up || reset);
  $('#pwt').textContent = reset ? 'Nueva contraseña' : 'Contraseña';
  $('#pw').autocomplete = (up || reset) ? 'new-password' : 'current-password';
  $('#go').textContent = up ? 'Crear cuenta' : reset ? 'Cambiar contraseña' : 'Entrar';
  $('#keepl').hidden = !(m === 'in' && !local);
  $('#forgot').hidden = m !== 'in';
  $('#back').hidden = !reset;
  $('#wipe').hidden = !(reset && local);
  $('#google-box').hidden = local || reset;
  msg('');
}

function showLock() {
  $('#app').hidden = true; $('#lock').hidden = false;
  $('#rec').hidden = true; $('#auth-form').hidden = false;
  const local = B.mode === 'local', has = local && B.exists();
  document.querySelector('[data-mode=up]').hidden = has;
  $('#seg').classList.toggle('one', has);
  $('#note').textContent = local
    ? (has ? 'Tus datos están cifrados y guardados solo en este navegador.'
           : 'Crea tu cuenta. Tus datos se guardarán cifrados solo en este navegador.')
    : 'Entra a tu cuenta. Tus datos se guardan en la nube.';
  $('#pw').value = $('#pw2').value = $('#code').value = ''; $('#keep').checked = false;
  setMode(has || !local ? 'in' : 'up');
}

function enter(email, data) {
  D = data;
  $('#who').textContent = email || '';
  $('#lock').hidden = true; $('#app').hidden = false;
  ensureMethods(); ensureSubs(); const goalsFixed = ensureGoals() | ensureLoans(); const migrated = ensureCats(); const charged = applySubs(); msg(''); render();
  if (migrated || charged || goalsFixed) persist();
  if (charged) toast('Se registró el cobro de ' + [...new Set(chargedNow)].join(', '));
  openSummaryOnce();
}

function showRecovery(code) {
  $('#auth-form').hidden = true; $('#rec').hidden = false;
  $('#rec-code').textContent = code;
  $('#saved').checked = false; $('#rec-go').disabled = true;
  $('#copy').textContent = 'Copiar clave';
}
$('#saved').onchange = e => { $('#rec-go').disabled = !e.target.checked; };
$('#copy').onclick = () => {
  navigator.clipboard && navigator.clipboard.writeText($('#rec-code').textContent).catch(() => {});
  $('#copy').textContent = 'Copiada';
};
$('#rec-go').onclick = () => { enter(pending.email, pending.D); pending = null; };

document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
$('#back').onclick = () => setMode('in');
$('#wipe').onclick = () => {
  if (!confirm('Se borrarán todos los datos de este navegador y no se podrán recuperar. ¿Continuar?')) return;
  B.wipe(); showLock(); msg('Datos borrados. Crea tu cuenta de nuevo.', true);
};
$('#forgot').onclick = async () => {
  if (B.mode === 'local') { if (B.exists()) setMode('reset'); return; }
  const em = $('#em').value.trim();
  if (!em) return msg('Escribe tu correo arriba y vuelve a tocar "¿Olvidaste tu contraseña?".');
  try {
    await B.sendReset(em);
    msg('Si ese correo tiene cuenta, te enviamos un enlace para cambiar la contraseña. Revisa también spam.', true);
  } catch (e) { showErr(e); }
};
$('#google').onclick = async () => { rememberLogin(keepWanted()); try { await B.google(); } catch (e) { forgetLogin(); showErr(e); } };

$('#auth-form').addEventListener('submit', async e => {
  e.preventDefault();
  const em = $('#em').value.trim(), pw = $('#pw').value, local = B.mode === 'local';
  if (mode === 'reset') {
    if (!$('#code').value.trim()) return msg('Escribe tu clave de recuperación.');
  } else {
    if (!em || !pw) return msg('Escribe tu correo y tu contraseña.');
    if (!/^\S+@\S+\.\S+$/.test(em)) return msg('Escribe un correo válido.');
  }
  if (mode !== 'in') {
    if (pw.length < 6) return msg('La contraseña debe tener al menos 6 caracteres.');
    if (pw !== $('#pw2').value) return msg('Las contraseñas no coinciden.');
  }
  $('#go').disabled = true; msg('Procesando…', true);
  try {
    if (mode === 'reset') {
      const data = await B.reset($('#code').value, pw);
      enter(B.email(), data);
    } else if (mode === 'up') {
      if (local) {
        const code = await B.signup(em, pw);
        pending = { email: em.toLowerCase(), D: { sav: [], exp: [], loan: [] } };
        showRecovery(code);
      } else { rememberLogin(false); await B.signup(em, pw); }
    } else if (local) {
      const data = await B.login(em, pw);
      enter(B.email(), data);
    } else { rememberLogin(keepWanted()); await B.login(em, pw); }
  } catch (err) { if (!local) forgetLogin(); showErr(err); }
  $('#go').disabled = false;
});

$('#logout').onclick = async () => {
  if (!(await askConfirm({ title: '¿Quieres cerrar sesión?', text: 'Tendrás que iniciar sesión otra vez para volver a entrar a tus finanzas.', tone: 'warn', ico: LOGOUT,
    yes: 'Sí, cerrar sesión', yesIco: LOGOUT, yesCls: 'amber', no: 'No, quedarme', noIco: SHIELD, noCls: 'blue' }))) return;
  forgetLogin();
  try { sessionStorage.clear(); } catch {}
  B.logout();
  if (B.mode === 'local') { D = null; showLock(); }
};

/* ---------- Guardado ---------- */
async function persist() {
  try { await B.save(D); }
  catch (e) { alert('No se pudo guardar. Revisa tu conexión e inténtalo otra vez.'); }
}

/* ---------- Navegación ---------- */
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('form.add').forEach(clearErrors);   // los avisos no se arrastran entre pestañas
  closeDd(); closeCdd();
  document.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', x === b));
  document.querySelectorAll('main section').forEach(s => s.classList.toggle('on', s.id === b.dataset.tab));
  if (b.dataset.tab === 'res') render();
  updateBoxes();
  b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });   // en móvil la pestaña activa queda a la vista
});

/* ---------- Campos de fecha (Flatpickr) ---------- */
/* Clases de los campos: "future" = solo hoy en adelante; "opt" = fecha opcional (empieza vacía y se puede quitar) */
if (window.flatpickr) {
  const fpOpts = {
    locale: (flatpickr.l10ns && flatpickr.l10ns.es) || 'default',
    dateFormat: 'Y-m-d', altInput: true, altFormat: 'j M Y', altInputClass: 'alt-date',
    defaultDate: today(), disableMobile: true, allowInput: false,
    onReady: (_d, _s, fp) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'fp-today';
      if (fp.input.classList.contains('opt')) { b.textContent = 'Quitar fecha'; b.onclick = () => { fp.clear(); fp.close(); }; }
      else { b.textContent = 'Hoy'; b.onclick = () => { fp.setDate(new Date(), true); fp.close(); }; }
      fp.calendarContainer.appendChild(b);
    }
  };
  document.querySelectorAll('input.date').forEach(i => {
    const o = { ...fpOpts };
    if (i.classList.contains('future')) o.minDate = 'today';
    if (i.classList.contains('opt')) o.defaultDate = null;
    flatpickr(i, o);
  });
} else {
  document.querySelectorAll('input.date').forEach(i => {
    i.type = 'date'; i.value = i.classList.contains('opt') ? '' : today();
    if (i.classList.contains('future')) i.min = today();
  });
}

/* ---------- Validación de formularios (mensajes en español) ---------- */
const RULES = {
  amount: { req: 'Escribe el monto.', min: 'El monto debe ser mayor que 0.' },
  back: { req: 'Escribe el monto a devolver.', min: 'El monto a devolver debe ser mayor que 0.' },
  person: { req: 'Escribe el nombre de la persona.' },
  date: { req: 'Elige una fecha.' },
  cat: { req: 'Elige una categoría.' },
  dest: { req: 'Elige a qué cuenta pasar el dinero.' },
  svc: { req: 'Elige un servicio u «Otra suscripción».' },
  sname: { req: 'Escribe el nombre de la suscripción.' },
  gname: { req: 'Escribe el nombre de la meta.' },
  acct: { req: 'Elige de qué cuenta se descontará.' }
};
const boxOf = el => el.closest('.field') || el.closest('label');
function clearErrors(root) {
  root.querySelectorAll('.err').forEach(x => x.remove());
  root.querySelectorAll('.invalid').forEach(x => x.classList.remove('invalid'));
  root.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
}
/* Marca un campo como inválido. msg=null solo resalta (sin texto). Devuelve false si ese campo ya tenía aviso. */
function addErr(el, m) {
  const box = boxOf(el) || el.closest('.tr-info');
  if (!box || box.classList.contains('invalid')) return false;
  box.classList.add('invalid');
  el.setAttribute('aria-invalid', 'true');
  if (m) {
    const sp = document.createElement('span');
    sp.className = 'err'; sp.setAttribute('role', 'alert'); sp.textContent = m;
    box.appendChild(sp);
  }
  return true;
}
/* Reglas extra por formulario (devuelven [campo, mensaje]) */
const EXTRAS = {
  'f-sav'(form) {
    if (form.elements.kind.value !== 'transfer') return [];
    if (!activeMethods().some(m => m.id !== selM)) return [[$('#tr-add'), null]];
    const el = form.elements.amount, a = parseFloat(el.value);
    if (!(a > 0)) return [];
    const bal = balanceOf(selM), nm = methodOf(selM).name;
    if (bal <= 0) return [[el, `«${nm}» no tiene saldo para transferir.`]];
    if (a > bal + 0.004) return [[el, `Solo tienes ${money(bal)} en «${nm}».`]];
    return [];
  },
  'f-sub'(form) {
    const d = form.elements.date.value;
    return d && d < today() ? [[form.elements.date, 'Elige hoy o una fecha futura: es tu próximo cobro.']] : [];
  },
  'f-goal'(form) {
    const s = form.elements.date.value, e = form.elements.gend.value;
    return s && e && e <= s ? [[form.elements.gend, 'La fecha final debe ser posterior a la de inicio.']] : [];
  }
};
function validate(form) {
  clearErrors(form);
  let first = null;
  for (const el of form.elements) {
    const r = RULES[el.name];
    if (!r || el.disabled || ((el.name === 'back' || el.name === 'sname') && el.readOnly)) continue;
    const v = String(el.value || '').trim();
    let m = '';
    if (!v) m = r.req;
    else if (el.type === 'number' && !(parseFloat(v) > 0)) m = r.min || r.req;
    if (m && addErr(el, m)) first = first || el;
  }
  const extra = EXTRAS[form.id];
  if (extra) for (const [el, m] of extra(form)) if (addErr(el, m)) first = first || el;
  return first;
}
function focusField(el) {
  if (el.type === 'hidden') { const b = el.closest('.field') && el.closest('.field').querySelector('button'); if (b) b.focus(); return; }
  (el._flatpickr ? el._flatpickr.altInput : el).focus();
}
function clearFieldError(el) {
  const box = el.closest('.field');
  if (box) { box.classList.remove('invalid'); box.querySelectorAll('.err').forEach(x => x.remove()); }
  el.removeAttribute('aria-invalid');
}
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
  const box = e.target.closest && e.target.closest('form.add .field, form.add label');
  if (box && box.classList.contains('invalid')) {
    box.classList.remove('invalid');
    box.querySelectorAll('.err').forEach(x => x.remove());
    e.target.removeAttribute('aria-invalid');
  }
}));

/* ---------- Formularios ---------- */
function bind(id, fn) {
  const form = $(id);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = validate(form);
    if (bad) { focusField(bad); return; }
    const f = Object.fromEntries(new FormData(form));
    const ok = fn(f); render();
    if (typeof ok === 'string') toast(ok);
    form.reset();
    const d = form.querySelector('input[name=date]');
    setTimeout(() => { d._flatpickr ? d._flatpickr.setDate(today(), true) : (d.value = today()); }, 0);
    persist();
  });
}
bind('#f-exp', f => {
  D.exp.push({ id: uid(), amount: +f.amount, cat: f.cat, m: f.acct || 'efectivo', date: f.date || today(), note: f.note.trim() });   // m = cuenta de la que se descuenta
  return 'Gasto agregado correctamente';
});
$('#f-exp').addEventListener('reset', () => { selC = ''; setTimeout(renderCats, 0); });   // sin categoría por defecto
bind('#f-sav', f => {
  const amt = +f.amount, m = f.method || 'efectivo', date = f.date || today(), note = f.note.trim();
  if (f.kind === 'transfer') {          // sale de una cuenta y entra en otra: dos movimientos enlazados
    const tid = uid();
    D.sav.push({ id: uid(), amount: -amt, m, date, note, tr: 'out', to: f.dest, tid },
               { id: uid(), amount: amt, m: f.dest, date, note, tr: 'in', from: m, tid });
  } else D.sav.push({ id: uid(), amount: amt, m, date, note });
  return f.kind === 'transfer' ? 'Transferencia realizada correctamente' : 'Aporte ingresado correctamente';
});
$('#f-sav').addEventListener('reset', () => setTimeout(() => { syncMethod(); syncTransfer(); }, 0));
$('#f-sav').addEventListener('change', e => { if (e.target.name === 'kind') syncTransfer(); });
$('#tr-add').onclick = () => setTimeout(() => openAcc(null), 0);
bind('#f-loan', f => {
  D.loan.push({ id: uid(), person: f.person.trim(), amount: +f.amount, back: +(f.back || f.amount), date: f.date || today(), note: f.note.trim(), paid: false, m: f.acct || 'efectivo' });   // m = cuenta de la que sale el dinero (y a la que vuelve al cobrar)
  return 'Préstamo anotado correctamente';
});
bind('#f-goal', f => {
  D.goals.push({ id: uid(), name: f.gname.trim(), target: +f.amount, start: f.date || today(), end: f.gend || '', adds: [], created: today() });
  return 'Meta creada correctamente';
});
$('#f-goal').addEventListener('reset', () => setTimeout(() => { const e = $('#g-end'); e._flatpickr ? e._flatpickr.clear() : (e.value = ''); }, 0));

/* Monto a devolver: copia el monto prestado salvo que se active "Editar" */
const lAmt = $('#l-amt'), lBack = $('#l-back'), lEdit = $('#l-edit');
lAmt.addEventListener('input', () => { if (!lEdit.checked) lBack.value = lAmt.value; });
lEdit.addEventListener('change', () => {
  lBack.readOnly = !lEdit.checked;
  lEdit.closest('.edt').classList.toggle('on', lEdit.checked);
  if (lEdit.checked) lBack.focus(); else lBack.value = lAmt.value;
});
$('#f-loan').addEventListener('reset', () => { lBack.readOnly = true; lEdit.closest('.edt').classList.remove('on'); });

document.addEventListener('click', async e => {
  const del = e.target.closest('[data-del]'), paid = e.target.closest('[data-paid]');
  let done = '';
  if (del) {
    const [k, id] = del.dataset.del.split(':');
    if (!(await askDelete(describe(k, id)))) return;
    const tid = (D[k].find(x => x.id === id) || {}).tid;     // una transferencia son dos movimientos
    D[k] = D[k].filter(x => x.id !== id && !(tid && x.tid === tid));
    done = { exp: 'Gasto eliminado correctamente', sav: 'Movimiento eliminado correctamente', loan: 'Préstamo eliminado correctamente' }[k] || 'Registro eliminado correctamente';
  } else if (paid) {
    const l = D.loan.find(x => x.id === paid.dataset.paid);
    if (!l) return;
    if (!l.paid) { openL(l.id, 'cobro'); return; }          // Cobrado: pide la cuenta donde entra el dinero
    if (!(await askReopen(l))) return;
    if ((l.pays || []).some(p => p.final)) l.pays = l.pays.filter(p => !p.final);   // quita el cobro final
    if (lPaid(l) >= getBack(l)) l.pays = [];                // estaba saldado solo con abonos: vuelve a deber todo
    l.paid = false;
    done = 'Préstamo reabierto como pendiente';
  } else return;
  render(); persist();            // primero se muestra el cambio y luego se guarda, para que no haya espera
  toast(done);
});

/* ---------- Abonar a un préstamo (pagos parciales: se descuentan de lo que te deben) ---------- */
let lTarget = null, lMode = 'abono';          // lMode: 'abono' (pago parcial) o 'cobro' (lo que falta, marca cobrado)
function fillL() {
  const l = D.loan.find(x => x.id === lTarget);
  if (!l) return;
  const pays = l.pays || [], cobro = lMode === 'cobro';
  $('#lo-title').textContent = (cobro ? 'Cobrar a ' : 'Abonar a la deuda de ') + l.person;
  $('#lo-sub').textContent = (pays.length ? `Te debe ${money(lLeft(l))}. Ya te abonó ${money(lPaid(l))} de ${money(getBack(l))}.` : `Te debe ${money(lLeft(l))}.`)
    + (cobro ? ' Al confirmar, el préstamo queda cobrado.' : '');
  $('#lo-amt').max = lLeft(l);
  if (cobro) $('#lo-amt').value = lLeft(l).toFixed(2);
  $('#lo-amt').readOnly = cobro;
  $('#lo-save').textContent = cobro ? 'Confirmar cobro' : 'Abonar';
  $('#lo-hist').hidden = !pays.length;
  $('#lo-histn').textContent = `Abonos (${pays.length})`;
  $('#lo-ablist').innerHTML = pays.map(p => `<div class="g-ab"><span>${fdate(p.date)}${accNote(payAcc(l, p))}</span><b>${money(p.amount)}</b><button type="button" data-ldel="${esc(p.id)}" aria-label="Eliminar abono" title="Eliminar abono">${TRASH}</button></div>`).join('');
}
function openL(id, mode = 'abono') {
  const l = D.loan.find(x => x.id === id);
  if (!l || l.paid) return;
  lTarget = id; lMode = mode; fillL();
  if (mode === 'abono') $('#lo-amt').value = '';
  $('#lo-acct').value = ''; $('#lo-err').hidden = true; $('#lo-hist').open = false;
  const d = $('#lo-date'); d._flatpickr ? d._flatpickr.setDate(today(), true) : (d.value = today());
  showModal($('#lomodal')); (mode === 'cobro' ? $('#lo-acct').disabled ? $('#lo-save') : $('#lo-acct') : $('#lo-amt')).focus();
}
async function closeL() { await hideModal($('#lomodal')); }
async function saveL() {
  const l = D.loan.find(x => x.id === lTarget), cobro = lMode === 'cobro', d = $('#lo-date').value || today(), err = $('#lo-err');
  if (!l) return;
  const a = cobro ? lLeft(l) : r2(parseFloat($('#lo-amt').value));
  const bad = (msg, el) => { err.textContent = msg; err.hidden = false; (el || $('#lo-amt')).focus(); };
  if (!(a > 0)) return bad('Escribe un monto mayor que 0.');
  if (a > lLeft(l)) return bad(`No puede ser mayor que lo que te debe (${money(lLeft(l))}).`);
  const acct = $('#lo-acct').disabled ? 'efectivo' : $('#lo-acct').value;      // con una sola cuenta no se pregunta
  if (!acct) return bad('Elige a qué cuenta entrará el dinero.', $('#lo-acct'));
  (l.pays = l.pays || []).push(cobro ? { id: uid(), amount: a, date: d, m: acct, final: true } : { id: uid(), amount: a, date: d, m: acct });
  const full = lLeft(l) <= 0;
  if (full) l.paid = true;                         // si cubre todo lo que debía, el préstamo queda cobrado
  const closing = closeL();
  render(); persist(); toast(cobro ? 'Préstamo marcado como cobrado' : full ? 'Abono registrado: el préstamo quedó cobrado por completo' : 'Abono registrado correctamente');
  await closing;
}
$('#lo-save').onclick = saveL;
$('#lo-cancel').onclick = closeL;
$('#lo-amt').addEventListener('input', () => { $('#lo-err').hidden = true; });
$('#lo-acct').addEventListener('change', () => { $('#lo-err').hidden = true; });
$('#lo-amt').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveL(); } });
$('#l-loan').addEventListener('click', e => { const b = e.target.closest('[data-labono]'); if (b) openL(b.dataset.labono); });
$('#lo-ablist').addEventListener('click', async e => {
  const b = e.target.closest('[data-ldel]'), l = D.loan.find(x => x.id === lTarget), p = l && b && (l.pays || []).find(x => x.id === b.dataset.ldel);
  if (!p) return;
  if (!(await askDelete(`el abono de ${money(p.amount)} del ${fdate(p.date)}`))) return;
  l.pays = l.pays.filter(x => x.id !== p.id);
  fillL(); render(); persist(); toast('Abono eliminado correctamente');
});

/* ---------- Período del historial ---------- */
$('#per').innerHTML = Object.entries(PERIODS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
$('#per').value = per;
$('#per').onchange = e => { per = e.target.value; render(); };
function cutoff(p) {
  if (p === 'all') return '';
  const d = new Date();
  if (p === 'week') d.setDate(d.getDate() - 7);
  else if (p === 'month') d.setMonth(d.getMonth() - 1);
  else if (p === 'm3') d.setMonth(d.getMonth() - 3);
  else if (p === 'm6') d.setMonth(d.getMonth() - 6);
  else d.setFullYear(d.getFullYear() - 1);
  return localISO(d);
}

/* ---------- Resumen mensual ---------- */
function pick(arr, seed) {
  let h = 0; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}
function analysis(s, fmt) {
  const { mes, pmes, spent, pspent, saved, psaved, cc, pc } = s;
  const seed = s.ym + spent.toFixed(2) + pspent.toFixed(2) + saved.toFixed(2);
  const out = [];
  const top = cc.indexOf(Math.max(...cc));
  if (!spent && !pspent) {
    out.push(`Todavía no hay gastos registrados en ${mes} ni en ${pmes}. Anota tus gastos y aquí verás cómo vas.`);
  } else if (!pspent) {
    out.push(pick([
      `En ${pmes} no registraste gastos, así que aún no hay con qué comparar. En lo que va de ${mes} llevas ${money(spent)}.`,
      `No hay gastos de ${pmes} para comparar. En ${mes} llevas ${money(spent)} gastados.`
    ], seed));
    out.push(`Lo que más pesa es ${fmt.cat(top)}, con ${money(cc[top])} (${Math.round(cc[top] / spent * 100)}% del total).`);
  } else {
    const diff = spent - pspent, pct = Math.round(Math.abs(diff) / pspent * 100);
    const deltas = cc.map((v, i) => v - pc[i]);
    if (Math.abs(diff) < 0.005) {
      out.push(`Hasta ahora llevas exactamente lo mismo que gastaste en todo ${pmes}: ${money(spent)}.`);
    } else if (diff > 0) {
      out.push(pick([
        `Este mes gastaste ${money(diff)} más que en ${pmes}: ${money(spent)} frente a ${money(pspent)} (${pct}% más).`,
        `En lo que va de ${mes} ya gastaste ${money(spent)}, ${money(diff)} más que en todo ${pmes} (${money(pspent)}).`,
        `Vas por encima de ${pmes}: ${money(spent)} contra ${money(pspent)}, una diferencia de ${money(diff)} (${pct}%).`
      ], seed));
      const i = deltas.indexOf(Math.max(...deltas));
      if (deltas[i] > 0.005) out.push(pick([
        `La categoría que más subió fue ${fmt.cat(i)}: pasó de ${money(pc[i])} a ${money(cc[i])}.`,
        `El mayor aumento está en ${fmt.cat(i)}, de ${money(pc[i])} a ${money(cc[i])}.`
      ], seed + 'c'));
    } else {
      out.push(pick([
        `Hasta ahora vas ${money(-diff)} por debajo de lo que gastaste en ${pmes} (${money(pspent)}); llevas ${money(spent)}.`,
        `Buen ritmo: llevas ${money(spent)} en ${mes}, ${money(-diff)} menos que en todo ${pmes} (${pct}% menos).`,
        `${mes[0].toUpperCase() + mes.slice(1)} va ${money(-diff)} más ligero que ${pmes}: ${money(spent)} contra ${money(pspent)}.`
      ], seed));
      const i = deltas.indexOf(Math.min(...deltas));
      if (deltas[i] < -0.005) out.push(pick([
        `La mayor reducción fue en ${fmt.cat(i)}: de ${money(pc[i])} a ${money(cc[i])}.`,
        `Donde más ahorraste fue en ${fmt.cat(i)}, que bajó de ${money(pc[i])} a ${money(cc[i])}.`
      ], seed + 'c'));
    }
  }
  if (saved > 0) out.push(pick([
    `Ahorraste ${money(saved)} este mes${psaved > 0 ? ` (en ${pmes}: ${money(psaved)})` : ''}.`,
    `Sumaste ${money(saved)} a tus ahorros en ${mes}${psaved > 0 ? `; en ${pmes} fueron ${money(psaved)}` : ''}.`
  ], seed + 's'));
  else if (saved < 0) out.push(`Este mes tus ahorros bajaron ${money(-saved)}.`);
  else out.push(`Aún no registras aportes de ahorro en ${mes}.`);
  return out.join(' ');
}
function monthSummary() {
  const ym = today().slice(0, 7), pm = prevYm(ym);
  const cur = D.exp.filter(e => e.date.startsWith(ym)), prev = D.exp.filter(e => e.date.startsWith(pm));
  const s = {
    ym, pm, mes: monthName(ym), pmes: monthName(pm),
    spent: sum(cur), pspent: sum(prev),
    saved: sum(D.sav.filter(x => x.date.startsWith(ym))), psaved: sum(D.sav.filter(x => x.date.startsWith(pm))),
    cc: byCat(cur), pc: byCat(prev)
  };
  return s;
}
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const catRows = s => D.cats.map((c, i) => ({ c, p: s.pc[i], v: s.cc[i], i })).filter(x => x.p || x.v).sort((a, b) => (b.v - a.v) || (b.p - a.p));
/* Etiqueta de cambio entre meses: verde si es bueno, rojo si no (goodUp = subir es bueno) */
function chg(c, p, goodUp) {
  const d = r2(c - p);
  if (Math.abs(d) < 0.005) return '<span class="chg eq">Igual</span>';
  const up = d > 0;
  return `<span class="chg ${up === goodUp ? 'good' : 'bad'}"><i>${up ? '▲' : '▼'}</i>${up ? '+' : '−'}${money(Math.abs(d))}</span>`;
}
/* Cuadrícula comparativa: mes anterior contra mes actual, con cambio por fila */
function summaryGrid(s) {
  const L1 = cap(s.pmes), L2 = cap(s.mes);
  const tot = (label, p, c, goodUp) => `<div class="cmp-r tot"><span class="cl"><b>${label}</b></span><span class="v" data-l="${L1}">${money(p)}</span><span class="v" data-l="${L2}">${money(c)}</span><span class="ch" data-l="Cambio">${chg(c, p, goodUp)}</span></div>`;
  const cr = catRows(s), nCats = cr.length;
  const rows = cr.map(x => `<div class="cmp-r"><span class="cl">${ctag(x.c)}</span><span class="v${x.p ? '' : ' z'}" data-l="${L1}">${x.p ? money(x.p) : '—'}</span><span class="v${x.v ? '' : ' z'}" data-l="${L2}">${x.v ? money(x.v) : '—'}</span><span class="ch" data-l="Cambio">${!x.p ? '<span class="chg bad">Nuevo</span>' : !x.v ? '<span class="chg good">Sin gastos</span>' : chg(x.v, x.p, false)}</span></div>`).join('');
  return `<div class="cmp-h"><span></span><span>${cap(s.pmes)}</span><span>${cap(s.mes)}</span><span>Cambio</span></div>
    ${tot('Total gastado', s.pspent, s.spent, false)}${tot('Total ahorrado', s.psaved, s.saved, true)}
    <details class="cmp-cats">
      <summary><span class="cc-t">Gastos por categoría</span><span class="cc-n"><b>${nCats}</b><em> ${nCats === 1 ? 'categoría' : 'categorías'}</em></span><span class="cc-i" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span></summary>
      <div class="cmp-body">${nCats ? `<div class="cmp-h"><span></span><span>${cap(s.pmes)}</span><span>${cap(s.mes)}</span><span>Cambio</span></div>${rows}` : '<div class="cmp-none">Aún no hay gastos registrados en estos dos meses.</div>'}</div>
    </details>`;
}
function fillSummary(s) {
  $('#m-sub').textContent = `${cap(s.mes)} ${s.ym.slice(0, 4)} · comparado con ${s.pmes}`;
  $('#m-grid').innerHTML = summaryGrid(s);
  $('#m-text').innerHTML = analysis(s, FMT_UI);
  updateBoxes();
}
const seenKey = () => 'resumen-' + today().slice(0, 7);
function showModal(m) { m.classList.remove('closing'); m.hidden = false; }
function hideModal(m) {
  return new Promise(res => {
    m.classList.add('closing');
    setTimeout(() => { m.hidden = true; m.classList.remove('closing'); res(); }, 170);
  });
}
/* "No volver a mostrar": se recuerda solo para el mes actual (localStorage); al cambiar de mes vuelve a salir */
const skipKey = () => 'resumen-off-' + today().slice(0, 7);
const summarySkipped = () => { try { return localStorage.getItem(skipKey()) === '1'; } catch { return false; } };
function pruneSkips() { try { Object.keys(localStorage).filter(k => k.startsWith('resumen-off-') && k !== skipKey()).forEach(k => localStorage.removeItem(k)); } catch {} }
function openSummary() {
  fillSummary(monthSummary());
  $('#m-skip').checked = summarySkipped();
  showModal($('#modal'));
  $('.sumdlg').scrollTop = 0;                            // siempre empieza desde arriba
  $('#m-title').focus({ preventScroll: true });          // enfocar el botón de abajo hacía saltar el scroll hasta el final
}
function openSummaryOnce() {
  pruneSkips();
  if (summarySkipped()) return;
  let seen = false;
  try { seen = !!sessionStorage.getItem(seenKey()); } catch {}
  if (!seen) openSummary();
}
async function closeSummary() {
  try {
    sessionStorage.setItem(seenKey(), '1');
    if ($('#m-skip').checked) localStorage.setItem(skipKey(), '1'); else localStorage.removeItem(skipKey());
  } catch {}
  await hideModal($('#modal'));
  $('#sum-open').focus();
}
// al abrir la pestaña de categorías, se lleva a la vista para ver todo sin buscar
$('#m-grid').addEventListener('toggle', e => {
  const d = e.target; if (!d.open) return;
  requestAnimationFrame(() => {                          // si la lista no cabe en pantalla, la pestaña sube al inicio para leerla de arriba hacia abajo
    const dlg = $('.sumdlg'), r = d.getBoundingClientRect(), v = dlg.getBoundingClientRect();
    if (r.bottom > v.bottom) dlg.scrollTo({ top: dlg.scrollTop + (d.querySelector('summary').getBoundingClientRect().top - v.top) - 10, behavior: 'smooth' });
  });
}, true);
$('#m-ok').onclick = closeSummary;
$('#sum-open').onclick = openSummary;

/* ---------- Confirmación para eliminar ---------- */
let askResolve = null;
function describe(k, id) {
  const r = (D[k] || []).find(x => x.id === id);
  if (!r) return 'este registro';
  if (k === 'exp') return `el gasto de ${money(r.amount)} en ${catOf(r.cat).name}`;
  if (k === 'sav') return r.tr ? `la transferencia de ${money(Math.abs(r.amount))} (se eliminarán sus dos movimientos)` : `el ${r.amount >= 0 ? 'aporte' : 'movimiento'} de ${money(Math.abs(r.amount))}`;
  return `el préstamo de ${money(r.amount)} a ${r.person}`;
}
function askConfirm(o) {
  $('#c-title').textContent = o.title;
  $('#c-text').textContent = o.text;
  const ic = $('#c-ico'); ic.className = 'c-ico ' + (o.tone || ''); ic.innerHTML = o.ico;
  const y = $('#c-yes'), n = $('#c-no');
  y.className = 'cbtn ' + o.yesCls; y.innerHTML = o.yesIco + esc(o.yes);
  n.className = 'cbtn ' + o.noCls; n.innerHTML = o.noIco + esc(o.no);
  showModal($('#cmodal')); n.focus();          // el foco empieza en "No": así un Enter accidental no hace nada
  return new Promise(res => { askResolve = res; });
}
function askDelete(desc, title = '¿Estás seguro que quieres eliminar este registro?') {
  return askConfirm({ title, text: `Vas a eliminar ${desc}. Esta acción no se puede deshacer.`, tone: '', ico: TRASH,
    yes: 'Sí, quiero eliminarlo', yesIco: TRASH, yesCls: 'red', no: 'No, no quiero eliminarlo', noIco: SHIELD, noCls: 'blue' });
}
const askReopen = l => { const fin = (l.pays || []).filter(p => p.final);
  return askConfirm({ title: '¿Volver a marcar este préstamo como pendiente?',
  text: fin.length ? `El préstamo a ${l.person} dejará de contar como cobrado y se restarán ${money(sum(fin))} de tu total actual y de la cuenta donde entró.` : `El préstamo a ${l.person} dejará de contar como cobrado, se restarán ${money(getBack(l))} de tu total actual y de las cuentas donde entraron sus abonos, y se borrarán esos abonos.`,
  tone: 'warn', ico: UNDO, yes: 'Sí, volver a pendiente', yesIco: UNDO, yesCls: 'amber', no: 'No, dejarlo cobrado', noIco: SHIELD, noCls: 'blue' }); };
async function answer(v) {
  if (!askResolve) return;
  const r = askResolve; askResolve = null;
  await hideModal($('#cmodal')); r(v);
}
$('#c-yes').onclick = () => answer(true);
$('#c-no').onclick = () => answer(false);
$('#cmodal').addEventListener('click', e => { if (e.target.id === 'cmodal') answer(false); });
/* Elementos alcanzables con Tab dentro de una ventana (de cada grupo de radios solo cuenta uno) */
const tabbable = x => !x.disabled && x.offsetParent !== null && x.tabIndex >= 0 &&
  (x.type !== 'radio' || x.checked || (!document.querySelector(`input[name="${x.name}"]:checked`) && document.querySelector(`input[name="${x.name}"]`) === x));
document.addEventListener('keydown', e => {
  const open = [$('#accmodal'), $('#gmodal'), $('#lomodal'), $('#svcmodal'), $('#catmodal'), $('#fmodal'), $('#cmodal')].find(m => !m.hidden);
  if (open) {
    if (e.key === 'Escape') { if (open.id === 'cmodal') answer(false); else if (open.id === 'catmodal') closeCat(); else if (open.id === 'svcmodal') { closeSvc(); $('#svc-btn').focus(); } else if (open.id === 'gmodal') closeG(); else if (open.id === 'lomodal') closeL(); else if (open.id === 'accmodal') closeAcc(); else fAnswer(null); }
    else if (e.key === 'Tab') {
      const f = [...open.querySelectorAll('input,select,button')].filter(tabbable);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[i < 0 ? (e.shiftKey ? f.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  } else if (e.key === 'Escape' && !$('#dd-menu').hidden) { closeDd(); $('#dd-btn').focus(); }
  else if (e.key === 'Escape' && !$('#cdd-menu').hidden) { closeCdd(); $('#cdd-btn').focus(); }
  else if (e.key === 'Escape' && !$('#modal').hidden) closeSummary();
});


$('#m-pdf').onclick = () => {
  if (!window.html2pdf) return alert('No se pudo cargar la herramienta de PDF. Revisa tu conexión e inténtalo otra vez.');
  const s = monthSummary();
  const th = 'text-align:left;padding:8px;border-bottom:2px solid #17302B;font-size:13px';
  const thr = th + ';text-align:right';
  const td = 'padding:8px;border-bottom:1px solid #CFDAD6;font-size:13px';
  const tdr = td + ';text-align:right';
  const chgPdf = (c, p, goodUp) => { const d = r2(c - p); if (Math.abs(d) < 0.005) return '<span style="color:#4F655F">Igual</span>';
    const up = d > 0; return `<b style="color:${up === goodUp ? '#1F6F5C' : '#B4432F'}">${up ? '▲ +' : '▼ −'}${money(Math.abs(d))}</b>`; };
  const tot = (label, p, c, goodUp) => `<tr style="background:#E4F0EC"><td style="${td};font-weight:bold">${label}</td><td style="${tdr}">${money(p)}</td><td style="${tdr};font-weight:bold">${money(c)}</td><td style="${tdr}">${chgPdf(c, p, goodUp)}</td></tr>`;
  const rows = catRows(s).map(x => `<tr><td style="${td}">${ctagPdf(x.c)}</td><td style="${tdr}">${x.p ? money(x.p) : '—'}</td><td style="${tdr}">${x.v ? money(x.v) : '—'}</td><td style="${tdr}">${!x.p ? '<b style="color:#B4432F">Nuevo</b>' : !x.v ? '<b style="color:#1F6F5C">Sin gastos</b>' : chgPdf(x.v, x.p, false)}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#17302B;padding:8px;width:680px">
    <h1 style="margin:0 0 4px;font-size:26px">Resumen de ${s.mes} ${s.ym.slice(0, 4)}</h1>
    <p style="margin:0 0 18px;color:#4F655F;font-size:13px">Generado el ${fdate(today())}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px"><tr><th style="${th}"></th><th style="${thr}">${cap(s.pmes)}</th><th style="${thr}">${cap(s.mes)}</th><th style="${thr}">Cambio</th></tr>
      ${tot('Total gastado', s.pspent, s.spent, false)}${tot('Total ahorrado', s.psaved, s.saved, true)}${rows}</table>
    <p style="font-size:14px;line-height:2;margin:0">${analysis(s, FMT_PDF)}</p>
  </div>`;
  html2pdf().set({ margin: 12, filename: `resumen-${s.ym}.pdf`, image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } })
    .from(html, 'string').save();
};

/* ---------- Tipos de ahorro ---------- */
const r2 = n => Math.round(n * 100) / 100;
let selM = 'efectivo';
function ensureMethods() {
  if (!D) return;
  const list = Array.isArray(D.met) ? D.met : [];
  D.met = list.some(m => m.id === 'efectivo') ? list : [{ id: 'efectivo', name: 'Efectivo' }, ...list];
  D.met.forEach(m => {                       // cuentas viejas: ícono y color por defecto
    if (!m.icon || !(ICONS[m.icon] || BANK_IDS.has(m.icon))) m.icon = m.id === 'efectivo' ? 'cash' : 'bank';
    if (!HEX.test(m.color || '')) m.color = m.id === 'efectivo' ? '#1F6F5C' : '#4C7FB5';
  });
}
const activeMethods = () => D.met.filter(m => !m.deleted);
const methodOf = id => D.met.find(m => m.id === (id || 'efectivo')) || { id: 'efectivo', name: 'Efectivo', icon: 'cash', color: '#1F6F5C' };
const savLabel = s => s.tr === 'out' ? 'Transferencia a ' + methodOf(s.to).name
  : s.tr === 'in' ? 'Transferencia desde ' + methodOf(s.from).name
  : (s.amount >= 0 ? 'Aporte a ' : 'Salida de ') + methodOf(s.m).name;
/* Saldo de una cuenta = aportes − gastos − préstamos que salieron de ella + lo que te devolvieron y entró en ella.
   Cada abono/cobro guarda su propia cuenta (p.m); si no la tiene (abonos viejos) se usa la cuenta del préstamo.
   Los préstamos viejos sin cuenta no tocan ninguna cuenta, como antes. */
const payAcc = (l, p) => p.m || l.m;
const balanceOf = id => r2(sum(D.sav.filter(s => (s.m || 'efectivo') === id)) - sum(D.exp.filter(e => e.m === id))
  - sum(D.loan.filter(l => l.m === id)) + sumBy(D.loan, l => sum((l.pays || []).filter(p => payAcc(l, p) === id))));
const accNote = m => m && (activeMethods().length > 1 || m !== 'efectivo') ? ' · ' + esc(methodOf(m).name) : '';   // " · Cuenta" para las filas

function syncMethod() {
  if (!D) return;
  if (!activeMethods().some(m => m.id === selM)) selM = 'efectivo';
  $('#m-val').value = selM;
  const cur = methodOf(selM);
  $('#dd-cur').innerHTML = `${acctBadge(cur, 'sm')}<span class="nm">${esc(cur.name)}</span>`;
}
function renderMethods() {
  syncMethod();
  $('#dd-list').innerHTML = activeMethods().map(m => `<div class="dd-item${m.id === selM ? ' sel' : ''}" role="option" aria-selected="${m.id === selM}" tabindex="0" data-mid="${m.id}">
    ${acctBadge(m, 'sm')}<span class="dd-name">${esc(m.name)}</span><span class="dd-bal">${money(balanceOf(m.id))}</span>
    <button type="button" class="dd-del dd-edit" data-medit="${m.id}" aria-label="Editar ${esc(m.name)}" title="Editar">${PENCIL}</button>
    ${m.id === 'efectivo' ? '' : `<button type="button" class="dd-del" data-mdel="${m.id}" aria-label="Eliminar ${esc(m.name)}" title="Eliminar">${TRASH}</button>`}</div>`).join('');
  $('#m-chips').innerHTML = activeMethods().map(m => `<span class="achip" style="border-color:${accColor(m)}">${acctBadge(m, 'sm')}<span>${esc(m.name)}: <b class="${balanceOf(m.id) < 0 ? 'neg' : ''}">${money(balanceOf(m.id))}</b></span></span>`).join('')
    + D.goals.map(g => `<span class="gchip">${FLAG}Meta · ${esc(g.name)}: <b>${money(gSaved(g))}</b></span>`).join('');
  syncTransfer();
  syncAcct();
}
/* Campo "Cuenta" de Gastos y Suscripciones: solo aparece si hay más de una cuenta de ahorro */
function syncAcct() {
  if (!D) return;
  const list = activeMethods(), show = list.length > 1;
  [['#ex-acct', '#ex-acct-field'], ['#sub-acct', '#sub-acct-field'], ['#ln-acct', '#ln-acct-field'], ['#lo-acct', '#lo-acct-field']].forEach(([s, f]) => {
    const sel = $(s), keep = sel.value;
    sel.innerHTML = '<option value="">Elige una cuenta</option>' + list.map(m => `<option value="${esc(m.id)}">${esc(m.name)} (${money(balanceOf(m.id))})</option>`).join('');
    sel.value = list.some(m => m.id === keep) ? keep : '';
    $(f).hidden = !show; sel.disabled = !show;
  });
}
/* Transferencia: lista las demás cuentas (sin la elegida) o avisa que no hay otra */
function syncTransfer() {
  if (!D) return;
  const tr = document.querySelector('#f-sav input[name=kind]:checked').value === 'transfer';
  const others = activeMethods().filter(m => m.id !== selM);
  const sel = $('#tr-dest'), keep = sel.value;
  sel.innerHTML = '<option value="">Selecciona una cuenta</option>' + others.map(m => `<option value="${esc(m.id)}">${esc(m.name)} (${money(balanceOf(m.id))})</option>`).join('');
  sel.value = others.some(m => m.id === keep) ? keep : '';
  const show = tr && others.length > 0;
  $('#tr-field').hidden = !show; sel.disabled = !show;
  $('#tr-info').hidden = !(tr && !others.length);
  if (!tr) $('#tr-info').classList.remove('invalid');
  $('#f-sav button[type=submit]').textContent = tr ? 'Transferir' : 'Guardar movimiento';
}
function openDd() { $('#dd-menu').hidden = false; $('#dd-btn').setAttribute('aria-expanded', 'true'); }
function closeDd() { $('#dd-menu').hidden = true; $('#dd-btn').setAttribute('aria-expanded', 'false'); }
$('#dd-btn').onclick = () => ($('#dd-menu').hidden ? openDd() : closeDd());
$('#dd-btn').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); openDd(); const f = $('#dd-list .dd-item'); f && f.focus(); }
});
document.addEventListener('click', e => { if (!e.target.closest('#dd')) closeDd(); });
$('#dd-list').addEventListener('keydown', e => {
  const items = [...$('#dd-list').querySelectorAll('.dd-item')], i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(i + 1, items.length - 1)].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(i - 1, 0)].focus(); }
  else if ((e.key === 'Enter' || e.key === ' ') && i >= 0 && e.target === items[i]) { e.preventDefault(); items[i].click(); }
});
$('#dd-menu').addEventListener('click', e => {
  const del = e.target.closest('[data-mdel]'), ed = e.target.closest('[data-medit]');
  if (del) { deleteMethod(del.dataset.mdel); return; }
  if (ed) { closeDd(); openAcc(ed.dataset.medit); return; }
  const it = e.target.closest('[data-mid]');
  if (it) { selM = it.dataset.mid; closeDd(); renderMethods(); $('#dd-btn').focus(); }
});
$('#dd-addbtn').onclick = () => { closeDd(); openAcc(null); };

/* ---------- Crear y editar cuentas de ahorro (nombre + color + ícono / banco) ---------- */
let accEdit = null;                       // id de la cuenta que se edita (null = nueva)
let accDraft = { icon: 'wallet', color: '#1F6F5C' };
const accColor = m => (HEX.test(m.color || '') ? m.color : '#4C7FB5');
/* Insignia de una cuenta: logo/marca si eligió un banco, o ícono genérico con su color */
const acctBadge = (m, cls = '') => BANK_IDS.has(m.icon) ? sbadge(m.icon, cls)
  : `<span class="cbadge ${cls}" style="background:${accColor(m)};color:${inkOn(accColor(m))}">${icon(m.icon)}</span>`;

/* Se construye al final (usa sbadge, que se define más abajo) */
function buildAcc() {
$('#acc-swatches').innerHTML = SWATCHES.map(([h, n]) => `<label class="sw" title="${n}"><input type="radio" name="acc-color" value="${h}" aria-label="${n}"><span style="background:${h}"></span></label>`).join('')
  + '<label class="sw custom" title="Color personalizado"><input type="color" id="acc-custom" aria-label="Color personalizado" value="#1f6f5c"><span></span></label>';
$('#acc-icons').innerHTML = BANK_GROUPS.map(g => `<div class="ic-group"><h3>${g.name}</h3><div class="bk-row">${g.items.map(([id, name]) =>
    `<label class="bk" data-n="${esc(name.toLowerCase())}"><input type="radio" name="acc-icon" value="${id}" aria-label="${esc(name)}"><span class="bk-in">${sbadge(id, 'sm')}<span class="nm">${esc(name)}</span></span></label>`).join('')}</div></div>`).join('')
  + `<div class="ic-group"><h3>Otros</h3><div class="ic-row">${ACCOUNT_ICONS.map(([k, n]) =>
    `<label class="ic" title="${n}" data-n="${n.toLowerCase()}"><input type="radio" name="acc-icon" value="${k}" aria-label="${n}"><span>${icon(k)}</span></label>`).join('')}</div></div>`;
}

function syncAccModal() {
  const ik = accDraft.icon, color = accDraft.color, ink = inkOn(color), g = $('#acc-icons');
  g.style.setProperty('--chosen', color); g.style.setProperty('--chosen-ink', ink);
  g.querySelectorAll('input').forEach(i => { i.checked = i.value === ik; });
  let match = false;
  $('#acc-swatches').querySelectorAll('input[type=radio]').forEach(i => { i.checked = i.value.toLowerCase() === color.toLowerCase(); match = match || i.checked; });
  const cu = $('#acc-custom');
  if (cu.value.toLowerCase() !== color.toLowerCase()) cu.value = color;
  cu.closest('.sw').classList.toggle('on', !match);
  cu.nextElementSibling.style.background = match ? '' : color;
  $('#acc-prev').innerHTML = acctBadge({ icon: ik, color }, 'big');
}
function filterAcc(q) {
  q = q.trim().toLowerCase();
  let any = false;
  $('#acc-icons').querySelectorAll('[data-n]').forEach(t => { const show = !q || t.dataset.n.includes(q); t.hidden = !show; any = any || show; });
  $('#acc-icons').querySelectorAll('.ic-group').forEach(g => { g.hidden = !g.querySelector('[data-n]:not([hidden])'); });
  $('#acc-empty').hidden = any;
}
$('#acc-icons').addEventListener('change', e => { if (e.target.name === 'acc-icon') { accDraft.icon = e.target.value; syncAccModal(); } });
$('#acc-swatches').addEventListener('change', e => { if (e.target.name === 'acc-color') { accDraft.color = e.target.value; syncAccModal(); } });
$('#acc-swatches').addEventListener('input', e => { if (e.target.id === 'acc-custom') { accDraft.color = e.target.value; syncAccModal(); } });
$('#acc-search').addEventListener('input', e => filterAcc(e.target.value));
$('#acc-name').addEventListener('input', () => { $('#acc-err').hidden = true; });
$('#acc-name').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveAcc(); } });
$('#acc-save').onclick = () => saveAcc();
$('#acc-cancel').onclick = () => closeAcc();

function openAcc(id) {
  accEdit = id;
  const m = id ? D.met.find(x => x.id === id) : null;
  const free = (SWATCHES.find(([h]) => !activeMethods().some(x => accColor(x).toLowerCase() === h.toLowerCase())) || SWATCHES[0])[0];
  accDraft = m ? { icon: m.icon, color: accColor(m) } : { icon: 'wallet', color: free };
  $('#acc-title').textContent = m ? 'Editar cuenta' : 'Nueva cuenta';
  $('#acc-save').textContent = m ? 'Guardar cambios' : 'Guardar cuenta';
  $('#acc-name').value = m ? m.name : '';
  $('#acc-err').hidden = true; $('#acc-search').value = ''; filterAcc('');
  syncAccModal();
  showModal($('#accmodal'));
  $('#acc-icons').scrollTop = 0;
  $('#acc-name').focus();
}
async function closeAcc() { await hideModal($('#accmodal')); $('#dd-btn').focus(); }
async function saveAcc() {
  const name = $('#acc-name').value.trim().replace(/\s+/g, ' '), err = $('#acc-err');
  const fail = t => { err.textContent = t; err.hidden = false; $('#acc-name').focus(); };
  if (!name) return fail('Escribe un nombre.');
  if (activeMethods().some(m => m.id !== accEdit && m.name.toLowerCase() === name.toLowerCase())) return fail('Ya existe una cuenta con ese nombre.');
  if (accEdit) {
    const m = D.met.find(x => x.id === accEdit);
    m.name = name; m.icon = accDraft.icon; m.color = accDraft.color;
  } else {
    const m = { id: uid(), name, icon: accDraft.icon, color: accDraft.color };
    D.met.push(m); selM = m.id;                     // la nueva queda elegida
  }
  const closing = closeAcc();
  render(); toast(accEdit ? 'Cuenta actualizada correctamente' : 'Tipo de ahorro agregado correctamente'); persist();
  await closing;
}

/* Eliminar un tipo de ahorro: solo con $0, o pasando antes los fondos a otro tipo */
let fResolve = null;
function askTransfer(m, bal) {
  $('#f-text').textContent = `«${m.name}» todavía tiene ${money(bal)}. ¿Deseas pasarlos a otro tipo de ahorro antes de eliminarlo?`;
  $('#f-chk').checked = false; $('#f-opt').classList.remove('on');
  $('#f-pick').hidden = true; $('#f-go').disabled = true;
  $('#f-dest').innerHTML = activeMethods().filter(x => x.id !== m.id).map(x => `<option value="${x.id}">${esc(x.name)} (${money(balanceOf(x.id))})</option>`).join('');
  showModal($('#fmodal')); $('#f-no').focus();
  return new Promise(res => { fResolve = res; });
}
async function fAnswer(v) {
  if (!fResolve) return;
  const r = fResolve; fResolve = null;
  await hideModal($('#fmodal')); r(v);
}
$('#f-chk').onchange = e => {
  $('#f-opt').classList.toggle('on', e.target.checked);
  $('#f-pick').hidden = !e.target.checked;
  $('#f-go').disabled = !e.target.checked;
};
$('#f-go').onclick = () => fAnswer({ dest: $('#f-dest').value });
$('#f-no').onclick = () => fAnswer(null);
$('#fmodal').addEventListener('click', e => { if (e.target.id === 'fmodal') fAnswer(null); });

async function deleteMethod(id) {
  const m = D.met.find(x => x.id === id);
  if (!m || id === 'efectivo') return;
  closeDd();
  const bal = balanceOf(id);
  if (bal < -0.005) return toast(`«${m.name}» tiene saldo negativo (${money(bal)}). Registra un aporte para dejarlo en $0.00 y podrás eliminarlo.`, 'warn');
  if (Math.abs(bal) < 0.005) {
    if (!(await askDelete(`el tipo de ahorro «${m.name}»`, '¿Estás seguro que quieres eliminar este tipo de ahorro?'))) return;
  } else {
    const r = await askTransfer(m, bal);
    if (!r) return;
    const d = D.met.find(x => x.id === r.dest), t = today();
    const tid = uid();
    D.sav.push({ id: uid(), amount: -bal, m: id, date: t, note: 'Al eliminar el tipo de ahorro', tr: 'out', to: d.id, tid },
               { id: uid(), amount: bal, m: d.id, date: t, note: 'Al eliminar «' + m.name + '»', tr: 'in', from: id, tid });
  }
  m.deleted = true;               // se oculta, pero su historial queda con nombre
  if (selM === id) selM = 'efectivo';
  render(); toast('Tipo de ahorro eliminado correctamente'); await persist();
}

/* ---------- Categorías de gastos ---------- */
let selC = '';          // categoría elegida en el formulario ('' = ninguna, a propósito)
let catEdit = null;     // id de la categoría que se está editando (null = nueva)
let catDraft = { icon: 'tag', color: SWATCHES[0][0] };
const catOf = id => (D && D.cats.find(c => c.id === id)) || { id, name: 'Sin categoría', icon: 'tag', color: '#8A9C96' };
const activeCats = () => D.cats.filter(c => !c.deleted);

/* Prepara D.cats: cuentas nuevas reciben las categorías base; los gastos viejos (guardados por nombre) pasan a usar el id.
   Devuelve true si cambió algo (para guardarlo). */
function ensureCats() {
  if (!D) return false;
  let changed = false;
  if (!Array.isArray(D.cats)) { D.cats = DEFAULT_CATS.map(c => ({ ...c })); changed = true; }
  D.cats.forEach(c => {
    if (!ICONS[c.icon]) { c.icon = 'tag'; changed = true; }
    if (!HEX.test(c.color)) { c.color = '#8A9C96'; changed = true; }
  });
  const byId = new Set(D.cats.map(c => c.id));
  D.exp.forEach(e => {
    if (byId.has(e.cat)) return;
    const raw = String(e.cat == null ? '' : e.cat).trim(), key = raw.toLowerCase();
    let c = D.cats.find(x => x.name.toLowerCase() === key);
    if (!c) {                                   // categoría que ya no existe: se conserva oculta para no perder el historial
      const lg = LEGACY_CATS[key] || {};
      c = { id: key === 'suscripciones' ? 'suscripciones' : uid(), name: raw || 'Sin categoría', icon: lg.icon || 'tag', color: lg.color || '#8A9C96', deleted: true };
      D.cats.push(c); byId.add(c.id);
    }
    e.cat = c.id; changed = true;
  });
  return changed;
}

function syncCat() {
  if (!D) return;
  if (selC && !activeCats().some(c => c.id === selC)) selC = '';
  $('#c-val').value = selC;
  const cur = $('#cdd-cur'), c = selC ? catOf(selC) : null;
  cur.classList.toggle('ph', !c);
  cur.innerHTML = c ? `${badge(c, 'sm')}<span class="nm">${esc(c.name)}</span>` : '<span class="nm">Selecciona una categoría</span>';
}
function renderCats() {
  if (!D) return;
  syncCat();
  $('#cdd-list').innerHTML = activeCats().map(c => `<div class="dd-item${c.id === selC ? ' sel' : ''}" role="option" aria-selected="${c.id === selC}" tabindex="0" data-cid="${esc(c.id)}">
    ${badge(c)}<span class="dd-name">${esc(c.name)}</span>
    <button type="button" class="dd-del dd-edit" data-cedit="${esc(c.id)}" aria-label="Editar ${esc(c.name)}" title="Editar">${PENCIL}</button>
    <button type="button" class="dd-del" data-cdel="${esc(c.id)}" aria-label="Eliminar ${esc(c.name)}" title="Eliminar">${TRASH}</button></div>`).join('')
    || '<div class="dd-empty">Aún no tienes categorías.</div>';
}

/* Menú desplegable de categorías */
function openCdd() { $('#cdd-menu').hidden = false; $('#cdd-btn').setAttribute('aria-expanded', 'true'); }
function closeCdd() { $('#cdd-menu').hidden = true; $('#cdd-btn').setAttribute('aria-expanded', 'false'); }
$('#cdd-btn').onclick = () => ($('#cdd-menu').hidden ? openCdd() : closeCdd());
$('#cdd-btn').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); openCdd(); const f = $('#cdd-list .dd-item'); f && f.focus(); }
});
document.addEventListener('click', e => { if (!e.target.closest('#cdd')) closeCdd(); });
$('#cdd-list').addEventListener('keydown', e => {
  const items = [...$('#cdd-list').querySelectorAll('.dd-item')], i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(i + 1, items.length - 1)].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(i - 1, 0)].focus(); }
  else if ((e.key === 'Enter' || e.key === ' ') && i >= 0 && e.target === items[i]) { e.preventDefault(); items[i].click(); }
});
$('#cdd-menu').addEventListener('click', e => {
  const del = e.target.closest('[data-cdel]'), ed = e.target.closest('[data-cedit]'), it = e.target.closest('[data-cid]');
  if (del) { deleteCat(del.dataset.cdel); return; }
  if (ed) { closeCdd(); openCat(ed.dataset.cedit); return; }
  if (it) { selC = it.dataset.cid; clearFieldError($('#c-val')); closeCdd(); renderCats(); $('#cdd-btn').focus(); }
});
$('#cdd-addbtn').onclick = () => { closeCdd(); openCat(null); };

/* Ventana para crear o editar una categoría: nombre + color + ícono */
$('#cat-swatches').innerHTML = SWATCHES.map(([h, n]) => `<label class="sw" title="${n}"><input type="radio" name="cat-color" value="${h}" aria-label="${n}"><span style="background:${h}"></span></label>`).join('')
  + '<label class="sw custom" title="Color personalizado"><input type="color" id="cat-custom" aria-label="Color personalizado" value="#1f6f5c"><span></span></label>';
$('#cat-icons').innerHTML = ICON_GROUPS.map(g => `<div class="ic-group"><h3>${g.name}</h3><div class="ic-row">${g.icons.map(([k, n]) =>
  `<label class="ic" title="${n}"><input type="radio" name="cat-icon" value="${k}" aria-label="${n}"><span>${icon(k)}</span></label>`).join('')}</div></div>`).join('');

function syncCatModal() {
  const ik = catDraft.icon, color = catDraft.color, ink = inkOn(color);
  const g = $('#cat-icons');
  g.style.setProperty('--chosen', color); g.style.setProperty('--chosen-ink', ink);
  g.querySelectorAll('input').forEach(i => { i.checked = i.value === ik; });
  let match = false;
  $('#cat-swatches').querySelectorAll('input[type=radio]').forEach(i => { i.checked = i.value.toLowerCase() === color.toLowerCase(); match = match || i.checked; });
  const cu = $('#cat-custom');
  if (cu.value.toLowerCase() !== color.toLowerCase()) cu.value = color;
  cu.closest('.sw').classList.toggle('on', !match);
  cu.nextElementSibling.style.background = match ? '' : color;
  const pv = $('#cat-prev');
  pv.style.background = color; pv.style.color = ink; pv.innerHTML = icon(ik);
}
$('#cat-icons').addEventListener('change', e => { if (e.target.name === 'cat-icon') { catDraft.icon = e.target.value; syncCatModal(); } });
$('#cat-swatches').addEventListener('change', e => { if (e.target.name === 'cat-color') { catDraft.color = e.target.value; syncCatModal(); } });
$('#cat-custom').addEventListener('input', e => { catDraft.color = e.target.value; syncCatModal(); });
$('#cat-name').addEventListener('input', () => { $('#cat-err').hidden = true; });
$('#cat-name').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveCat(); } });
$('#cat-save').onclick = () => saveCat();
$('#cat-cancel').onclick = () => closeCat();

function openCat(id) {
  catEdit = id;
  const c = id ? catOf(id) : null;
  const free = (SWATCHES.find(([h]) => !activeCats().some(x => x.color.toLowerCase() === h.toLowerCase())) || SWATCHES[0])[0];
  catDraft = c ? { icon: c.icon, color: c.color } : { icon: 'tag', color: free };
  $('#cat-title').textContent = c ? 'Editar categoría' : 'Nueva categoría';
  $('#cat-save').textContent = c ? 'Guardar cambios' : 'Guardar categoría';
  $('#cat-name').value = c ? c.name : '';
  $('#cat-err').hidden = true;
  syncCatModal();
  showModal($('#catmodal'));
  $('#cat-icons').scrollTop = 0;
  $('#cat-name').focus();
}
async function closeCat() { await hideModal($('#catmodal')); $('#cdd-btn').focus(); }
async function saveCat() {
  const name = $('#cat-name').value.trim().replace(/\s+/g, ' '), err = $('#cat-err');
  const fail = t => { err.textContent = t; err.hidden = false; $('#cat-name').focus(); };
  if (!name) return fail('Escribe un nombre.');
  if (activeCats().some(c => c.id !== catEdit && c.name.toLowerCase() === name.toLowerCase())) return fail('Ya existe una categoría con ese nombre.');
  if (catEdit) {
    const c = D.cats.find(x => x.id === catEdit);
    c.name = name; c.icon = catDraft.icon; c.color = catDraft.color;
  } else {
    const c = { id: uid(), name, icon: catDraft.icon, color: catDraft.color };
    D.cats.push(c); selC = c.id; clearFieldError($('#c-val'));      // la nueva queda elegida
  }
  const closing = closeCat();
  render(); toast(catEdit ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente'); await persist();
  await closing;
}

/* Eliminar: si tiene gastos se oculta (para no perder el historial); si no, se borra del todo */
async function deleteCat(id) {
  const c = D.cats.find(x => x.id === id);
  if (!c) return;
  closeCdd();
  const n = D.exp.filter(e => e.cat === id).length;
  const desc = `la categoría «${c.name}»` + (n ? `, que tiene ${n} ${n === 1 ? 'gasto registrado' : 'gastos registrados'} (seguirán apareciendo en tu historial)` : '');
  if (!(await askDelete(desc, '¿Estás seguro que quieres eliminar esta categoría?'))) return;
  if (n) c.deleted = true; else D.cats = D.cats.filter(x => x.id !== id);
  if (selC === id) selC = '';
  render(); toast('Categoría eliminada correctamente'); await persist();
}

/* ---------- Suscripciones ---------- */
let selSvc = '', lastAuto = '';
const svcOf = id => SERVICES[id] || SERVICES.custom;
/* Ícono real de cada app: se descarga de internet a partir de su dominio. Orden de intento: Google, DuckDuckGo.
   Si ninguno sirve (sin conexión, dominio sin ícono o ícono diminuto) queda la insignia con la inicial y el color de la marca. */
const iconSrcs = d => [`https://www.google.com/s2/favicons?domain=${d}&sz=128`, `https://icons.duckduckgo.com/ip3/${d}.ico`];
const iconIdx = {}, iconBad = new Set();      // fuente que ya funcionó por dominio / dominios sin ícono
const imgFor = dom => {
  if (!dom || iconBad.has(dom)) return '';
  const i = iconIdx[dom] || 0;
  return `<img class="${dom in iconIdx ? 'ok' : ''}" src="${iconSrcs(dom)[i]}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-dom="${dom}" data-i="${i}">`;
};
/* La marca puede tener dos líneas separadas por "|" (ej. claro|video) */
const sbadge = (id, cls = '') => { const s = svcOf(id), lg = LOGOS[id];
  if (lg) return `<span class="sbadge logo ${cls}" style="background:${lg[0]}" role="img" aria-label="${esc(s.name)}"><svg viewBox="0 0 48 48" aria-hidden="true">${lg[1]}</svg></span>`;
  const img = imgFor(s.dom), lines = String(s.mark).split('|');
  return `<span class="sbadge ${cls}${img ? ' has-img' : ''}" data-l="${s.ico ? 0 : Math.max(...lines.map(l => [...l].length))}" style="background:${s.bg};color:${s.fg}"><span class="fb${lines.length > 1 ? ' ml' : ''}">${s.ico ? icon(s.ico) : lines.map(esc).join('<br>')}</span>${img}</span>`; };
function nextIcon(img) {
  const dom = img.dataset.dom, i = +img.dataset.i + 1, src = iconSrcs(dom)[i];
  if (src) { img.dataset.i = i; img.src = src; } else { iconBad.add(dom); img.remove(); }
}
document.addEventListener('error', e => { const t = e.target; if (t.tagName === 'IMG' && t.dataset && t.dataset.dom) nextIcon(t); }, true);
document.addEventListener('load', e => {
  const t = e.target;
  if (t.tagName !== 'IMG' || !t.dataset || !t.dataset.dom) return;
  const last = !iconSrcs(t.dataset.dom)[+t.dataset.i + 1];
  if (t.naturalWidth && t.naturalWidth < 24 && !last) return nextIcon(t);     // ícono diminuto: se prueba la siguiente fuente
  iconIdx[t.dataset.dom] = +t.dataset.i; t.classList.add('ok');
}, true);

function ensureSubs() {
  if (!D) return false;
  if (!Array.isArray(D.subs)) { D.subs = []; return true; }
  return false;
}
/* Suma meses a una fecha YYYY-MM-DD respetando el día de cobro (31 -> 28/30 en meses cortos) */
function addPeriod(iso, day, months) {
  let y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1 + months;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  const dim = new Date(y, m + 1, 0).getDate();
  return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(Math.min(day, dim)).padStart(2, '0');
}
/* Categoría donde se registran los cobros (oculta del selector, pero visible en historial y gráficos) */
function subCat() {
  let c = D.cats.find(x => x.id === 'suscripciones') || D.cats.find(x => x.name.toLowerCase() === 'suscripciones');
  if (!c) { c = { id: 'suscripciones', name: 'Suscripciones', icon: 'repeat', color: '#5B5BC9', deleted: true }; D.cats.push(c); }
  return c;
}
/* Descuenta los cobros cuya fecha ya llegó (también los atrasados si la app estuvo cerrada). Devuelve true si cambió algo. */
let chargedNow = [];     // nombres de las suscripciones cobradas en la última revisión
function applySubs() {
  if (!D) return false;
  let changed = false;
  chargedNow = [];
  const t = today();
  D.subs.forEach(s => {
    let n = 0;
    while (s.next <= t && n++ < 240) {
      const acct = s.m && D.met.some(x => x.id === s.m && !x.deleted) ? s.m : (s.m ? 'efectivo' : undefined);   // si la cuenta ya no existe, sale de Efectivo
      D.exp.push({ id: uid(), amount: s.amount, cat: subCat().id, m: acct, date: s.next, note: s.name + ' (suscripción)', sub: s.id });
      chargedNow.push(s.name);
      s.next = addPeriod(s.next, s.day || +s.next.slice(8, 10), s.every === 'year' ? 12 : 1);
      changed = true;
    }
  });
  return changed;
}
async function tick() {
  if (!D || $('#app').hidden) return;
  if (applySubs()) { render(); toast('Se registró el cobro de ' + [...new Set(chargedNow)].join(', ')); await persist(); }
}
setInterval(tick, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

const barColor = s => { const l = lum(s.bg); return (l > .75 || l < .02) ? (lum(s.fg) > .75 ? '#17302B' : s.fg) : s.bg; };
function renderSubs() {
  if (!D) return;
  const list = [...D.subs].sort((a, b) => a.next.localeCompare(b.next));
  const monthly = list.reduce((t, s) => t + (s.every === 'year' ? s.amount / 12 : s.amount), 0);
  $('#subs-total').innerHTML = list.length
    ? `<b>${money(monthly)}</b> al mes · ${list.length} ${list.length === 1 ? 'suscripción activa' : 'suscripciones activas'}` : '';
  $('#l-sub').innerHTML = list.map(s => {
    const days = Math.round((new Date(s.next + 'T12:00') - new Date(today() + 'T12:00')) / 864e5);
    const when = days <= 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`;
    return `<article class="sub" style="--sc:${barColor(svcOf(s.svc))}">
      <div class="sub-top">${sbadge(s.svc)}<div><b>${esc(s.name)}</b><small>${money(s.amount)} · ${s.every === 'year' ? 'cada año' : 'cada mes'}${s.m && activeMethods().length > 1 ? ' · ' + esc(methodOf(s.m).name) : ''}</small></div>
        <button type="button" class="x" data-sdel="${esc(s.id)}" aria-label="Eliminar suscripción ${esc(s.name)}" title="Eliminar suscripción">${TRASH}</button></div>
      <div class="sub-next"><span><small>Próximo pago</small><b>${fdate(s.next)}</b></span><span class="chip${days <= 3 ? ' soon' : ''}">${when}</span></div>
    </article>`;
  }).join('') || `<div class="sub-empty">${sbadge('custom')}<b>Aún no tienes suscripciones</b><span>Agrega Netflix, Spotify o cualquier pago que se repita y se descontará solo.</span></div>`;
}
$('#l-sub').addEventListener('click', async e => {
  const b = e.target.closest('[data-sdel]');
  if (!b) return;
  const s = D.subs.find(x => x.id === b.dataset.sdel);
  if (!s) return;
  if (!(await askDelete(`la suscripción «${s.name}» (ya no se cobrará más; los pagos que ya se descontaron se quedan en tus gastos)`, '¿Estás seguro que quieres eliminar esta suscripción?'))) return;
  D.subs = D.subs.filter(x => x.id !== s.id);
  render(); toast('Suscripción eliminada correctamente'); await persist();
});

/* Selector de servicio */
$('#svc-grid').innerHTML = SERVICE_GROUPS.map(g => `<div class="svc-group"><h3>${g.name}</h3><div class="svc-row">${g.items.map(([id, name]) =>
  `<button type="button" class="svc-tile" data-svc="${id}" data-n="${esc(name.toLowerCase())}">${sbadge(id)}<span class="nm">${esc(name)}</span></button>`).join('')}</div></div>`).join('');
function syncSvc() {
  $('#svc-val').value = selSvc;
  const cur = $('#svc-cur');
  cur.classList.toggle('ph', !selSvc);
  cur.innerHTML = selSvc ? `${sbadge(selSvc, 'sm')}<span class="nm">${esc(svcOf(selSvc).name)}</span>` : '<span class="nm">Elige un servicio</span>';
}
function openSvc() {
  $('#svc-search').value = '';
  $('#svc-grid').querySelectorAll('[hidden]').forEach(x => { x.hidden = false; });
  $('#svc-empty').hidden = true;
  $('#svc-grid').querySelectorAll('.svc-tile').forEach(t => t.classList.toggle('sel', t.dataset.svc === selSvc));
  showModal($('#svcmodal'));
  $('#svc-grid').scrollTop = 0;
  $('#svc-search').focus();
}
async function closeSvc() { await hideModal($('#svcmodal')); }
$('#svc-btn').onclick = openSvc;
$('#svc-cancel').onclick = async () => { await closeSvc(); $('#svc-btn').focus(); };
$('#svc-search').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  let any = false;
  $('#svc-grid').querySelectorAll('.svc-tile').forEach(t => { const show = !q || t.dataset.n.includes(q); t.hidden = !show; any = any || show; });
  $('#svc-grid').querySelectorAll('.svc-group').forEach(g => { g.hidden = !g.querySelector('.svc-tile:not([hidden])'); });
  $('#svc-empty').hidden = any;
});
/* Nombre de la suscripción: bloqueado (se llena solo con el servicio) salvo que se marque "Editar" */
const sName = $('#sname'), sEdit = $('#sname-edit');
function setNameLock(locked) {
  sName.readOnly = locked; sEdit.checked = !locked;
  sEdit.closest('.edt').classList.toggle('on', !locked);
}
sEdit.addEventListener('change', () => {
  setNameLock(!sEdit.checked);
  if (sEdit.checked) sName.focus();
  else { sName.value = selSvc && selSvc !== 'custom' ? svcOf(selSvc).name : ''; lastAuto = sName.value; }   // al bloquear vuelve el nombre del servicio
});
$('#svc-grid').addEventListener('click', async e => {
  const t = e.target.closest('[data-svc]');
  if (!t) return;
  selSvc = t.dataset.svc;
  if (selSvc === 'custom') {                      // otra suscripción: el nombre se escribe a mano
    if (sName.value === lastAuto) sName.value = '';
    lastAuto = ''; setNameLock(false);
  } else if (!sName.value || sName.value === lastAuto) {   // nombre automático: queda bloqueado
    sName.value = svcOf(selSvc).name; lastAuto = sName.value; setNameLock(true);
  }
  clearFieldError($('#svc-val'));
  if (sName.value) { const lb = sName.closest('.field'); lb.classList.remove('invalid'); lb.querySelectorAll('.err').forEach(x => x.remove()); sName.removeAttribute('aria-invalid'); }
  syncSvc();
  await closeSvc();
  (sName.value ? $('#f-sub input[name=amount]') : sName).focus();
});
$('#f-sub').addEventListener('reset', () => { selSvc = ''; lastAuto = ''; setNameLock(true); setTimeout(syncSvc, 0); });
setNameLock(true);
syncSvc();
bind('#f-sub', f => {
  const next = f.date || today();
  D.subs.push({ id: uid(), name: f.sname.trim(), svc: f.svc, amount: +f.amount, m: f.acct || 'efectivo', every: f.every === 'year' ? 'year' : 'month', next, day: +next.slice(8, 10), created: today() });
  const n = D.exp.length;
  applySubs();           // si el pago es hoy, se registra enseguida
  return D.exp.length > n ? 'Suscripción agregada correctamente. El cobro de hoy ya se registró' : 'Suscripción agregada correctamente';
});

/* ---------- Metas de ahorro ---------- */
function ensureGoals() {
  if (!D) return false;
  let ch = false;
  if (!Array.isArray(D.goals)) { D.goals = []; ch = true; }
  D.goals.forEach(g => { if (!Array.isArray(g.adds)) { g.adds = []; ch = true; } });
  return ch;
}
/* Préstamos viejos ya cobrados: su cobro pasa a registrarse como un pago (con la cuenta del préstamo) para que todo salga de "pays" */
function ensureLoans() {
  if (!D) return false;
  let ch = false;
  D.loan.forEach(l => {
    if (!Array.isArray(l.pays)) { l.pays = []; ch = true; }
    if (l.paid && lLeft(l) > 0) { l.pays.push({ id: uid(), amount: lLeft(l), date: l.date, m: l.m, final: true }); ch = true; }
  });
  return ch;
}
const gSaved = g => r2(sum(g.adds));
/* Estado de una meta: avance, cuánto falta y, si tiene fecha final, si va al día */
function goalInfo(g) {
  const saved = gSaved(g), left = Math.max(0, r2(g.target - saved)), t = today();
  const pct = Math.min(100, Math.floor(saved / g.target * 100)), done = saved >= g.target - 0.004;
  const o = { saved, left, pct, done, exp: null, status: 'eq', label: '', tip: '', days: null };
  if (done) { o.status = 'good'; o.label = 'Meta cumplida'; o.pct = 100; return o; }
  if (g.start > t) { o.label = 'Empieza el ' + fdate(g.start); return o; }
  if (!g.end) { o.label = 'Sin fecha límite'; return o; }
  const total = Math.max(1, daysBetween(g.start, g.end)), el = Math.min(total, Math.max(0, daysBetween(g.start, t)));
  o.days = daysBetween(t, g.end);
  if (o.days < 0) { o.status = 'bad'; o.label = 'Plazo vencido'; return o; }
  o.exp = Math.round(el / total * 100);
  const need = g.target * el / total;
  if (saved + 0.004 >= need) { o.status = 'good'; o.label = 'Vas al día'; } else { o.status = 'warn'; o.label = 'Vas atrasado'; }
  if (o.days > 0) o.tip = o.days >= 60 ? `Ahorra ≈ ${money(left / (o.days / 30.44))} al mes` : `Ahorra ≈ ${money(left / Math.max(1, o.days / 7))} por semana`;
  return o;
}
function renderGoals() {
  if (!D) return;
  const list = [...D.goals].sort((a, b) => (goalInfo(a).done - goalInfo(b).done) || (a.end || '9999').localeCompare(b.end || '9999') || a.created.localeCompare(b.created));
  const active = list.filter(g => !goalInfo(g).done);
  $('#goals-total').innerHTML = list.length
    ? `<b>${money(sumBy(list, gSaved))}</b> ahorrados de ${money(sumBy(list, g => g.target))} · ${active.length} ${active.length === 1 ? 'activa' : 'activas'}` : '';
  $('#l-goal').innerHTML = list.map(g => {
    const i = goalInfo(g), left = i.days != null && i.days >= 0 ? (i.days === 0 ? 'Vence hoy' : i.days === 1 ? 'Queda 1 día' : `Quedan ${i.days} días`) : '';
    const abs = [...g.adds].sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
    return `<article class="goal${i.done ? ' done' : ''}${i.status === 'bad' ? ' late' : ''}">
      <div class="g-top"><span class="g-ico">${icon(i.done ? 'trophy' : 'flag')}</span>
        <div><b>${esc(g.name)}</b><small>${fdate(g.start)}${g.end ? ' → ' + fdate(g.end) : ' · sin fecha final'}</small></div>
        <button type="button" class="x" data-gdel="${esc(g.id)}" aria-label="Eliminar meta ${esc(g.name)}" title="Eliminar meta">${TRASH}</button></div>
      <div class="g-nums"><b>${money(i.saved)}</b><span>de ${money(g.target)}</span><span class="g-pct">${i.pct}%</span></div>
      <div class="g-bar" role="progressbar" aria-label="Avance de ${esc(g.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${i.pct}"><i style="width:${i.pct}%"></i>${i.exp != null && !i.done ? `<span class="g-mark" style="left:${i.exp}%" title="Dónde deberías ir hoy"></span>` : ''}</div>
      <div class="g-meta"><span class="chip ${i.status}">${i.label}</span>${i.done ? '' : `<span>Faltan <b>${money(i.left)}</b></span>`}${left ? `<span>${left}</span>` : ''}${i.tip ? `<span>${i.tip}</span>` : ''}</div>
      <div class="g-act"><button type="button" class="btn" data-gadd="${esc(g.id)}">Abonar</button></div>
      <details class="g-hist"><summary>Abonos (${abs.length})</summary><div class="g-ablist">${abs.map(a => `<div class="g-ab"><span>${fdate(a.date)}</span><b>${money(a.amount)}</b><button type="button" data-gabdel="${esc(g.id)}:${esc(a.id)}" aria-label="Eliminar abono" title="Eliminar abono">${TRASH}</button></div>`).join('') || '<p class="g-none">Aún no hay abonos.</p>'}</div></details>
    </article>`;
  }).join('') || `<div class="goal-empty"><span class="g-ico">${icon('flag')}</span><b>Aún no tienes metas</b><span>Crea una arriba (por ejemplo, unas vacaciones) y ve abonando para ver qué tan cerca estás.</span></div>`;
}
let gTarget = null;
function openG(id) {
  const g = D.goals.find(x => x.id === id);
  if (!g) return;
  gTarget = id;
  const i = goalInfo(g);
  $('#g-title').textContent = 'Abonar a «' + g.name + '»';
  $('#g-sub').textContent = i.done ? 'Esta meta ya está cumplida, pero puedes seguir abonando.' : `Llevas ${money(i.saved)} de ${money(g.target)}. Faltan ${money(i.left)}.`;
  $('#g-amt').value = ''; $('#g-err').hidden = true;
  const d = $('#g-date'); d._flatpickr ? d._flatpickr.setDate(today(), true) : (d.value = today());
  showModal($('#gmodal')); $('#g-amt').focus();
}
async function closeG() { await hideModal($('#gmodal')); }
async function saveG() {
  const g = D.goals.find(x => x.id === gTarget), a = parseFloat($('#g-amt').value), d = $('#g-date').value || today(), err = $('#g-err');
  if (!g) return;
  if (!(a > 0)) { err.textContent = 'Escribe un monto mayor que 0.'; err.hidden = false; $('#g-amt').focus(); return; }
  g.adds.push({ id: uid(), amount: a, date: d });
  const closing = closeG();
  render(); persist(); toast('Abono registrado correctamente');
  await closing;
}
$('#g-save').onclick = saveG;
$('#g-cancel').onclick = closeG;
$('#g-amt').addEventListener('input', () => { $('#g-err').hidden = true; });
$('#g-amt').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveG(); } });
$('#l-goal').addEventListener('click', async e => {
  const add = e.target.closest('[data-gadd]'), del = e.target.closest('[data-gdel]'), abd = e.target.closest('[data-gabdel]');
  if (add) return openG(add.dataset.gadd);
  if (del) {
    const g = D.goals.find(x => x.id === del.dataset.gdel);
    if (!g) return;
    if (!(await askDelete(`la meta «${g.name}»${g.adds.length ? ` (se perderán sus ${g.adds.length} ${g.adds.length === 1 ? 'abono' : 'abonos'}, ${money(gSaved(g))})` : ''}`, '¿Estás seguro que quieres eliminar esta meta?'))) return;
    D.goals = D.goals.filter(x => x.id !== g.id);
    toast('Meta eliminada correctamente');
  } else if (abd) {
    const [gid, aid] = abd.dataset.gabdel.split(':'), g = D.goals.find(x => x.id === gid), a = g && g.adds.find(x => x.id === aid);
    if (!a) return;
    if (!(await askDelete(`el abono de ${money(a.amount)} del ${fdate(a.date)}`))) return;
    g.adds = g.adds.filter(x => x.id !== aid);
    toast('Abono eliminado correctamente');
  } else return;
  render(); persist();
});

/* Cuadros con scroll: un velo al pie avisa cuando hay más registros debajo */
function updateBoxes() {
  document.querySelectorAll('.boxwrap').forEach(w => {
    const u = w.querySelector('.sbox');
    w.classList.toggle('more', u.offsetParent !== null && u.scrollHeight > u.clientHeight + 2 && u.scrollTop + u.clientHeight < u.scrollHeight - 2);
  });
}
document.querySelectorAll('.sbox').forEach(u => u.addEventListener('scroll', updateBoxes, { passive: true }));
window.addEventListener('resize', updateBoxes);

/* ---------- Dibujo ---------- */
let ch1, ch2;
/* Más reciente primero: por fecha y, dentro del mismo día, el último que se agregó va arriba */
const sorted = a => a.map((x, i) => [x, i]).sort((p, q) => q[0].date.localeCompare(p[0].date) || q[1] - p[1]).map(p => p[0]);
function row(main, sub, amt, k, id, neg, extra, cls, ico) {
  const text = `<div><b>${main}</b><small>${sub}</small></div>`;
  return `<li class="${cls || ''}">${ico ? `<div class="lead">${ico}${text}</div>` : text}<span class="amt ${neg ? 'neg' : ''}">${amt}</span><span>${extra || ''}<button class="x" data-del="${k}:${id}" aria-label="Eliminar registro" title="Eliminar">${TRASH}</button></span></li>`;
}
const expRow = e => { const c = catOf(e.cat);
  const acc = e.m && (activeMethods().length > 1 || e.m !== 'efectivo') ? ' · ' + esc(methodOf(e.m).name) : '';   // de qué cuenta salió
  return row(esc(c.name), fdate(e.date) + acc + (e.note ? '. ' + esc(e.note) : ''), money(e.amount), 'exp', e.id, true, '', '', badge(c)); };
const savRow = s => row(esc(savLabel(s)), fdate(s.date) + (s.note ? '. ' + esc(s.note) : ''), money(s.amount), 'sav', s.id, s.amount < 0);
const loanRow = l => row(esc(l.person), `${fdate(l.date)}${accNote(l.m)}. Prestado ${money(l.amount)}` + (lPaid(l) ? `. Abonado ${money(lPaid(l))}` : '') + (l.note ? '. ' + esc(l.note) : ''), money(l.paid ? getBack(l) : lLeft(l)), 'loan', l.id, false,
  (l.paid ? '' : `<button class="btn alt sm" data-labono="${l.id}">Abonar</button>`) + `<button class="btn alt sm" data-paid="${l.id}">${l.paid ? 'Reabrir' : 'Cobrado'}</button>`, l.paid ? 'done' : '');

/* Listas separadas por día (Hoy, Ayer, lunes 19 de octubre…), con el total de cada día a la derecha */
function dayLabel(d) {
  const t = today(), diff = daysBetween(d, t);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  const o = { weekday: 'long', day: 'numeric', month: 'long' };
  if (d.slice(0, 4) !== t.slice(0, 4)) o.year = 'numeric';
  return cap(new Date(d + 'T12:00').toLocaleDateString('es', o));
}
function byDay(list, rowFn, totalFn) {
  let out = '', cur = null, grp = [];
  const flush = () => { if (grp.length) out += `<li class="dayh"><span>${esc(dayLabel(cur))}</span><span class="dt">${totalFn ? totalFn(grp) : ''}</span></li>` + grp.map(rowFn).join(''); grp = []; };
  list.forEach(x => { if (x.date !== cur) { flush(); cur = x.date; } grp.push(x); });
  flush();
  return out;
}
const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + money(Math.abs(n));

function render() {
  if (!D) return;
  const ym = today().slice(0, 7);
  const mexp = D.exp.filter(e => e.date.startsWith(ym));

  /* Totales: los gastos restan; lo prestado sale de tus manos y vuelve cuando lo cobras */
  const actual = sum(D.sav) - sum(D.exp) - sum(D.loan) + sumBy(D.loan, lPaid);
  const conPrest = actual + sumBy(D.loan.filter(l => !l.paid), lLeft);
  $('#k-sav').textContent = money(actual); $('#k-sav').classList.toggle('neg', actual < 0);
  $('#k-all').textContent = money(conPrest); $('#k-all').classList.toggle('neg', conPrest < 0);
  $('#k-exp').textContent = money(sum(mexp));
  /* Por defecto solo "Total actual" y "Gastado en…". Las otras aparecen solo si hay con qué calcularlas */
  const metas = r2(sumBy(D.goals, gSaved)), conMetas = actual + metas;
  $('#k-goal').textContent = money(conMetas); $('#k-goal').classList.toggle('neg', conMetas < 0);
  $('#f-goals').hidden = !(metas > 0);                       // hay dinero abonado a metas
  $('#f-owed').hidden = !D.loan.some(l => !l.paid);          // hay gente que te debe
  const figs = [...document.querySelectorAll('.figs .fig')].filter(e => !e.hidden), rest = figs.filter(e => !e.classList.contains('main'));
  $('.figs').dataset.n = figs.length;
  figs.forEach(e => e.classList.remove('wide'));
  if (rest.length % 2 === 1) rest[rest.length - 1].classList.add('wide');   // en móvil, si queda uno suelto ocupa todo el ancho
  $('#k-ml').textContent = 'Gastado en ' + new Date().toLocaleDateString('es', { month: 'long' });

  /* Listas */
  $('#l-exp').innerHTML = byDay(sorted(D.exp).slice(0, 500), expRow, g => money(sum(g))) || '<div class="empty">Aún no hay gastos. Agrega el primero arriba.</div>';
  $('#l-sav').innerHTML = byDay(sorted(D.sav).slice(0, 500), savRow, g => signed(r2(sum(g)))) || '<div class="empty">Registra tu primer aporte de ahorro arriba.</div>';

  renderMethods();
  renderCats();
  renderSubs();
  renderGoals();

  const owed = {}; D.loan.filter(l => !l.paid).forEach(l => owed[l.person] = (owed[l.person] || 0) + lLeft(l));
  $('#owed').innerHTML = Object.entries(owed).map(([p, a]) => `<span>${esc(p)}: <b>${money(a)}</b></span>`).join('') || '<span>Nadie te debe nada</span>';
  $('#l-loan').innerHTML = byDay(sorted(D.loan), loanRow, g => 'Prestado ' + money(sum(g))) || '<div class="empty">No has anotado préstamos.</div>';

  /* Historial por período */
  const from = cutoff(per);
  const pexp = D.exp.filter(e => !from || e.date >= from);
  $('#hist-sum').textContent = pexp.length
    ? `${PERIODS[per]}: ${money(sum(pexp))} en ${pexp.length} ${pexp.length === 1 ? 'gasto' : 'gastos'}.`
    : `${PERIODS[per]}: sin gastos registrados.`;
  $('#l-hist').innerHTML = byDay(sorted(pexp), expRow, g => money(sum(g))) || '<div class="empty">No hay gastos en este período.</div>';
  $('#t-cat').textContent = 'Gastos por categoría (' + PERIODS[per].toLowerCase() + ')';

  /* Resumen mensual */
  fillSummary(monthSummary());
  updateBoxes();

  /* Gráfico y leyenda de categorías (con el color e ícono de cada una) */
  const bycat = byCat(pexp);
  const items = D.cats.map((c, i) => ({ c, v: bycat[i] })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const hasCat = items.length > 0, tot = items.reduce((t, x) => t + x.v, 0);
  $('#e-cat').hidden = hasCat;
  $('#c-cat').hidden = !hasCat;
  $('#legend-cat').innerHTML = items.map(x => `<div class="lg-i">${badge(x.c, 'sm')}<span class="nm">${esc(x.c.name)}</span><span class="v">${money(x.v)}<small>${Math.round(x.v / tot * 100)}%</small></span></div>`).join('');

  /* Gráficos */
  if (!window.Chart) return;
  Chart.defaults.font.family = 'Manrope,system-ui,sans-serif';
  Chart.defaults.font.size = 15;
  Chart.defaults.color = '#17302B';
  Chart.defaults.borderColor = '#CFDAD6';

  ch1 && ch1.destroy(); ch1 = null;
  if (hasCat) ch1 = new Chart($('#c-cat'), { type: 'doughnut',
    data: { labels: items.map(x => x.c.name), datasets: [{ data: items.map(x => x.v), backgroundColor: items.map(x => x.c.color), borderWidth: 2 }] },
    options: { maintainAspectRatio: false, cutout: '58%', plugins: {
      legend: { display: false },
      tooltip: { bodyFont: { size: 15 }, callbacks: { label: c => ' ' + c.label + ': ' + money(c.parsed) } } } } });

  const ms = [], now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    ms.push({ k: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), l: d.toLocaleDateString('es', { month: 'short' }) });
  }
  ch2 && ch2.destroy();
  ch2 = new Chart($('#c-mon'), { type: 'bar',
    data: { labels: ms.map(m => m.l), datasets: [{ data: ms.map(m => sum(D.exp.filter(e => e.date.startsWith(m.k)))), backgroundColor: '#1F6F5C', borderRadius: 6 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false },
      tooltip: { bodyFont: { size: 15 }, callbacks: { label: c => ' ' + money(c.parsed.y) } } },
      scales: { x: { ticks: { font: { size: 15 } } },
                y: { beginAtZero: true, suggestedMax: 10, ticks: { font: { size: 14 }, callback: v => '$' + v } } } } });
}

/* ---------- Copia de seguridad ---------- */
$('#bk').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(D)], { type: 'application/json' }));
  a.download = 'copia-finanzas-' + today() + '.json'; a.click(); URL.revokeObjectURL(a.href);
  toast('Copia descargada correctamente');
};
$('#rs').onclick = () => $('#rsf').click();
$('#rsf').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (!Array.isArray(j.sav) || !Array.isArray(j.exp) || !Array.isArray(j.loan)) throw 0;
    if (!confirm('Esto reemplaza todos tus datos actuales. ¿Continuar?')) return;
    D = { sav: j.sav, exp: j.exp, loan: j.loan, met: Array.isArray(j.met) ? j.met : [], cats: Array.isArray(j.cats) ? j.cats : undefined, subs: Array.isArray(j.subs) ? j.subs : [], goals: Array.isArray(j.goals) ? j.goals : [] };
    ensureMethods(); ensureGoals(); ensureLoans(); ensureCats(); applySubs(); render(); toast('Copia restaurada correctamente'); await persist();
  } catch { alert('El archivo no es una copia válida.'); }
  e.target.value = '';
};

buildAcc();

/* ---------- Inicio ---------- */
async function onUser(email, data, err) {
  if (email === null) { D = null; endBoot(); showLock(); if (err) showErr(err); return; }
  if (B.mode === 'cloud' && !sessionAllowed()) { await B.logout(); return; }   // sesión guardada sin "Mantener sesión activa" (o vencida): se pide entrar de nuevo
  endBoot(); enter(email, data);
}
(async () => {
  showLock();
  if (B.mode === 'local') {
    if (!B.supported()) {
      msg('Este navegador solo permite el cifrado desde https o desde localhost. Abre la página con la dirección 127.0.0.1 o localhost, o desde GitHub Pages.');
      $('#go').disabled = true;
    }
    return;
  }
  if (sessionAllowed()) beginBoot();
  try { await B.init(window.FIREBASE_CONFIG, onUser); } catch (e) { endBoot(); showErr(e); }
})();
