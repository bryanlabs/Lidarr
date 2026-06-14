# Bryanlabs Lidarr

This fork keeps Bryanlabs on a controlled Lidarr image instead of the upstream
`linuxserver/lidarr:latest` moving tag.

Current local customization:

- `/` opens an album-first library grid.
- `/artists` preserves the upstream artist library view.
- The Library sidebar exposes both Albums and Artists.

Build and push for the media-suite deployment:

```bash
docker buildx build \
  --platform linux/amd64 \
  -f Dockerfile.bryanlabs \
  -t ghcr.io/bryanlabs/lidarr:v2.14.5.1-bryanlabs.3 \
  --push .
```

After pushing, pin the media-suite manifest to the immutable digest.
