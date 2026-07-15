import { app } from '../src/index';

export default function (req: Request) {
  const url = new URL(req.url);
  
  // Vercel Serverless Functions inside the /api folder automatically strip the "/api" 
  // prefix from the request URL. Since our Elysia app expects routes to start with "/api",
  // we must add it back manually before passing the request to Elysia.
  if (!url.pathname.startsWith('/api')) {
    url.pathname = '/api' + (url.pathname === '/' ? '' : url.pathname);
  }
  
  const newReq = new Request(url.toString(), req);
  return app.fetch(newReq);
}
