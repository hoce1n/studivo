# Production `ChunkLoadError` Runbook

Studivo self-hosts Next.js with `pnpm build` and `next start` behind PM2/Nginx. A `ChunkLoadError` after deployment means a browser, service worker, reverse proxy, or non-atomic deploy path is trying to combine JavaScript from one build with HTML/RSC from another build.

## Required deployment order

Use `scripts/deploy-production.sh` as the baseline SSH deploy entrypoint:

```bash
APP_DIR=/path/to/studivo PM2_APP_NAME=studivo ./scripts/deploy-production.sh
```

The script pulls the current branch, installs locked dependencies, stops PM2 before deleting `.next`, performs a clean production build, then starts the existing PM2 process again. Stopping before `rm -rf .next` prevents the running server from serving a half-deleted or half-built asset tree.

## Nginx cache policy

Let Next.js own HTML/RSC cache headers. If Nginx adds cache headers, use this split:

```nginx
location /_next/static/ {
  proxy_pass http://127.0.0.1:3000;
  add_header Cache-Control "public, max-age=31536000, immutable" always;
}

location / {
  proxy_pass http://127.0.0.1:3000;
  add_header Cache-Control "private, no-cache, no-store, max-age=0, must-revalidate" always;
}
```

Do not cache App Router HTML, RSC responses, or route prefetch responses at Nginx unless the cache key and invalidation strategy are explicitly designed for Next.js App Router deployments.

## Browser recovery

The root layout mounts a tiny client recovery listener. If an already-open tab requests a chunk from the previous build and the browser raises a `ChunkLoadError`, Studivo reloads once per tab so the browser fetches the current build manifest and route chunks.

## Service worker policy

`public/sw.js` intentionally excludes `/_next/` and navigation requests from its runtime cache. The service worker may cache stable manifest icons, but it must not cache hashed chunks, HTML, RSC payloads, or App Router data responses.

## Verification

After deployment, compare the requested missing chunk with the current build output:

```bash
cat .next/BUILD_ID
find .next/static/chunks -maxdepth 1 -name '<missing-chunk-name>' -print
```

- Missing from disk and requested only by old tabs: stale browser bundle; reload recovery should fix it.
- Present on disk but 404 through Nginx: reverse proxy/static routing issue.
- Missing from disk but referenced by freshly loaded HTML: incomplete build or serving mixed `.next` output.
