#!/usr/bin/env node
// scripts/fix-capacitor-proguard.js
//
// AGP 9+ rejects getDefaultProguardFile('proguard-android.txt') with a hard
// error. Several Capacitor plugins still ship that outdated string. This script
// replaces it with the correct 'proguard-android-optimize.txt' in every
// Capacitor plugin build.gradle inside node_modules.
//
// Run automatically as a postinstall hook (see package.json).

const fs = require('fs');
const path = require('path');

const OLD = "getDefaultProguardFile('proguard-android.txt')";
const NEW = "getDefaultProguardFile('proguard-android-optimize.txt')";

// Plugins known to ship the bad string – add more here if needed.
const TARGETS = [
    '@capacitor/filesystem/android/build.gradle',
    '@capacitor/push-notifications/android/build.gradle',
];

let fixed = 0;
for (const rel of TARGETS) {
    const abs = path.join(__dirname, '..', 'node_modules', rel);
    if (!fs.existsSync(abs)) continue;

    const original = fs.readFileSync(abs, 'utf8');
    if (!original.includes(OLD)) {
        console.log(`[fix-proguard] Already OK: ${rel}`);
        continue;
    }

    fs.writeFileSync(abs, original.split(OLD).join(NEW), 'utf8');
    console.log(`[fix-proguard] Patched:    ${rel}`);
    fixed++;
}

console.log(`[fix-proguard] Done. ${fixed} file(s) patched.`);
