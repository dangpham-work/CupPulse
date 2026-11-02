import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Bản build tự chứa cho Docker (apps/web/Dockerfile đặt NEXT_OUTPUT=standalone).
  // Không bật mặc định vì trên Windows cần quyền tạo symlink.
  ...(process.env.NEXT_OUTPUT === 'standalone'
    ? { output: 'standalone' as const, outputFileTracingRoot: path.join(__dirname, '../..') }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
