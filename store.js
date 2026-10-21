'use strict';
/*
  store.js: guarda y protege los datos. No toca la pantalla.
  Dos modos con la misma interfaz:
    Local: cuenta en este navegador, datos cifrados (AES-GCM) con una clave que se protege
           con tu contraseña y, aparte, con una clave de recuperación.
    Cloud: Firebase (correo, Google, recuperación por correo) y datos en Firestore.
*/
const te = new TextEncoder(), td = new TextDecoder();
const b64 = buf => { let s = ''; for (const x of new Uint8Array(buf)) s += String.fromCharCode(x); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const EMPTY = () => ({ sav: [], exp: [], loan: [] });
const userError = m => Object.assign(new Error(m), { user: true });

/* ================= MODO LOCAL ================= */
const Local = (() => {
  const KEY = 'fin2';
  let DK = null;
  const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const wr = r => localStorage.setItem(KEY, JSON.stringify(r));
  const norm = c => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const rnd = n => crypto.getRandomValues(new Uint8Array(n));

  async function kdf(secret, salt) {
    const m = await crypto.subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
      m, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function seal(key, bytes) {
    const iv = rnd(12);
    return { i: b64(iv), d: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes)) };
  }
  async function open(key, o) {
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.i) }, key, unb64(o.d)));
  }
  const dataKey = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  const readData = async r => JSON.parse(td.decode(await open(DK, r.data)));

  function newCode() {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 caracteres, sin I, O, 0, 1
    let s = '';
    rnd(16).forEach((x, i) => { s += A[x % 32]; if (i % 4 === 3 && i < 15) s += '-'; });
    return s;
  }

  return {
    mode: 'local',
    supported: () => !!(window.crypto && crypto.subtle),
    exists: () => !!rd(),

    async signup(email, pw) {
      if (rd()) throw userError('Ya existe una cuenta en este navegador.');
      const raw = rnd(32), sp = rnd(16), sr = rnd(16), code = newCode();
      DK = await dataKey(raw);
      wr({
        email: email.toLowerCase(),
        sp: b64(sp), sr: b64(sr),
        wp: await seal(await kdf(pw, sp), raw),
        wr: await seal(await kdf(norm(code), sr), raw),
        data: await seal(DK, te.encode(JSON.stringify(EMPTY())))
      });
      return code;
    },

    async login(email, pw) {
      const r = rd();
      if (!r) throw userError('No hay ninguna cuenta en este navegador. Toca "Crear cuenta".');
      const bad = userError('Correo o contraseña incorrectos.');
      if (r.email !== email.toLowerCase()) throw bad;
      let raw;
      try { raw = await open(await kdf(pw, unb64(r.sp)), r.wp); } catch { throw bad; }
      DK = await dataKey(raw);
      return readData(r);
    },

    async reset(code, newPw) {
      const r = rd();
      if (!r) throw userError('No hay ninguna cuenta en este navegador.');
      let raw;
      try { raw = await open(await kdf(norm(code), unb64(r.sr)), r.wr); }
      catch { throw userError('La clave de recuperación no es correcta.'); }
      const sp = rnd(16);
      r.sp = b64(sp);
      r.wp = await seal(await kdf(newPw, sp), raw);
      wr(r);
      DK = await dataKey(raw);
      return readData(r);
    },

    async save(D) {
      const r = rd();
      r.data = await seal(DK, te.encode(JSON.stringify(D)));
      wr(r);
    },
    email: () => (rd() || {}).email || '',
    logout() { DK = null; },
    wipe() { localStorage.removeItem(KEY); DK = null; }
  };
})();

/* ================= MODO NUBE (Firebase) ================= */
const Cloud = (() => {
  let auth, db, U = null;
  const loadScript = src => new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok;
    s.onerror = () => no(userError('No se pudo cargar Firebase. Revisa tu conexión.'));
    document.head.appendChild(s);
  });

  return {
    mode: 'cloud',
    async init(cfg, onUser) {
      const base = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-';
      for (const m of ['app', 'auth', 'firestore']) await loadScript(base + m + '-compat.js');
      firebase.initializeApp(cfg);
      auth = firebase.auth(); db = firebase.firestore();
      auth.onAuthStateChanged(async u => {
        U = u;
        if (!u) return onUser(null, null);
        try {
          const s = await db.collection('datos').doc(u.uid).get();
          onUser(u.email, { ...EMPTY(), ...(s.exists ? s.data() : {}) });
        } catch (e) {
          await auth.signOut();
          onUser(null, null, userError('No se pudieron leer tus datos. Revisa las reglas de Firestore.'));
        }
      });
    },
    async signup(email, pw) {
      const c = await auth.createUserWithEmailAndPassword(email, pw);
      c.user.sendEmailVerification().catch(() => {});
    },
    login: (email, pw) => auth.signInWithEmailAndPassword(email, pw),
    google: () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()),
    sendReset: email => auth.sendPasswordResetEmail(email),
    save: D => db.collection('datos').doc(U.uid).set(D),
    logout: () => auth.signOut()
  };
})();
