const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

code = code.replace(/Gunakan Model Pembelajaran berikut: \$\{modelResponseText\}/, 'Gunakan Model Pembelajaran berikut: ${formData.modelMethod}');

fs.writeFileSync('index.tsx', code);
console.log('Done replacement 9');
