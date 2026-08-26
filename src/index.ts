export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Root route or /index.html serves the roadmap explorer demo
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const assetResponse = await env.ASSETS.fetch(
        new Request(new URL("/index.html", request.url), request)
      );
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        headers: {
          ...Object.fromEntries(assetResponse.headers.entries()),
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
