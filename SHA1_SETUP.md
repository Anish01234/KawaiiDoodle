# 🔑 Google Sign-In Setup for Release App

Your new app version uses a **permanent security key** so you can update it easily in the future.
However, Google Cloud doesn't recognize this key yet, which is why "Sign In" fails on the new version (but works on the old one).

## 🚀 The Fix

1.  Go to **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)**.
2.  Navigate to **APIs & Services** > **Credentials**.
3.  Click on your **Android Client ID** (edit icon).
4.  Look for the **SHA-1 certificate fingerprint** section.
5.  **Add** the following fingerprint to the list:

    ```text
    E2:7B:4A:F6:31:9A:49:48:14:05:76:14:0F:E9:05:75:E1:3A:00:F3
    ```

6.  Click **Save**.

---
**Done!**
Wait about 1-2 minutes, and the "Sign In" button on your new app will start working. You do **not** need to reinstall or rebuild the app.
