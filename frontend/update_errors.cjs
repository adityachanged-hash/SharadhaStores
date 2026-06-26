const fs = require('fs');
const path = require('path');

const srcDirs = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src')
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Image path replacement
  const newContentImg1 = content.replace(/src="[^"]*logo\.png"/g, 'src="/logo.png"');
  if (newContentImg1 !== content) {
    content = newContentImg1;
    changed = true;
  }

  const newContentImg2 = content.replace(/src="[^"]*gift-packing\.jpg"/g, 'src="/gift-packing.jpg"');
  if (newContentImg2 !== content) {
    content = newContentImg2;
    changed = true;
  }
  
  // also fix if they used 'gift_pack.png' or something
  const newContentImg3 = content.replace(/src="[^"]*gift_pack\.png"/g, 'src="/gift-packing.jpg"');
  if (newContentImg3 !== content) {
    content = newContentImg3;
    changed = true;
  }

  // 2. Error handling replacement
  const regex = /const\s+(\w+)\s*=\s*await\s+response\.json\(\);/g;
  const newContentJSON = content.replace(regex, (match, varName) => {
    // preserve indentation by looking at the line before it
    return `const text = await response.text();\n      if (!response.ok) {\n        throw new Error(text || \`Request failed with status \${response.status}\`);\n      }\n      const ${varName} = text ? JSON.parse(text) : {};`;
  });

  if (newContentJSON !== content) {
    content = newContentJSON;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

srcDirs.forEach(dir => processDirectory(dir));
