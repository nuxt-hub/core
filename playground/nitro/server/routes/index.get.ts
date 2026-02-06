import { defineEventHandler } from '#imports'
import { setHeader } from 'h3'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/html; charset=utf-8')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NuxtHub Nitro Playground</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 28px; line-height: 1.5; }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      .wrap { max-width: 980px; }
      .muted { opacity: 0.8; }
      .grid { display: grid; gap: 12px; margin-top: 14px; }
      .row { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; padding: 12px; border: 1px solid rgba(127,127,127,.35); border-radius: 12px; }
      .path { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .btn { cursor: pointer; border: 1px solid rgba(127,127,127,.45); background: rgba(127,127,127,.12); padding: 7px 10px; border-radius: 10px; }
      .btn:hover { background: rgba(127,127,127,.18); }
      .btn:disabled { opacity: .6; cursor: default; }
      .a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
      .panel { margin-top: 14px; padding: 12px; border: 1px solid rgba(127,127,127,.35); border-radius: 12px; }
      pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>NuxtHub Nitro Playground</h1>
      <p class="muted">Click an endpoint to open it, or run it inline to see the JSON response.</p>

      <div class="grid" id="grid"></div>

      <div class="panel">
        <div class="muted" style="margin-bottom: 8px">Response</div>
        <pre id="out">Select “Run” on an endpoint.</pre>
      </div>
    </div>

    <script>
      const endpoints = [
        { label: "Blob", path: "/api/tests/blob" },
        { label: "KV", path: "/api/tests/kv" },
        { label: "DB", path: "/api/tests/db" },
        { label: "Cache", path: "/api/tests/cache" },
      ]

      const grid = document.getElementById("grid")
      const out = document.getElementById("out")

      function setOut(value) {
        out.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }

      async function run(path, btn) {
        const start = Date.now()
        btn.disabled = true
        btn.textContent = "Running…"
        try {
          const res = await fetch(path, { headers: { "accept": "application/json" } })
          const txt = await res.text()
          let body
          try { body = JSON.parse(txt) } catch { body = txt }
          setOut({ ok: res.ok, status: res.status, ms: Date.now() - start, path, body })
        } catch (e) {
          setOut({ ok: false, path, error: e && (e.message || String(e)) })
        } finally {
          btn.disabled = false
          btn.textContent = "Run"
        }
      }

      for (const ep of endpoints) {
        const row = document.createElement("div")
        row.className = "row"

        const left = document.createElement("div")
        left.className = "path"
        left.innerHTML = "<strong>" + ep.label + "</strong> <span class='muted'>GET</span> <code>" + ep.path + "</code>"

        const open = document.createElement("a")
        open.className = "a"
        open.href = ep.path
        open.target = "_blank"
        open.rel = "noreferrer"
        open.textContent = "Open"

        const btn = document.createElement("button")
        btn.className = "btn"
        btn.type = "button"
        btn.textContent = "Run"
        btn.addEventListener("click", () => run(ep.path, btn))

        row.appendChild(left)
        row.appendChild(open)
        row.appendChild(btn)
        grid.appendChild(row)
      }
    </script>
  </body>
</html>`
})
