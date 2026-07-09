# HÆ°á»›ng dáº«n PostgreSQL cho tivi-app

## Má»¥c tiĂªu

tivi-app dĂ¹ng PostgreSQL + Prisma Ä‘á»ƒ phá»¥c vá»¥ nhiá»u TV, nhiá»u nhĂ  xÆ°á»Ÿng vĂ  nhiá»u ngÆ°á»i cĂ¹ng thao tĂ¡c. TV váº«n dĂ¹ng polling 5 giĂ¢y vĂ¬ quy mĂ´ khoáº£ng 10 TV lĂ  ráº¥t nháº¹ vĂ  tÆ°Æ¡ng thĂ­ch Smart TV tá»‘t.

## 1. Táº¡o database

VĂ­ dá»¥ náº¿u dĂ¹ng PostgreSQL local:

```sql
CREATE DATABASE tivi_app;
```

Táº¡o file `.env` á»Ÿ thÆ° má»¥c gá»‘c dá»± Ă¡n, dá»±a theo `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tivi_app?schema=public"
```

Thay `postgres:postgres` báº±ng user/password tháº­t cá»§a báº¡n.

## 2. Táº¡o báº£ng báº±ng Prisma

Cháº¡y trong thÆ° má»¥c dá»± Ă¡n:

```powershell
npm install
npx prisma generate
npx prisma migrate dev --name init_postgresql
```

Khi triá»ƒn khai production/server tháº­t, dĂ¹ng:

```powershell
npx prisma migrate deploy
```

## 3. Táº¡o dá»¯ liá»‡u váº­n hĂ nh ban Ä‘áº§u

Dá»± Ă¡n khĂ´ng seed tá»± Ä‘á»™ng theo yĂªu cáº§u hiá»‡n táº¡i. CĂ³ 2 cĂ¡ch thao tĂ¡c.

### CĂ¡ch A: Prisma Studio

```powershell
npx prisma studio
```

Sau Ä‘Ă³ táº¡o dá»¯ liá»‡u theo thá»© tá»±:

1. `Factory`: táº¡o 3 nhĂ  xÆ°á»Ÿng, vĂ­ dá»¥ `xuong-a`, `xuong-b`, `xuong-c`.
2. `DisplayGroup`: táº¡o nhĂ³m hiá»ƒn thá»‹ cho tá»«ng xÆ°á»Ÿng, vĂ­ dá»¥ `xuong-a`, `xuong-b`, `xuong-c`.
3. `DisplayDevice`: táº¡o 10 TV, má»—i TV trá» vá» má»™t `DisplayGroup`.
4. `User`: táº¡o tĂ i khoáº£n sau khi app cĂ³ mĂ n hĂ¬nh Ä‘Äƒng nháº­p.

### CĂ¡ch B: SQL máº«u

CĂ³ thá»ƒ cháº¡y SQL trá»±c tiáº¿p trong PostgreSQL. VĂ­ dá»¥:

```sql
INSERT INTO "Factory" (id, code, name, "isActive", "createdAt", "updatedAt")
VALUES
  ('factory-a', 'xuong-a', 'XÆ°á»Ÿng A', true, now(), now()),
  ('factory-b', 'xuong-b', 'XÆ°á»Ÿng B', true, now(), now()),
  ('factory-c', 'xuong-c', 'XÆ°á»Ÿng C', true, now(), now());

INSERT INTO "DisplayGroup" (id, "factoryId", code, name, "isActive", "createdAt", "updatedAt")
VALUES
  ('group-a', 'factory-a', 'xuong-a', 'MĂ n hĂ¬nh xÆ°á»Ÿng A', true, now(), now()),
  ('group-b', 'factory-b', 'xuong-b', 'MĂ n hĂ¬nh xÆ°á»Ÿng B', true, now(), now()),
  ('group-c', 'factory-c', 'xuong-c', 'MĂ n hĂ¬nh xÆ°á»Ÿng C', true, now(), now());
```

Náº¿u Admin táº¡o thĂ´ng bĂ¡o vá»›i mĂ£ nhĂ³m chÆ°a tá»“n táº¡i, API hiá»‡n sáº½ tá»± táº¡o nhĂ³m Ä‘Ă³ dÆ°á»›i `Factory` máº·c Ä‘á»‹nh Ä‘á»ƒ trĂ¡nh lá»—i váº­n hĂ nh. Khi cháº¡y tháº­t nĂªn táº¡o sáºµn nhĂ³m chuáº©n Ä‘á»ƒ dá»¯ liá»‡u gá»n.

## 4. CĂ¡ch dĂ¹ng nhĂ³m TV

MĂ n hĂ¬nh TV má»Ÿ URL theo nhĂ³m:

```text
http://SERVER_IP:3003/display?group=xuong-a
http://SERVER_IP:3003/display?group=xuong-b
http://SERVER_IP:3003/display?group=xuong-c
```

Trong Admin, trÆ°á»ng `NhĂ³m TV` cĂ³ thá»ƒ nháº­p má»™t hoáº·c nhiá»u nhĂ³m báº±ng dáº¥u pháº©y:

```text
xuong-a
xuong-a,xuong-b
xuong-a,xuong-b,xuong-c
```

## 5. Thiáº¿t káº¿ cho file/áº£nh/tĂ i liá»‡u

Schema Ä‘Ă£ cĂ³ `NoticeAsset` Ä‘á»ƒ sau nĂ y gáº¯n nhiá»u loáº¡i file:

- `IMAGE`: áº£nh/poster.
- `DOCUMENT`: Word, PDF, PowerPoint.
- `VIDEO`: video náº¿u cáº§n má»Ÿ rá»™ng.
- `OTHER`: loáº¡i khĂ¡c.

CĂ¡c trÆ°á»ng quan trá»ng:

- `url`: Ä‘Æ°á»ng dáº«n file Ä‘á»ƒ TV/Admin táº£i.
- `mimeType`: phĂ¢n biá»‡t PDF/Word/PowerPoint/áº£nh.
- `thumbnailUrl`: áº£nh preview náº¿u cáº§n.
- `role`: `PRIMARY`, `ATTACHMENT`, `THUMBNAIL`.

BÆ°á»›c sau cáº§n lĂ m thĂªm API upload file vĂ  xá»­ lĂ½ preview/nĂ©n áº£nh. PostgreSQL chá»‰ lÆ°u metadata file; file tháº­t nĂªn lÆ°u trong thÆ° má»¥c upload ná»™i bá»™ hoáº·c object storage.
## 6. Quáº£n lĂ½ dá»¯ liá»‡u báº±ng giao diá»‡n Admin

Sau thay Ä‘á»•i má»›i, báº¡n khĂ´ng cáº§n nháº­p dá»¯ liá»‡u ná»n báº±ng SQL trong váº­n hĂ nh thÆ°á»ng ngĂ y.

Má»Ÿ:

```text
http://localhost:3003/admin
```

á» cuá»‘i trang cĂ³ khu `Dá»¯ liá»‡u ná»n`:

1. Táº¡o `XÆ°á»Ÿng` trÆ°á»›c, vĂ­ dá»¥ `xuong-a`, `xuong-b`, `xuong-c`.
2. Táº¡o `NhĂ³m TV` vĂ  chá»n xÆ°á»Ÿng tÆ°Æ¡ng á»©ng. MĂ£ nhĂ³m nĂ y chĂ­nh lĂ  mĂ£ dĂ¹ng cho URL TV, vĂ­ dá»¥ `xuong-a`.
3. Táº¡o `Thiáº¿t bá»‹ TV` vĂ  chá»n nhĂ³m TV tÆ°Æ¡ng á»©ng.
4. Khi táº¡o thĂ´ng bĂ¡o, pháº§n `NhĂ³m TV nháº­n thĂ´ng bĂ¡o` sáº½ hiá»ƒn thá»‹ danh sĂ¡ch nhĂ³m TV tháº­t tá»« database Ä‘á»ƒ chá»n, khĂ´ng cáº§n nháº­p tay.

SQL máº«u phĂ­a trĂªn chá»‰ cĂ²n dĂ¹ng khi cáº§n nháº­p nhanh hĂ ng loáº¡t hoáº·c khĂ´i phá»¥c dá»¯ liá»‡u.

## 7. Phát chung theo nhóm và phát riêng theo từng TV

- Phát chung: mở TV bằng URL nhóm, ví dụ `/display?group=nha-may-3`, và khi tạo thông báo chọn `Nhóm TV` là `nha-may-3`.
- Phát riêng: mỗi TV mở thêm mã thiết bị, ví dụ `/display?group=nha-may-3&device=tv-tang-1` hoặc `/display?group=nha-may-3&device=tv-tang-2`.
- Nếu nhà máy 3 có 2 tầng, tạo 1 nhóm `nha-may-3`, sau đó tạo 2 thiết bị `tv-tang-1` và `tv-tang-2` thuộc nhóm này.
- Khi muốn cả 2 tầng hiển thị giống nhau, tạo thông báo và chọn nhóm `nha-may-3`.
- Khi muốn tầng 1 hiển thị riêng, tạo thông báo và chỉ chọn thiết bị `tv-tang-1`; tầng 2 không thấy thông báo này.
- Sau khi cập nhật schema, chạy `npx prisma migrate deploy` để tạo bảng `NoticeDeviceTarget`.
