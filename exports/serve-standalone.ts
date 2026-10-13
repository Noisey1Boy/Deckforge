const root = '/home/z/my-project/exports/voice-agent-pitch';
Bun.serve({
  port: 8123,
  async fetch(req) {
    const url = new URL(req.url);
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/standalone/index.html';
    const f = Bun.file(root + p);
    if (await f.exists()) return new Response(f);
    return new Response('not found', { status: 404 });
  },
});
console.log('serving on 8123');
