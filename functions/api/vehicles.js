/**
 * Cloudflare Pages Function: /api/vehicles
 * Handles vehicle CRUD operations against D1
 */

const ADMIN_TOKEN = "admin-token-998999-secure";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
};

function isAdmin(request) {
    const auth = request.headers.get("Authorization") || "";
    return auth === `Bearer ${ADMIN_TOKEN}`;
}

// GET /api/vehicles — fetch all vehicles
export async function onRequestGet(context) {
    try {
        const { results } = await context.env.DB.prepare(
            "SELECT * FROM vehicles ORDER BY id DESC"
        ).all();
        return new Response(JSON.stringify({ success: true, data: results }), {
            status: 200,
            headers: corsHeaders,
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch vehicles", details: err.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

// POST /api/vehicles — create a new vehicle (admin only)
export async function onRequestPost(context) {
    if (!isAdmin(context.request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: corsHeaders,
        });
    }

    try {
        const { name, type, daily_rate, image_url, plate_number, description, features } = await context.request.json();

        if (!name || !type || !daily_rate) {
            return new Response(
                JSON.stringify({ error: "name, type, and daily_rate are required" }),
                { status: 400, headers: corsHeaders }
            );
        }

        const result = await context.env.DB.prepare(
            "INSERT INTO vehicles (name, type, daily_rate, image_url, plate_number, description, is_available) VALUES (?, ?, ?, ?, ?, ?, 1)"
        )
            .bind(name, type, parseInt(daily_rate), image_url || "", plate_number || "", description || "")
            .run();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Vehicle added",
                id: result.meta.last_row_id,
            }),
            { status: 201, headers: corsHeaders }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to add vehicle", details: err.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

// PUT /api/vehicles — update vehicle availability (admin only)
export async function onRequestPut(context) {
    if (!isAdmin(context.request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: corsHeaders,
        });
    }

    try {
        const { id, name, type, daily_rate, image_url, plate_number, description, features, is_available } = await context.request.json();

        if (name !== undefined) {
            // Full update
            await context.env.DB.prepare(
                `UPDATE vehicles SET name = ?, type = ?, daily_rate = ?, image_url = ?, plate_number = ?, description = ?, is_available = ? WHERE id = ?`
            )
                .bind(name, type, parseInt(daily_rate), image_url || "", plate_number || "", description || "", is_available ? 1 : 0, id)
                .run();
        } else {
            // Partial update just for availability
            await context.env.DB.prepare(
                "UPDATE vehicles SET is_available = ? WHERE id = ?"
            )
                .bind(is_available ? 1 : 0, id)
                .run();
        }

        return new Response(
            JSON.stringify({ success: true, message: "Vehicle updated" }),
            { status: 200, headers: corsHeaders }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to update vehicle", details: err.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

// DELETE /api/vehicles — remove a vehicle (admin only)
export async function onRequestDelete(context) {
    if (!isAdmin(context.request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: corsHeaders,
        });
    }

    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return new Response(JSON.stringify({ error: "id query param required" }), {
                status: 400,
                headers: corsHeaders,
            });
        }

        await context.env.DB.prepare("DELETE FROM vehicles WHERE id = ?")
            .bind(id)
            .run();

        return new Response(
            JSON.stringify({ success: true, message: "Vehicle deleted" }),
            { status: 200, headers: corsHeaders }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to delete vehicle", details: err.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}
