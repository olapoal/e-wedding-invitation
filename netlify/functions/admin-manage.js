// netlify/functions/admin-manage.js
// Endpoint Super Admin untuk mengelola data lisensi pengguna, saldo token, dan undangan

exports.handler = async function(event, context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
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
        const action = body.action || "list";
        const adminKey = event.headers["x-admin-key"] || body.admin_key || "";

        let buyersStore = null;
        let settingsStore = null;
        let invitationsStore = null;
        let trakteerTxStore = null;
        let lynkTxStore = null;

        try {
            const { getStore } = require("@netlify/blobs");
            buyersStore = getStore("wedding_buyers");
            settingsStore = getStore("wedding_settings");
            invitationsStore = getStore("wedding_invitations");
            trakteerTxStore = getStore("trakteer_transactions");
            lynkTxStore = getStore("lynk_transactions");
        } catch (e) {
            console.warn("Blobs store init notice:", e.message);
        }

        // Tentukan Password Admin Aktif
        let activeAdminPassword = (process.env.ADMIN_PASSWORD || "admin12345").trim();
        if (settingsStore) {
            try {
                const customPass = await settingsStore.get("admin_password");
                if (customPass && customPass.trim()) {
                    activeAdminPassword = customPass.trim();
                }
            } catch (e) {
                console.warn("Failed to read custom admin password:", e.message);
            }
        }

        // Verifikasi Password Admin
        if (adminKey !== activeAdminPassword) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, message: "Password Admin tidak valid." })
            };
        }

        // ACTION: CHANGE ADMIN PASSWORD
        if (action === "change_password") {
            const newPassword = (body.new_password || "").trim();
            if (!newPassword || newPassword.length < 5) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: false, message: "Password baru minimal 5 karakter." })
                };
            }
            if (settingsStore) {
                await settingsStore.set("admin_password", newPassword);
            }
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ success: true, message: "Password Admin berhasil diperbarui!" })
            };
        }

        // ACTION: LIST BUYERS
        if (action === "list" || action === "list_buyers") {
            let buyers = [];
            if (buyersStore) {
                try {
                    const listResult = await buyersStore.list();
                    const keys = listResult.blobs || [];
                    for (const item of keys) {
                        try {
                            const val = await buyersStore.get(item.key, { type: "json" });
                            if (val) buyers.push(val);
                        } catch (e) {}
                    }
                } catch (e) {
                    console.warn("List error:", e.message);
                }
            }

            // Jika kosong di Blobs, ambil dari Supabase
            if (buyers.length === 0) {
                const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
                const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_edaVnzcw7U4xi2xUYz_nkQ_4mCMgFRJ";
                if (supabaseUrl && supabaseKey) {
                    try {
                        const cleanUrl = supabaseUrl.replace(/\/$/, "");
                        const res = await fetch(`${cleanUrl}/rest/v1/wedding_buyers?select=*`, {
                            headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
                        });
                        if (res.ok) {
                            const rows = await res.json();
                            if (rows && rows.length > 0) {
                                buyers = rows;
                            }
                        }
                    } catch (e) {
                        console.warn("Supabase list error in admin:", e.message);
                    }
                }
            }

            // Tambahkan admin default jika belum ada di list
            const adminEmail = "olapoal.artgallery@gmail.com";
            if (!buyers.some(b => b.email === adminEmail)) {
                buyers.unshift({
                    email: adminEmail,
                    name: "Master Admin",
                    tokens: 9999,
                    publishedCount: 0,
                    order_id: "MASTER-ADMIN",
                    created_at: new Date().toISOString()
                });
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ success: true, buyers: buyers, count: buyers.length })
            };
        }

        // ACTION: ADD OR UPDATE TOKENS
        if (action === "add_tokens" || action === "set_tokens") {
            const email = (body.email || "").trim().toLowerCase();
            const amount = parseInt(body.amount, 10);

            if (!email || isNaN(amount)) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: false, message: "Email dan jumlah token wajib diisi valid." })
                };
            }

            if (!buyersStore) {
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: false, message: "Database store belum aktif." })
                };
            }

            let buyer = await buyersStore.get(email, { type: "json" }) || {
                email: email,
                name: body.name || email,
                tokens: 0,
                created_at: new Date().toISOString()
            };

            const current = typeof buyer.tokens === "number" ? buyer.tokens : 0;
            const newTokens = action === "add_tokens" ? Math.max(0, current + amount) : Math.max(0, amount);
            buyer.tokens = newTokens;
            buyer.updated_at = new Date().toISOString();

            await buyersStore.setJSON(email, buyer);

            // Update juga di Supabase Database
            const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
            const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_edaVnzcw7U4xi2xUYz_nkQ_4mCMgFRJ";
            if (supabaseUrl && supabaseKey) {
                try {
                    const cleanUrl = supabaseUrl.replace(/\/$/, "");
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
                            tokens: newTokens,
                            updated_at: new Date().toISOString()
                        })
                    });
                } catch (e) {
                    console.warn("Supabase update error in admin:", e.message);
                }
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    message: `Berhasil memperbarui token ${email} menjadi ${newTokens} token.`,
                    email: email,
                    tokens: newTokens
                })
            };
        }

        // ACTION: ADD BUYER MANUALLY
        if (action === "add_buyer") {
            const email = (body.email || "").trim().toLowerCase();
            const name = (body.name || "Manual Buyer").trim();
            const tokens = parseInt(body.tokens || 1, 10);
            const orderId = body.order_id || `MANUAL-${Date.now()}`;

            if (!email || !email.includes("@")) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: false, message: "Format email tidak valid." })
                };
            }

            if (buyersStore) {
                const newRecord = {
                    email: email,
                    name: name,
                    tokens: tokens,
                    order_id: orderId,
                    publishedCount: 0,
                    publishedSlugs: [],
                    source: "manual_admin",
                    created_at: new Date().toISOString()
                };
                await buyersStore.setJSON(email, newRecord);
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    message: `Berhasil menambahkan user ${email} dengan ${tokens} token.`
                })
            };
        }

        // ACTION: DELETE BUYER
        if (action === "delete_buyer") {
            const email = (body.email || "").trim().toLowerCase();
            if (buyersStore && email) {
                await buyersStore.delete(email);
            }
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ success: true, message: `User ${email} berhasil dihapus.` })
            };
        }

        // ACTION: LIST INVITATIONS
        if (action === "list_invitations") {
            let invitations = [];
            if (invitationsStore) {
                try {
                    const listResult = await invitationsStore.list();
                    for (const item of (listResult.blobs || [])) {
                        try {
                            const val = await invitationsStore.get(item.key, { type: "json" });
                            if (val) invitations.push(val);
                        } catch (e) {}
                    }
                } catch (e) {}
            }
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ success: true, invitations: invitations, count: invitations.length })
            };
        }

        // ACTION: GET STATS
        if (action === "get_stats") {
            let userCount = 0;
            let totalTokens = 0;
            let totalPublished = 0;

            if (buyersStore) {
                try {
                    const list = await buyersStore.list();
                    userCount = (list.blobs || []).length;
                    for (const b of (list.blobs || [])) {
                        const val = await buyersStore.get(b.key, { type: "json" });
                        if (val) {
                            totalTokens += (val.tokens || 0);
                            totalPublished += (val.publishedCount || 0);
                        }
                    }
                } catch (e) {}
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    stats: {
                        totalUsers: userCount,
                        totalTokensActive: totalTokens,
                        totalPublished: totalPublished
                    }
                })
            };
        }

        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, message: `Aksi '${action}' tidak dikenali.` })
        };

    } catch (err) {
        console.error("admin-manage error:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Internal Server Error", detail: err.message })
        };
    }
};
