// Follow this setup to deploy:
// 1. npx supabase functions deploy push --no-verify-jwt
// 2. npx supabase secrets set SERVICE_ACCOUNT_JSON="$(cat ./your-service-account.json)"

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

console.log("Hello from Functions!");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Helper to import PEM key
async function importPrivateKey(pem: string) {
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";

    // Remove headers, footers and any newlines
    const pemContents = pem
        .replace(pemHeader, "")
        .replace(pemFooter, "")
        .replace(/\s+/g, "");

    // Decode base64 to array buffer
    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return await crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"]
    );
}

// Retry fetch wrapper
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;

            // If strict 4xx or 5xx, we might want to retry
            const status = response.status;
            if (status >= 500 || status === 429) {
                console.warn(`Attempt ${i + 1} failed with ${status}. Retrying in ${backoff}ms...`);
            } else {
                // Not retryable (e.g., 400 Bad Request, 401 Unauthorized)
                return response;
            }
        } catch (err) {
            console.warn(`Attempt ${i + 1} failed with network error: ${err.message}. Retrying in ${backoff}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff
    }
    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { to, title, body, data } = payload;

        if (!to) {
            throw new Error("Missing 'to' (FCM Token)");
        }

        // Get Service Account from Env
        const serviceAccountJson = Deno.env.get("SERVICE_ACCOUNT_JSON");
        if (!serviceAccountJson) {
            throw new Error("Missing SERVICE_ACCOUNT_JSON secret");
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountJson);
        } catch (e) {
            throw new Error("SERVICE_ACCOUNT_JSON is not valid JSON. Please re-upload your secret.");
        }

        if (!serviceAccount.project_id || !serviceAccount.private_key) {
            throw new Error("Invalid SERVICE_ACCOUNT_JSON: missing project_id or private_key");
        }

        // 1. Import Private Key
        let privateKey;
        try {
            privateKey = await importPrivateKey(serviceAccount.private_key);
        } catch (e) {
            console.error("Key Import Error:", e.message);
            throw new Error("Failed to import private key. Ensure it's a valid PKCS#8 RSA key.");
        }

        // 2. Create JWT for Google OAuth
        const jwt = await create(
            { alg: "RS256", typ: "JWT" },
            {
                iss: serviceAccount.client_email,
                sub: serviceAccount.client_email,
                aud: "https://oauth2.googleapis.com/token",
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
                scope: "https://www.googleapis.com/auth/firebase.messaging"
            },
            privateKey
        );

        // 3. Get Google Access Token
        const tokenResponse = await fetchWithRetry("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
        });

        const tokens = await tokenResponse.json();
        if (!tokenResponse.ok) {
            console.error("Google Auth Error:", JSON.stringify(tokens));
            throw new Error(`Google Auth Failed: ${tokens.error_description || tokens.error || "Unknown error"}`);
        }

        const accessToken = tokens.access_token;

        // 4. Send Push (FCM V1 API)
        const fcmResponse = await fetchWithRetry(
            `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: {
                        token: to,
                        // Always include data payload for background handling
                        data: {
                            ...data,
                            doodle_id: data.doodle_id?.toString() || "",
                            type: "doodle",
                            sender: data.sender || "Someone",
                            title: title || "New Magic! ✨",
                            body: body || "You received a doodle!"
                        },
                        // Explicit notification block ensures it shows up even if app is killed (on some devices)
                        // But also handling data-only logic in client is key.
                        // We include a minimal notification for guaranteed delivery visibility.
                        notification: {
                            title: title || "New Magic! ✨",
                            body: body || "You received a doodle!",
                        },
                        android: {
                            priority: "HIGH",
                            ttl: "0s",
                            notification: {
                                icon: "ic_stat_icon", // Ensure you have this icon resource!
                                color: "#FF69B4",     // Pink color
                                click_action: "FLUTTER_NOTIFICATION_CLICK" // Or your intent filter
                            }
                        }
                    }
                })
            }
        );

        const result = await fcmResponse.json();

        if (!fcmResponse.ok) {
            console.error("FCM Error Result:", JSON.stringify(result));
            return new Response(JSON.stringify({ error: "FCM Error", detail: result }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        console.log("✅ FCM Success:", JSON.stringify(result));

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Edge Function Exception:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
