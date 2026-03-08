/**
 * Cloudflare Pages Function: /api/login
 * Handles admin authentication
 */

const ADMIN_PASSWORD = "998999";
const ADMIN_TOKEN = "admin-token-998999-secure";

export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const { password } = await context.request.json();

    if (password === ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({
          success: true,
          token: ADMIN_TOKEN,
          message: "Login successful",
        }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid password",
        }),
        { status: 401, headers: corsHeaders }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Bad request", details: err.message }),
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
