// netlify/functions/submit-rsvp.js
// Endpoint untuk tamu mengirimkan konfirmasi kehadiran (RSVP) & doa ucapan

exports.handler = async function(event, context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: corsHeaders, body: "" };
    }

    try {
        const { getStore } = require("@netlify/blobs");
        const rsvpStore = getStore("wedding_rsvps");

        // GET: Ambil daftar ucapan untuk suatu undangan
        if (event.httpMethod === "GET") {
            const slug = (event.queryStringParameters?.slug || "").trim().toLowerCase();
            if (!slug) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: "Slug diperlukan" })
                };
            }

            let wishesList = [];
            try {
                const data = await rsvpStore.get(slug, { type: "json" });
                wishesList = data?.wishes || [];
            } catch (e) {
                console.warn("Get rsvp error:", e.message);
            }

            // Fallback / Dual check ke Supabase
            if (wishesList.length === 0) {
                const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
                const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_edaVnzcw7U4xi2xUYz_nkQ_4mCMgFRJ";
                if (supabaseUrl && supabaseKey) {
                    try {
                        const cleanUrl = supabaseUrl.replace(/\/$/, "");
                        const res = await fetch(`${cleanUrl}/rest/v1/wedding_rsvps?slug=eq.${encodeURIComponent(slug)}&order=created_at.desc&limit=200`, {
                            headers: {
                                "apikey": supabaseKey,
                                "Authorization": `Bearer ${supabaseKey}`
                            }
                        });
                        if (res.ok) {
                            const rows = await res.json();
                            if (rows && rows.length > 0) {
                                wishesList = rows.map(r => ({
                                    id: `WISH-${r.id}`,
                                    name: r.guest_name,
                                    attendance: r.attendance,
                                    guestsCount: r.guests_count,
                                    message: r.message,
                                    createdAt: r.created_at
                                }));
                            }
                        }
                    } catch (supaErr) {
                        console.warn("Supabase get rsvp notice:", supaErr.message);
                    }
                }
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ success: true, wishes: wishesList })
            };
        }

        // POST: Kirim ucapan baru
        if (event.httpMethod === "POST") {
            const body = JSON.parse(event.body || "{}");
            const slug = (body.slug || "").trim().toLowerCase();
            const name = (body.name || "").trim();
            const attendance = body.attendance || "Hadir";
            const guestsCount = parseInt(body.guestsCount || 1, 10);
            const message = (body.message || "").trim();

            if (!slug || !name || !message) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: false, message: "Nama, ucapan, dan slug undangan wajib diisi." })
                };
            }

            const newWish = {
                id: `WISH-${Date.now()}`,
                name: name,
                attendance: attendance,
                guestsCount: guestsCount,
                message: message,
                createdAt: new Date().toISOString()
            };

            let wishesList = [];
            try {
                const existing = await rsvpStore.get(slug, { type: "json" });
                wishesList = existing?.wishes || [];
                wishesList.unshift(newWish); // Tambah ucapan baru paling atas
                // Batasi simpan 200 ucapan per undangan
                if (wishesList.length > 200) wishesList = wishesList.slice(0, 200);

                await rsvpStore.setJSON(slug, { slug, wishes: wishesList, lastUpdated: new Date().toISOString() });
            } catch (e) {
                console.warn("Save RSVP error:", e.message);
            }

            // Simpan juga ke Supabase Database
            const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
            const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_edaVnzcw7U4xi2xUYz_nkQ_4mCMgFRJ";
            if (supabaseUrl && supabaseKey) {
                try {
                    const cleanUrl = supabaseUrl.replace(/\/$/, "");
                    await fetch(`${cleanUrl}/rest/v1/wedding_rsvps`, {
                        method: "POST",
                        headers: {
                            "apikey": supabaseKey,
                            "Authorization": `Bearer ${supabaseKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            slug: slug,
                            guest_name: name,
                            attendance: attendance,
                            guests_count: guestsCount,
                            message: message,
                            created_at: newWish.createdAt
                        })
                    });
                } catch (supaErr) {
                    console.warn("Supabase RSVP save notice:", supaErr.message);
                }
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    message: "Terima kasih atas doa dan konfirmasi kehadiran Anda!",
                    wish: newWish,
                    totalWishes: wishesList.length
                })
            };
        }

        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };

    } catch (err) {
        console.error("submit-rsvp error:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Internal Server Error", detail: err.message })
        };
    }
};
