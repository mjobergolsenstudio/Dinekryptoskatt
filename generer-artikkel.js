const https = require('https');
const fs = require('fs');
const path = require('path');

const TOPICS = [
  'Slik rapporterer du krypto til Skatteetaten i 2025',
  'Kryptoskatt for nybegynnere i Norge – komplett guide',
  'Binance CSV-guide for norske brukere',
  'Coinbase og norsk skatt – slik gjør du det riktig',
  'Firi skatt – slik eksporterer og rapporterer du',
  'Hva er realisasjonsprinsippet og hvordan gjelder det for krypto?',
  'NFT og skatt i Norge – hva sier regelverket?',
  'Staking og mining – slik beskattes det i Norge',
  'DeFi og norsk skatt – hva må du rapportere?',
  'Kryptotap – kan du få fradrag i Norge?',
  'Kraken CSV-eksport guide for norske skattebetalere',
  'Kucoin og norsk skatt – steg for steg',
];

function getRandomTopic() {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function callAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        resolve(parsed.content[0].text);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const topic = getRandomTopic();
  const dato = new Date().toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' });
  const slug = slugify(topic);
  const filename = `${slug}.html`;
  const artiklerDir = path.join(__dirname, 'artikler');

  if (!fs.existsSync(artiklerDir)) fs.mkdirSync(artiklerDir, { recursive: true });

  console.log(`Genererer artikkel: ${topic}`);

  const innhold = await callAnthropic(`Skriv en grundig norsk artikkel om: "${topic}".
Artikkelen skal være 600-800 ord, SEO-optimalisert, og gi praktisk verdi for norske kryptoinvestorer.
Bruk norske skatteregler. Inkluder en intro, 3-4 seksjoner med overskrifter, og en konklusjon.
Returner kun ren HTML-innhold (ikke full side) med <h2>, <p> og <ul>-tagger.`);

  const html = `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${topic} | DineKryptoskatt.no</title>
<meta name="description" content="Les om ${topic} – praktisk guide for norske kryptoinvestorer.">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header><a href="/">← DineKryptoskatt.no</a></header>
<main class="artikkel">
<p class="dato">Publisert: ${dato}</p>
<h1>${topic}</h1>
${innhold}
<div class="cta-boks">
  <p>Klar til å beregne kryptoskatten din?</p>
  <a href="/app.html">Prøv appen vår gratis →</a>
</div>
</main>
</body>
</html>`;

  fs.writeFileSync(path.join(artiklerDir, filename), html);
  console.log(`Artikkel lagret: artikler/${filename}`);
}

main().catch(console.error);
