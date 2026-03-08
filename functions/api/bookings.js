/**
 * Cloudflare Pages Function: /api/bookings
 * Handles booking creation and retrieval
 */

const ADMIN_TOKEN = "admin-token-998999-secure";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
};

function isAdmin(request) {
    const auth = request.headers.get("Authorization") || "";
    return auth === `Bearer ${ADMIN_TOKEN}`;
}

// GET /api/bookings — admin fetches all bookings with vehicle info
export async function onRequestGet(context) {
    if (!isAdmin(context.request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: corsHeaders,
        });
    }

    try {
        const { results } = await context.env.DB.prepare(`
      SELECT
        b.id,
        b.customer_name,
        b.customer_phone,
        b.start_date,
        b.end_date,
        b.total_price,
        b.status,
        v.name AS vehicle_name,
        v.type AS vehicle_type
      FROM bookings b
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.id DESC
    `).all();

        return new Response(JSON.stringify({ success: true, data: results }), {
            status: 200,
            headers: corsHeaders,
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch bookings", details: err.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

// POST /api/bookings — customer creates a booking with overlap check
export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { vehicle_id, customer_name, customer_phone, start_date, end_date } = body;

        // Validate required fields
        if (!vehicle_id || !customer_name || !customer_phone || !start_date || !end_date) {
            return new Response(
                JSON.stringify({ error: "All fields are required" }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate dates
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (end <= start) {
            return new Response(
                JSON.stringify({ error: "end_date must be after start_date" }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Check vehicle exists and is available
        const vehicle = await context.env.DB.prepare(
            "SELECT * FROM vehicles WHERE id = ? AND is_available = 1"
        )
            .bind(vehicle_id)
            .first();

        if (!vehicle) {
            return new Response(
                JSON.stringify({ error: "Vehicle not found or unavailable" }),
                { status: 404, headers: corsHeaders }
            );
        }

        // Check for date overlaps with existing bookings
        const overlap = await context.env.DB.prepare(`
      SELECT id FROM bookings
      WHERE vehicle_id = ?
        AND status != 'cancelled'
        AND NOT (end_date <= ? OR start_date >= ?)
    `)
            .bind(vehicle_id, start_date, end_date)
            .first();

        if (overlap) {
            return new Response(
                JSON.stringify({
                    error: "Vehicle already booked for the selected dates. Please choose different dates.",
                }),
                { status: 409, headers: corsHeaders }
            );
        }

        // Calculate total price
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const total_price = days * vehicle.daily_rate;

        // Insert booking
        const result = await context.env.DB.prepare(`
      INSERT INTO bookings (vehicle_id, customer_name, customer_phone, start_date, end_date, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
    `)
            .bind(vehicle_id, customer_name, customer_phone, start_date, end_date, total_price)
            .run();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Booking confirmed!",
                booking_id: result.meta.last_row_id,
                total_price,
                days,
            }),
            { status: 201, headers: corsHeaders }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to create booking", details: err.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

// PUT /api/bookings — admin updates booking status
export async function onRequestPut(context) {
    if (!isAdmin(context.request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: corsHeaders,
        });
    }

    try {
        const { id, status } = await context.request.json();
        const validStatuses = ["confirmed", "cancelled", "completed"];

        if (!validStatuses.includes(status)) {
            return new Response(
                JSON.stringify({ error: "Invalid status value" }),
                { status: 400, headers: corsHeaders }
            );
        }

        await context.env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ?")
            .bind(status, id)
            .run();

        return new Response(
            JSON.stringify({ success: true, message: "Booking status updated" }),
            { status: 200, headers: corsHeaders }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to update booking", details: err.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders });
}
