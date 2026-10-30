import fs from 'node:fs';
import path from 'node:path';

const seen = new Set();
const notices = [];
function visit(name, from) {
  let directory = from;
  let location;
  while (directory !== path.dirname(directory)) {
    const candidate = path.join(directory,'node_modules',name);
    if (fs.existsSync(path.join(candidate,'package.json'))) { location = candidate; break; }
    directory = path.dirname(directory);
  }
  if (!location) throw new Error(`Missing dependency license: ${name}`);
  const pkg = JSON.parse(fs.readFileSync(path.join(location,'package.json'),'utf8'));
  const key = `${pkg.name}@${pkg.version}`;
  if (seen.has(key)) return;
  seen.add(key);
  const files = fs.readdirSync(location).filter(file=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(file) && fs.statSync(path.join(location,file)).isFile());
  const text = files.map(file=>fs.readFileSync(path.join(location,file),'utf8')).join('\n');
  notices.push(`${key}\nLicense: ${pkg.license ?? 'See package source'}\n${text || `Source: https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`}\n`);
  for (const dependency of Object.keys(pkg.dependencies ?? {})) visit(dependency,location);
}
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
for (const name of Object.keys(pkg.dependencies)) visit(name,process.cwd());
fs.writeFileSync('../wwwroot/App_Plugins/Handbook/DEPENDENCY_LICENSES.txt',notices.sort().join('\n---\n\n'));
console.log(`Included license notices for ${seen.size} client dependencies`);
