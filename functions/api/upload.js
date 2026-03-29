/**
 * Cloudflare Pages Function: /api/upload
 * Handles Admin secure image multipart/form-data uploads to Cloudflare R2
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Basic Authorization (Admin only)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== "Bearer admin-token-998999-secure") {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 2. Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No valid image provided in 'image' field." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Generate a secure, unique filename
    const uniqueId = crypto.randomUUID();
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uniqueId}.${ext}`;

    // 4. Save to Cloudflare R2 bucket bound as env.R2_BUCKET
    await env.R2_BUCKET.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type || 'image/jpeg' }
    });

    // 5. Return success JSON with local proxy CDN url!
    const localCdnUrl = `/cdn/${filename}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Image uploaded successfully to R2",
        url: localCdnUrl,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to upload image", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
