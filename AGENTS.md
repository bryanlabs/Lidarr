# Lidarr (BryanLabs Fork) - AGENTS.md

## What it is

Lidarr is a music collection manager that monitors RSS feeds, auto-downloads releases,
and organizes a music library (similar to Sonarr/Radarr but for music/audiobooks).

This repo is a BryanLabs fork of [upstream Lidarr](https://github.com/Lidarr/Lidarr)
(`develop` branch). It exists to maintain a pinned, controlled image instead of
riding `linuxserver/lidarr:latest`. The fork tracks upstream but adds a small set of
UI customizations (three commits by Dan Bryan, June 2026).

## Where it is used

- **Namespace:** `media-suite`
- **Workload:** `Deployment/lidarr`
- **Image:** `ghcr.io/bryanlabs/lidarr` (currently pinned to tag `v2.14.5.1-bryanlabs.3`)
- Part of the media automation suite alongside Sonarr, Radarr, Prowlarr, qBittorrent,
  and rreading-glasses.

## BryanLabs customizations

Three frontend commits on top of upstream `develop` (all authored June 14 2026):

| Commit | Change |
|---|---|
| `12231f1` | Added album-first library grid view (`frontend/src/Album/Index/AlbumIndex.tsx` + CSS + routes + sidebar) |
| `64193c3` | Made `/` (root URL) default to the new album view instead of the upstream artist view |
| `bf27928` | Filtered the album grid to show only imported (locally present) albums, not all monitored ones |

Net effect: the UI opens to a grid of your imported albums; the upstream artist view
is still reachable at `/artists`; the Library sidebar exposes both Albums and Artists.

No backend changes. No patches to .NET source.

## Build and deploy

Build is entirely manual (no CI pipeline in this repo):

```bash
docker buildx build \
  --platform linux/amd64 \
  -f Dockerfile.bryanlabs \
  -t ghcr.io/bryanlabs/lidarr:v2.14.5.1-bryanlabs.3 \
  --push .
```

Use the cloud builder per cluster convention:
`--builder cloud-bryanlabs-builder` if the multiarch builder is healthy; otherwise
build locally with `--builder multiarch-builder` (see docker-cloud-builder-broken memory note).

`Dockerfile.bryanlabs` stages:
1. Build stage: `dotnet/sdk:8.0-bookworm-slim` + Node 20 + Yarn 1.22 - runs `build.sh --backend --frontend --packages` with `BUILD_SOURCEBRANCHNAME=bryanlabs`
2. Runtime stage: `dotnet/runtime-deps:8.0-bookworm-slim` - uid/gid 1000, exposes 8686, volumes `/config /music /downloads`

After pushing, pin the `media-suite` manifest to the immutable digest (not the mutable tag).

Versioning convention: `v<upstream-lidarr-version>-bryanlabs.<patch>` (e.g. `v2.14.5.1-bryanlabs.3`).

## Code map (customization-relevant files only)

```
Dockerfile.bryanlabs               BryanLabs build definition
BRYANLABS.md                       Short human changelog / build cheatsheet
frontend/src/App/AppRoutes.js      Root route now points to /albums
frontend/src/Components/Page/
  Sidebar/PageSidebar.js           Sidebar: added Albums link alongside Artists
frontend/src/Album/Index/
  AlbumIndex.tsx                   New album grid page (imported-only filter)
  AlbumIndex.css / .css.d.ts      Grid layout styles
  Menus/AlbumIndexSortMenu.tsx    Sort controls for the album grid
frontend/src/Album/
  AlbumCover.js                   Minor cover tweak used by the grid
frontend/src/Store/Actions/
  albumActions.js                  Added fetch action wired to album grid
```

Everything else is upstream Lidarr - do not edit it unless you are intentionally
pulling in upstream changes and rebasing the three bryanlabs commits on top.

## Gotchas

- **Rebase discipline:** the three bryanlabs commits sit on top of upstream `develop`.
  When pulling upstream updates, rebase (do not merge) to keep the commit history clean
  and the diff against upstream minimal.
- **Image tag is immutable in the manifest:** after `--push`, grab the digest
  (`docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/bryanlabs/lidarr:...`)
  and pin it in `bare-metal` manifests.
- **No CI:** there is no GitHub Actions workflow in this fork. Builds and pushes are
  manual. Add a workflow before the customization set grows.
- **Frontend only:** all BryanLabs changes are in `frontend/src`. If a Lidarr upstream
  update significantly refactors `AppRoutes.js`, `PageSidebar.js`, or the album store
  actions, the rebase will need manual resolution.
- **Port 8686** is the standard Lidarr port; the Deployment in `media-suite` should
  expose it on the same port for consistency with other arr apps.
