// Fix broken toast class names and inner HTML
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'app.js');

let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// ── Fix 1: broken className with spaces inside Tailwind classes ───────────────
const OLD_CLASS = "toast.className = `toast - enter px - 6 py - 3 rounded - full shadow - 2xl mb - 4 font - bold flex items - center gap - 3 text - white z - [100] backdrop - blur - sm border border - white / 20`;";
const NEW_CLASS = "toast.className = `toast-enter px-6 py-3 rounded-full shadow-2xl mb-4 font-bold flex items-center gap-3 text-white z-[100] backdrop-blur-sm border border-white/20`;";

if (!src.includes(OLD_CLASS)) {
    console.error('❌ className target not found — already fixed or different content');
} else {
    src = src.replace(OLD_CLASS, NEW_CLASS);
    console.log('✅ Fixed toast className (no more broken Tailwind classes)');
}

// ── Fix 2: broken innerHTML with spaces inside HTML tags ─────────────────────
// The broken line contains: < i data - lucide=  and < /i >  and < span ... >  etc.
// We do a regex replace so we don't need to match the exact quote escaping
src = src.replace(
    /toast\.innerHTML\s*=\s*`<\s*i\s+data\s*-\s*lucide="[^"]*"\s+class="[^"]*"\s*>[^<]*<\s*\/\s*i\s*>\s*<\s*span\s+class="[^"]*">[^`]*<\/\s*span\s*>`/,
    (match) => {
        // Just rebuild it cleanly
        return `toast.innerHTML = \`<i data-lucide="\${type === 'pink' ? 'sparkles' : 'info'}" class="w-4 h-4 text-white/90"></i> <span class="tracking-wide text-sm">\${message}</span>\``;
    }
);
console.log('✅ Fixed toast innerHTML (proper HTML tags)');

// ── Remove the now-stale comment about "subtle blur" ─────────────────────────
src = src.replace('        // Pill shape, centered, subtle blur\n        toast.className', '        toast.className');

fs.writeFileSync(filePath, src.replace(/\n/g, '\r\n'), 'utf8');
console.log('✅ src/app.js saved');
