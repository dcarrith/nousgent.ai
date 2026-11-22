# ==============================================================================
# nousgent.ai & ia.nousgent.ai Production Hardened Multi-Stage Dockerfile
# Targets: https://nousgent.ai (Human UI), https://www.nousgent.ai (301), https://ia.nousgent.ai (M2M)
# ==============================================================================

FROM node:22-alpine AS native-builder
RUN apk add --no-cache build-base
WORKDIR /src
COPY packages/dbrain/vendor/dbrain-core-rs/native/dbrain_core_rs_napi.c /src/dbrain_core_rs_napi.c
RUN mkdir -p /out && \
    ARCH="$(node -p process.arch)" && \
    gcc -O3 -std=c99 -shared -fPIC \
      -I/usr/local/include/node \
      /src/dbrain_core_rs_napi.c \
      -o "/out/dbrain_core_rs.linux-${ARCH}.node"

FROM node:22-alpine AS production

ARG APP_VERSION=1.7.0
LABEL org.opencontainers.image.title="nousgent-web" \
      org.opencontainers.image.description="nousgent.ai & ia.nousgent.ai — NOUSGENT Flagship Gamified Mission Control & M2M Swarm Plane for Bounded ASI on the Chia Blockchain" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.source="https://github.com/dcarrith/nousgent.ai" \
      org.opencontainers.image.url="https://nousgent.ai"

RUN apk upgrade --no-cache && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nousgent -u 1001 -G nodejs && \
    mkdir -p /var/lib/nousgent /tmp/nousgent-state && \
    chown -R nousgent:nodejs /var/lib/nousgent /tmp/nousgent-state && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn*

WORKDIR /app

COPY --chown=nousgent:nodejs . /app/
COPY --from=native-builder --chown=nousgent:nodejs /out/*.node /app/packages/dbrain/vendor/dbrain-core-rs/

USER nousgent

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV CANONICAL_ORIGIN=https://nousgent.ai
ENV M2M_ORIGIN=https://ia.nousgent.ai
ENV NOUSGENT_STATE_DIR=/var/lib/nousgent
ENV APP_VERSION=${APP_VERSION}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "--no-warnings=ExperimentalWarning", "server.js"]
