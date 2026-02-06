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
    
    # Notch support and translucent bars
    fullscreen_items = """
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
        <item name="android:windowTranslucentStatus">true</item>
        <item name="android:windowTranslucentNavigation">true</item>
        <item name="android:windowFullscreen">true</item>
    """
    if 'windowLayoutInDisplayCutoutMode' not in content:
        content = content.replace('</style>', fullscreen_items + '    </style>')
        with open(path, 'w') as f:
            f.write(content)
        print("✅ Patched styles.xml")
    else:
        print("ℹ️ styles.xml already patched")

def patch_main_activity():
    # Path based on appId io.kawaii.doodle
    path = 'android/app/src/main/java/io/kawaii/doodle/MainActivity.java'
    if not os.path.exists(path):
        # Try to find it if path differs
        found = False
        for root, dirs, files in os.walk('android/app/src/main/java'):
            if 'MainActivity.java' in files:
                path = os.path.join(root, 'MainActivity.java')
                found = True
                break
        if not found:
            print(f"Skipping MainActivity.java - not found")
            return

    with open(path, 'r') as f:
        content = f.read()

    # Add imports
    if 'androidx.core.view.WindowCompat' not in content:
        import_stmt = "import androidx.core.view.WindowCompat;\n"
        content = content.replace('import com.getcapacitor.BridgeActivity;', 'import com.getcapacitor.BridgeActivity;\n' + import_stmt)
    
    # Add Edge-to-Edge code in onCreate if it exists, or just before the end of the class?
    # Actually, we can just add an override for onCreate if missing, but Capacitor usually has it empty or defined.
    # A safer way is to inject it into the class body or just after super.onCreate
    
    edge_to_edge_code = "\n        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);"
    
    if 'setDecorFitsSystemWindows' not in content:
        if 'super.onCreate(savedInstanceState);' in content:
            content = content.replace('super.onCreate(savedInstanceState);', 'super.onCreate(savedInstanceState);' + edge_to_edge_code)
        else:
            # If onCreate is missing, we add it
            on_create_template = """
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);""" + edge_to_edge_code + """
    }
"""
            content = content.replace('public class MainActivity extends BridgeActivity {', 'public class MainActivity extends BridgeActivity {' + on_create_template)
            
        with open(path, 'w') as f:
            f.write(content)
        print("✅ Patched MainActivity.java (Edge-to-Edge)")
    else:
        print("ℹ️ MainActivity.java already patched")

if __name__ == "__main__":
    patch_manifest()
    patch_styles()
    patch_main_activity()
    # Add Google Auth strings
    strings_path = 'android/app/src/main/res/values/strings.xml'
    if os.path.exists(strings_path):
        with open(strings_path, 'r') as f:
            content = f.read()
        if 'server_client_id' not in content:
            # Insert before </resources>
            content = content.replace('</resources>', '    <string name="server_client_id">REPLACE_WITH_YOUR_WEB_CLIENT_ID</string>\n</resources>')
            with open(strings_path, 'w') as f:
                f.write(content)
            print("✅ Patched strings.xml (Google Auth)")
