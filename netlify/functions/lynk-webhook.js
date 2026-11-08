// netlify/functions/lynk-webhook.js
// Endpoint ini menerima notifikasi saat customer selesai membayar di Lynk.id

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
        const payload = JSON.parse(event.body || "{}");
        console.log("Lynk.id webhook incoming payload:", JSON.stringify(payload));

        // Ekstraksi data customer dari berbagai kemungkinan struktur payload Lynk.id
        const email = (
            payload.customer_email ||
            payload.email ||
            payload.data?.customer_email ||
            payload.data?.email ||
            payload.buyer_email ||
            payload.customer?.email ||
            ""
        ).trim().toLowerCase();

        const name = (
            payload.customer_name ||
            payload.name ||
            payload.data?.customer_name ||
            payload.data?.name ||
            payload.customer?.name ||
            "Pembeli Undangan Digital"
        );

        const orderId = (
            payload.order_id ||
            payload.transaction_id ||
            payload.id ||
            payload.data?.order_id ||
            payload.data?.id ||
            `LYNK-${Date.now()}`
        );

        const phone = (
            payload.customer_phone ||
            payload.phone ||
            payload.data?.customer_phone ||
            payload.data?.phone ||
            ""
        );

        const productName = (
            payload.product_name ||
            payload.product ||
            payload.title ||
            payload.item_name ||
            payload.data?.product_name ||
            payload.data?.title ||
            ""
        );

        // Filter Proteksi Multi-Produk: Jika ada nama produk, pastikan relevan dengan produk Undangan / Wedding
        const isWeddingProduct = !productName || 
            productName.toUpperCase().includes("[WEDDING]") ||
            productName.toLowerCase().includes("wedding") || 
            productName.toLowerCase().includes("undangan") ||
            productName.toLowerCase().includes("nikah");

        if (productName && !isWeddingProduct) {
            console.log(`Transaksi diabaikan karena bukan produk Wedding: ${productName}`);
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: false,
                    ignored: true,
                    message: `Transaksi diabaikan: produk '${productName}' bukan produk Undangan Pernikahan.`
                })
            };
        }

        if (!email || !email.includes("@")) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: "Email customer tidak valid dalam payload Lynk.id" })
            };
        }

        // Tentukan jumlah token awal yang didapatkan saat pertama kali beli di Lynk.id (default 1 token)
        const initialTokens = 1;

        const buyerRecord = {
            email: email,
            name: name,
            phone: phone,
            order_id: orderId,
            product_name: productName || "Generator E-Wedding Invitation",
            tokens: initialTokens,
            publishedCount: 0,
            publishedSlugs: [],
            source: "lynk.id",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 1. Simpan ke Netlify Blobs
        let blobsSaved = false;
        try {
            const { getStore } = require("@netlify/blobs");
            const buyersStore = getStore("wedding_buyers");
            const txStore = getStore("lynk_transactions");

            // Cek apakah email sudah ada sebelumnya (jika ada, tambahkan token atau pertahankan token yang ada)
            const existingBuyer = await buyersStore.get(email, { type: "json" });
            if (existingBuyer) {
                buyerRecord.tokens = (typeof existingBuyer.tokens === "number" ? existingBuyer.tokens : 0) + initialTokens;
                buyerRecord.publishedCount = existingBuyer.publishedCount || 0;
                buyerRecord.publishedSlugs = existingBuyer.publishedSlugs || [];
                buyerRecord.created_at = existingBuyer.created_at || buyerRecord.created_at;
            }

            await buyersStore.setJSON(email, buyerRecord);
            await txStore.setJSON(orderId, { ...buyerRecord, payload });
            blobsSaved = true;
            console.log(`Berhasil menyimpan data pembeli ${email} dengan ${buyerRecord.tokens} token ke Netlify Blobs`);
        } catch (blobsErr) {
            console.warn("Netlify Blobs save notice:", blobsErr.message);
        }

        // 2. Simpan ke Supabase Database (Opsional)
        const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            try {
                const cleanUrl = supabaseUrl.replace(/\/$/, "");
                const endpoint = `${cleanUrl}/rest/v1/wedding_buyers`;

                await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                        "Prefer": "resolution=merge-duplicates"
                    },
                    body: JSON.stringify({
                        email: email,
                        name: name,
                        phone: phone,
                        order_id: orderId,
                        product_name: productName,
                        tokens: buyerRecord.tokens,
                        created_at: buyerRecord.created_at
                    })
                });
            } catch (supaErr) {
                console.warn("Supabase save error:", supaErr.message);
            }
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                message: `Berhasil mencatat pembeli ${email} dan memberikan ${buyerRecord.tokens} token.`,
                email: email,
                tokens: buyerRecord.tokens,
                order_id: orderId
            })
        };

    } catch (err) {
        console.error("lynk-webhook error:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Internal Server Error", detail: err.message })
        };
    }
};
