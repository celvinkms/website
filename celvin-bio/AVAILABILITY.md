# Website availability

The repository's `Website availability` GitHub Actions workflow requests
`https://celvin.rip/healthz` about every ten minutes. It also runs when its workflow
or the Express server changes on `main`, and can be started manually from Actions.
The endpoint responds without reading PostgreSQL, invoking Discord or recording a
profile view. Cache-control headers and a per-run query string prevent a cached
edge response from being mistaken for a running Express instance.

This is a best-effort availability check. Regular incoming requests can keep a
Render Free instance active, but GitHub can delay or drop scheduled jobs, and
public-repository schedules are disabled after 60 days without repository
activity. Render can still restart or suspend a service and its 750 monthly free
instance hours are shared across the workspace. A paid Render instance is needed
to remove the Free instance's inactivity shutdown limitation reliably.

Standard GitHub-hosted runners are free for this public repository. This workflow
uses no secrets, repository token permissions, third-party actions or persistent
artifacts. It can be disabled under Actions → Website availability → Disable
workflow, or removed by deleting `.github/workflows/website-availability.yml`.

Sources:
- https://render.com/docs/free#spinning-down-on-idle
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
