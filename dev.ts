const PORT = 8787;
console.log(`🚀 Local dev server running on http://localhost:${PORT}`);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(`./public${filePath}`);
    if (await file.exists()) {
      return new Response(file);
    }
    return new Response(Bun.file("./public/index.html"));
  },
});
