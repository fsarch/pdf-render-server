# Base
FROM node:20.10.0-bullseye-slim AS base

ENV PORT 3000
ENV CHROMIUM_EXECUTABLE_PATH /usr/bin/chromium

WORKDIR /usr/src/app

COPY package*.json ./


# Production Deps
FROM base AS deps

ENV NODE_ENV production

RUN apt-get update && \
    apt-get install -y node-gyp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
RUN npm ci --fetch-timeout=300000


# Build Dockerfile
FROM base AS builder

RUN apt-get update && \
    apt-get install -y node-gyp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
RUN npm ci --fetch-timeout=300000

COPY . ./
RUN npm run build


# Main Dockerfile
FROM base

ENV NODE_ENV production

EXPOSE 3000

RUN apt-get update ; \
    apt-get --no-install-recommends install -y chromium ; \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules

USER node

CMD ["node", "./dist/main.js"]

