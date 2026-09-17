FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .

# Where the built site will be served, origin and path together. Left unset it
# is this site's own host at the root of it; a deployment putting the tool
# under a path — one of several on a shared host — passes that address here and
# every route, canonical and sitemap entry is written under it:
#   docker build --build-arg SITE_URL=https://example.org/osiris/ .
ARG SITE_URL=
ENV SITE_URL=$SITE_URL

RUN npm run build

FROM joseluisq/static-web-server:2-alpine
# The build stays here, read-only. The entrypoint copies it to SERVER_ROOT,
# which is a tmpfs, so the mount can be stamped into the pages at startup
# without the image filesystem ever being writable.
COPY --from=builder /app/dist /app/dist
COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENV SERVER_ROOT=/public
# The build writes one HTML file per routed address, each with its own head, so
# `/compare` must serve `compare/index.html` as it stands rather than
# redirecting to `/compare/` — the address the app writes is the address the
# canonical names.
ENV SERVER_REDIRECT_TRAILING_SLASH=false
# No fallback page: every address the app answers is on disk, so an address
# that is not is genuinely not a page of this site and 404s, rather than
# serving the explorer under a name it does not have. The day a route takes an
# id in its path — `prefix: true` in src/seo/routes.ts — this has to come back
# as ENV SERVER_FALLBACK_PAGE=/public/index.html, or that address works in dev
# and 404s in production.
ENV SERVER_PORT=80
# A /health endpoint that answers 200 and writes no access-log line, which is
# what the compose healthcheck and the server's deploy script probe.
ENV SERVER_HEALTH=true
EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/local/bin/static-web-server"]
