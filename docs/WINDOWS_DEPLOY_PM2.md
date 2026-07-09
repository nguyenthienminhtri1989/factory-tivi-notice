# Deploy tivi-app lên Windows Server bằng PM2

Máy chủ Windows có IP public: `203.210.244.137`. App chạy port `3003`.

## 1. Chuẩn bị thư mục app

Ví dụ đặt source tại:

```powershell
D:\APP\FACTORY-TIVI-NOTICE
```

Cài dependencies:

```powershell
cd D:\APP\FACTORY-TIVI-NOTICE
npm install
```

## 2. Cấu hình `.env`

Tạo file `.env`:

```env
DATABASE_URL="postgresql://postgres:MAT_KHAU_POSTGRES@localhost:5432/tivi_app_db?schema=public"
AUTH_SECRET="tao-mot-chuoi-bi-mat-rat-dai-toi-thieu-24-ky-tu"
UPLOAD_DIR="D:\\TIVI-APP-DATA\\uploads"
```

`AUTH_SECRET` dùng để ký session đăng nhập. Khi public ra internet không được để secret mặc định.

## 3. Tạo database và migration

Nếu chưa có database:

```sql
CREATE DATABASE tivi_app_db;
```

Chạy trong thư mục app:

```powershell
npx prisma generate
npx prisma migrate deploy
npm run build
```

## 4. Chạy bằng PM2

Cài PM2 nếu server chưa có:

```powershell
npm install -g pm2
```

Start app:

```powershell
pm2 start npm --name tivi-app -- start
pm2 save
```

Kiểm tra:

```powershell
pm2 status
pm2 logs tivi-app
```

## 5. Mở firewall

Chạy PowerShell bằng Administrator:

```powershell
New-NetFirewallRule -DisplayName "tivi-app port 3003" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow
```

Truy cập:

```text
http://203.210.244.137:3003/login
```

## 6. Tài khoản đầu tiên

Nếu database chưa có user, vào `/login` và nhập username/password bất kỳ bạn muốn dùng cho Admin đầu tiên. Hệ thống sẽ tự tạo tài khoản `ADMIN` đầu tiên.

Sau khi vào Admin, mở tab `Tài khoản` để tạo:

- `ADMIN`: quản trị hệ thống và tài khoản.
- `EDITOR`: soạn/sửa thông báo, xưởng, nhóm TV, thiết bị TV.
- `VIEWER`: tài khoản dành cho Smart TV.

## 7. Smart TV ở mạng khác nhà máy

Vì server có IP public, TV ở nhà máy khác mạng vẫn mở được bằng internet nếu firewall/NAT cho phép.

Ví dụ TV tầng 1 nhà máy 3:

```text
http://203.210.244.137:3003/display?group=nha-may-3&device=tv-tang-1
```

TV tầng 2:

```text
http://203.210.244.137:3003/display?group=nha-may-3&device=tv-tang-2
```

Lần đầu TV mở URL sẽ bị chuyển về `/login`. Đăng nhập bằng tài khoản `VIEWER`, sau đó TV tự quay lại màn hình hiển thị.

## 8. Tự chạy lại sau khi restart Windows

Có thể dùng:

```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

Sau khi restart server, kiểm tra:

```powershell
pm2 status
```

## 9. Cập nhật code sau này

```powershell
cd D:\APP\FACTORY-TIVI-NOTICE
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart tivi-app
pm2 save
```

## 10. Thu muc upload co dinh

Tao thu muc luu anh/tai lieu upload ngoai source code:

```powershell
New-Item -ItemType Directory -Force D:\TIVI-APP-DATA\uploads
```

Cau hinh trong `.env`:

```env
UPLOAD_DIR="D:\\TIVI-APP-DATA\\uploads"
```

Tu sau thay doi nay, file moi upload se co URL dang `/media/YYYY/MM/ten-file.png`. Cac URL cu dang `/uploads/notices/YYYY/MM/ten-file.png` van duoc route tuong thich doc tu thu muc upload moi hoac thu muc `public/uploads/notices` cu.
