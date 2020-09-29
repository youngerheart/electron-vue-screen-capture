const fs = require('fs');
let fileName = './dist_electron/bundled/screenCapture.html';
let data = fs.readFileSync(fileName);
let str = data.toString().replace(/app:\/\//g, '');
fs.writeFileSync(fileName, str);

