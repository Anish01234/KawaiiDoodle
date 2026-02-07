const fs = require('fs');
const path = require('path');

function patchManifest() {
    const filePath = 'android/app/src/main/AndroidManifest.xml';
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filePath} - not found`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('io.kawaii.doodle')) {
        const intentFilter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="io.kawaii.doodle" />
            </intent-filter>
        `;
        content = content.replace('</activity>', intentFilter + '\n        </activity>');
        fs.writeFileSync(filePath, content);
        console.log("✅ Patched AndroidManifest.xml");
    } else {
        console.log("ℹ️ AndroidManifest.xml already patched");
    }
}

function patchStyles() {
    const filePath = 'android/app/src/main/res/values/styles.xml';
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filePath} - not found`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    const fullscreenItems = `
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
        <item name="android:windowTranslucentStatus">true</item>
        <item name="android:windowTranslucentNavigation">true</item>
        <item name="android:windowFullscreen">true</item>
    `;
    if (!content.includes('windowLayoutInDisplayCutoutMode')) {
        content = content.replace('</style>', fullscreenItems + '    </style>');
        fs.writeFileSync(filePath, content);
        console.log("✅ Patched styles.xml");
    } else {
        console.log("ℹ️ styles.xml already patched");
    }
}

function patchMainActivity() {
    let filePath = 'android/app/src/main/java/io/kawaii/doodle/MainActivity.java';
    // Find MainActivity if path differs (simple check)
    if (!fs.existsSync(filePath)) {
        // Fallback search logic omitted for brevity as path is standard from cap add
        console.log(`Skipping MainActivity.java - not found at expected path`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Add imports
    if (!content.includes('androidx.core.view.WindowCompat')) {
        const importStmt = "import androidx.core.view.WindowCompat;\n";
        content = content.replace('import com.getcapacitor.BridgeActivity;', 'import com.getcapacitor.BridgeActivity;\n' + importStmt);
    }

    const edgeToEdgeCode = "\n        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);";

    if (!content.includes('setDecorFitsSystemWindows')) {
        if (content.includes('super.onCreate(savedInstanceState);')) {
            content = content.replace('super.onCreate(savedInstanceState);', 'super.onCreate(savedInstanceState);' + edgeToEdgeCode);
        } else {
            // Add onCreate method
            const onCreateTemplate = `
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);${edgeToEdgeCode}
    }
`;
            content = content.replace('public class MainActivity extends BridgeActivity {', 'public class MainActivity extends BridgeActivity {' + onCreateTemplate);
        }
        fs.writeFileSync(filePath, content);
        console.log("✅ Patched MainActivity.java (Edge-to-Edge)");
    } else {
        console.log("ℹ️ MainActivity.java already patched");
    }
}

function patchStrings() {
    const filePath = 'android/app/src/main/res/values/strings.xml';
    if (!fs.existsSync(filePath)) {
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('server_client_id')) {
        // Use the hardcoded ID we know is correct
        content = content.replace('</resources>', '    <string name="server_client_id">122450948192-kpqrglufceoa8d1554n9nq2ca0chk6iu.apps.googleusercontent.com</string>\n</resources>');
        fs.writeFileSync(filePath, content);
        console.log("✅ Patched strings.xml (Google Auth)");
    }
}

patchManifest();
patchStyles();
patchMainActivity();
patchStrings();
