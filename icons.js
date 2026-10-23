'use strict';
/*
  icons.js: catálogo de íconos para las categorías de gastos.
  Cada ícono es el interior de un SVG de 24x24 (trazo, sin relleno).
  ICON_GROUPS define cómo se muestran agrupados: [clave, nombre en español].
*/
const ICONS = {
  /* Comida y bebida */
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  coffee: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 1v3M10 1v3M14 1v3"/>',
  pizza: '<path d="M3 6.5a15 15 0 0 1 18 0L12 22z"/><circle cx="9.5" cy="9.5" r="1"/><circle cx="14" cy="11" r="1"/><circle cx="11.5" cy="15" r="1"/>',
  cake: '<path d="M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"/><path d="M4 16c2 0 2 1.5 4 1.5S10 16 12 16s2 1.5 4 1.5S18 16 20 16"/><path d="M2 21h20"/><path d="M12 11V8"/><path d="M12 3.5c1 1.2 1 2.3 0 3-1-.7-1-1.8 0-3z"/>',
  apple: '<path d="M12 7c-1-2-4-2.5-5.5-.5C4.5 9 5 14 7 17c1.2 1.8 2.8 3 5 3s3.8-1.2 5-3c2-3 2.5-8 .5-10.5C15.8 4.5 13 5 12 7z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
  wine: '<path d="M8 22h8"/><path d="M12 15v7"/><path d="M7 3h10l-.7 6.2A4.4 4.4 0 0 1 12 13a4.4 4.4 0 0 1-4.3-3.8z"/>',
  beer: '<path d="M5 6h10v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M15 9h2.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M5 6c0-1.7 1.3-3 3-3 .8 0 1.5.3 2 .8.5-.5 1.2-.8 2-.8 1.7 0 3 1.3 3 3"/>',
  soup: '<path d="M3 11h18c0 5-4 9-9 9s-9-4-9-9z"/><path d="M8 7.5c0-1.5 1-2.5 1-4M13 7.5c0-1.5 1-2.5 1-4"/>',
  soda: '<path d="M6 8h12l-1.5 13h-9z"/><path d="M5 8h14"/><path d="M12 8l2-6h3"/>',

  /* Compras */
  bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v9h14v-9"/>',
  shirt: '<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  gem: '<path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3L8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  gift: '<path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>',
  package: '<path d="M16.5 9.4L7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  glasses: '<circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-4 0"/><path d="M2.5 13L5 7c.7-1.3 1.4-2 3-2"/><path d="M21.5 13L19 7c-.7-1.3-1.5-2-3-2"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/><path d="M14.47 14.48L20 20"/><path d="M8.12 8.12L12 12"/>',

  /* Transporte */
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  bus: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  train: '<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-2 3"/><path d="M16 19l2 3"/><circle cx="8" cy="15" r=".8"/><circle cx="16" cy="15" r=".8"/>',
  bike: '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17L9 8h5l4.5 9"/><path d="M14 8l-3 9"/><path d="M8 8H6"/>',
  plane: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  fuel: '<path d="M3 22V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17"/><path d="M2 22h13"/><path d="M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-3-3"/><rect x="6" y="7" width="4" height="4"/>',
  truck: '<rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  parking: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  anchor: '<circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',

  /* Hogar y servicios */
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  bed: '<path d="M2 18V6"/><path d="M2 14h20v4"/><path d="M22 18v-4a4 4 0 0 0-4-4h-8v4"/><circle cx="6" cy="10.5" r="1.8"/>',
  lamp: '<path d="M9 22h6"/><path d="M12 22v-8"/><path d="M5 14h14l-3-9H8z"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
  droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mobile: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
  tv: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="M17 2l-5 5-5-5"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="M11.4 11.6L21 2"/><path d="M16 7l3 3"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',

  /* Salud y bienestar */
  cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  pill: '<path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="M8.5 8.5l7 7"/>',
  pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  thermo: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
  paw: '<circle cx="5" cy="11" r="2"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/><circle cx="19" cy="11" r="2"/><path d="M12 12c-3 0-6 3.5-6 6 0 2 1.5 3 3 3 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.5 0 3-1 3-3 0-2.5-3-6-6-6z"/>',

  /* Ocio y viajes */
  film: '<rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  gamepad: '<rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4"/><circle cx="15.5" cy="11" r=".8"/><circle cx="18" cy="13" r=".8"/>',
  ticket: '<path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  video: '<path d="M23 7l-7 5 7 5z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  umbrella: '<path d="M22 12a10 10 0 0 0-20 0z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/>',
  tent: '<path d="M3 20L12 4l9 16z"/><path d="M10 20l2-4 2 4"/>',
  mountain: '<path d="M8 3l4 8 5-5 5 15H2z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',

  /* Dinero y trabajo */
  dollar: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  piggy: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/>',
  safe: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1M12 15v1M8 12h1M15 12h1"/><path d="M7 21v1M17 21v1"/>',
  bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 21h18"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  trendup: '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
  trenddown: '<path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/>',
  pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  repeat: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  award: '<circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-1.21 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98 1.21 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',

  /* Educación y personas */
  cap: '<path d="M22 10L12 5 2 10l10 5z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 10v6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>',

  /* Otros */
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  dots: '<circle cx="12" cy="12" r="10"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'
};

const ICON_GROUPS = [
  { name: 'Comida y bebida', icons: [['utensils', 'Cubiertos'], ['coffee', 'Café'], ['pizza', 'Pizza'], ['cake', 'Pastel'], ['apple', 'Fruta'], ['wine', 'Vino'], ['beer', 'Cerveza'], ['soup', 'Sopa'], ['soda', 'Refresco']] },
  { name: 'Compras', icons: [['bag', 'Bolsa'], ['cart', 'Carrito'], ['store', 'Tienda'], ['shirt', 'Camisa'], ['gem', 'Joya'], ['gift', 'Regalo'], ['tag', 'Etiqueta'], ['package', 'Paquete'], ['receipt', 'Recibo'], ['glasses', 'Lentes'], ['scissors', 'Tijeras']] },
  { name: 'Transporte', icons: [['car', 'Auto'], ['bus', 'Bus'], ['train', 'Tren'], ['bike', 'Bicicleta'], ['plane', 'Avión'], ['fuel', 'Combustible'], ['truck', 'Camión'], ['parking', 'Parqueo'], ['anchor', 'Barco'], ['pin', 'Ubicación']] },
  { name: 'Hogar y servicios', icons: [['home', 'Casa'], ['bed', 'Cama'], ['lamp', 'Lámpara'], ['tool', 'Herramienta'], ['zap', 'Electricidad'], ['droplet', 'Agua'], ['flame', 'Gas'], ['wifi', 'Internet'], ['phone', 'Teléfono'], ['mobile', 'Celular'], ['laptop', 'Computadora'], ['tv', 'Televisión'], ['cloud', 'Nube'], ['key', 'Llave'], ['lock', 'Candado']] },
  { name: 'Salud y bienestar', icons: [['cross', 'Salud'], ['pill', 'Medicina'], ['pulse', 'Pulso'], ['thermo', 'Termómetro'], ['heart', 'Corazón'], ['dumbbell', 'Pesas'], ['leaf', 'Naturaleza'], ['sparkles', 'Belleza'], ['smile', 'Sonrisa'], ['paw', 'Mascota']] },
  { name: 'Ocio y viajes', icons: [['film', 'Cine'], ['music', 'Música'], ['gamepad', 'Videojuegos'], ['ticket', 'Entradas'], ['camera', 'Cámara'], ['video', 'Video'], ['headphones', 'Audífonos'], ['globe', 'Mundo'], ['compass', 'Brújula'], ['umbrella', 'Playa'], ['tent', 'Acampar'], ['mountain', 'Montaña'], ['sun', 'Sol'], ['moon', 'Luna']] },
  { name: 'Dinero y trabajo', icons: [['dollar', 'Dólar'], ['card', 'Tarjeta'], ['wallet', 'Billetera'], ['cash', 'Efectivo'], ['piggy', 'Alcancía'], ['coins', 'Monedas'], ['safe', 'Caja fuerte'], ['bank', 'Banco'], ['percent', 'Porcentaje'], ['trendup', 'Sube'], ['trenddown', 'Baja'], ['pie', 'Gráfico'], ['briefcase', 'Maletín'], ['calendar', 'Calendario'], ['repeat', 'Suscripción'], ['award', 'Premio'], ['trophy', 'Trofeo']] },
  { name: 'Educación y personas', icons: [['cap', 'Graduación'], ['book', 'Libro'], ['pencil', 'Lápiz'], ['user', 'Persona'], ['users', 'Personas'], ['mail', 'Correo']] },
  { name: 'Otros', icons: [['star', 'Estrella'], ['shield', 'Escudo'], ['bell', 'Campana'], ['clock', 'Reloj'], ['flag', 'Bandera'], ['dots', 'Otros']] }
];

/*
  Servicios de suscripción conocidos en Latinoamérica.
  [id, nombre, marca corta, color de fondo, color de la marca, ícono opcional de ICONS, dominio]
  El ícono real de cada app se descarga de internet a partir de su dominio (ver sbadge() en app.js).
  Si no hay conexión o no se encuentra, se muestra una insignia con la inicial y los colores de la marca.
  Una marca puede tener dos líneas separadas por "|" (ej. 'claro|video'). Con dominio null nunca se pide ícono a internet.
*/
const SERVICE_GROUPS = [
  { name: 'Video y TV', items: [
    ['netflix', 'Netflix', 'N', '#000000', '#E50914', null, 'netflix.com'],
    ['disney', 'Disney+', 'D+', '#113CCF', '#FFFFFF', null, 'disneyplus.com'],
    ['hbo', 'HBO Max', 'max', '#5822B4', '#FFFFFF', null, 'hbomax.com'],
    ['paramount', 'Paramount+', 'P+', '#0064FF', '#FFFFFF', null, 'paramountplus.com'],
    ['prime', 'Prime Video', 'prime', '#00A8E1', '#FFFFFF', null, 'primevideo.com'],
    ['appletv', 'Apple TV+', 'tv+', '#000000', '#FFFFFF', null, 'tv.apple.com'],
    ['crunchyroll', 'Crunchyroll', 'CR', '#F47521', '#FFFFFF', null, 'crunchyroll.com'],
    ['vix', 'ViX', 'ViX', '#111111', '#FF7A00', null, 'vix.com'],
    ['youtube', 'YouTube Premium', '▶', '#FF0000', '#FFFFFF', null, 'youtube.com'],
    ['clarovideo', 'Claro video', 'claro|video', '#DA291C', '#FFFFFF', null, null],
    ['directv', 'DIRECTV', 'DTV', '#0A2A4A', '#FFFFFF', null, 'directv.com'],
    ['espn', 'ESPN', 'ESPN', '#D00000', '#FFFFFF', null, 'espn.com'],
    ['winplus', 'Win Sports+', 'W+', '#FDB913', '#111111', null, 'winsports.co'],
    ['twitch', 'Twitch', 'Tw', '#9146FF', '#FFFFFF', null, 'twitch.tv']
  ] },
  { name: 'Música y audio', items: [
    ['spotify', 'Spotify', 'Sp', '#1DB954', '#000000', null, 'spotify.com'],
    ['applemusic', 'Apple Music', '♫', '#FA243C', '#FFFFFF', null, 'music.apple.com'],
    ['youtubemusic', 'YouTube Music', 'YM', '#FF0000', '#FFFFFF', null, 'music.youtube.com'],
    ['amazonmusic', 'Amazon Music', 'am', '#25D1DA', '#000000', null, 'music.amazon.com'],
    ['deezer', 'Deezer', 'dz', '#A238FF', '#FFFFFF', null, 'deezer.com'],
    ['tidal', 'Tidal', 'TD', '#000000', '#FFFFFF', null, 'tidal.com'],
    ['audible', 'Audible', 'Au', '#F8991D', '#000000', null, 'audible.com']
  ] },
  { name: 'Apps, IA y nube', items: [
    ['chatgpt', 'ChatGPT', 'GPT', '#10A37F', '#FFFFFF', null, 'chatgpt.com'],
    ['claude', 'Claude', 'C', '#D97757', '#FFFFFF', null, 'claude.ai'],
    ['gemini', 'Gemini', '✦', '#4285F4', '#FFFFFF', null, 'gemini.google.com'],
    ['canva', 'Canva', 'Ca', '#00C4CC', '#FFFFFF', null, 'canva.com'],
    ['adobe', 'Adobe Creative Cloud', 'Cc', '#FA0F00', '#FFFFFF', null, 'adobe.com'],
    ['microsoft', 'Microsoft 365', '365', '#D83B01', '#FFFFFF', null, 'microsoft365.com'],
    ['googleone', 'Google One', 'G1', '#4285F4', '#FFFFFF', null, 'one.google.com'],
    ['icloud', 'iCloud+', 'iC', '#3693F3', '#FFFFFF', null, 'icloud.com'],
    ['dropbox', 'Dropbox', 'Db', '#0061FF', '#FFFFFF', null, 'dropbox.com'],
    ['notion', 'Notion', 'N', '#F1F1EF', '#111111', null, 'notion.so'],
    ['duolingo', 'Duolingo', 'Du', '#58CC02', '#FFFFFF', null, 'duolingo.com'],
    ['kindle', 'Kindle Unlimited', 'K', '#232F3E', '#FF9900', null, 'amazon.com']
  ] },
  { name: 'Juegos', items: [
    ['xbox', 'Xbox Game Pass', 'X', '#107C10', '#FFFFFF', null, 'xbox.com'],
    ['playstation', 'PlayStation Plus', 'PS+', '#003791', '#FFFFFF', null, 'playstation.com'],
    ['nintendo', 'Nintendo Switch Online', 'NSO', '#E60012', '#FFFFFF', null, 'nintendo.com']
  ] },
  { name: 'Telefonía e internet', items: [
    ['tigo', 'Tigo', 'tigo', '#00377B', '#FFD100', null, 'tigo.com.sv'],
    ['claro', 'Claro', 'cl', '#DA291C', '#FFFFFF', null, 'claro.com.sv'],
    ['movistar', 'Movistar', 'M', '#019DF4', '#FFFFFF', null, 'movistar.com'],
    ['starlink', 'Starlink', 'SL', '#000000', '#FFFFFF', null, 'starlink.com']
  ] },
  { name: 'Otros', items: [
    ['gym', 'Gimnasio', '', '#E4F0EC', '#1F6F5C', 'dumbbell'],
    ['custom', 'Otra suscripción', '', '#E4F0EC', '#1F6F5C', 'repeat']
  ] }
];
const SERVICES = {};
SERVICE_GROUPS.forEach(g => g.items.forEach(([id, name, mark, bg, fg, ico, dom]) => { SERVICES[id] = { id, name, mark, bg, fg, ico, dom }; }));


/*
  Bancos y billeteras de El Salvador (lista de la Superintendencia del Sistema Financiero y del Instituto de Garantía de Depósitos).
  [id, nombre, marca corta, color de fondo, color de la marca, null, dominio]. El logo real se carga de internet a partir del dominio
  (misma técnica que las suscripciones); si no hay conexión o no existe, se muestra la marca con sus colores.
*/
const BANK_GROUPS = [
  { name: 'Bancos de El Salvador', items: [
    ['b_agricola', 'Banco Agrícola', 'BA', '#0A8F3C', '#FFFFFF', null, 'bancoagricola.com'],
    ['b_cuscatlan', 'Banco Cuscatlán', 'BC', '#003B71', '#FFFFFF', null, 'bancocuscatlan.com'],
    ['b_davivienda', 'Banco Davivienda', 'D', '#E1161E', '#FFFFFF', null, 'davivienda.com.sv'],
    ['b_bac', 'BAC Credomatic', 'BAC', '#E30613', '#FFFFFF', null, 'baccredomatic.com'],
    ['b_promerica', 'Banco Promerica', 'Pm', '#2E8B3E', '#FFFFFF', null, 'promerica.com.sv'],
    ['b_hipotecario', 'Banco Hipotecario', 'BH', '#0A3D8F', '#FFFFFF', null, 'bancohipotecario.com.sv'],
    ['b_bfa', 'Banco de Fomento Agropecuario', 'BFA', '#1F7A3E', '#FFFFFF', null, 'bfa.gob.sv'],
    ['b_azul', 'Banco Azul', 'Az', '#0072CE', '#FFFFFF', null, 'bancoazul.com'],
    ['b_atlantida', 'Banco Atlántida', 'At', '#B5121B', '#FFFFFF', null, 'bancoatlantida.com.sv'],
    ['b_industrial', 'Banco Industrial', 'BI', '#FDB913', '#003B71', null, 'bi.com.sv'],
    ['b_abank', 'ABANK', 'AB', '#E87722', '#FFFFFF', null, 'abank.com.sv'],
    ['b_apoyo', 'Banco Apoyo Integral', 'AI', '#5B3D91', '#FFFFFF', null, null],
    ['b_citi', 'Citibank', 'citi', '#056DAE', '#FFFFFF', null, 'citi.com']
  ] },
  { name: 'Bancos cooperativos', items: [
    ['b_fedecredito', 'Fedecrédito', 'Fed', '#00539B', '#FFFFFF', null, 'fedecredito.com.sv'],
    ['b_mibanco', 'Mi Banco', 'Mi', '#00A3AD', '#FFFFFF', null, 'mibanco.com.sv'],
    ['b_visionario', 'Banco Cooperativo Visionario', 'Vi', '#7A1F5C', '#FFFFFF', null, null]
  ] },
  { name: 'Billeteras digitales', items: [
    ['b_chivo', 'Chivo Wallet', 'Chivo', '#00A862', '#FFFFFF', null, 'chivowallet.com'],
    ['b_tigomoney', 'Tigo Money', 'TM', '#00377B', '#FFD100', null, 'tigo.com.sv'],
    ['b_paypal', 'PayPal', 'PP', '#003087', '#FFFFFF', null, 'paypal.com']
  ] }
];
BANK_GROUPS.forEach(g => g.items.forEach(([id, name, mark, bg, fg, ico, dom]) => { SERVICES[id] = { id, name, mark, bg, fg, ico, dom }; }));
const BANK_IDS = new Set(BANK_GROUPS.flatMap(g => g.items.map(i => i[0])));
/* Íconos genéricos para cuentas ("Otros") */
const ACCOUNT_ICONS = [['wallet', 'Billetera'], ['cash', 'Billetes'], ['piggy', 'Alcancía'], ['bank', 'Banco'], ['trendup', 'Inversiones'], ['coins', 'Monedas'],
  ['card', 'Tarjeta'], ['safe', 'Caja fuerte'], ['dollar', 'Dólar'], ['briefcase', 'Negocio'], ['pie', 'Portafolio'], ['percent', 'Intereses'],
  ['gem', 'Joyas'], ['shield', 'Seguro'], ['heart', 'Emergencias'], ['plane', 'Viajes'], ['home', 'Casa'], ['car', 'Vehículo'],
  ['cap', 'Estudios'], ['gift', 'Regalos'], ['star', 'Favorita'], ['trophy', 'Metas'], ['calendar', 'Ahorro programado'], ['users', 'Familia']];
