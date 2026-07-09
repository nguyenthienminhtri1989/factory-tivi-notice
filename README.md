# Factory TV Notice

Bảng thông báo TV nội bộ cho xưởng sản xuất, xây bằng Next.js App Router.

## Chạy thử

```powershell
npm install
npx prisma generate
npm run dev
```

- Admin: `http://localhost:3003/admin`
- TV: `http://localhost:3003/display?group=xuong-a`

## Database

Dự án dùng PostgreSQL + Prisma. Tạo file `.env` từ `.env.example`, rồi chạy migration:

```powershell
npx prisma migrate dev --name init_postgresql
```

Xem hướng dẫn chi tiết tại `docs/DATABASE_SETUP.md`.

## Ghi chú

TV dùng polling 5 giây để tự cập nhật thông báo. Cách này đủ nhẹ cho khoảng 10 TV và tương thích tốt với trình duyệt Smart TV.

Doc bối cảnh dự án nằm ở `docs/PROJECT_CONTEXT.md`.