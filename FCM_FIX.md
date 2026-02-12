
# 🚨 FCM Legacy API Fix (Error 404)

Your logs show the **Firebase Legacy API** is disabled or hidden (`404 Not Found`).
Since we don't have a backend server, we MUST enable this specific API to send push notifications directly from the app.

## 1. Enable the Legacy API (Crucial!)
Click this direct link to go to the API page for your project:
**[Enable Cloud Messaging API (Legacy)](https://console.cloud.google.com/apis/library/googlecloudmessaging.googleapis.com?project=kawaii-doodle-97054)**

1.  If the button says **ENABLE**, click it! 🔵
2.  If it says **MANAGE** (already enabled), click **MANAGE** -> **DISABLE API** -> Wait 10s -> **ENABLE API** again. (This resets the permissions).

## 2. Check the API Key
After enabling, go to **Credentials** in the sidebar.
1.  Click your `Kawaii Doodle` API Key.
2.  Under **API restrictions**, ensure **"Cloud Messaging"** (Legacy) is selected.
    *   *If you can't find it in the list, choose "Don't restrict key" temporarily.*

## 3. Test Again
1.  Build & Run the app.
2.  Send a doodle.
3.  Check the logs.
    *   `200 OK` = Fixed! 🎉
    *   `401 Unauthorized` = Key restriction issue.
    *   `404 Not Found` = API still dead (we might need a backend).
