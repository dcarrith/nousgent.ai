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

FROM node:22-alpine AS voice-builder
ARG VOICE_MODEL=kokoro-82m-q8
WORKDIR /voice-deps
RUN npm init -y >/dev/null && \
    npm install --omit=dev --no-audit --no-fund onnxruntime-web@1.31.1 phonemizer@1.2.1 && \
    rm -f node_modules/onnxruntime-web/dist/*.map \
          node_modules/onnxruntime-web/dist/*.jsep.* \
          node_modules/onnxruntime-web/dist/*.asyncify.* \
          node_modules/onnxruntime-web/dist/*.jspi.* \
          node_modules/onnxruntime-web/dist/ort.all.* \
          node_modules/onnxruntime-web/dist/ort.webgl.* \
          node_modules/onnxruntime-web/dist/ort.webgpu.* && \
    mkdir -p /voices && \
    wget -q -O "/voices/${VOICE_MODEL}.onnx" \
      "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_quantized.onnx" && \
    wget -q -O "/voices/kokoro-tokenizer.json" \
      "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/tokenizer.json" && \
    wget -q -O "/voices/bm_george.bin" \
      "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/bm_george.bin" && \
    wget -q -O "/voices/bm_daniel.bin" \
      "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/bm_daniel.bin" && \
    wget -q -O "/voices/am_onyx.bin" \
      "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/am_onyx.bin"

FROM node:22-alpine AS production

ARG APP_VERSION=1.16.2
LABEL org.opencontainers.image.title="nousgent-web" \
      org.opencontainers.image.description="nousgent.ai & ia.nousgent.ai — NOUSGENT Flagship Gamified Mission Control & M2M Swarm Plane for Bounded ASI on the Chia Blockchain" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.source="https://github.com/dcarrith/nousgent.ai" \
      org.opencontainers.image.url="https://nousgent.ai"

RUN apk upgrade --no-cache && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nousgent -u 1001 -G nodejs && \
    mkdir -p /var/lib/nousgent /tmp/nousgent-state /opt/nousgent-voices && \
    chown -R nousgent:nodejs /var/lib/nousgent /tmp/nousgent-state /opt/nousgent-voices && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn*

WORKDIR /app

COPY --chown=nousgent:nodejs . /app/
COPY --from=voice-builder --chown=nousgent:nodejs /voice-deps/node_modules /app/node_modules
COPY --from=voice-builder --chown=nousgent:nodejs /voices /opt/nousgent-voices
COPY --from=native-builder --chown=nousgent:nodejs /out/*.node /app/packages/dbrain/vendor/dbrain-core-rs/

USER nousgent

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV CANONICAL_ORIGIN=https://nousgent.ai
ENV M2M_ORIGIN=https://ia.nousgent.ai
ENV NOUSGENT_STATE_DIR=/var/lib/nousgent
ENV NOUSGENT_MASK_OPACITY_PCT=65
ENV NOUSGENT_VOICE_ENABLED=true
ENV NOUSGENT_VOICE_MODEL=kokoro-82m-q8
ENV NOUSGENT_VOICE_PERSONA=afrobeat-baritone
ENV NOUSGENT_VOICE_MODEL_DIR=/opt/nousgent-voices
ENV APP_VERSION=${APP_VERSION}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "--no-warnings=ExperimentalWarning", "server.js"]
