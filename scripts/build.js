const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = path.resolve(__dirname, '..');
const BUILD_DIR = path.resolve(__dirname, '../www');

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR);
}

// Helper to copy files/dirs recursively
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

const { execSync } = require('child_process');

// Files to copy
const ASSETS = [
    'index.html',
    'styles.css',
    'tailwind.css',
    'sw.js',
    'manifest.json'
];

const DIRS = [
    'src',
    'resources'
];

console.log('🏗️  Starting Elite Build Process...');

// 0. Run Tailwind compiler
console.log('🎨 Compiling Tailwind CSS...');
try {
    execSync('npx tailwindcss -i input.css -o tailwind.css --minify', { stdio: 'inherit' });
} catch (e) {
    console.warn('⚠️ Tailwind compile failed or skipped. Ensure tailwindcss is installed.');
}

// 1. Clean (optional but safer)
console.log('🧹 Cleaning build directory...');
if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR);

// 2. Copy Root Assets
ASSETS.forEach(file => {
    const srcPath = path.join(SOURCE_DIR, file);
    const destPath = path.join(BUILD_DIR, file);
    if (fs.existsSync(srcPath)) {
        console.log(`📦 Copying ${file}...`);
        fs.copyFileSync(srcPath, destPath);
    } else {
        console.warn(`⚠️  Warning: ${file} not found in root.`);
    }
});

// 3. Copy Directories
DIRS.forEach(dir => {
    const srcPath = path.join(SOURCE_DIR, dir);
    const destPath = path.join(BUILD_DIR, dir);
    if (fs.existsSync(srcPath)) {
        console.log(`📂 Copying ${dir}/...`);
        copyRecursiveSync(srcPath, destPath);
    } else {
        console.warn(`⚠️  Warning: Directory ${dir} not found.`);
    }
});

console.log('✅ Build Complete! Ready for Capacitor Sync.');
