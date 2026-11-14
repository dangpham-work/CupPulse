# BrewLite API – build từ thư mục gốc monorepo:
#   docker build -f apps/api/Dockerfile -t brewlite-api .
FROM node:22-alpine AS build
RUN apk add --no-cache openssl && npm install -g pnpm@10.34.9
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @brewlite/api...
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @brewlite/shared build && pnpm --filter @brewlite/api build

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/api
RUN chmod +x docker-entrypoint.sh
USER node
EXPOSE 4000
# Migration chạy khi container khởi động vì DB production không public (ADR-004).
ENTRYPOINT ["./docker-entrypoint.sh"]
