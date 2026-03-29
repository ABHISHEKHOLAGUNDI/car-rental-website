/**
 * Cloudflare Pages Function: /cdn/[[path]]
 * Seamless internal proxy to fetch images from private Cloudflare R2 buckets
 * Using native Pages Routing!
 */

export async function onRequestGet({ request, env, params }) {
  // params.path is an array from the routing: /cdn/myfile.jpg -> ["myfile.jpg"]
  const filename = Array.isArray(params.path) ? params.path.join('/') : params.path;
  
  // 1. Fetch object natively from R2
  const object = await env.R2_BUCKET.get(filename);

  if (object === null) {
    return new Response('Asset Not Found', { status: 404 });
  }

  // 2. Construct response natively with R2 metadata headers
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
  // Cache heavily in user browsers for 1 year (static rental car assets shouldn't change without URL changing)
  headers.set('Cache-Control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
}
