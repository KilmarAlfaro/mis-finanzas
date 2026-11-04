'use strict';
/*
  brands.js: catálogo de marcas para "Mis cuentas" (bancos, redes, correo, streaming, trabajo, juegos, etc.).
  Cada elemento es [nombre, dominio, id de LOGOS opcional]. El logo se descarga de internet a partir del dominio
  (mismo mecanismo que las suscripciones: Google y luego DuckDuckGo; si no hay conexión queda la inicial).
  Si el tercer dato existe, se usa esa réplica vectorial propia (ver LOGOS en icons.js) porque el ícono de internet es incorrecto.
  Este archivo NO contiene datos de nadie: solo nombres públicos de marcas.
*/
const VAULT_CATALOG = [
  { name: 'Bancos de El Salvador', items: [
    ['Banco Agrícola', 'bancoagricola.com'], ['Banco Cuscatlán', 'bancocuscatlan.com'], ['Banco Davivienda', 'davivienda.com.sv'],
    ['BAC Credomatic', 'baccredomatic.com'], ['Banco Promerica', 'promerica.com.sv'], ['Banco Hipotecario', 'bancohipotecario.com.sv'],
    ['Banco de Fomento Agropecuario', 'bfa.gob.sv'], ['Banco Azul', 'bancoazul.com'], ['Banco Atlántida', 'bancoatlantida.com.sv'],
    ['Banco Industrial', 'bi.com.sv'], ['ABANK', 'abank.com.sv'], ['Banco Apoyo Integral', 'apoyointegral.com'], ['Citibank', 'citi.com'],
    ['Fedecrédito', 'fedecredito.com.sv'], ['Mi Banco', 'mibanco.com.sv'], ['Banco Cooperativo Visionario', 'visionario.com.sv']
  ] },
  { name: 'Billeteras, pagos y criptomonedas', items: [
    ['Chivo Wallet', 'chivowallet.com'], ['Tigo Money', 'tigo.com.sv'], ['PayPal', 'paypal.com'], ['Wise', 'wise.com'], ['Payoneer', 'payoneer.com'],
    ['Stripe', 'stripe.com'], ['Binance', 'binance.com'], ['Coinbase', 'coinbase.com'], ['Kraken', 'kraken.com'], ['Bybit', 'bybit.com'],
    ['Bitget', 'bitget.com'], ['OKX', 'okx.com'], ['Airtm', 'airtm.com'], ['Strike', 'strike.me'], ['Skrill', 'skrill.com'], ['Cash App', 'cash.app'],
    ['Venmo', 'venmo.com'], ['Zelle', 'zellepay.com'], ['Western Union', 'westernunion.com'], ['MoneyGram', 'moneygram.com'], ['Remitly', 'remitly.com'],
    ['Revolut', 'revolut.com'], ['Nubank', 'nubank.com.br'], ['Mercado Pago', 'mercadopago.com'], ['Google Pay', 'pay.google.com'], ['Apple Pay', 'apple.com']
  ] },
  { name: 'Bancos, tarjetas e inversión (internacional)', items: [
    ['Bank of America', 'bankofamerica.com'], ['Chase', 'chase.com'], ['Wells Fargo', 'wellsfargo.com'], ['HSBC', 'hsbc.com'], ['Santander', 'santander.com'],
    ['BBVA', 'bbva.com'], ['Scotiabank', 'scotiabank.com'], ['Bancolombia', 'bancolombia.com'], ['Capital One', 'capitalone.com'],
    ['American Express', 'americanexpress.com'], ['Visa', 'visa.com'], ['Mastercard', 'mastercard.com'], ['Discover', 'discover.com'],
    ['Hapi', 'hapi.com'], ['Interactive Brokers', 'interactivebrokers.com'], ['Charles Schwab', 'schwab.com'], ['Fidelity', 'fidelity.com'],
    ['Robinhood', 'robinhood.com'], ['eToro', 'etoro.com'], ['TradingView', 'tradingview.com']
  ] },
  { name: 'Correo electrónico', items: [
    ['Gmail', 'mail.google.com'], ['Outlook', 'outlook.com'], ['Yahoo Mail', 'mail.yahoo.com'], ['iCloud Mail', 'icloud.com'], ['Proton Mail', 'proton.me'],
    ['Zoho Mail', 'zoho.com'], ['Tuta', 'tuta.com'], ['GMX', 'gmx.com'], ['AOL', 'aol.com'], ['Fastmail', 'fastmail.com'], ['HEY', 'hey.com']
  ] },
  { name: 'Redes sociales y mensajería', items: [
    ['Facebook', 'facebook.com'], ['Instagram', 'instagram.com'], ['WhatsApp', 'whatsapp.com'], ['Messenger', 'messenger.com'], ['X (Twitter)', 'x.com'],
    ['TikTok', 'tiktok.com'], ['Snapchat', 'snapchat.com'], ['LinkedIn', 'linkedin.com'], ['Pinterest', 'pinterest.com'], ['Reddit', 'reddit.com'],
    ['Telegram', 'telegram.org'], ['Threads', 'threads.net'], ['Discord', 'discord.com'], ['Tumblr', 'tumblr.com'], ['Signal', 'signal.org'],
    ['Bluesky', 'bsky.app'], ['Mastodon', 'joinmastodon.org'], ['Line', 'line.me'], ['WeChat', 'wechat.com'], ['Viber', 'viber.com'],
    ['Quora', 'quora.com'], ['Medium', 'medium.com'], ['BeReal', 'bereal.com'], ['Substack', 'substack.com']
  ] },
  { name: 'Streaming y TV', items: [
    ['Netflix', 'netflix.com'], ['Disney+', 'disneyplus.com'], ['HBO Max', 'hbomax.com', 'hbo'], ['Paramount+', 'paramountplus.com'], ['Prime Video', 'primevideo.com'],
    ['Apple TV+', 'tv.apple.com'], ['Crunchyroll', 'crunchyroll.com'], ['ViX', 'vix.com'], ['YouTube', 'youtube.com'], ['Claro video', 'clarovideo.com'],
    ['DIRECTV', 'directv.com'], ['ESPN', 'espn.com'], ['Twitch', 'twitch.tv'], ['Hulu', 'hulu.com'], ['Peacock', 'peacocktv.com'], ['Pluto TV', 'pluto.tv'],
    ['Tubi', 'tubitv.com'], ['Plex', 'plex.tv'], ['Vimeo', 'vimeo.com'], ['Dailymotion', 'dailymotion.com'], ['Kick', 'kick.com'], ['Rumble', 'rumble.com'],
    ['MUBI', 'mubi.com'], ['Cinépolis', 'cinepolis.com'], ['Cinemark', 'cinemark.com']
  ] },
  { name: 'Música y audio', items: [
    ['Spotify', 'spotify.com'], ['Apple Music', 'music.apple.com'], ['YouTube Music', 'music.youtube.com'], ['Amazon Music', 'music.amazon.com'],
    ['Deezer', 'deezer.com'], ['Tidal', 'tidal.com'], ['Audible', 'audible.com'], ['SoundCloud', 'soundcloud.com'], ['Pandora', 'pandora.com'],
    ['Shazam', 'shazam.com'], ['Bandcamp', 'bandcamp.com']
  ] },
  { name: 'Videojuegos', items: [
    ['Steam', 'steampowered.com'], ['Epic Games', 'epicgames.com'], ['Xbox', 'xbox.com'], ['PlayStation', 'playstation.com'], ['Nintendo', 'nintendo.com'],
    ['Battle.net', 'battle.net'], ['Blizzard', 'blizzard.com'], ['EA', 'ea.com'], ['Ubisoft', 'ubisoft.com'], ['Riot Games', 'riotgames.com'],
    ['Valorant', 'playvalorant.com'], ['League of Legends', 'leagueoflegends.com'], ['Fortnite', 'fortnite.com'], ['Roblox', 'roblox.com'],
    ['Minecraft', 'minecraft.net'], ['Rockstar Games', 'rockstargames.com'], ['GOG', 'gog.com'], ['itch.io', 'itch.io'], ['Activision', 'activision.com'],
    ['Call of Duty', 'callofduty.com'], ['Garena', 'garena.com'], ['Supercell', 'supercell.com'], ['HoYoverse', 'hoyoverse.com'], ['PUBG', 'pubg.com'],
    ['Mobile Legends', 'mobilelegends.com']
  ] },
  { name: 'Reuniones y trabajo', items: [
    ['Zoom', 'zoom.us'], ['Microsoft Teams', 'teams.microsoft.com'], ['Google Meet', 'meet.google.com'], ['Slack', 'slack.com'], ['Webex', 'webex.com'],
    ['Skype', 'skype.com'], ['Trello', 'trello.com'], ['Asana', 'asana.com'], ['Notion', 'notion.so'], ['Monday', 'monday.com'], ['ClickUp', 'clickup.com'],
    ['Atlassian (Jira)', 'atlassian.com'], ['Airtable', 'airtable.com'], ['Miro', 'miro.com'], ['Calendly', 'calendly.com'], ['Linear', 'linear.app'],
    ['Basecamp', 'basecamp.com'], ['Evernote', 'evernote.com'], ['Todoist', 'todoist.com'], ['Obsidian', 'obsidian.md'], ['Loom', 'loom.com'],
    ['DocuSign', 'docusign.com'], ['HubSpot', 'hubspot.com'], ['Salesforce', 'salesforce.com'], ['Zendesk', 'zendesk.com'], ['QuickBooks', 'intuit.com'],
    ['Odoo', 'odoo.com'], ['SAP', 'sap.com'], ['Workday', 'workday.com']
  ] },
  { name: 'Empleo y freelance', items: [
    ['Indeed', 'indeed.com'], ['Glassdoor', 'glassdoor.com'], ['Computrabajo', 'computrabajo.com'], ['Upwork', 'upwork.com'], ['Fiverr', 'fiverr.com'],
    ['Freelancer', 'freelancer.com']
  ] },
  { name: 'Google, Microsoft, Apple y Amazon', items: [
    ['Google', 'google.com'], ['Google Drive', 'drive.google.com'], ['Google Docs', 'docs.google.com'], ['Google Fotos', 'photos.google.com'],
    ['Google Calendar', 'calendar.google.com'], ['Google Cloud', 'cloud.google.com'], ['Google Maps', 'maps.google.com'], ['Microsoft', 'microsoft.com'],
    ['Microsoft 365', 'microsoft365.com'], ['OneDrive', 'onedrive.live.com'], ['Office', 'office.com'], ['Azure', 'azure.microsoft.com'],
    ['Apple ID', 'appleid.apple.com'], ['Amazon', 'amazon.com'], ['AWS', 'aws.amazon.com'], ['Samsung', 'samsung.com'],
    ['Xiaomi', 'mi.com'], ['Huawei', 'huawei.com'], ['Motorola', 'motorola.com'], ['OnePlus', 'oneplus.com']
  ] },
  { name: 'Inteligencia artificial', items: [
    ['ChatGPT', 'chatgpt.com'], ['OpenAI', 'openai.com'], ['Claude', 'claude.ai'], ['Anthropic', 'anthropic.com'], ['Gemini', 'gemini.google.com'],
    ['Copilot', 'copilot.microsoft.com'], ['Perplexity', 'perplexity.ai'], ['Midjourney', 'midjourney.com'], ['Grok', 'grok.com'], ['DeepSeek', 'deepseek.com'],
    ['Mistral', 'mistral.ai'], ['Hugging Face', 'huggingface.co'], ['Character.AI', 'character.ai'], ['Poe', 'poe.com'], ['Suno', 'suno.com'],
    ['ElevenLabs', 'elevenlabs.io'], ['Runway', 'runwayml.com'], ['Leonardo AI', 'leonardo.ai']
  ] },
  { name: 'Nube y almacenamiento', items: [
    ['Dropbox', 'dropbox.com'], ['MEGA', 'mega.nz'], ['Box', 'box.com'], ['pCloud', 'pcloud.com'], ['WeTransfer', 'wetransfer.com'],
    ['MediaFire', 'mediafire.com'], ['Backblaze', 'backblaze.com'], ['Sync', 'sync.com']
  ] },
  { name: 'Desarrollo y hosting', items: [
    ['GitHub', 'github.com'], ['GitLab', 'gitlab.com'], ['Bitbucket', 'bitbucket.org'], ['Vercel', 'vercel.com'], ['Netlify', 'netlify.com'],
    ['Firebase', 'firebase.google.com'], ['Cloudflare', 'cloudflare.com'], ['DigitalOcean', 'digitalocean.com'], ['Heroku', 'heroku.com'], ['Render', 'render.com'],
    ['Supabase', 'supabase.com'], ['MongoDB', 'mongodb.com'], ['npm', 'npmjs.com'], ['Docker', 'docker.com'], ['Stack Overflow', 'stackoverflow.com'],
    ['Hostinger', 'hostinger.com'], ['GoDaddy', 'godaddy.com'], ['Namecheap', 'namecheap.com'], ['Wix', 'wix.com'], ['WordPress', 'wordpress.com'],
    ['Squarespace', 'squarespace.com'], ['Shopify', 'shopify.com'], ['Replit', 'replit.com'], ['CodePen', 'codepen.io'], ['Postman', 'postman.com'],
    ['JetBrains', 'jetbrains.com'], ['Kaggle', 'kaggle.com']
  ] },
  { name: 'Diseño y creatividad', items: [
    ['Canva', 'canva.com'], ['Adobe', 'adobe.com'], ['Figma', 'figma.com'], ['Behance', 'behance.net'], ['Dribbble', 'dribbble.com'], ['Pexels', 'pexels.com'],
    ['Unsplash', 'unsplash.com'], ['Freepik', 'freepik.com'], ['Envato', 'envato.com'], ['Shutterstock', 'shutterstock.com'], ['CapCut', 'capcut.com']
  ] },
  { name: 'Compras y comida', items: [
    ['eBay', 'ebay.com'], ['AliExpress', 'aliexpress.com'], ['Temu', 'temu.com'], ['Shein', 'shein.com'], ['Walmart', 'walmart.com'],
    ['Mercado Libre', 'mercadolibre.com'], ['Etsy', 'etsy.com'], ['Alibaba', 'alibaba.com'], ['Target', 'target.com'], ['Best Buy', 'bestbuy.com'],
    ['PriceSmart', 'pricesmart.com'], ['Súper Selectos', 'superselectos.com.sv'], ['Office Depot', 'officedepot.com'], ['IKEA', 'ikea.com'], ['Nike', 'nike.com'],
    ['Adidas', 'adidas.com'], ['Zara', 'zara.com'], ['Rappi', 'rappi.com'], ['Uber Eats', 'ubereats.com'], ['PedidosYa', 'pedidosya.com', 'pedidosya'],
    ['DoorDash', 'doordash.com'], ['Glovo', 'glovoapp.com'], ['Domino\'s', 'dominos.com'], ['McDonald\'s', 'mcdonalds.com'], ['Pizza Hut', 'pizzahut.com'],
    ['Starbucks', 'starbucks.com'], ['Burger King', 'bk.com'], ['KFC', 'kfc.com'], ['Pollo Campero', 'campero.com']
  ] },
  { name: 'Viajes y transporte', items: [
    ['Uber', 'uber.com'], ['Lyft', 'lyft.com'], ['inDrive', 'indrive.com'], ['Airbnb', 'airbnb.com'], ['Booking.com', 'booking.com'], ['Expedia', 'expedia.com'],
    ['Tripadvisor', 'tripadvisor.com'], ['Avianca', 'avianca.com'], ['Copa Airlines', 'copaair.com'], ['American Airlines', 'aa.com'], ['United', 'united.com'],
    ['Delta', 'delta.com'], ['Volaris', 'volaris.com'], ['Spirit', 'spirit.com'], ['JetBlue', 'jetblue.com'], ['Iberia', 'iberia.com'], ['Waze', 'waze.com'],
    ['Kayak', 'kayak.com'], ['Skyscanner', 'skyscanner.com'], ['Hertz', 'hertz.com']
  ] },
  { name: 'Telefonía, internet y servicios', items: [
    ['Tigo', 'tigo.com.sv'], ['Claro', 'claro.com.sv'], ['Movistar', 'movistar.com'], ['Digicel', 'digicel.com'], ['Starlink', 'starlink.com'], ['AT&T', 'att.com'],
    ['Verizon', 'verizon.com'], ['T-Mobile', 't-mobile.com'], ['CAESS', 'caess.com.sv'], ['DELSUR', 'delsur.com.sv'], ['ANDA', 'anda.gob.sv']
  ] },
  { name: 'Gobierno y trámites', items: [
    ['Gobierno de El Salvador', 'gob.sv'], ['Ministerio de Hacienda', 'mh.gob.sv'], ['ISSS', 'isss.gob.sv'], ['AFP Crecer', 'afpcrecer.com.sv'], ['AFP Confía', 'afpconfia.com.sv'],
    ['CNR', 'cnr.gob.sv'], ['RNPN (DUI)', 'rnpn.gob.sv'], ['Ministerio de Trabajo', 'mtps.gob.sv'], ['Superintendencia del Sistema Financiero', 'ssf.gob.sv'],
    ['IRS', 'irs.gov'], ['Seguro Social (SSA)', 'ssa.gov'], ['USCIS', 'uscis.gov']
  ] },
  { name: 'Educación', items: [
    ['Google Classroom', 'classroom.google.com'], ['Moodle', 'moodle.org'], ['Coursera', 'coursera.org'], ['Udemy', 'udemy.com'], ['edX', 'edx.org'],
    ['Khan Academy', 'khanacademy.org'], ['Duolingo', 'duolingo.com'], ['Platzi', 'platzi.com'], ['Domestika', 'domestika.org'], ['Quizlet', 'quizlet.com'],
    ['Chegg', 'chegg.com'], ['Kahoot!', 'kahoot.com'], ['Babbel', 'babbel.com'], ['Wikipedia', 'wikipedia.org'], ['UGB', 'ugb.edu.sv'],
    ['Universidad de El Salvador', 'ues.edu.sv'], ['UCA', 'uca.edu.sv'], ['UDB', 'udb.edu.sv'], ['UFG', 'ufg.edu.sv']
  ] },
  { name: 'Salud y bienestar', items: [
    ['Strava', 'strava.com'], ['Fitbit', 'fitbit.com'], ['MyFitnessPal', 'myfitnesspal.com'], ['Garmin', 'garmin.com'], ['Calm', 'calm.com'],
    ['Headspace', 'headspace.com'], ['Peloton', 'onepeloton.com'], ['Mapfre', 'mapfre.com'], ['Allianz', 'allianz.com'], ['MetLife', 'metlife.com'], ['AIG', 'aig.com']
  ] },
  { name: 'Seguridad, VPN y contraseñas', items: [
    ['1Password', '1password.com'], ['Bitwarden', 'bitwarden.com'], ['LastPass', 'lastpass.com'], ['Dashlane', 'dashlane.com'], ['Authy', 'authy.com'],
    ['NordVPN', 'nordvpn.com'], ['ExpressVPN', 'expressvpn.com'], ['Surfshark', 'surfshark.com'], ['Norton', 'norton.com'], ['McAfee', 'mcafee.com'],
    ['Kaspersky', 'kaspersky.com'], ['Malwarebytes', 'malwarebytes.com']
  ] },
  { name: 'Noticias y lectura', items: [
    ['The New York Times', 'nytimes.com'], ['BBC', 'bbc.com'], ['CNN', 'cnn.com'], ['El Diario de Hoy', 'elsalvador.com'], ['La Prensa Gráfica', 'laprensagrafica.com'],
    ['Goodreads', 'goodreads.com'], ['Scribd', 'scribd.com'], ['Wattpad', 'wattpad.com']
  ] }
];

/* Búsqueda rápida por dominio: { dominio: { name, dom, cat, logo } } (la primera aparición manda si un dominio se repite) */
const VAULT_BRANDS = {};
VAULT_CATALOG.forEach(g => g.items.forEach(([name, dom, logo]) => { if (!VAULT_BRANDS[dom]) VAULT_BRANDS[dom] = { name, dom, cat: g.name, logo: logo || '' }; }));
