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
        content = content.replace('</activity>', intent_filter + '\n        </activity>')
        with open(path, 'w') as f:
            f.write(content)
        print("✅ Patched AndroidManifest.xml")
    else:
        print("ℹ️ AndroidManifest.xml already patched")

def patch_styles():
    path = 'android/app/src/main/res/values/styles.xml'
    if not os.path.exists(path):
        print(f"Skipping {path} - not found")
        return
    with open(path, 'r') as f:
        content = f.read()
    
    # Update parent theme
    content = content.replace('AppTheme.NoActionBar', 'Theme.AppCompat.Light.NoActionBar.FullScreen')
    
    # Add fullscreen items
    if 'android:windowFullscreen' not in content:
        fullscreen_items = """
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        """
        content = content.replace('</style>', fullscreen_items + '\n    </style>')
        with open(path, 'w') as f:
            f.write(content)
        print("✅ Patched styles.xml")
    else:
        print("ℹ️ styles.xml already patched")

if __name__ == "__main__":
    patch_manifest()
    patch_styles()
