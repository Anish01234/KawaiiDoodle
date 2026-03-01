const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const cwd = process.cwd();
const bgPath = path.join(cwd, 'android', 'Background.png');
const fgPath = path.join(cwd, 'android', 'Foreground.png');
const resDir = path.join(cwd, 'android', 'app', 'src', 'main', 'res');

const sizes = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432
};

async function generate() {
    for (const [folder, size] of Object.entries(sizes)) {
        const dir = path.join(resDir, folder);
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }

        const bgOut = path.join(dir, 'ic_launcher_background.png');
        const bgInner = Math.round(size * 0.82); // slightly larger than foreground limit but still padded
        const bgPadTop = Math.round((size - bgInner) / 2);
        const bgPadBottom = size - bgInner - bgPadTop;
        const bgPadLeft = Math.round((size - bgInner) / 2);
        const bgPadRight = size - bgInner - bgPadLeft;

        await sharp(bgPath)
            .resize(bgInner, bgInner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .extend({
                top: bgPadTop,
                bottom: bgPadBottom,
                left: bgPadLeft,
                right: bgPadRight,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(bgOut);
        console.log(`Saved ${bgOut} with padding`);

        const fgOut = path.join(dir, 'ic_launcher_foreground.png');
        const fgInner = Math.round(size * 0.65);
        const padTop = Math.round((size - fgInner) / 2);
        const padBottom = size - fgInner - padTop;
        const padLeft = Math.round((size - fgInner) / 2);
        const padRight = size - fgInner - padLeft;

        await sharp(fgPath)
            .resize(fgInner, fgInner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .extend({
                top: padTop,
                bottom: padBottom,
                left: padLeft,
                right: padRight,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(fgOut);
        console.log(`Saved ${fgOut} with padding`);
    }

    // Create XML in anydpi-v26
    const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) {
        fs.mkdirSync(anydpiDir, { recursive: true });
    }

    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    const launcherXml = path.join(anydpiDir, 'ic_launcher.xml');
    const launcherRoundXml = path.join(anydpiDir, 'ic_launcher_round.xml');

    fs.writeFileSync(launcherXml, xmlContent);
    fs.writeFileSync(launcherRoundXml, xmlContent);
    console.log('Created ic_launcher.xml and ic_launcher_round.xml');
}

generate().catch(console.error);
