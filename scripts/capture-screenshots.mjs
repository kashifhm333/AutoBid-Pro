import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'docs', 'screenshot');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PAGES = [
  { name: '01-home', alias: 'home', hash: 'home', label: 'Home Page' },
  { name: '02-catalog', alias: 'catalog', hash: 'catalog', label: 'Browse Catalog / Live Auctions' },
  { name: '03-auction-details', alias: 'auction-details', hash: 'details', label: 'Auction Details Page' },
  { name: '04-buyer-dashboard', alias: 'buyer-dashboard', hash: 'dashboard', label: 'Buyer Dashboard' },
  { name: '05-seller-dashboard', alias: 'seller-dashboard', hash: 'seller', label: 'Seller Dashboard' },
  { name: '06-admin-dashboard', alias: 'admin-dashboard', hash: 'admin', label: 'Admin Command Center' },
  { name: '07-login', alias: 'login', hash: 'login', label: 'Sign In / Login Page' },
  { name: '08-register', alias: 'register', hash: 'register', label: 'Registration Page' },
  { name: '09-how-it-works', alias: 'how-it-works', hash: 'howItWorks', label: 'How It Works Guide' }
];

async function capture() {
  const port = 9225;
  const tempProfile = `/tmp/chrome-ss-profile-${Date.now()}`;
  console.log('Launching headless Chrome on port', port);

  const chromeProcess = spawn('google-chrome', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,900',
    `--user-data-dir=${tempProfile}`
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await sleep(200);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProcess.kill();
    throw new Error('Could not connect to Chrome debugging WebSocket');
  }

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const { resolve, reject } = callbacks.get(data.id);
      callbacks.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));
  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  const baseUrl = 'http://localhost:5173';

  for (const page of PAGES) {
    const targetUrl = `${baseUrl}/#${page.hash}`;
    console.log(`Capturing: ${page.label} (${targetUrl})...`);

    await send('Page.navigate', { url: targetUrl });
    await sleep(1500);

    // Ensure all images are fully loaded before capturing
    try {
      await send('Runtime.evaluate', {
        expression: `
          Promise.all(
            Array.from(document.images)
              .filter(img => !img.complete)
              .map(img => new Promise(resolve => {
                img.onload = img.onerror = resolve;
                setTimeout(resolve, 3000);
              }))
          )
        `,
        awaitPromise: true
      });
    } catch {}

    await sleep(1000);

    const screenshot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });

    const buffer = Buffer.from(screenshot.data, 'base64');
    const numberedFile = path.join(outputDir, `${page.name}.png`);
    const aliasFile = path.join(outputDir, `${page.alias}.png`);

    fs.writeFileSync(numberedFile, buffer);
    fs.writeFileSync(aliasFile, buffer);
    console.log(`Saved: ${page.name}.png & ${page.alias}.png (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
  }

  ws.close();
  chromeProcess.kill();
  console.log('All screenshots captured successfully in docs/screenshot/!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});

