import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.join(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const publicImagesDir = path.join(repoRoot, 'public', 'images');

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      results.push(...walk(p));
    } else {
      results.push(p);
    }
  });
  return results;
}

function findImageCaseInsensitive(basename) {
  const allFiles = walk(publicImagesDir);
  const lower = basename.toLowerCase();
  for (const f of allFiles) {
    if (path.basename(f).toLowerCase() === lower) return f;
  }
  return null;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error('Skipping non-JSON or invalid JSON:', filePath);
    return false;
  }

  let changed = false;

  function walkObj(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(walkObj);
      return;
    }
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (key === 'image' && typeof val === 'string') {
          let rel = val.replace(/^https?:\/\/[^/]+/i, '');
          if (!rel.startsWith('/')) rel = '/' + rel;
          // ensure starts with /images/
          const idx = rel.toLowerCase().indexOf('/images/');
          if (idx !== -1) rel = rel.slice(idx);

          const candidate = path.join(publicImagesDir, rel.replace(/^\/images\//i, ''));
          if (fs.existsSync(candidate)) {
            const newRel = '/images/' + path.relative(publicImagesDir, candidate).split(path.sep).join('/');
            if (obj[key] !== newRel) {
              console.log(`Fixing ${filePath}: ${val} -> ${newRel}`);
              obj[key] = newRel;
              changed = true;
            }
          } else {
            const basename = path.basename(candidate);
            const found = findImageCaseInsensitive(basename);
            if (found) {
              const newRel = '/images/' + path.relative(publicImagesDir, found).split(path.sep).join('/');
              console.log(`Replacing (case) ${filePath}: ${val} -> ${newRel}`);
              obj[key] = newRel;
              changed = true;
            } else {
              // try to fallback to a similar name (strip non-alphanum) - skip for safety
              // leave unchanged if not found
            }
          }
        } else if (val && typeof val === 'object') {
          walkObj(val);
        }
      });
    }
  }

  walkObj(data);

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  return changed;
}

function main() {
  const files = walk(dataDir).filter(f => f.endsWith('.json'));
  let totalChanged = 0;
  files.forEach(f => {
    const changed = processFile(f);
    if (changed) totalChanged++;
  });

  console.log(`Done. Files updated: ${totalChanged}`);
}

main();
