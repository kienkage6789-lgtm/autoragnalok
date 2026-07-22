const fs = require('fs');
const path = require('path');

const canvasPath = path.join(__dirname, '..', 'xhrpg_canvas.js');
if (!fs.existsSync(canvasPath)) {
  console.error('xhrpg_canvas.js not found at:', canvasPath);
  process.exit(1);
}

let content = fs.readFileSync(canvasPath, 'utf8');

// Declare assetsBaseUrl right after let baseUrl = ...
content = content.replace("let baseUrl = '/human/';", "let baseUrl = '/human/';\n  let assetsBaseUrl = 'https://ragnalok.online/human/';");

// Replace baseUrl + 'assets/ with assetsBaseUrl + 'assets/
content = content.split("baseUrl + 'assets/").join("assetsBaseUrl + 'assets/");
content = content.split("baseUrl+'assets/").join("assetsBaseUrl+'assets/");

// Replace ${baseUrl}assets/ with ${assetsBaseUrl}assets/
content = content.split("${baseUrl}assets/").join("${assetsBaseUrl}assets/");

fs.writeFileSync(canvasPath, content, 'utf8');
console.log('Canvas patched successfully!');
