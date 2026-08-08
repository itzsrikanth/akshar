# Local content server (dev)

Status: Accepted

## What this is

`ContentRepository` (`src/services/content-repository.ts`) reads chapter JSON from the repo's
`api/` folder — over jsDelivr in production (`CONTENT_BASE_URL` in `src/services/config.ts`), but
jsDelivr caches a branch alias like `@main` for hours, which makes it painful to see content
edits reflected while actively iterating. In dev, the app instead points at a local static file
server serving the repo root, so `http://localhost:8787/api/contents.json` etc. resolve to
whatever's on disk right now — no waiting on a CDN cache, no committing/pushing to preview a
change.

## Running it

From the repo root:

```sh
npm run content-server   # python3 -m http.server 8787, no new dependency
```

That's the whole server — a directory listing over the repo root, which is all `fetch()` needs.

## Reaching it from wherever the app is actually running

The server binds to the machine it's started on. Where that is relative to the app determines
whether you need anything extra:

- **Metro/the app also runs on the same machine as the content server** (e.g. web build tested in
  a browser on this VM) — `http://localhost:8787` already works, nothing else to do.
- **iOS Simulator on your Mac, content server on this VM** (the current dev setup) — the Simulator
  shares your Mac's network namespace, so it resolves `localhost` to the Mac, not the VM. You need
  a **local port forward** (SSH `-L`, not `-R`) from your Mac into the VM, same direction and
  mechanism as whatever you're already using to reach Metro's port:

  ```sh
  ssh -L 8787:localhost:8787 <user>@<vm-host>
  ```

  Run this alongside (or add `-L 8787:localhost:8787` to) your existing Metro tunnel command.
  **Not a reverse tunnel** — `-R` would only be needed if the VM had to initiate a connection
  into your Mac, which isn't the case here: the Mac is always the client, the VM is always the
  server, for both Metro and this content server. Once the forward is up, `localhost:8787` on the
  Mac (and therefore inside the Simulator) reaches the VM's server.
- **A physical Android device** — same idea, but the device doesn't share your Mac's network
  namespace the way the Simulator does, so it also needs `adb reverse tcp:8787 tcp:8787` (device
  → the machine running `adb`, which is `-R`-shaped from the device's point of view) in addition
  to the Mac→VM forward above, chaining the two — the same pattern already used for Metro's port
  on that path.

## Switching back to the CDN

`CONTENT_BASE_URL` picks the local server automatically whenever `__DEV__` is true (i.e. any
`expo start`/dev-client session) and the jsDelivr URL in production builds — no manual toggle.
CORS doesn't come up on iOS/Android (native `fetch` isn't a browser and doesn't enforce it); it
would if this server is ever used from a web build in an actual browser, which would need
`--cors`-equivalent headers `python3 -m http.server` doesn't send by default.

If a production build ever needs to see a very recent push before jsDelivr's cache naturally
expires, force it with jsDelivr's purge endpoint:
`https://purge.jsdelivr.net/gh/itzsrikanth/akshar@main/api/contents.json` (and per changed file).
