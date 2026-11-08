// netlify/functions/trakteer-webhook.js
// Endpoint ini menerima webhook resmi dari Trakteer secara realtime
// ketika user melakukan top-up token / tipping 'Cendol'.

exports.handler = async function(event, context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Trakteer-Signature, Key",
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
        const payload = JSON.parse(event.body || "{}");
        console.log("Trakteer webhook received:", JSON.stringify(payload));

        // Ekstraksi data dari payload Trakteer
        const supporterName = payload.supporter_name || payload.name || "Supporter";
        const message = payload.supporter_message || payload.message || payload.description || "";
        const quantity = parseInt(payload.quantity || payload.unit_count || 1, 10);
        const orderId = payload.order_id || payload.transaction_id || payload.id || `TRK-${Date.now()}`;
        const price = payload.price || payload.amount || 0;

        // Cari email pendukung:
        // 1. Dari field email resmi jika ada
        let email = (payload.supporter_email || payload.email || payload.buyer_email || "").trim().toLowerCase();

        // 2. Jika email tidak ada di field utama, deteksi email di dalam pesan supporter
        // (Seringkali supporter memasukkan email akun mereka di pesan/catatan Trakteer)
        if (!email || !email.includes("@")) {
            const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
            const match = message.match(emailRegex);
            if (match && match[1]) {
                email = match[1].trim().toLowerCase();
            }
        }

        if (!email || !email.includes("@")) {
            console.warn("Trakteer donation received without identifiable email:", payload);
            // Simpan ke log transaksi gantung (unclaimed) agar bisa diklaim manual atau lewat admin
            try {
                const { getStore } = require("@netlify/blobs");
                const unclaimedStore = getStore("trakteer_unclaimed");
                await unclaimedStore.setJSON(orderId, {
                    order_id: orderId,
                    supporter_name: supporterName,
                    message: message,
                    quantity: quantity,
                    price: price,
                    created_at: new Date().toISOString(),
                    payload: payload
                });
            } catch (e) {
                console.warn("Failed to store unclaimed trakteer tx:", e.message);
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    note: "Pembayaran Trakteer diterima, namun email tidak ditemukan pada pesan/data. Disimpan di pending claims.",
                    order_id: orderId
                })
            };
        }

        // Hitung token yang didapat (1 unit/cendol = 1 Token)
        // Default minimal 1 token per transaksi jika quantity valid
        const addedTokens = Math.max(1, quantity);

        let finalTokens = addedTokens;
        let userFound = false;

        // Update saldo token di Netlify Blobs
        try {
            const { getStore } = require("@netlify/blobs");
            const buyersStore = getStore("wedding_buyers");
            const txStore = getStore("trakteer_transactions");

            // Cek apakah order ID ini sudah pernah diproses (cegah double claim)
            const existingTx = await txStore.get(orderId, { type: "json" });
            if (existingTx && existingTx.processed) {
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: true,
                        message: "Transaksi ini sudah pernah diproses sebelumnya.",
                        order_id: orderId
                    })
                };
            }

            // Ambil data user
            const buyer = await buyersStore.get(email, { type: "json" });
            if (buyer) {
                userFound = true;
                const currentTokens = typeof buyer.tokens === "number" ? buyer.tokens : 0;
                finalTokens = currentTokens + addedTokens;
                buyer.tokens = finalTokens;
                buyer.lastTopupAt = new Date().toISOString();
                buyer.lastTopupOrderId = orderId;
                await buyersStore.setJSON(email, buyer);
            } else {
                // Jika email belum ada di buyers (misal pembeli langsung top-up), buatkan profil baru
                const newBuyer = {
                    email: email,
                    name: supporterName,
                    order_id: orderId,
                    tokens: addedTokens,
                    publishedCount: 0,
                    publishedSlugs: [],
                    source: "trakteer",
                    created_at: new Date().toISOString()
                };
                await buyersStore.setJSON(email, newBuyer);
                finalTokens = addedTokens;
            }

            // Catat log transaksi sukses
            await txStore.setJSON(orderId, {
                order_id: orderId,
                email: email,
                supporter_name: supporterName,
                quantity: quantity,
                addedTokens: addedTokens,
                message: message,
                processed: true,
                created_at: new Date().toISOString()
            });

            console.log(`Berhasil menambahkan ${addedTokens} token untuk email ${email}. Total token sekarang: ${finalTokens}`);

        } catch (blobsErr) {
            console.error("Netlify Blobs error in trakteer-webhook:", blobsErr.message);
        }

        // Simpan / Update ke Supabase Database
        const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
            try {
                const cleanUrl = supabaseUrl.replace(/\/$/, "");
                // Upsert buyer
                await fetch(`${cleanUrl}/rest/v1/wedding_buyers`, {
                    method: "POST",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                        "Prefer": "resolution=merge-duplicates"
                    },
                    body: JSON.stringify({
                        email: email,
                        name: supporterName,
                        tokens: finalTokens,
                        source: "trakteer",
                        updated_at: new Date().toISOString()
                    })
                });

                // Catat transaksi
                await fetch(`${cleanUrl}/rest/v1/wedding_transactions`, {
                    method: "POST",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                        "Prefer": "resolution=merge-duplicates"
                    },
                    body: JSON.stringify({
                        order_id: orderId,
                        email: email,
                        supporter_name: supporterName,
                        platform: "trakteer",
                        tokens_credited: addedTokens,
                        created_at: new Date().toISOString()
                    })
                });
            } catch (supaErr) {
                console.warn("Supabase trakteer update notice:", supaErr.message);
            }
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                message: `Berhasil menambahkan ${addedTokens} token untuk ${email}`,
                email: email,
                addedTokens: addedTokens,
                currentTokens: finalTokens,
                order_id: orderId
            })
        };

    } catch (err) {
        console.error("trakteer-webhook error:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Internal Server Error", detail: err.message })
        };
    }
};
