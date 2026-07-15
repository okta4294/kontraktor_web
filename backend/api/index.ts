import { app } from '../src/index';

export default async function handler(request: Request) {
  try {
    return await app.fetch(request);
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: "Vercel Serverless Error",
      message: err.message,
      stack: err.stack
    }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
