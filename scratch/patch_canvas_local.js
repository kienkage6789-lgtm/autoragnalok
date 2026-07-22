const fs = require('fs');
const path = require('path');

const canvasPath = path.join(__dirname, '..', 'xhrpg_canvas.js');
if (!fs.existsSync(canvasPath)) {
  console.error('xhrpg_canvas.js not found at:', canvasPath);
  process.exit(1);
}

let content = fs.readFileSync(canvasPath, 'utf8');

// Update assetsBaseUrl to point to local root
content = content.replace(
  "let assetsBaseUrl = 'https://ragnalok.online/human/';",
  "let assetsBaseUrl = '/';"
);

fs.writeFileSync(canvasPath, content, 'utf8');
console.log('Canvas patched to local assets successfully!');
