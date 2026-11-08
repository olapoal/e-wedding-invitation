// netlify/functions/get-invitation.js
// Endpoint untuk mengambil data undangan yang telah dipublish berdasarkan slug

exports.handler = async function(event, context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: corsHeaders, body: "" };
    }

    try {
        const params = event.queryStringParameters || {};
        const slug = (params.slug || params.id || "").trim().toLowerCase();

        if (!slug) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ success: false, message: "Parameter slug undangan diperlukan" })
            };
        }

        try {
            const { getStore } = require("@netlify/blobs");
            const invitationsStore = getStore("wedding_invitations");
            const invitationRecord = await invitationsStore.get(slug, { type: "json" });

            if (invitationRecord) {
                // Increment view count secara background
                try {
                    invitationRecord.viewsCount = (invitationRecord.viewsCount || 0) + 1;
                    invitationRecord.lastViewedAt = new Date().toISOString();
                    await invitationsStore.setJSON(slug, invitationRecord);
                } catch (e) {
                    // Ignore view count bump error
                }

                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: true,
                        slug: slug,
                        data: invitationRecord.data,
                        publishedAt: invitationRecord.publishedAt,
                        owner: invitationRecord.ownerEmail
                    })
                };
            }
        } catch (blobsErr) {
            console.warn("Netlify Blobs read error in get-invitation:", blobsErr.message);
        }

        // Cek ke Supabase Database jika tidak ditemukan di Blobs
        const supabaseUrl = process.env.SUPABASE_URL || "https://plxonjsspoagxxtolyjj.supabase.co";
        const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_edaVnzcw7U4xi2xUYz_nkQ_4mCMgFRJ";
        if (supabaseUrl && supabaseKey) {
            try {
                const cleanUrl = supabaseUrl.replace(/\/$/, "");
                const res = await fetch(`${cleanUrl}/rest/v1/wedding_invitations?slug=eq.${encodeURIComponent(slug)}&select=*`, {
                    headers: {
                        "apikey": supabaseKey,
                        "Authorization": `Bearer ${supabaseKey}`
                    }
                });
                if (res.ok) {
                    const rows = await res.json();
                    if (rows && rows.length > 0) {
                        return {
                            statusCode: 200,
                            headers: corsHeaders,
                            body: JSON.stringify({
                                success: true,
                                slug: slug,
                                data: rows[0].data,
                                publishedAt: rows[0].created_at || rows[0].updated_at,
                                owner: rows[0].owner_email
                            })
                        };
                    }
                }
            } catch (supaErr) {
                console.warn("Supabase get-invitation notice:", supaErr.message);
            }
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                message: `Undangan dengan tautan '${slug}' tidak ditemukan atau belum dipublikasikan.`
            })
        };

    } catch (err) {
        console.error("get-invitation error:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Internal Server Error", detail: err.message })
        };
    }
};
