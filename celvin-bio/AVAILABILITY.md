# Website availability

## Why the first check left gaps

GitHub's scheduled workflow was active and its runs succeeded, but the observed
run history contained gaps of several hours despite a ten-minute schedule.
GitHub documents that scheduled events can be delayed or dropped. A successful
individual run therefore does not guarantee uninterrupted Render activity.

## Two best-effort checks

1. `keep-alive.js` sends one HTTPS GET to this service's public `/healthz` every
   five minutes, plus one immediately after the server starts listening. It uses
   Render's `RENDER_EXTERNAL_URL` to bypass Cloudflare and any custom-domain cache.
   The request has a 15-second timeout, does not overlap an existing request,
   follows no redirects, and checks the actual JSON health response. Failures
   update diagnostics and never stop the website. No database, Discord lookup,
   profile view, music, image or video is loaded by these requests.
2. `.github/workflows/website-availability.yml` requests the public health endpoint
   every five minutes as an independent wake-up fallback. It also runs on relevant
   pushes and can be started manually. GitHub scheduling remains best effort.

The self-check starts automatically on Render, except for pull-request previews.
It stays disabled during local development. Optional environment variables:

- `KEEP_ALIVE_ENABLED=false`: stop self-checks.
- `KEEP_ALIVE_ENABLED=true`: explicitly enable them outside Render.
- `KEEP_ALIVE_URL=https://your-service.example`: override the public service
  origin; the requested path is always `/healthz`. HTTPS is required.

`GET /healthz` reports `uptimeSeconds` and `keepAlive` diagnostics: whether checks
are enabled/running, their interval, last attempt/success and consecutive failures.
It reveals no environment secrets or configured target URL. Cache-control headers
and a per-request query string prevent a cached edge response from being mistaken
for a running Express instance.

## Limits and stronger options

A process cannot run a timer while Render has stopped or suspended it. The
self-check cannot wake that process by itself, and an external check cannot
override suspension, exhausted free instance hours or provider restarts. Render
does not document a guarantee that self-generated requests prevent inactivity
shutdown. These checks reduce the chance of idle gaps; they are not an uptime SLA.

For an independent external scheduler, a Cloudflare Worker Cron Trigger or a
dedicated uptime monitor can request `https://celvin.rip/healthz` every five
minutes. Activating one requires the owner's account connection/configuration.
An always-on paid Render compute instance removes the Free plan's inactivity
shutdown. Changing the workspace subscription alone does not do that.

No paid service or external account is created by this code. GitHub checks use
public HTTP only, with no secrets or repository-token permissions. They can be
disabled under Actions → Website availability → Disable workflow. For the app's
self-check, set `KEEP_ALIVE_ENABLED=false` and redeploy.

Sources:
- https://render.com/docs/free#spinning-down-on-idle
- https://render.com/docs/environment-variables
- https://docs.github.com/en/actions/how-tos/troubleshoot-workflows
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule
