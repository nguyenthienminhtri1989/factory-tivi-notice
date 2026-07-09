# Factory TV Notice - Project Context

## Muc tieu

Ung dung web noi bo de Smart TV ngoai xuong hien thi thong bao dang slideshow. Admin tao/sua thong bao tren trinh duyet, TV tu cap nhat noi dung ma khong can refresh trang.

## Nguyen tac san pham

- Uu tien on dinh, de doc tu xa, de van hanh trong mang LAN.
- Man hinh TV it nut, chu lon, tuong phan cao, slideshow tu dong.
- Admin thao tac nhanh: tao, sua, bat/tat, sap xep, chon nhom hien thi.
- Thiet ke du lieu theo "slide" de sau nay mo rong upload anh/poster.
- Moi thay doi code dang ke can cap nhat file nay de cua so lam viec moi hoac AI moi tiep quan duoc.

## Quyet dinh ky thuat

- Bat dau san pham chinh bang Next.js App Router thay vi Node.js thuong.
- Prototype Node.js thuong ban dau duoc dung de khoa nghiep vu nhanh; code moi can uu tien Next.js trong `app/` va `lib/`.
- Dá»¯ liá»‡u váº­n hĂ nh chuyá»ƒn sang PostgreSQL + Prisma. JSON `data/notices.json` chá»‰ cĂ²n lĂ  dáº¥u váº¿t prototype, khĂ´ng cĂ²n lĂ  store chĂ­nh.
- CÆ¡ cháº¿ TV cáº­p nháº­t: polling má»—i 5 giĂ¢y, slideshow cháº¡y ná»™i bá»™ theo `durationSeconds` cá»§a tá»«ng slide. Vá»›i khoáº£ng 10 TV, táº£i API ráº¥t nháº¹ vĂ  á»•n Ä‘á»‹nh hÆ¡n WebSocket trĂªn Smart TV.
- Port mac dinh cua tivi-app la `3003` de tranh trung voi cac app noi bo khac.
- Font UI mac dinh: `Tahoma, Arial, sans-serif`; Tahoma/Arial pho bien tren Windows/TV, ho tro tieng Viet tot va net chu deu hon cho man hinh xuong. Tranh dung weight qua nang tren TV; uu tien 600-700.

## Kien truc hien tai

- Runtime: Next.js App Router + React + TypeScript.
- Admin UI: `app/admin/page.tsx`, `app/admin/admin.module.css`.
- TV UI: `app/display/page.tsx`, `app/display/display.module.css`.
- Store/types/service: `lib/notices.ts`; Prisma client helper: `lib/prisma.ts`; schema DB: `prisma/schema.prisma`.
- Database: PostgreSQL qua Prisma. File `.env.example` mĂ´ táº£ `DATABASE_URL`.
- API route handlers:
  - `app/api/notices/route.ts`
  - `app/api/notices/[id]/route.ts`
  - `app/api/display/[groupCode]/notices/route.ts`

## API

- `GET /api/notices`: lay toan bo store cho Admin.
- `POST /api/notices`: tao thong bao.
- `PUT /api/notices/:id`: cap nhat thong bao.
- `DELETE /api/notices/:id`: xoa thong bao.
- `GET /api/display/:groupCode/notices`: lay cac thong bao dang active cho mot nhom TV.

## Mo hinh slide

```json
{
  "id": "uuid",
  "type": "TEXT | IMAGE | MIXED",
  "title": "Tieu de",
  "content": "Noi dung",
  "displayGroup": "xuong-a",
  "level": "NORMAL | IMPORTANT | URGENT",
  "durationSeconds": 30,
  "isActive": true,
  "sortOrder": 1,
  "backgroundColor": "#111827",
  "textColor": "#f9fafb",
  "imageUrl": "",
  "fitMode": "cover | contain"
}
```

## Cach chay

```powershell
npm install
npm run dev
```

Sau do mo:

- Admin: `http://localhost:3003/admin`
- TV: `http://localhost:3003/display?group=xuong-a`

Neu dua ra TV trong LAN, dung IP cua may server, vi du:

- `http://192.168.1.50:3003/display?group=xuong-a`

## Viec can lam tiep

- Them dang nhap Admin.
- Them upload anh/poster that, resize/nen anh ve kich thuoc phu hop TV.
- Doi JSON store sang database khi chot moi truong van hanh.
- Them cau hinh nhieu TV/nhieu khu vuc ro rang hon.
- Kiem thu tren trinh duyet Smart TV thuc te.

## Nhat ky thay doi

### 2026-07-09

- Khoi tao du an `factory-tv-notice` trong `work/`.
- Ban dau tao prototype Node.js thuong de khoa nghiep vu: API CRUD, Admin UI, TV slideshow.
- Theo quyet dinh moi, chuyen nen san pham sang Next.js App Router.
- Them `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`.
- Port store/types sang `lib/notices.ts`.
- Port API CRUD sang `app/api/notices` va `app/api/notices/[id]`.
- Port API TV sang `app/api/display/[groupCode]/notices`.
- Port Admin UI sang `app/admin/page.tsx` va CSS module.
- Port TV fullscreen slideshow sang `app/display/page.tsx` va CSS module.
- Chot port mac dinh `3003` trong `package.json`, README va tai lieu du an.

## Kiem thu gan nhat

### 2026-07-09

- `npm run build`: pass voi Next.js 15.5.20.
- `npm run dev`: server chay tai `http://localhost:3003`.
- GET /admin: 200.
- GET /display?group=xuong-a: 200.
- GET /api/notices: 200.
- GET /api/display/xuong-a/notices: 200.
- Tao va xoa slide test qua API: pass, khong de lai du lieu rac.
- Sau khi doi port sang `3003`: `npm run build` pass; `npm run dev` hien `Local: http://localhost:3003`; `GET /admin`, `GET /display?group=xuong-a`, `GET /api/notices` deu tra 200.
- Chuyen toan bo text hien thi tren UI sang tieng Viet co dau trong Admin, man hinh TV, thong bao loi API, du lieu mau va prototype tinh trong `public/`; `npm run build` pass.
- Chuyen font UI sang `Tahoma, Arial, sans-serif`, them `font-synthesis: none`, giam font-weight nang tu 800 xuong 700 va mot so nhan/nut tu 700 xuong 600; `npm run build` pass.


- Man hinh TV them auto-fit text: component do vung hien thi thuc te va tu giam scale cua title/body/badge theo tung slide de tranh bi footer che hoac tran khung; text qua dai duoc overflow-wrap: anywhere.
- Fullscreen tren TV: trinh duyet khong cho web tu bat fullscreen neu chua co thao tac nguoi dung, nen man hinh TV co nut Bam de toan man hinh va click vao man hinh se goi equestFullscreen().


## Thay Ä‘á»•i kiáº¿n trĂºc dá»¯ liá»‡u PostgreSQL

### 2026-07-09

- Chuyá»ƒn store chĂ­nh tá»« JSON sang PostgreSQL + Prisma.
- ThĂªm `prisma/schema.prisma` vá»›i cĂ¡c model dĂ i háº¡n: `Factory`, `DisplayGroup`, `DisplayDevice`, `User`, `UserFactory`, `Notice`, `NoticeTarget`, `NoticeAsset`, `NoticeAuditLog`.
- `NoticeTarget` cho phĂ©p má»™t thĂ´ng bĂ¡o phĂ¡t tá»›i má»™t hoáº·c nhiá»u nhĂ³m TV/xÆ°á»Ÿng.
- `NoticeAsset` chuáº©n bá»‹ cho áº£nh, Word, PDF, PowerPoint, video hoáº·c file khĂ¡c. DB chá»‰ lÆ°u metadata/URL; file tháº­t sáº½ xá»­ lĂ½ á»Ÿ bÆ°á»›c upload sau.
- API `/api/notices` vĂ  `/api/display/[groupCode]/notices` Ä‘Ă£ Ä‘á»c/ghi qua Prisma.
- Admin váº«n giá»¯ trÆ°á»ng `NhĂ³m TV`; cĂ³ thá»ƒ nháº­p nhiá»u nhĂ³m báº±ng dáº¥u pháº©y, vĂ­ dá»¥ `xuong-a,xuong-b`.
- API hiá»‡n tá»± táº¡o `DisplayGroup` dÆ°á»›i `Factory` máº·c Ä‘á»‹nh náº¿u Admin nháº­p mĂ£ nhĂ³m chÆ°a cĂ³, Ä‘á»ƒ trĂ¡nh lá»—i khi thao tĂ¡c thá»­. Khi váº­n hĂ nh tháº­t nĂªn táº¡o trÆ°á»›c 3 xÆ°á»Ÿng vĂ  10 TV báº±ng Prisma Studio hoáº·c SQL.
- ThĂªm `.env.example` vĂ  `docs/DATABASE_SETUP.md` hÆ°á»›ng dáº«n táº¡o PostgreSQL, cháº¡y migration vĂ  táº¡o dá»¯ liá»‡u váº­n hĂ nh ban Ä‘áº§u.
- ÄĂ£ pin Prisma v6 (`prisma@6`, `@prisma/client@6`) Ä‘á»ƒ dĂ¹ng cáº¥u hĂ¬nh `DATABASE_URL` quen thuá»™c trong `schema.prisma`.
- Kiá»ƒm thá»­: `npx prisma generate` pass; `npm run build` pass.
- Kiem thu bo sung: 
px prisma validate pass khi co DATABASE_URL tam trong phien lenh; 
px prisma generate pass; 
pm run build pass. Chua chay migrate vi may hien tai chua duoc cau hinh database PostgreSQL that trong .env.


## Quáº£n trá»‹ dá»¯ liá»‡u ná»n trĂªn UI

### 2026-07-09

- ThĂªm API CRUD cho `Factory`, `DisplayGroup`, `DisplayDevice`:
  - `GET/POST /api/factories`, `PUT/DELETE /api/factories/:id`
  - `GET/POST /api/display-groups`, `PUT/DELETE /api/display-groups/:id`
  - `GET/POST /api/display-devices`, `PUT/DELETE /api/display-devices/:id`
- Trang Admin khĂ´ng cĂ²n nháº­p tay `NhĂ³m TV` cho thĂ´ng bĂ¡o. Form táº¡o/sá»­a thĂ´ng bĂ¡o láº¥y danh sĂ¡ch nhĂ³m tá»« báº£ng `DisplayGroup` vĂ  hiá»ƒn thá»‹ dáº¡ng checkbox chá»n nhiá»u.
- ThĂªm khu `Dá»¯ liá»‡u ná»n` ngay trĂªn Admin Ä‘á»ƒ táº¡o/sá»­a/xĂ³a XÆ°á»Ÿng, NhĂ³m TV vĂ  Thiáº¿t bá»‹ TV. NhÆ° váº­y ngÆ°á»i váº­n hĂ nh khĂ´ng cáº§n táº¡o dá»¯ liá»‡u báº±ng SQL.
- `DisplayGroup.code` váº«n lĂ  mĂ£ dĂ¹ng trĂªn URL TV: `/display?group=xuong-a`.
- `DisplayDevice` dĂ¹ng Ä‘á»ƒ quáº£n lĂ½ tá»«ng TV cá»¥ thá»ƒ trong nhĂ³m; bÆ°á»›c sau cĂ³ thá»ƒ cáº­p nháº­t `lastSeenAt` khi TV polling.
- Kiá»ƒm thá»­: `npx prisma validate` pass khi cĂ³ `DATABASE_URL`; `npm run build` pass.

## Sá»­a lá»—i encoding tiáº¿ng Viá»‡t trĂªn UI

### 2026-07-09

- Sá»­a `app/admin/page.tsx` vĂ  `app/display/DisplayClient.tsx` vĂ¬ má»™t sá»‘ chuá»—i tiáº¿ng Viá»‡t bá»‹ mojibake hoáº·c bá»‹ thay dáº¥u báº±ng `?` sau khi thĂªm UI/API quáº£n trá»‹.
- Giá»¯ font toĂ n cá»¥c `Tahoma, Arial, sans-serif`; lá»—i láº§n nĂ y náº±m á»Ÿ ná»™i dung source, khĂ´ng pháº£i do CSS font.
- Kiá»ƒm thá»­: quĂ©t source khĂ´ng cĂ²n cĂ¡c máº«u mojibake thÆ°á»ng gáº·p; `npm run build` pass; `GET /admin` vĂ  `GET /display?group=xuong-a` tráº£ 200.

## Thiáº¿t káº¿ láº¡i Admin theo tab

### 2026-07-09

- KhĂ´ng cĂ²n nhá»“i toĂ n bá»™ form vĂ o má»™t mĂ n hĂ¬nh dĂ i. `app/admin/page.tsx` Ä‘Æ°á»£c tĂ¡ch thĂ nh cĂ¡c tab nghiá»‡p vá»¥: `ThĂ´ng bĂ¡o`, `XÆ°á»Ÿng`, `NhĂ³m TV`, `Thiáº¿t bá»‹ TV`.
- Tab `ThĂ´ng bĂ¡o` táº­p trung vĂ o soáº¡n/sá»­a thĂ´ng bĂ¡o vĂ  danh sĂ¡ch phĂ¡t. Dá»¯ liá»‡u ná»n Ä‘Æ°á»£c chuyá»ƒn sang cĂ¡c tab riĂªng Ä‘á»ƒ ngÆ°á»i váº­n hĂ nh dá»… hiá»ƒu hÆ¡n.
- ThĂªm dáº£i sá»‘ liá»‡u tá»•ng quan á»Ÿ Ä‘áº§u trang: sá»‘ thĂ´ng bĂ¡o Ä‘ang phĂ¡t, nhĂ³m TV, thiáº¿t bá»‹ TV vĂ  xÆ°á»Ÿng.
- ChÆ°a thĂªm Ant Design Ä‘á»ƒ trĂ¡nh tÄƒng phá»¥ thuá»™c khi nhu cáº§u hiá»‡n táº¡i chá»‰ lĂ  tá»‘i Æ°u bá»‘ cá»¥c. CĂ³ thá»ƒ cĂ¢n nháº¯c Ant Design sau khi cáº§n báº£ng lá»c/sáº¯p xáº¿p/phĂ¢n trang nĂ¢ng cao.
- Kiá»ƒm thá»­: quĂ©t source khĂ´ng cĂ²n máº«u mojibake; `npm run build` pass.

## Phát thông báo theo từng thiết bị TV

### 2026-07-09

- Thêm khả năng phát thông báo theo thiết bị TV cụ thể trong cùng một nhóm/xưởng. Ví dụ nhà máy 3 có `tv-tang-1` và `tv-tang-2`, mỗi TV có thể nhận nội dung riêng.
- Schema thêm model `NoticeDeviceTarget`, liên kết `Notice` với `DisplayDevice`. Migration: `20260709090000_add_notice_device_targets`.
- `NoticeTarget` vẫn giữ vai trò phát chung theo nhóm TV. Khi Admin chọn nhóm `nha-may-3`, tất cả TV đang mở group đó đều nhận thông báo.
- `NoticeDeviceTarget` dùng cho thông báo riêng. Khi Admin chọn thiết bị `tv-tang-1`, chỉ URL TV có `device=tv-tang-1` mới nhận thông báo riêng đó.
- URL TV mới hỗ trợ định danh thiết bị: `/display?group=nha-may-3&device=tv-tang-1`. URL chỉ có `group` vẫn hoạt động và chỉ nhận thông báo chung của nhóm.
- API `/api/display/[groupCode]/notices` nhận query `device`. Kết quả trả về gồm thông báo chung của nhóm và thông báo riêng của thiết bị nếu có.
- Admin UI tab `Thông báo` có thêm phần `Thiết bị TV nhận riêng`; chọn nhóm để phát chung, chọn thiết bị để phát riêng, hoặc chọn cả hai nếu thật sự muốn thông báo thuộc nhiều phạm vi.
- Kiểm thử: `npx prisma generate` pass; `npx prisma migrate deploy` đã apply migration vào PostgreSQL `tivi_app_db`; `npx prisma migrate status` báo database up to date; `npm run build` pass.

## Đăng nhập và phân quyền

### 2026-07-09

- Thêm cơ chế đăng nhập bằng session cookie `tivi_session`, ký bằng biến môi trường `AUTH_SECRET`.
- Mật khẩu user được hash bằng `scrypt` trong `lib/auth.ts`, không lưu mật khẩu thô.
- Nếu database chưa có user nào, lần đăng nhập đầu tiên tại `/login` sẽ tự tạo tài khoản `ADMIN` đầu tiên bằng username/password được nhập.
- Thêm trang `/login`, API `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
- Middleware bảo vệ `/admin` và `/display`: chưa có cookie thì chuyển về `/login?next=...`.
- API quản trị được bảo vệ server-side bằng `requireApiRole`:
  - `ADMIN` và `EDITOR`: quản lý thông báo, xưởng, nhóm TV, thiết bị TV.
  - `ADMIN`: quản lý tài khoản tại `/api/users`.
  - `VIEWER`: dùng cho Smart TV, chỉ truy cập màn hình hiển thị và API display.
- Admin UI thêm tab `Tài khoản` để tạo tài khoản `ADMIN`, `EDITOR`, `VIEWER`; tài khoản `VIEWER` dùng cho trình duyệt Smart TV.
- Khi deploy public internet, bắt buộc đặt `AUTH_SECRET` đủ dài trong `.env`; không dùng secret mặc định.
- Kiểm thử: `npm run build` pass, route `/login` build thành công, middleware được build kèm app.


## Cập nhật media upload

- Admin có thể tải trực tiếp ảnh, PDF, Word, Excel, PowerPoint khi tạo/sửa thông báo.
- File upload được lưu trong `public/uploads/notices/YYYY/MM`; database lưu metadata ở bảng `NoticeAsset`.
- Màn hình TV hiển thị trực tiếp ảnh và PDF. Các file Office được lưu như tài liệu đính kèm; để trình chiếu đẹp trên Smart TV nên xuất sang ảnh hoặc PDF trước, hoặc bổ sung bước chuyển đổi Office sang PDF/ảnh ở server sau này.
- API mới: `POST /api/uploads`, chỉ cho phép role `ADMIN` và `EDITOR`, giới hạn 30 MB mỗi file.


## Cap nhat luu tru upload production

- File upload moi luu vao thu muc co dinh qua bien `UPLOAD_DIR`, mac dinh Windows la `D:\TIVI-APP-DATA\uploads`.
- API upload tra URL moi dang `/media/YYYY/MM/ten-file`; route `/media/[...path]` doc file truc tiep tu `UPLOAD_DIR`.
- Route tuong thich `/uploads/notices/[...path]` giup cac thong bao cu van doc duoc file tu `UPLOAD_DIR` hoac `public/uploads/notices`.
