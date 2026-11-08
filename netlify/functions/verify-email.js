// netlify/functions/verify-email.js
// Endpoint untuk memvalidasi akses pembeli Lynk.id & mengambil saldo token publikasi

exports.handler = async function(event, context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: corsHeaders, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const email = (body.email || "").trim().toLowerCase();

        if (!email) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ valid: false, message: "Email tidak boleh kosong" })
            };
        }

        // 1. Cek Environment Variable ADMIN_EMAILS (Akses Master Admin & Creator)
        const adminEmails = (process.env.ADMIN_EMAILS || "olapoal.artgallery@gmail.com,admin@wedding.com")
            .toLowerCase()
            .split(",")
            .map(e => e.trim());

        if (adminEmails.includes(email)) {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    valid: true,
                    email: email,
                    name: "Super Admin (Owner)",
                    orderId: "ADMIN-MASTER",
                    tokens: 9999, // Unlimited token for admin
                    isAdmin: true,
                    registeredAt: new Date().toISOString()
                })
            };
        }

        // 2. Cek dari Netlify Blobs (Database Utama)
        let store = null;
        try {
            const { getStore } = require("@netlify/blobs");
            store = getStore("wedding_buyers");
            const buyerData = await store.get(email, { type: "json" });

            if (buyerData) {
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        valid: true,
                        email: buyerData.email || email,
                        name: buyerData.name || buyerData.email || email,
                        orderId: buyerData.order_id || buyerData.orderId || "-",
                        tokens: typeof buyerData.tokens === "number" ? buyerData.tokens : 1, // Default 1 token awal
                        publishedCount: buyerData.publishedCount || 0,
                        publishedSlugs: buyerData.publishedSlugs || [],
                        registeredAt: buyerData.created_at || new Date().toISOString()
                    })
                };
            }
        } catch (blobsErr) {
            console.warn("Netlify Blobs check notice:", blobsErr.message);
        }

        // 3. Cek dari Supabase Database (Opsional jika env variable diaktifkan)
        const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
        const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_edaVnzcw7U4xi2xUYz_nkQ_4mCMgFRJ";

        if (supabaseUrl && supabaseKey) {
            try {
                const cleanUrl = supabaseUrl.replace(/\/$/, "");
                const endpoint = `${cleanUrl}/rest/v1/wedding_buyers?email=eq.${encodeURIComponent(email)}&select=*`;

                const res = await fetch(endpoint, {
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`
                    }
                });

                if (res.ok) {
                    const rows = await res.json();
                    if (rows && rows.length > 0) {
                        const row = rows[0];
                        return {
                            statusCode: 200,
                            headers: corsHeaders,
                            body: JSON.stringify({
                                valid: true,
                                email: row.email,
                                name: row.name || row.email,
                                orderId: row.order_id || "-",
                                tokens: typeof row.tokens === "number" ? row.tokens : 1,
                                publishedCount: row.published_count || 0
                            })
                        };
                    }
                }
            } catch (supaErr) {
                console.warn("Supabase check error:", supaErr);
            }
        }

        // Jika email belum terdaftar
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                valid: false,
                message: `Email '${email}' belum terdaftar. Pastikan Anda telah membeli akses di Lynk.id (https://lynk.id/olapoal) dengan email ini.`
            })
        };

    } catch (err) {
        console.error("verify-email error:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Internal Server Error", detail: err.message })
        };
    }
};
