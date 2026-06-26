const fs = require('fs');
const path = require('path');

const srcDirs = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components')
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes("fetch('/api") || content.includes('fetch("/api') || content.includes('fetch(`/api')) {
    
    if (!content.includes('import API_URL')) {
      const importMatches = [...content.matchAll(/^import.*?;?\r?\n/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const insertPos = lastImport.index + lastImport[0].length;
        
        // Handle path relativity
        const inComponents = filePath.includes(path.join('src', 'components'));
        const inPages = filePath.includes(path.join('src', 'pages'));
        let importPath = "../config/api";
        // If file is directly in src/components or src/pages, it's one directory deep from src, config is in src/config
        // So "../config/api" is correct.
        
        content = content.slice(0, insertPos) + `import API_URL from "${importPath}";\n` + content.slice(insertPos);
        changed = true;
      }
    }

    const newContent1 = content.replace(/fetch\(['"]\/api([^'"]*)['"]/g, 'fetch(`${API_URL}/api$1`');
    if (newContent1 !== content) {
      content = newContent1;
      changed = true;
    }

    const newContent2 = content.replace(/fetch\(`\/api/g, 'fetch(`${API_URL}/api');
    if (newContent2 !== content) {
      content = newContent2;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
}

srcDirs.forEach(dir => processDirectory(dir));
