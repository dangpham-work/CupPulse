#!/bin/sh
# Khởi động API: migrate → (seed nếu bật) → chạy server. Migration lỗi thì container dừng, bản cũ vẫn phục vụ.
set -e

node_modules/.bin/prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  node_modules/.bin/prisma db seed
fi

exec node dist/main.js
