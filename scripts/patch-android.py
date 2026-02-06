import os

def patch_manifest():
    path = 'android/app/src/main/AndroidManifest.xml'
    if not os.path.exists(path):
        print(f"Skipping {path} - not found")
        return
    with open(path, 'r') as f:
        content = f.read()
    if 'io.kawaii.doodle' not in content:
        intent_filter = """
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="io.kawaii.doodle" />
            </intent-filter>
        """
        # Insert before the closing activity tag
        content = content.replace('</activity>', intent_filter + '\n        </activity>')
        with open(path, 'w') as f:
            f.write(content)
        print("✅ Patched AndroidManifest.xml (Deep Links)")
    else:
        print("ℹ️ AndroidManifest.xml already patched")

def patch_styles():
    path = 'android/app/src/main/res/values/styles.xml'
    if not os.path.exists(path):
        print(f"Skipping {path} - not found")
        return
    with open(path, 'r') as f:
        content = f.read()
    
    # ⚠️ DO NOT rename the styles, only change parents if needed or add items
    # In Capacitor 6, we want to add windowFullscreen to the styles
    
    # Add fullscreen items to AppTheme.NoActionBarLaunch and AppTheme.NoActionBar
    if 'android:windowFullscreen' not in content:
        # We append to the styles
        fullscreen_items = '        <item name="android:windowFullscreen">true</item>\n        <item name="android:windowContentOverlay">@null</item>\n'
        
        # Patch both themes if they exist
        content = content.replace('</style>', fullscreen_items + '    </style>')
        
        with open(path, 'w') as f:
            f.write(content)
        print("✅ Patched styles.xml (Fullscreen)")
    else:
        print("ℹ️ styles.xml already patched")

if __name__ == "__main__":
    patch_manifest()
    patch_styles()
