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
