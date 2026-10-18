import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve("dist/client");
const base = process.env.VITE_BASE_PATH || "/";
if (!base.startsWith("/") || !base.endsWith("/")) {
  throw new Error("VITE_BASE_PATH must start and end with a slash.");
}
const prefix = `fit-detective-${createHash("sha256").update(base).digest("hex").slice(0, 8)}-`;
async function walk(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      files.map((item) =>
        item.isDirectory()
          ? walk(path.join(dir, item.name))
          : path.join(dir, item.name),
      ),
    )
  ).flat();
}
const files = (await walk(root)).filter(
  (file) => path.basename(file) !== "sw.js",
);
const hash = createHash("sha256");
for (const file of files.sort()) hash.update(await readFile(file));
const cache = `${prefix}${hash.digest("hex").slice(0, 12)}`;
const urls = files.map(
  (file) => base + path.relative(root, file).split(path.sep).join("/"),
);
await writeFile(
  path.join(root, "sw.js"),
  `const CACHE=${JSON.stringify(cache)};
const ASSETS=${JSON.stringify([base, ...urls])};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(${JSON.stringify(prefix)})&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(${JSON.stringify(base)}))return;
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreVary:true})).then(cached=>cached||fetch(event.request)));
});
`,
);
console.log(`Prepared offline cache: ${urls.length} local files.`);
