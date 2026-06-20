// Minimal static server to preview the built marketing site locally.
// Usage: npm run preview  (then open http://localhost:8787)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const port = Number(process.env.PORT) || 8787;

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript" };

createServer(async (req, res) => {
  try {
    const url = (req.url || "/").split("?")[0];
    const rel = url === "/" ? "index.html" : url.replace(/^\/+/, "");
    const ext = rel.slice(rel.lastIndexOf("."));
    const body = await readFile(join(dist, rel));
    res.writeHead(200, { "content-type": types[ext] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
}).listen(port, () => console.log(`Preview at http://localhost:${port}`));
