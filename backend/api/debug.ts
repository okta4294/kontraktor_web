export default function handler(request: Request) {
  return new Response(JSON.stringify({
    url: request.url,
    method: request.method
  }), {
    headers: { 'content-type': 'application/json' }
  });
}
