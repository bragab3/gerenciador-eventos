// Serve a pasta dist/ (export web do Expo) em http://localhost:PORT, com fallback para index.html.
const http = require('http');
const fs = require('fs');
const path = require('path');

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.map': 'application/json' };

function servirPasta(raiz, porta) {
  const servidor = http.createServer((req, res) => {
    let arquivo = path.join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!arquivo.startsWith(raiz) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      arquivo = path.join(raiz, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    fs.createReadStream(arquivo).pipe(res);
  });
  return new Promise((resolve) => servidor.listen(porta, () => resolve(servidor)));
}

module.exports = { servirPasta };
