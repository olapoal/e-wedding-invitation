// netlify/functions/verify-trakteer.js
// Endpoint untuk cek status top-up Trakteer & klaim token secara instan dari aplikasi

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
        const orderIdInput = (body.order_id || body.orderId || "").trim();

        if (!email) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, message: "Email wajib diisi" })
            };
        }

        let store = null;
        let buyersStore = null;
        let unclaimedStore = null;
        let txStore = null;

        try {
            const { getStore } = require("@netlify/blobs");
            buyersStore = getStore("wedding_buyers");
            unclaimedStore = getStore("trakteer_unclaimed");
            txStore = getStore("trakteer_transactions");
        } catch (e) {
            console.warn("Blobs not ready in verify-trakteer:", e.message);
        }

        // 1. Cek profil user saat ini
        let currentTokens = 0;
        let buyerData = null;
        if (buyersStore) {
            buyerData = await buyersStore.get(email, { type: "json" });
            if (buyerData) {
                currentTokens = typeof buyerData.tokens === "number" ? buyerData.tokens : 0;
            }
        }

        // Cek fallback ke Supabase jika data belum ada di Blobs
        if (!buyerData) {
            const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
            const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_edaVnzcw7U4xi2xUYz_nkQ_4mCMgFRJ";
            if (supabaseUrl && supabaseKey) {
                try {
                    const cleanUrl = supabaseUrl.replace(/\/$/, "");
                    const res = await fetch(`${cleanUrl}/rest/v1/wedding_buyers?email=eq.${encodeURIComponent(email)}&select=*`, {
                        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
                    });
                    if (res.ok) {
                        const rows = await res.json();
                        if (rows && rows.length > 0) {
                            buyerData = rows[0];
                            currentTokens = typeof rows[0].tokens === "number" ? rows[0].tokens : 0;
                        }
                    }
                } catch (e) {
                    console.warn("Supabase check error in verify-trakteer:", e.message);
                }
            }
        }

        // 2. Jika user menyertakan Order ID Trakteer untuk klaim:
        if (orderIdInput && unclaimedStore && buyersStore) {
            const pendingTx = await unclaimedStore.get(orderIdInput, { type: "json" });
            if (pendingTx && !pendingTx.claimed) {
                const quantity = Math.max(1, parseInt(pendingTx.quantity || 1, 10));
                
                // Tambahkan token
                currentTokens += quantity;
                if (!buyerData) {
                    buyerData = {
                        email: email,
                        name: pendingTx.supporter_name || "Supporter Trakteer",
                        tokens: currentTokens,
                        publishedCount: 0,
                        publishedSlugs: [],
                        source: "trakteer_claim",
                        created_at: new Date().toISOString()
                    };
                } else {
                    buyerData.tokens = currentTokens;
                    buyerData.lastTopupAt = new Date().toISOString();
                }

                await buyersStore.setJSON(email, buyerData);

                // Tandai sudah diklaim
                pendingTx.claimed = true;
                pendingTx.claimedBy = email;
                pendingTx.claimedAt = new Date().toISOString();
                await unclaimedStore.setJSON(orderIdInput, pendingTx);

                if (txStore) {
                    await txStore.setJSON(orderIdInput, {
                        ...pendingTx,
                        email: email,
                        addedTokens: quantity,
                        processed: true
                    });
                }

                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: true,
                        claimed: true,
                        tokens: currentTokens,
                        addedTokens: quantity,
                        message: `Selamat! Pembayaran Trakteer #${orderIdInput} terverifikasi. ${quantity} token telah berhasil ditambahkan!`
                    })
                };
            }
        }

        // 3. Cek Trakteer API jika TRAKTEER_API_KEY tersedia di Environment Variables
        const trakteerApiKey = process.env.TRAKTEER_API_KEY;
        if (trakteerApiKey && buyersStore) {
            try {
                // Fetch 10 donasi terbaru dari Trakteer
                const res = await fetch("https://api.trakteer.id/v1/public/supports?page=1", {
                    headers: {
                        "Accept": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        "key": trakteerApiKey
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    const supports = data.data || [];

                    let newlyClaimedTokens = 0;
                    for (const item of supports) {
                        const supEmail = (item.supporter_email || "").trim().toLowerCase();
                        const supMsg = item.support_message || "";
                        const itemOrderId = item.order_id || item.id || "";
                        const qty = Math.max(1, parseInt(item.quantity || 1, 10));

                        // Cocokkan apakah email sama atau terdapat di catatan
                        const matchesEmail = (supEmail === email) || (supMsg && supMsg.toLowerCase().includes(email));

                        if (matchesEmail && itemOrderId && txStore) {
                            const alreadyProcessed = await txStore.get(itemOrderId, { type: "json" });
                            if (!alreadyProcessed) {
                                newlyClaimedTokens += qty;
                                await txStore.setJSON(itemOrderId, {
                                    order_id: itemOrderId,
                                    email: email,
                                    supporter_name: item.supporter_name,
                                    quantity: qty,
                                    addedTokens: qty,
                                    processed: true,
                                    created_at: new Date().toISOString()
                                });
                            }
                        }
                    }

                    if (newlyClaimedTokens > 0) {
                        currentTokens += newlyClaimedTokens;
                        if (!buyerData) {
                            buyerData = {
                                email: email,
                                tokens: currentTokens,
                                publishedCount: 0,
                                source: "trakteer_api",
                                created_at: new Date().toISOString()
                            };
                        } else {
                            buyerData.tokens = currentTokens;
                            buyerData.lastTopupAt = new Date().toISOString();
                        }
                        await buyersStore.setJSON(email, buyerData);

                        return {
                            statusCode: 200,
                            headers: corsHeaders,
                            body: JSON.stringify({
                                success: true,
                                claimed: true,
                                tokens: currentTokens,
                                addedTokens: newlyClaimedTokens,
                                message: `Sistem menemukan ${newlyClaimedTokens} token baru dari Trakteer! Saldo token Anda sekarang: ${currentTokens}`
                            })
                        };
                    }
                }
            } catch (apiErr) {
                console.warn("Trakteer API check notice:", apiErr.message);
            }
        }

        // Return current tokens status
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                claimed: false,
                tokens: currentTokens,
                message: `Saldo token aktif untuk ${email}: ${currentTokens} token.`
            })
        };

    } catch (err) {
        console.error("verify-trakteer error:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Internal Server Error", detail: err.message })
        };
    }
};
