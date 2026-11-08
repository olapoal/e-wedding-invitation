// netlify/functions/publish-invitation.js
// Endpoint untuk mempublikasikan undangan pernikahan & memotong 1 token secara aman

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
        let slug = (body.slug || "").trim().toLowerCase();
        const invitationData = body.invitationData || body.data;

        if (!email) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, message: "Email pemilik undangan wajib disertakan" })
            };
        }

        if (!invitationData) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, message: "Data undangan tidak boleh kosong" })
            };
        }

        // Format slug bersih (hanya huruf, angka, strip)
        if (!slug) {
            const groom = (invitationData.groom?.nickname || "groom").toLowerCase().replace(/[^a-z0-9]/g, "");
            const bride = (invitationData.bride?.nickname || "bride").toLowerCase().replace(/[^a-z0-9]/g, "");
            slug = `${groom}-${bride}-${Date.now().toString(36).substring(4)}`;
        } else {
            slug = slug.replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        }

        // 1. Cek Admin Emails (Bypass token deduction untuk master admin)
        const adminEmails = (process.env.ADMIN_EMAILS || "olapoal.artgallery@gmail.com,admin@wedding.com")
            .toLowerCase()
            .split(",")
            .map(e => e.trim());
        const isAdmin = adminEmails.includes(email);

        let remainingTokens = 0;

        try {
            const { getStore } = require("@netlify/blobs");
            const buyersStore = getStore("wedding_buyers");
            const invitationsStore = getStore("wedding_invitations");

            let buyer = await buyersStore.get(email, { type: "json" });

            if (!isAdmin) {
                if (!buyer) {
                    return {
                        statusCode: 403,
                        headers: corsHeaders,
                        body: JSON.stringify({
                            success: false,
                            message: "Akun Anda belum terdaftar sebagai pembeli berlisensi."
                        })
                    };
                }

                const currentTokens = typeof buyer.tokens === "number" ? buyer.tokens : 0;

                // Cek apakah token mencukupi
                if (currentTokens < 1) {
                    return {
                        statusCode: 402, // Payment Required
                        headers: corsHeaders,
                        body: JSON.stringify({
                            success: false,
                            needTopup: true,
                            currentTokens: 0,
                            message: "Token Publish Anda habis (0 Token). Silakan lakukan Top Up via Trakteer untuk mempublish undangan ini."
                        })
                    };
                }

                // Cek apakah slug ini sudah pernah dipublish oleh user yang sama sebelumnya (re-publish/update gratis!)
                const userSlugs = buyer.publishedSlugs || [];
                const isRepublish = userSlugs.includes(slug);

                if (isRepublish) {
                    // Update undangan yang sudah ada tidak memotong token lagi!
                    remainingTokens = currentTokens;
                    console.log(`User ${email} memperbarui undangan yang sudah ada (${slug}) tanpa potong token.`);
                } else {
                    // Undangan baru -> potong 1 token
                    remainingTokens = currentTokens - 1;
                    buyer.tokens = remainingTokens;
                    buyer.publishedCount = (buyer.publishedCount || 0) + 1;
                    userSlugs.push(slug);
                    buyer.publishedSlugs = userSlugs;
                    buyer.lastPublishAt = new Date().toISOString();

                    await buyersStore.setJSON(email, buyer);
                    console.log(`User ${email} berhasil mempublish undangan baru '${slug}'. Sisa token: ${remainingTokens}`);
                }
            } else {
                remainingTokens = 9999;
            }

            // Simpan data undangan ke Netlify Blobs
            const recordToSave = {
                slug: slug,
                ownerEmail: email,
                data: invitationData,
                publishedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                viewsCount: 0
            };

            await invitationsStore.setJSON(slug, recordToSave);

        } catch (blobsErr) {
            console.error("Publish Netlify Blobs error:", blobsErr.message);
            // Jika blobs tidak ada (misal di local testing serverless offline), kembalikan response berhasil simulasi
            remainingTokens = 0;
        }

        // Simpan / Backup ke Supabase Database
        const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
            try {
                const cleanUrl = supabaseUrl.replace(/\/$/, "");
                // Simpan data undangan
                await fetch(`${cleanUrl}/rest/v1/wedding_invitations`, {
                    method: "POST",
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                        "Prefer": "resolution=merge-duplicates"
                    },
                    body: JSON.stringify({
                        slug: slug,
                        owner_email: email,
                        data: invitationData,
                        updated_at: new Date().toISOString()
                    })
                });

                // Update token user di Supabase jika bukan demo
                if (email && email !== "demo.pengantin@gmail.com") {
                    await fetch(`${cleanUrl}/rest/v1/wedding_buyers?email=eq.${encodeURIComponent(email)}`, {
                        method: "PATCH",
                        headers: {
                            "apikey": supabaseKey,
                            "Authorization": `Bearer ${supabaseKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            tokens: remainingTokens,
                            updated_at: new Date().toISOString()
                        })
                    });
                }
            } catch (supaErr) {
                console.warn("Supabase publish notice:", supaErr.message);
            }
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                message: "Undangan pernikahan berhasil dipublikasikan secara online!",
                slug: slug,
                publicUrl: `/i/${slug}`,
                fullUrl: `https://${event.headers.host || "undangan-nikah.netlify.app"}/i/${slug}`,
                remainingTokens: remainingTokens
            })
        };

    } catch (err) {
        console.error("publish-invitation error:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Internal Server Error", detail: err.message })
        };
    }
};
