const fs = require('fs');
const file = 'src/app/upload/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<div>(\s*)<label className="block text-sm font-medium text-gray-300 mb-2">/g, '<div className="input-group">$1<label className="label-text">');
content = content.replace(/<div>(\s*)<label className="block text-sm font-medium text-gray-300">/g, '<div className="input-group">$1<label className="label-text">');

fs.writeFileSync(file, content);
console.log('Done!');
