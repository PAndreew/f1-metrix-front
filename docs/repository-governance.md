# Chart scopes and repository governance

## Website

Production deployment `dpl_BnncMg6VgJGRNSUemQqWzjezvn9c` reports Ready at https://f1-metrix-front.vercel.app/.

Driver career rankings and constructor-season estimates are separate sections. The constructor section has a year selector and explains its season-specific centring. It no longer places 2026 constructor estimates beside all-time driver estimates as though the populations share a scope.

Charts no longer initialise inside hidden accordions. A shared lifecycle controller waits for visible, nonzero-size containers, observes expansion/hiding and container resizing, and destroys registered instances when views change. Regression tests check hidden charts are not constructed, then exercise expansion, collapse, race switching and constructor-year switching at desktop/tablet/mobile widths. Existing simulator and qualifying browser tests pass, as do 39 Node tests. This addresses the identified hidden-initialisation path; precise original failing screenshots were not provided.

## GitHub settings applied

Repository: https://github.com/PAndreew/f1-metrix-front

- Public, Issues enabled.
- Actual default branch is `master`; no branch named `main` exists. Protected `master` rather than silently renaming it.
- Non-admin updates require a PR with one approving review; stale approvals are dismissed and conversations must resolve.
- Admin enforcement is disabled, preserving the owner's direct-push bypass.
- Force pushes and deletion are disabled.
- PAndreew is the sole repository collaborator/admin at the time of verification.

Before public visibility, Gitleaks 8.30.1 scanned tracked git history with redacted output and found zero credential matches. No tracked environment/private-key/credential files were found by the filename check. This is a best-effort audit, not a guarantee that every kind of sensitive information is absent. Uncommitted research artifacts were not published by changing GitHub visibility.

## Owner-only issue resolution workflow

GitHub cannot prohibit an issue's author from closing their own issue. The prepared workflow reopens non-owner closures, while leaving owner closures and subsequent owner closures untouched. It uses only issue-write permission, a commit-pinned official GitHub action, no checkout and no interpolation of issue text as code. Four mocked tests cover its decision logic.

This is eventual automation, not an atomic prohibition: the issue can briefly close, and enforcement depends on Actions running. The user explicitly approved committing and pushing this workflow together with the current website source. This avoids a Git-triggered deployment restoring the old site. Unpublished numerical experiments, machine paths and research working files are excluded from that commit. After pushing, verify the workflow's active state via the GitHub API; mocked tests alone do not establish live enforcement.
