// Unit/API test giả lập Prisma nên không kết nối DB thật; chỉ cần DATABASE_URL hợp lệ
// để loadEnv() (ADR-008) không chặn khởi tạo AppModule khi CI không có apps/api/.env.
process.env.DATABASE_URL ??= 'postgresql://unit:unit@localhost:5432/unit_test_khong_ket_noi';
