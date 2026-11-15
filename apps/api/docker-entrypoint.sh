#!/bin/sh
# Khởi động API: migrate → (seed nếu bật) → chạy server. Migration lỗi thì container dừng, bản cũ vẫn phục vụ.
set -e

# `prisma db seed` gọi lệnh `tsx prisma/seed.ts` (package.json#prisma.seed) qua PATH; khi không chạy bằng pnpm
# thì PATH không có node_modules/.bin, dẫn tới "spawn tsx ENOENT".
export PATH="$(pwd)/node_modules/.bin:$PATH"

node_modules/.bin/prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  node_modules/.bin/prisma db seed
fi

exec node dist/main.js
