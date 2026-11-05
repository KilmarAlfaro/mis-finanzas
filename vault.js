'use strict';
/*
  vault.js: "Mis cuentas" (bóveda de contraseñas).

  SEGURIDAD (cifrado de extremo a extremo; el servidor nunca ve nada legible):
  - Todo se cifra EN EL DISPOSITIVO con AES-256-GCM antes de guardarse. Firestore (o el almacenamiento local) solo recibe texto cifrado.
  - Una clave de datos aleatoria (DEK) cifra las cuentas. La DEK se guarda "envuelta" dos veces: con la contraseña maestra y con
    una clave de recuperación. Ambas se convierten en claves con PBKDF2-SHA256 (600 000 vueltas) y una sal aleatoria.
  - La contraseña maestra y la clave de recuperación NUNCA se guardan ni se envían. Si se pierden las dos, no hay forma de recuperar los datos.
  - Mientras está desbloqueada, la clave vive solo en memoria (CryptoKey no exportable). Se bloquea sola por inactividad,
    al salir de la app unos segundos o al cerrar sesión; al bloquear se borran los datos de pantalla.
  - Este archivo no contiene datos de nadie. Nada sensible va al repositorio de GitHub.
*/
(() => {
  const ITER = 600000, MIN_PW = 10, AAD_TXT = 'mis-cuentas:v1';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const toB64 = u => { let s = ''; u.forEach(c => { s += String.fromCharCode(c); }); return btoa(s); };
  const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const rnd = n => crypto.getRandomValues(new Uint8Array(n));
  const AAD = enc.encode(AAD_TXT);

  /* ---------- Criptografía ---------- */
  async function kdf(secret, salt, iter) {
    const base = await crypto.subtle.importKey('raw', enc.encode(String(secret).normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter || ITER }, base,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function seal(key, bytes) {
    const iv = rnd(12);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, key, bytes);
    return { i: toB64(iv), d: toB64(new Uint8Array(ct)) };
  }
  const unseal = async (key, o) => new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(o.i), additionalData: AAD }, key, fromB64(o.d)));
  const importDek = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  const REC_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';                  // 32 símbolos sin 0/O/1/I: 20 símbolos = 100 bits
  const newRecovery = () => [...rnd(20)].map(x => REC_ALPHA[x & 31]).join('').match(/.{5}/g).join('-');
  const normRec = s => String(s || '').toUpperCase().replace(/[^A-Z2-9]/g, '');

  /* ---------- Verificación en dos pasos (TOTP, compatible con Google Authenticator, Microsoft Authenticator, Authy…) ----------
     RFC 6238: HMAC-SHA1, 6 dígitos, cambia cada 30 s. El secreto se guarda DENTRO del bloque cifrado (data.sec.totp). */
  const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const b32enc = bytes => { let bits = '', out = ''; bytes.forEach(b => { bits += b.toString(2).padStart(8, '0'); }); for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; return out; };
  const b32dec = str => { let bits = ''; for (const c of str.replace(/=+$/, '')) bits += B32.indexOf(c).toString(2).padStart(5, '0'); const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return new Uint8Array(out); };
  async function hotp(secret, counter) {
    const k = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const buf = new ArrayBuffer(8); new DataView(buf).setUint32(4, counter >>> 0); new DataView(buf).setUint32(0, Math.floor(counter / 4294967296));
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, buf)), o = mac[19] & 15;
    const n = ((mac[o] & 0x7f) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3];
    return String(n % 1000000).padStart(6, '0');
  }
  /* Devuelve el "paso" de 30 s en que el código es válido (acepta ±1 paso por diferencias de reloj) o 0 si no lo es. Un paso ya usado no se acepta de nuevo. */
  async function totpCheck(secretB32, code, lastStep) {
    const sec = b32dec(secretB32), now = Math.floor(Date.now() / 30000);
    for (const d of [0, -1, 1]) { const st = now + d; if (st > (lastStep || 0) && await hotp(sec, st) === code) return st; }
    return 0;
  }
  const newBackupCodes = () => Array.from({ length: 8 }, () => { const b = rnd(5); return [...b].map(x => String(x % 100).padStart(2, '0')).join(''); });
  const showBackup = c => c.slice(0, 5) + '-' + c.slice(5);

  /* ---------- Almacenamiento (solo guarda el documento ya cifrado) ---------- */
  const VS = {
    lkey: () => 'fin-vault:' + (B.email() || ''),
    ref() { const u = firebase.auth().currentUser; if (!u) throw Object.assign(new Error('Sin sesión'), { code: 'no-auth' }); return firebase.firestore().collection('boveda').doc(u.uid); },
    async load() {
      if (B.mode === 'local') { try { return JSON.parse(localStorage.getItem(this.lkey())); } catch { return null; } }
      const s = await this.ref().get(); return s.exists ? s.data() : null;
    },
    async save(doc, baseRev) {
      const out = { ...doc, rev: baseRev + 1, updated: new Date().toISOString() };
      if (B.mode === 'local') { localStorage.setItem(this.lkey(), JSON.stringify(out)); return out; }
      const ref = this.ref(), db = firebase.firestore();
      await db.runTransaction(async t => {
        const s = await t.get(ref), cur = s.exists ? (s.data().rev || 0) : 0;
        if (cur !== baseRev) throw Object.assign(new Error('conflict'), { conflict: true });
        t.set(ref, out);
      });
      return out;
    }
  };
  const friendly = e => {
    if (e && e.conflict) return 'Se modificó desde otro dispositivo. Se cargó la versión más reciente: repite el cambio.';
    if (e && e.code === 'permission-denied') return 'Falta autorizar la colección «boveda» en las reglas de Firestore. Publica las reglas del archivo firestore.rules.';
    if (e && (e.code === 'unavailable' || /network|offline/i.test(e.message || ''))) return 'Sin conexión. Inténtalo de nuevo cuando vuelvas a tener internet.';
    return 'No se pudo completar. Inténtalo de nuevo.';
  };

  /* ---------- Estado ---------- */
  let V = null;                       // { key, doc, rev, items, sec } solo mientras está desbloqueada
  let PEND = null;                    // contraseña maestra correcta, pendiente del código de 2 pasos
  let appMode = 'fin', lastFin = 'res', gate = 'loading', fails = 0, waitUntil = 0;
  let idleT = null, hiddenAt = 0, clipT = null, E = null, viewId = '', pickerBuilt = false;
  const FIELDS = [['name', 'Nombre de la cuenta'], ['email', 'Correo'], ['user', 'Nombre de usuario'], ['pass', 'Contraseña']];
  const VT_SECTIONS = ['vt-list', 'vt-sec'];

  /* Íconos propios de esta sección */
  const KEY = svg('<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2"/><path d="M16 7l3 3"/><path d="M14 9l2 2"/>');
  const SHIELDLOCK = svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9a2 2 0 0 1 4 0v2"/>');
  const COPY = svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>');
  const HIST = svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>');
  const PLUS = svg('<path d="M12 5v14M5 12h14"/>');
  const LOCKI = svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>');
  const EYE_ON = '<svg class="i-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="i-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-6.4 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="M2 2l20 20"/></svg>';

  const fmtDT = iso => new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  const lockMin = () => { const v = +localStorage.getItem('vt-lock-min'); return [1, 5, 10, 15, 30].includes(v) ? v : 5; };
  const showErr = (id, msg) => { const el = $('#' + id); if (!el) return; el.textContent = msg || ''; el.hidden = !msg; };
  const initialOf = it => (it.name || '?').trim().charAt(0).toUpperCase();
  const catOfItem = it => (it.brand && VAULT_BRANDS[it.brand]) ? VAULT_BRANDS[it.brand].cat : 'Personalizadas';

  /* Insignia de una cuenta: logo oficial de internet (o réplica propia), ícono genérico o inicial, con el color elegido */
  function vbadge(it, cls = '') {
    const col = HEX.test(it.color || '') ? it.color : '';
    const b = it.brand && VAULT_BRANDS[it.brand];
    if (b) {
      if (b.logo && LOGOS[b.logo]) { const lg = LOGOS[b.logo]; return `<span class="sbadge logo ${cls}" style="background:${lg[0]}" role="img" aria-label="${esc(b.name)}"><svg viewBox="0 0 48 48" aria-hidden="true">${lg[1]}</svg></span>`; }
      const bg = col || '#FFFFFF';
      return `<span class="sbadge ${cls} has-img" data-l="1" style="background:${bg};color:${inkOn(bg)}"><span class="fb">${esc(initialOf(it))}</span>${imgFor(b.dom)}</span>`;
    }
    const bg = col || '#4C7FB5';
    return `<span class="cbadge ${cls}" style="background:${bg};color:${inkOn(bg)}">${it.icon && ICONS[it.icon] ? icon(it.icon) : `<b>${esc(initialOf(it))}</b>`}</span>`;
  }

  /* ---------- Cambio de modo (Mis finanzas / Mis cuentas) ---------- */
  function setMenu(open) { $('#mode-menu').hidden = !open; $('#mode-btn').setAttribute('aria-expanded', String(open)); }
  function setAppMode(m) {
    if (m === appMode) return;
    appMode = m;
    const vault = m === 'vault';
    $('#mode-title').textContent = vault ? 'Mis cuentas' : 'Mis finanzas';
    document.title = vault ? 'Mis cuentas' : 'Mis finanzas';
    document.querySelectorAll('#mode-menu [data-mode]').forEach(b => { b.classList.toggle('on', b.dataset.mode === m); b.setAttribute('aria-checked', String(b.dataset.mode === m)); });
    $('#fin-nav').hidden = vault; $('#vnav').hidden = !vault; $('#sum-open').hidden = vault;
    if (vault) {
      const cur = document.querySelector('main section.on'); if (cur && !VT_SECTIONS.includes(cur.id)) lastFin = cur.id;
      document.querySelectorAll('main section').forEach(s => s.classList.remove('on'));
      selectVTab('vt-list'); enterVault();
    } else {
      document.querySelectorAll('main section').forEach(s => s.classList.toggle('on', s.id === lastFin));
      closeAllModals(); if (window.updateBoxes) updateBoxes(); if (lastFin === 'res') render();
    }
    window.scrollTo({ top: 0 });
  }
  function selectVTab(id) {
    document.querySelectorAll('[data-vtab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.vtab === id)));
    VT_SECTIONS.forEach(s => $('#' + s).classList.toggle('on', s === id));
    if (id === 'vt-sec') renderSec();
  }

  /* ---------- Bloqueo ---------- */
  function closeAllModals() { ['vt-view', 'vt-edit', 'vt-hist'].forEach(id => { $('#' + id).hidden = true; }); E = null; viewId = ''; }
  function clearScreen() {
    ['vt-items', 'vv-rows', 'hist-list'].forEach(id => { $('#' + id).innerHTML = ''; });
    ['ve-name', 've-email', 've-user', 've-pass', 'vt-q', 'sc-cur', 'sc-new', 'sc-new2', 'sc-rec-pw'].forEach(id => { const el = $('#' + id); if (el) el.value = ''; });
    $('#sc-reckey').hidden = true; $('#sc-reckey-val').textContent = '';
    tfStage = 'idle'; tfSecret = ''; ['tf-key', 'tf-codes-list'].forEach(id => { $('#' + id).textContent = ''; }); ['tf-code', 'tf-pw', 'tf-dis-code', 'vg-otp'].forEach(id => { $('#' + id).value = ''; });
    resetEyes();
  }
  function lock(msg) {
    clearTimeout(idleT); clearTimeout(clipT);
    const was = !!V; V = null; PEND = null;
    closeAllModals(); clearScreen();
    if (appMode === 'vault') { renderGate('unlock'); renderSec(); }
    if (was && msg) toast(msg, 'warn');
  }
  function reset() {                                         // al cerrar sesión o entrar con otra cuenta
    clearTimeout(idleT); clearTimeout(clipT); V = null; PEND = null; gate = 'loading';
    closeAllModals(); clearScreen();
    appMode = 'fin'; $('#mode-title').textContent = 'Mis finanzas'; document.title = 'Mis finanzas';
    $('#fin-nav').hidden = false; $('#vnav').hidden = true; $('#sum-open').hidden = false; setMenu(false);
    document.querySelectorAll('main section').forEach(s => s.classList.toggle('on', s.id === 'res'));
    document.querySelectorAll('#mode-menu [data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === 'fin'));
    document.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.tab === 'res'))); lastFin = 'res';
  }
  function bump() { if (!V) return; clearTimeout(idleT); idleT = setTimeout(() => lock('Tus cuentas se bloquearon por inactividad'), lockMin() * 60000); }
  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(ev => document.addEventListener(ev, bump, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (V && hiddenAt && Date.now() - hiddenAt > 60000) lock('Tus cuentas se bloquearon porque saliste de la app');
  });

  /* ---------- Pantalla de acceso a la bóveda ---------- */
  const strength = pw => {
    let c = 0; if (/[a-z]/.test(pw)) c++; if (/[A-Z]/.test(pw)) c++; if (/\d/.test(pw)) c++; if (/[^A-Za-z0-9]/.test(pw)) c++;
    const s = Math.min(pw.length / 4, 6) + c + (new Set(pw).size < pw.length / 2 ? -2 : 0);
    return s < 5 ? [1, 'Débil'] : s < 7 ? [2, 'Aceptable'] : s < 9 ? [3, 'Fuerte'] : [4, 'Muy fuerte'];
  };
  function paintMeter(pw) {
    const m = $('#vg-meter'), [lv, txt] = strength(pw);
    m.dataset.lv = pw ? lv : 0; m.querySelector('span').textContent = pw ? txt : '';
  }
  function renderGate(state) {
    gate = state;
    const T = {
      loading: ['Mis cuentas', 'Comprobando tu bóveda…'],
      error: ['Mis cuentas', ''],
      otp: ['Verificación en dos pasos', 'Abre tu app de autenticación y escribe el código de 6 dígitos de «Mis cuentas». Si perdiste tu teléfono, usa un código de respaldo.'],
      setup: ['Protege tus cuentas', 'Crea una contraseña maestra. Tus datos se cifran en tu dispositivo antes de guardarse: nadie más puede leerlos, ni siquiera quien administra la base de datos.'],
      unlock: ['Desbloquea tus cuentas', 'Escribe tu contraseña maestra para ver tus datos.'],
      forgot: ['Recuperar acceso', 'Escribe tu clave de recuperación y elige una nueva contraseña maestra.'],
      rec: ['Guarda tu clave de recuperación', 'Es la única forma de volver a entrar si olvidas la contraseña maestra. Guárdala en un lugar seguro y fuera de este dispositivo. No se puede volver a ver.']
    }[state];
    $('#vg-title').textContent = T[0]; $('#vg-sub').textContent = T[1];
    const form = ['setup', 'unlock', 'forgot', 'otp'].includes(state);
    $('#vg-form').hidden = !form; $('#vg-recbox').hidden = state !== 'rec';
    $('#vg-l-rec').hidden = state !== 'forgot'; $('#vg-l-otp').hidden = state !== 'otp'; $('#vg-l-pw').hidden = state === 'otp';
    $('#vg-l-pw2').hidden = state === 'unlock' || state === 'otp'; $('#vg-meter').hidden = state === 'unlock' || state === 'otp';
    $('#vg-pw-t').textContent = state === 'forgot' ? 'Nueva contraseña maestra' : 'Contraseña maestra';
    $('#vg-go').textContent = { setup: 'Crear bóveda', unlock: 'Desbloquear', forgot: 'Recuperar acceso', otp: 'Verificar' }[state] || '';
    $('#vg-alt').hidden = !['unlock', 'forgot', 'error', 'otp'].includes(state);
    $('#vg-alt').textContent = state === 'forgot' ? 'Volver' : state === 'error' ? 'Reintentar' : state === 'otp' ? 'Cancelar' : 'Olvidé mi contraseña maestra';
    ['vg-rec', 'vg-pw', 'vg-pw2', 'vg-otp'].forEach(id => { $('#' + id).value = ''; }); paintMeter('');
    resetEyes(); showErr('vg-err', ''); $('#vg-go').disabled = false; delete $('#vg-go').dataset.t;
    $('#vt-gate').hidden = false; $('#vt-open').hidden = true;
    if (form) setTimeout(() => $(state === 'forgot' ? '#vg-rec' : state === 'otp' ? '#vg-otp' : '#vg-pw').focus({ preventScroll: true }), 50);
  }
  async function enterVault() {
    if (V) { renderOpen(); return; }
    renderGate('loading');
    try { const doc = await VS.load(); if (appMode === 'vault' && !V) renderGate(doc ? 'unlock' : 'setup'); }
    catch (e) { renderGate('error'); $('#vg-sub').textContent = friendly(e); }
  }
  const busy = (on, txt) => {
    const b = $('#vg-go');
    if (on) { b.dataset.t = b.dataset.t || b.textContent; b.textContent = txt; b.disabled = true; }
    else { if (b.dataset.t) { b.textContent = b.dataset.t; delete b.dataset.t; } b.disabled = false; }
  };

  async function loadData(key, doc) {
    const d = JSON.parse(dec.decode(await unseal(key, doc.data)));
    return { items: Array.isArray(d.items) ? d.items : [], sec: d.sec && typeof d.sec === 'object' ? d.sec : {} };
  }
  async function persistItems() {
    const doc = { ...V.doc, data: await seal(V.key, enc.encode(JSON.stringify({ items: V.items, sec: V.sec || {} }))) };
    try { const out = await VS.save(doc, V.rev); V.doc = out; V.rev = out.rev; }
    catch (e) {
      if (e.conflict) { try { const cur = await VS.load(), d = await loadData(V.key, cur); V.items = d.items; V.sec = d.sec; V.doc = cur; V.rev = cur.rev || 0; renderOpen(); } catch {} }
      throw e;
    }
  }

  $('#vg-form').addEventListener('submit', async e => {
    e.preventDefault();
    showErr('vg-err', '');
    const pw = $('#vg-pw').value, pw2 = $('#vg-pw2').value, rec = $('#vg-rec').value;
    if (!['unlock', 'forgot', 'setup', 'otp'].includes(gate)) return;
    if (Date.now() < waitUntil) return showErr('vg-err', `Demasiados intentos. Espera ${Math.ceil((waitUntil - Date.now()) / 1000)} s.`);
    if (gate === 'otp') {
      const code = $('#vg-otp').value.replace(/[\s-]/g, '');
      if (!PEND) return renderGate('unlock');
      if (!code) return showErr('vg-err', 'Escribe el código de 6 dígitos.');
      busy(true, 'Verificando…');
      const t = PEND.data.sec.totp; let step = 0, backup = false;
      if (/^\d{6}$/.test(code)) step = await totpCheck(t.secret, code, t.last || 0);
      else if (/^\d{10}$/.test(code)) { const i = (t.backup || []).indexOf(code); if (i >= 0) { t.backup.splice(i, 1); backup = true; } }
      if (!step && !backup) {
        fails++; if (fails >= 3) waitUntil = Date.now() + Math.min(60, 5 * 2 ** (fails - 3)) * 1000;
        busy(false); return showErr('vg-err', 'El código no es correcto o ya se usó. Revisa que la hora de tu teléfono esté en automático.');
      }
      if (step) t.last = step;
      V = { key: PEND.key, doc: PEND.doc, rev: PEND.doc.rev || 0, items: PEND.data.items, sec: PEND.data.sec }; PEND = null;
      fails = 0; waitUntil = 0; bump(); renderOpen();
      try { await persistItems(); } catch {}                         // guarda el último código usado (no se puede repetir) o el respaldo gastado
      if (backup) toast(`Usaste un código de respaldo. Te quedan ${V.sec.totp.backup.length}.`, 'warn');
      return;
    }
    if (gate === 'unlock') {
      if (!pw) return showErr('vg-err', 'Escribe tu contraseña maestra.');
      busy(true, 'Verificando…');
      try {
        const doc = await VS.load(); if (!doc) throw new Error('nodoc');
        let raw;
        try { raw = await unseal(await kdf(pw, fromB64(doc.pw.s), doc.iter), doc.pw); }
        catch { fails++; if (fails >= 3) waitUntil = Date.now() + Math.min(60, 5 * 2 ** (fails - 3)) * 1000; busy(false); return showErr('vg-err', 'La contraseña maestra no es correcta.'); }
        const key = await importDek(raw); raw.fill(0);
        const data = await loadData(key, doc), tf = data.sec.totp;
        if (tf && tf.enabled) { PEND = { key, doc, data }; renderGate('otp'); return; }          // falta el código de la app de autenticación
        V = { key, doc, rev: doc.rev || 0, items: data.items, sec: data.sec };
        fails = 0; waitUntil = 0; bump(); renderOpen();
      } catch (er) { busy(false); showErr('vg-err', friendly(er)); }
      return;
    }
    if (pw.length < MIN_PW) return showErr('vg-err', `La contraseña maestra debe tener al menos ${MIN_PW} caracteres.`);
    if (pw !== pw2) return showErr('vg-err', 'Las contraseñas no coinciden.');
    if (gate === 'setup') {
      busy(true, 'Cifrando…');
      try {
        const dek = rnd(32), recKey = newRecovery(), sP = rnd(16), sR = rnd(16);
        const [kP, kR] = await Promise.all([kdf(pw, sP), kdf(normRec(recKey), sR)]);
        const key = await importDek(dek);
        const doc = { v: 1, iter: ITER, pw: { s: toB64(sP), ...(await seal(kP, dek)) }, rk: { s: toB64(sR), ...(await seal(kR, dek)) }, data: await seal(key, enc.encode(JSON.stringify({ items: [], sec: {} }))) };
        const out = await VS.save(doc, 0); dek.fill(0);
        V = { key, doc: out, rev: out.rev, items: [], sec: {} };
        $('#vg-reckey').textContent = recKey; $('#vg-saved').checked = false; $('#vg-done').disabled = true;
        renderGate('rec');
      } catch (er) {
        busy(false);
        if (er.conflict) { renderGate('unlock'); showErr('vg-err', 'Ya existe una bóveda en tu cuenta. Desbloquéala con tu contraseña maestra.'); }
        else showErr('vg-err', friendly(er));
      }
      return;
    }
    if (gate === 'forgot') {                                              // recuperar con la clave de recuperación
      if (!normRec(rec)) return showErr('vg-err', 'Escribe tu clave de recuperación.');
      busy(true, 'Verificando…');
      try {
        const doc = await VS.load(); if (!doc) throw new Error('nodoc');
        let raw;
        try { raw = await unseal(await kdf(normRec(rec), fromB64(doc.rk.s), doc.iter), doc.rk); }
        catch { fails++; if (fails >= 3) waitUntil = Date.now() + Math.min(60, 5 * 2 ** (fails - 3)) * 1000; busy(false); return showErr('vg-err', 'La clave de recuperación no es correcta.'); }
        const sP = rnd(16), nd = { ...doc, pw: { s: toB64(sP), ...(await seal(await kdf(pw, sP, doc.iter), raw)) } };
        const out = await VS.save(nd, doc.rev || 0), key = await importDek(raw); raw.fill(0);
        const data = await loadData(key, out), had = !!(data.sec.totp && data.sec.totp.enabled);
        V = { key, doc: out, rev: out.rev, items: data.items, sec: data.sec };
        if (had) { V.sec.totp = null; try { await persistItems(); } catch {} }
        fails = 0; waitUntil = 0; bump(); renderOpen(); toast(had ? 'Contraseña maestra actualizada. La verificación en dos pasos se desactivó: vuelve a activarla en Seguridad.' : 'Contraseña maestra actualizada');
      } catch (er) { busy(false); showErr('vg-err', friendly(er)); }
    }
  });
  $('#vg-pw').addEventListener('input', e => { if (gate !== 'unlock') paintMeter(e.target.value); });
  $('#vg-alt').onclick = () => { if (gate === 'error') enterVault(); else if (gate === 'otp') { PEND = null; renderGate('unlock'); } else renderGate(gate === 'forgot' ? 'unlock' : 'forgot'); };
  $('#vg-saved').addEventListener('change', e => { $('#vg-done').disabled = !e.target.checked; });
  $('#vg-done').onclick = () => { $('#vg-reckey').textContent = ''; bump(); renderOpen(); toast('Bóveda creada correctamente'); };
  $('#vg-copy').onclick = () => copyText($('#vg-reckey').textContent, 'Clave de recuperación');

  async function copyText(txt, what) {
    try { await navigator.clipboard.writeText(txt); } catch { return toast('No se pudo copiar. Cópialo manualmente.', 'warn'); }
    toast(`${what} copiado. Se borrará del portapapeles en 30 s`);
    clearTimeout(clipT); clipT = setTimeout(() => { navigator.clipboard.writeText(' ').catch(() => {}); }, 30000);
  }

  /* ---------- Lista de cuentas ---------- */
  function renderOpen() {
    $('#vt-gate').hidden = true; $('#vt-open').hidden = false;
    renderList(); renderSec();
  }
  function renderList() {
    if (!V) return;
    const q = norm($('#vt-q').value), cat = $('#vt-cat').value;
    const cnt = {}; V.items.forEach(it => { const c = catOfItem(it); cnt[c] = (cnt[c] || 0) + 1; });
    const cats = Object.keys(cnt).sort((a, b) => a.localeCompare(b, 'es'));
    const sel = $('#vt-cat'); const keep = cats.includes(cat) ? cat : 'all';
    sel.innerHTML = `<option value="all">Todas las categorías (${V.items.length})</option>` + cats.map(c => `<option value="${esc(c)}">${esc(c)} (${cnt[c]})</option>`).join('');
    sel.value = keep; sel.classList.toggle('on', keep !== 'all');
    const list = V.items.filter(it => (keep === 'all' || catOfItem(it) === keep)
      && (!q || norm([it.name, it.email, it.user].join(' ')).includes(q))).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    $('#vt-count').textContent = V.items.length ? `${V.items.length} ${V.items.length === 1 ? 'cuenta guardada' : 'cuentas guardadas'}` : 'Aún no tienes cuentas guardadas';
    $('#vt-items').innerHTML = list.map(it => `<div class="vt-item"><button type="button" class="vt-main" data-open="${esc(it.id)}">${vbadge(it)}<span class="vt-t"><b>${esc(it.name)}</b><small>${esc(it.email || it.user || '')}</small></span></button><button type="button" class="vt-q" data-copy="${esc(it.id)}" aria-label="Copiar contraseña de ${esc(it.name)}" title="Copiar contraseña">${KEY}</button></div>`).join('');
    const empty = $('#vt-empty');
    empty.hidden = list.length > 0;
    empty.innerHTML = V.items.length ? 'No hay cuentas que coincidan con tu búsqueda.' : `<span class="vt-empty-ico">${KEY}</span><b>Guarda tu primera cuenta</b><span>Agrega correo o usuario y su contraseña. Se guardan cifrados.</span>`;
  }
  $('#vt-q').addEventListener('input', renderList);
  $('#vt-cat').addEventListener('change', renderList);
  $('#vt-items').addEventListener('click', e => {
    const o = e.target.closest('[data-open]'), c = e.target.closest('[data-copy]');
    if (o) openView(o.dataset.open);
    else if (c) { const it = V && V.items.find(x => x.id === c.dataset.copy); if (it) copyText(it.pass, 'Contraseña'); }
  });
  $('#vt-add').onclick = () => openEdit();
  $('#vt-lockbtn').onclick = () => lock('Tus cuentas están bloqueadas');

  /* ---------- Ver una cuenta ---------- */
  function openView(id) {
    const it = V && V.items.find(x => x.id === id); if (!it) return;
    viewId = id;
    $('#vv-badge').innerHTML = vbadge(it, 'big');
    $('#vv-title').textContent = it.name;
    $('#vv-meta').textContent = (it.updated && it.updated !== it.created ? 'Modificada el ' : 'Creada el ') + fmtDT(it.updated || it.created);
    const rows = [];
    if (it.email) rows.push(['email', 'Correo', it.email]);
    if (it.user) rows.push(['user', 'Nombre de usuario', it.user]);
    rows.push(['pass', 'Contraseña', it.pass]);
    $('#vv-rows').innerHTML = rows.map(([k, l, v]) => `<div class="vv-row"><div class="vv-l">${l}</div><div class="vv-v"><span class="vv-val${k === 'pass' ? ' pw' : ''}" data-f="${k}">${k === 'pass' ? '••••••••••' : esc(v)}</span>`
      + (k === 'pass' ? `<button type="button" class="vv-eye" data-reveal="pass" aria-label="Mostrar contraseña" aria-pressed="false" title="Mostrar contraseña">${EYE_ON}</button>` : '')
      + `<button type="button" class="vv-copy" data-cp="${k}" aria-label="Copiar ${l.toLowerCase()}" title="Copiar">${COPY}</button></div></div>`).join('');
    $('#vv-hist').hidden = !(it.history && it.history.length);
    showModal($('#vt-view'));
  }
  const closeView = async () => { await hideModal($('#vt-view')); viewId = ''; $('#vv-rows').innerHTML = ''; };
  $('#vv-rows').addEventListener('click', e => {
    const it = V && V.items.find(x => x.id === viewId); if (!it) return;
    const r = e.target.closest('[data-reveal]'), c = e.target.closest('[data-cp]');
    if (r) {
      const val = r.closest('.vv-v').querySelector('.vv-val'), on = r.getAttribute('aria-pressed') !== 'true';
      val.textContent = on ? it.pass : '••••••••••'; r.classList.toggle('on', on); r.setAttribute('aria-pressed', String(on));
      const t = on ? 'Ocultar contraseña' : 'Mostrar contraseña'; r.setAttribute('aria-label', t); r.title = t;
    } else if (c) copyText(it[c.dataset.cp], { email: 'Correo', user: 'Usuario', pass: 'Contraseña' }[c.dataset.cp]);
  });
  $('#vv-close').onclick = closeView;
  $('#vt-view').addEventListener('click', e => { if (e.target.id === 'vt-view') closeView(); });
  $('#vv-edit').onclick = async () => { const id = viewId; await closeView(); openEdit(id); };
  $('#vv-hist').onclick = () => openHist(viewId);
  $('#vv-del').onclick = async () => {
    const it = V && V.items.find(x => x.id === viewId); if (!it) return;
    if (!(await askDelete(`la cuenta «${it.name}» con su contraseña e historial`, '¿Seguro que quieres eliminar esta cuenta?'))) return;
    const before = V.items; V.items = V.items.filter(x => x.id !== it.id);
    try { await persistItems(); } catch (er) { if (!er.conflict) V.items = before; return toast(friendly(er), 'warn'); }
    await closeView(); renderList(); toast('Cuenta eliminada correctamente');
  };

  /* ---------- Historial de cambios ---------- */
  function openHist(id) {
    const it = V && V.items.find(x => x.id === id); if (!it) return;
    $('#hist-title').textContent = 'Historial de «' + it.name + '»';
    const mask = '••••••••••';
    $('#hist-list').innerHTML = (it.history || []).map(h => `<div class="hs-entry"><div class="hs-date">${HIST}<span>${fmtDT(h.at)}</span></div>${h.ch.map(c => {
      const sec = c.k === 'pass', show = v => v ? esc(v) : '<i>(vacío)</i>';
      return `<div class="hs-ch"><b>${esc(c.f)}</b><div class="hs-from"><em>Antes</em><span class="hs-v${sec ? ' pw' : ''}" data-r="${esc(c.from)}">${sec && c.from ? mask : show(c.from)}</span></div><div class="hs-to"><em>Ahora</em><span class="hs-v${sec ? ' pw' : ''}" data-r="${esc(c.to)}">${sec && c.to ? mask : show(c.to)}</span></div>${sec ? `<button type="button" class="filt-x hs-eye" data-hs="1" aria-pressed="false">Mostrar contraseñas</button>` : ''}</div>`;
    }).join('')}</div>`).join('');
    showModal($('#vt-hist'));
  }
  const closeHist = async () => { await hideModal($('#vt-hist')); $('#hist-list').innerHTML = ''; };
  $('#hist-list').addEventListener('click', e => {
    const b = e.target.closest('[data-hs]'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true', box = b.closest('.hs-ch');
    box.querySelectorAll('.hs-v.pw').forEach(s => { const raw = s.dataset.r; s.innerHTML = raw ? (on ? esc(raw) : '••••••••••') : '<i>(vacío)</i>'; });
    b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Ocultar contraseñas' : 'Mostrar contraseñas';
  });
  $('#hist-close').onclick = closeHist;
  $('#vt-hist').addEventListener('click', e => { if (e.target.id === 'vt-hist') closeHist(); });

  /* ---------- Agregar / editar ---------- */
  const GEN = () => {
    const L = 'abcdefghijkmnopqrstuvwxyz', U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', N = '23456789', S = '!@#$%^&*-_=+?', ALL = L + U + N + S, pick = s => s[rnd(1)[0] % s.length];
    const out = [pick(L), pick(U), pick(N), pick(S)]; while (out.length < 18) out.push(pick(ALL));
    for (let i = out.length - 1; i > 0; i--) { const j = rnd(1)[0] % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
    return out.join('');
  };
  function buildPicker() {
    if (pickerBuilt) return; pickerBuilt = true;
    $('#ve-swatches').innerHTML = SWATCHES.map(([h, n]) => `<label class="sw" title="${n}"><input type="radio" name="ve-color" value="${h}" aria-label="${n}"><span style="background:${h}"></span></label>`).join('')
      + '<label class="sw custom" title="Color personalizado"><input type="color" id="ve-custom" aria-label="Color personalizado" value="#1f6f5c"><span></span></label>';
    const badge = d => `<span class="sbadge sm has-img" data-l="1" style="background:#fff;color:#17302B"><span class="fb">${esc(d.name.charAt(0).toUpperCase())}</span>${imgFor(d.dom)}</span>`;
    const lbl = (val, name, inner, extra = '') => `<label class="bk" data-n="${esc((name + ' ' + extra).toLowerCase())}"><input type="radio" name="ve-icon" value="${esc(val)}" aria-label="${esc(name)}"><span class="bk-in">${inner}<span class="nm">${esc(name)}</span></span></label>`;
    let html = `<div class="ic-group"><h3>Sin ícono</h3><div class="bk-row">${lbl('', 'Solo la inicial', '<span class="cbadge sm" style="background:#8A9C96;color:#fff"><b>A</b></span>')}</div></div>`;
    VAULT_CATALOG.forEach(g => {
      const seen = new Set();
      html += `<div class="ic-group"><h3>${esc(g.name)}</h3><div class="bk-row">${g.items.filter(([, d]) => !seen.has(d) && seen.add(d)).map(([name, dom, lg]) => {
        const inner = lg && LOGOS[lg] ? `<span class="sbadge sm logo" style="background:${LOGOS[lg][0]}"><svg viewBox="0 0 48 48" aria-hidden="true">${LOGOS[lg][1]}</svg></span>` : badge({ name, dom });
        return lbl('b:' + dom, name, inner, dom);
      }).join('')}</div></div>`;
    });
    ICON_GROUPS.forEach(g => { html += `<div class="ic-group"><h3>Genéricos · ${esc(g.name)}</h3><div class="bk-row">${g.icons.map(([k, n]) => lbl('i:' + k, n, `<span class="cbadge sm" style="background:#4C7FB5;color:#fff">${icon(k)}</span>`)).join('')}</div></div>`; });
    $('#ve-icons').innerHTML = html;
  }
  function paintPrev() {
    if (!E) return;
    const tmp = { name: $('#ve-name').value || '?', brand: E.brand, icon: E.icon, color: E.color };
    $('#ve-prev').innerHTML = vbadge(tmp, 'big');
  }
  function selectIcon(val) {
    E.brand = val.startsWith('b:') ? val.slice(2) : ''; E.icon = val.startsWith('i:') ? val.slice(2) : '';
    const r = [...document.querySelectorAll('input[name=ve-icon]')].find(x => x.value === val); if (r) r.checked = true;
    paintPrev();
  }
  function openEdit(id) {
    if (!V) return;
    buildPicker();
    const it = id ? V.items.find(x => x.id === id) : null;
    E = { id: it ? it.id : '', brand: it ? it.brand || '' : '', icon: it ? it.icon || '' : '', color: it ? it.color || '' : '' };
    $('#ve-title').textContent = it ? 'Editar cuenta' : 'Nueva cuenta';
    $('#ve-save').textContent = it ? 'Guardar cambios' : 'Guardar cuenta';
    $('#ve-name').value = it ? it.name : ''; $('#ve-email').value = it ? it.email || '' : ''; $('#ve-user').value = it ? it.user || '' : ''; $('#ve-pass').value = it ? it.pass : '';
    ['ve-e-name', 've-e-id', 've-e-pass', 've-e-mail'].forEach(x => showErr(x, ''));
    resetEyes(); $('#ve-search').value = ''; filterPicker();
    const val = E.brand ? 'b:' + E.brand : E.icon ? 'i:' + E.icon : ''; selectIcon(val);
    document.querySelectorAll('input[name=ve-color]').forEach(r => { r.checked = r.value.toLowerCase() === E.color.toLowerCase(); });
    showModal($('#vt-edit')); $('#ve-name').focus({ preventScroll: true });
    const sel = document.querySelector('input[name=ve-icon]:checked'); if (sel) setTimeout(() => sel.closest('.bk').scrollIntoView({ block: 'nearest' }), 80);
  }
  const closeEdit = async () => { await hideModal($('#vt-edit')); E = null; ['ve-name', 've-email', 've-user', 've-pass'].forEach(x => { $('#' + x).value = ''; }); resetEyes(); };
  function filterPicker() {
    const q = norm($('#ve-search').value); let any = false;
    document.querySelectorAll('#ve-icons .bk').forEach(l => { const show = !q || norm(l.dataset.n).includes(q); l.hidden = !show; if (show) any = true; });
    document.querySelectorAll('#ve-icons .ic-group').forEach(g => { g.hidden = ![...g.querySelectorAll('.bk')].some(l => !l.hidden); });
    $('#ve-empty').hidden = any;
  }
  $('#ve-search').addEventListener('input', filterPicker);
  $('#ve-icons').addEventListener('change', e => { if (e.target.name === 've-icon') selectIcon(e.target.value); });
  $('#ve-swatches').addEventListener('change', e => { if (e.target.name === 've-color') { E.color = e.target.value; paintPrev(); } });
  $('#ve-swatches').addEventListener('input', e => { if (e.target.id === 've-custom') { E.color = e.target.value; document.querySelectorAll('input[name=ve-color]').forEach(r => { r.checked = false; }); paintPrev(); } });
  $('#ve-color-reset').onclick = () => { E.color = ''; document.querySelectorAll('input[name=ve-color]').forEach(r => { r.checked = false; }); paintPrev(); };
  $('#ve-name').addEventListener('input', paintPrev);
  $('#ve-gen').onclick = () => {
    const p = $('#ve-pass'); p.value = GEN(); showErr('ve-e-pass', '');
    const b = document.querySelector('[data-eye=ve-pass]'); if (b && p.type === 'password') b.click();      // se muestra para que la puedas ver y copiar
  };
  $('#ve-cancel').onclick = closeEdit;
  $('#ve-save').onclick = async () => {
    if (!V || !E) return;
    const f = { name: $('#ve-name').value.trim(), email: $('#ve-email').value.trim(), user: $('#ve-user').value.trim(), pass: $('#ve-pass').value };
    let bad = null;
    showErr('ve-e-name', ''); showErr('ve-e-id', ''); showErr('ve-e-pass', ''); showErr('ve-e-mail', '');
    if (!f.name) { showErr('ve-e-name', 'Escribe el nombre de la cuenta.'); bad = bad || '#ve-name'; }
    if (!f.email && !f.user) { showErr('ve-e-id', 'Escribe al menos el correo o el nombre de usuario.'); bad = bad || '#ve-email'; }
    else if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) { showErr('ve-e-mail', 'Escribe un correo válido.'); bad = bad || '#ve-email'; }
    if (!f.pass) { showErr('ve-e-pass', 'Escribe la contraseña.'); bad = bad || '#ve-pass'; }
    if (bad) return $(bad).focus();
    const now = new Date().toISOString(), old = E.id ? V.items.find(x => x.id === E.id) : null;
    const snapshot = JSON.stringify(V.items);
    let it;
    if (old) {
      it = old;
      const ch = FIELDS.filter(([k]) => (old[k] || '') !== f[k]).map(([k, l]) => ({ k, f: l, from: old[k] || '', to: f[k] }));
      if (ch.length) { old.history = old.history || []; old.history.unshift({ at: now, ch }); }
      Object.assign(old, f, { brand: E.brand, icon: E.icon, color: E.color });
      if (ch.length) old.updated = now;
    } else {
      it = { id: uid(), ...f, brand: E.brand, icon: E.icon, color: E.color, created: now, updated: now, history: [] };
      V.items.push(it);
    }
    const btn = $('#ve-save'), t = btn.textContent; btn.disabled = true; btn.textContent = 'Guardando…';
    try { await persistItems(); }
    catch (er) { if (!er.conflict) V.items = JSON.parse(snapshot); btn.disabled = false; btn.textContent = t; return toast(friendly(er), 'warn'); }
    btn.disabled = false; btn.textContent = t;
    const wasEdit = !!old, id = it.id;
    await closeEdit(); renderList();
    toast(wasEdit ? 'Cambios guardados correctamente' : 'Cuenta guardada correctamente');
    if (wasEdit) openView(id);
  };

  /* ---------- Seguridad ---------- */
  function renderSec() {
    const unlocked = !!V;
    $('#sc-locked').hidden = unlocked; $('#sc-body').hidden = !unlocked;
    $('#sc-lockmin').value = String(lockMin());
    renderTF();
  }

  /* ---------- Seguridad: verificación en dos pasos ---------- */
  let tfStage = 'idle', tfSecret = '';                        // idle | setup | codes
  const tfOn = () => !!(V && V.sec && V.sec.totp && V.sec.totp.enabled);
  function renderTF() {
    const on = tfOn(), st = V ? tfStage : 'idle';
    $('#tf-off').hidden = !(!on && st === 'idle'); $('#tf-setup').hidden = st !== 'setup';
    $('#tf-codes').hidden = st !== 'codes'; $('#tf-on').hidden = !(on && st === 'idle');
    $('#tf-state').textContent = on ? 'Activada' : 'Desactivada'; $('#tf-state').dataset.on = on ? '1' : '0';
    if (on) { const n = V.sec.totp.backup.length; $('#tf-left').textContent = n ? `Te quedan ${n} ${n === 1 ? 'código de respaldo' : 'códigos de respaldo'}.` : 'Ya no te quedan códigos de respaldo: genera nuevos.'; }
  }
  function showBackupCodes(codes) {
    $('#tf-codes-list').innerHTML = codes.map(c => `<span>${showBackup(c)}</span>`).join('');
    $('#tf-codes-saved').checked = false; $('#tf-codes-done').disabled = true; tfStage = 'codes'; renderTF();
  }
  $('#tf-start').onclick = () => {
    tfSecret = b32enc(rnd(20));
    $('#tf-key').textContent = tfSecret.match(/.{4}/g).join(' ');
    const who = encodeURIComponent((B.email && B.email()) || 'mis-cuentas');
    $('#tf-open').href = `otpauth://totp/Mis%20cuentas:${who}?secret=${tfSecret}&issuer=Mis%20cuentas&algorithm=SHA1&digits=6&period=30`;
    $('#tf-code').value = ''; showErr('tf-err', ''); tfStage = 'setup'; renderTF();
  };
  $('#tf-copy').onclick = () => copyText(tfSecret, 'Clave');
  $('#tf-cancel').onclick = () => { tfSecret = ''; $('#tf-key').textContent = ''; $('#tf-code').value = ''; tfStage = 'idle'; renderTF(); };
  $('#tf-verify').onclick = async () => {
    showErr('tf-err', ''); const code = $('#tf-code').value.replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) return showErr('tf-err', 'Escribe los 6 dígitos que muestra tu app de autenticación.');
    const step = await totpCheck(tfSecret, code, 0);
    if (!step) return showErr('tf-err', 'El código no coincide. Revisa que la clave esté bien escrita y que la hora de tu teléfono esté en automático.');
    const b = $('#tf-verify'); b.disabled = true;
    const codes = newBackupCodes(); V.sec = V.sec || {};
    V.sec.totp = { enabled: true, secret: tfSecret, backup: codes, last: step, since: new Date().toISOString() };
    try { await persistItems(); }
    catch (er) { V.sec.totp = null; b.disabled = false; return showErr('tf-err', friendly(er)); }
    b.disabled = false; tfSecret = ''; $('#tf-key').textContent = ''; $('#tf-code').value = '';
    showBackupCodes(codes); toast('Verificación en dos pasos activada');
  };
  $('#tf-codes-saved').addEventListener('change', e => { $('#tf-codes-done').disabled = !e.target.checked; });
  $('#tf-codes-copy').onclick = () => copyText([...$('#tf-codes-list').children].map(x => x.textContent).join('\n'), 'Códigos de respaldo');
  $('#tf-codes-done').onclick = () => { $('#tf-codes-list').textContent = ''; tfStage = 'idle'; renderTF(); };
  async function tfCodeOk(raw) {                                  // acepta código de la app o uno de respaldo
    const t = V.sec.totp, code = raw.replace(/[\s-]/g, '');
    if (/^\d{6}$/.test(code)) { const st = await totpCheck(t.secret, code, t.last || 0); if (st) { t.last = st; return true; } return false; }
    if (/^\d{10}$/.test(code)) { const i = t.backup.indexOf(code); if (i >= 0) { t.backup.splice(i, 1); return true; } }
    return false;
  }
  $('#tf-regen').onclick = async () => {
    showErr('tf-on-err', ''); const pw = $('#tf-pw').value;
    if (!pw) return showErr('tf-on-err', 'Escribe tu contraseña maestra para continuar.');
    const v = await verifyMaster(pw); if (!v) return showErr('tf-on-err', 'La contraseña maestra no es correcta.'); v.raw.fill(0);
    const prev = V.sec.totp.backup, codes = newBackupCodes(); V.sec.totp.backup = codes;
    try { await persistItems(); } catch (er) { V.sec.totp.backup = prev; return showErr('tf-on-err', friendly(er)); }
    $('#tf-pw').value = ''; resetEyes(); showBackupCodes(codes); toast('Códigos de respaldo nuevos generados');
  };
  $('#tf-disable').onclick = async () => {
    showErr('tf-on-err', ''); const pw = $('#tf-pw').value, code = $('#tf-dis-code').value;
    if (!pw || !code) return showErr('tf-on-err', 'Escribe tu contraseña maestra y un código de tu app de autenticación.');
    const v = await verifyMaster(pw); if (!v) return showErr('tf-on-err', 'La contraseña maestra no es correcta.'); v.raw.fill(0);
    if (!(await tfCodeOk(code))) return showErr('tf-on-err', 'El código no es correcto o ya se usó.');
    const prev = V.sec.totp; V.sec.totp = null;
    try { await persistItems(); } catch (er) { V.sec.totp = prev; return showErr('tf-on-err', friendly(er)); }
    ['tf-pw', 'tf-dis-code'].forEach(id => { $('#' + id).value = ''; }); resetEyes(); renderTF(); toast('Verificación en dos pasos desactivada');
  };
  $('#sc-lockmin').addEventListener('change', e => { localStorage.setItem('vt-lock-min', e.target.value); bump(); toast('Bloqueo automático actualizado'); });
  $('#sc-now').onclick = () => { lock('Tus cuentas están bloqueadas'); selectVTab('vt-list'); };
  $('#sc-go').onclick = () => selectVTab('vt-list');
  async function verifyMaster(pw) {                                 // devuelve los bytes de la DEK si la contraseña maestra es correcta
    const cur = await VS.load();
    try { return { raw: await unseal(await kdf(pw, fromB64(cur.pw.s), cur.iter), cur.pw), cur }; } catch { return null; }
  }
  $('#sc-form').addEventListener('submit', async e => {
    e.preventDefault(); showErr('sc-err', '');
    const o = $('#sc-cur').value, n = $('#sc-new').value, n2 = $('#sc-new2').value;
    if (!o) return showErr('sc-err', 'Escribe tu contraseña maestra actual.');
    if (n.length < MIN_PW) return showErr('sc-err', `La nueva contraseña debe tener al menos ${MIN_PW} caracteres.`);
    if (n !== n2) return showErr('sc-err', 'Las contraseñas nuevas no coinciden.');
    const b = $('#sc-save'); b.disabled = true; const t = b.textContent; b.textContent = 'Guardando…';
    try {
      const v = await verifyMaster(o);
      if (!v) return showErr('sc-err', 'La contraseña maestra actual no es correcta.');
      const sP = rnd(16), nd = { ...v.cur, pw: { s: toB64(sP), ...(await seal(await kdf(n, sP, v.cur.iter), v.raw)) } };
      v.raw.fill(0);
      const out = await VS.save(nd, v.cur.rev || 0); V.doc = out; V.rev = out.rev;
      ['sc-cur', 'sc-new', 'sc-new2'].forEach(id => { $('#' + id).value = ''; }); resetEyes(); paintMeterSec('');
      toast('Contraseña maestra cambiada correctamente');
    } catch (er) { showErr('sc-err', friendly(er)); }
    finally { b.disabled = false; b.textContent = t; }
  });
  function paintMeterSec(pw) { const m = $('#sc-meter'), [lv, txt] = strength(pw); m.dataset.lv = pw ? lv : 0; m.querySelector('span').textContent = pw ? txt : ''; }
  $('#sc-new').addEventListener('input', e => paintMeterSec(e.target.value));
  $('#sc-rec-go').onclick = async () => {
    showErr('sc-rec-err', ''); const pw = $('#sc-rec-pw').value;
    if (!pw) return showErr('sc-rec-err', 'Escribe tu contraseña maestra para continuar.');
    const b = $('#sc-rec-go'); b.disabled = true; const t = b.textContent; b.textContent = 'Generando…';
    try {
      const v = await verifyMaster(pw);
      if (!v) return showErr('sc-rec-err', 'La contraseña maestra no es correcta.');
      const rec = newRecovery(), sR = rnd(16), nd = { ...v.cur, rk: { s: toB64(sR), ...(await seal(await kdf(normRec(rec), sR, v.cur.iter), v.raw)) } };
      v.raw.fill(0);
      const out = await VS.save(nd, v.cur.rev || 0); V.doc = out; V.rev = out.rev;
      $('#sc-reckey-val').textContent = rec; $('#sc-reckey').hidden = false; $('#sc-rec-pw').value = ''; resetEyes();
      toast('Nueva clave de recuperación generada');
    } catch (er) { showErr('sc-rec-err', friendly(er)); }
    finally { b.disabled = false; b.textContent = t; }
  };
  $('#sc-rec-copy').onclick = () => copyText($('#sc-reckey-val').textContent, 'Clave de recuperación');
  $('#sc-rec-hide').onclick = () => { $('#sc-reckey').hidden = true; $('#sc-reckey-val').textContent = ''; };

  /* ---------- Menú de modo y pestañas ---------- */
  $('#mode-btn').addEventListener('click', e => { e.stopPropagation(); setMenu($('#mode-menu').hidden); });
  document.addEventListener('click', e => { if (!$('#mode-menu').hidden && !e.target.closest('.modewrap')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#mode-menu').hidden) { setMenu(false); $('#mode-btn').focus(); } });
  document.querySelectorAll('#mode-menu [data-mode]').forEach(b => b.addEventListener('click', () => { setMenu(false); setAppMode(b.dataset.mode); }));
  document.querySelectorAll('[data-vtab]').forEach(b => b.addEventListener('click', () => selectVTab(b.dataset.vtab)));
  ['ve-name', 've-email', 've-user', 've-pass'].forEach(id => $('#' + id).addEventListener('input', () => ['ve-e-name', 've-e-id', 've-e-pass', 've-e-mail'].forEach(x => showErr(x, ''))));

  /* ---------- Enlaces con app.js ---------- */
  window.vaultReset = reset;
  window.vaultEsc = id => ({ 'vt-view': closeView, 'vt-edit': closeEdit, 'vt-hist': closeHist }[id] || (() => {}))();
  window.vaultState = () => ({ mode: appMode, unlocked: !!V, items: V ? V.items.length : 0 });   // útil para pruebas
})();
