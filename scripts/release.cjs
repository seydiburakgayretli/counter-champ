// Builds one zip per portal: release/counter-champ-<portal>.zip (index.html at the zip root).
// Usage: npm run release
const { execSync } = require('child_process');
const fs = require('fs');

fs.rmSync('release', { recursive: true, force: true });
for (const mode of ['crazygames', 'poki']) {
  execSync(`npx vite build --mode ${mode} --outDir release/${mode}`, { stdio: 'inherit' });
  execSync(`cd release/${mode} && zip -qr ../counter-champ-${mode}.zip .`);
  const kb = Math.round(fs.statSync(`release/counter-champ-${mode}.zip`).size / 1024);
  console.log(`release/counter-champ-${mode}.zip ${kb} KB`);
}
