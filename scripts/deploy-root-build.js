const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('[Deploy] Initializing CBT Backend Deployment Build...');
console.log('====================================================');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

// Step 1: Install production dependencies in backend if not already present
const hasNest = fs.existsSync(path.join(backendDir, 'node_modules', '@nestjs', 'core'));
if (hasNest) {
  console.log('[Deploy] Cached backend production dependencies detected. Skipping redundant installation.');
} else {
  console.log('[Deploy] Installing backend production dependencies...');
  try {
    execSync('npm ci --omit=dev --prefer-offline --no-audit --no-fund', {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    console.log('[Deploy] Backend dependencies installed successfully.');
  } catch (err) {
    console.warn('[Deploy] npm ci failed or had issues, attempting fallback npm install --omit=dev...');
    try {
      execSync('npm install --omit=dev --prefer-offline --no-audit --no-fund', {
        cwd: backendDir,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' },
      });
      console.log('[Deploy] Fallback npm install completed successfully.');
    } catch (fallbackErr) {
      console.error('[Deploy] Error installing backend dependencies:', fallbackErr.message);
      process.exit(1);
    }
  }
}

// Step 2: Ensure pre-compiled dist is synchronized to root for root runners
const rootDist = path.join(rootDir, 'dist');
const backendDist = path.join(backendDir, 'dist');

if (fs.existsSync(backendDist)) {
  console.log('[Deploy] Synchronizing backend/dist to root /dist for root runners...');
  try {
    if (!fs.existsSync(rootDist)) {
      fs.cpSync(backendDist, rootDist, { recursive: true });
    }
    console.log('[Deploy] root /dist synchronized.');
  } catch (copyErr) {
    console.warn('[Deploy] Notice: dist sync encountered:', copyErr.message);
  }
} else {
  console.log('[Deploy] Building backend dist...');
  execSync('npm run build:local', { cwd: backendDir, stdio: 'inherit' });
}

// Step 3: Ensure node_modules proxy exists at root if needed
const rootNm = path.join(rootDir, 'node_modules');
const backendNm = path.join(backendDir, 'node_modules');

if (fs.existsSync(backendNm) && !fs.existsSync(rootNm)) {
  try {
    const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(backendNm, rootNm, symlinkType);
    console.log('[Deploy] root /node_modules linked to backend/node_modules.');
  } catch (linkErr) {
    console.warn('[Deploy] Notice: Could not link node_modules (non-critical):', linkErr.message);
  }
}

console.log('====================================================');
console.log('[Deploy] Build step finished successfully!');
console.log('====================================================');
