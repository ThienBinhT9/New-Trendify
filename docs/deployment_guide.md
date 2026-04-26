# Trendify Deployment Guide

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────┐
│                   Internet                          │
└──────────────────┬──────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
[Frontend]    [Backend]      [AI Service]
React/Vite    Node.js/TS     Python/FastAPI
Port 3000     Port 8000      Port 8001
    │              │
    │    ┌─────────┼──────────────┐
    │    ▼         ▼              ▼
    │  [MongoDB] [Redis]      [RabbitMQ]
    │  Port 27017 Port 6379   Port 5672
    │
    └─── [AWS S3] (media storage)
```

---

## ✅ Trạng thái hiện tại (đã sẵn sàng)

| Hạng mục | Trạng thái |
|---|---|
| Frontend API URL | ✅ Dùng `VITE_API_URL` env var |
| Backend CORS | ✅ Dùng `URL_FORNT_END` env var |
| AWS S3 | ✅ Đã cấu hình |
| Socket.IO URL | ✅ Dùng `VITE_SOCKET_URL` env var |
| Backend build script | ❌ Chưa có — **cần thêm** |
| tsconfig paths production | ❌ Cần kiểm tra |

---

## Option A: Render + Vercel (Khuyến nghị cho sinh viên/demo)

**Chi phí: ~$0 (free tier)**

### Bước 1: Chuẩn bị Cloud Services (External)

#### MongoDB Atlas
1. Vào [mongodb.com/atlas](https://www.mongodb.com/atlas) → Tạo account
2. Tạo cluster **M0 Free** (region: Singapore)
3. Network Access → Add IP: `0.0.0.0/0` (allow all)
4. Database Access → Tạo user + password
5. Lấy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/trendify`

#### Redis — Upstash
1. Vào [upstash.com](https://upstash.com) → Tạo Redis database
2. Region: Singapore
3. Lấy `REDIS_URL`: `rediss://default:xxx@xxx.upstash.io:6380`

#### RabbitMQ — CloudAMQP
1. Vào [cloudamqp.com](https://www.cloudamqp.com) → Tạo instance **Little Lemur** (free)
2. Region: Singapore
3. Lấy `AMQP_URL`: `amqps://user:pass@xxx.cloudamqp.com/vhost`

---

### Bước 2: Chuẩn bị Backend để deploy

> **Backend hiện không có build script** — cần thêm script và sửa tsconfig:

Thêm vào `trendify-backed/package.json`:
```json
"scripts": {
  "build": "tsc",
  "start": "node -r tsconfig-paths/register/js dist/index.js",
  ...
}
```

Thêm vào `trendify-backed/tsconfig.json`:
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    ...
  }
}
```

> Hoặc dùng cách đơn giản hơn: **dùng ts-node trực tiếp trên Render** — không cần build step.

**Thêm Procfile** tại `trendify-backed/Procfile`:
```
web: npx ts-node -r tsconfig-paths/register src/index.ts
```

---

### Bước 3: Deploy Backend lên Render

1. Push code lên GitHub
2. Vào [render.com](https://render.com) → New Web Service
3. Connect GitHub repo → chọn folder `trendify-backed`
4. Cấu hình:
   - **Build Command:** `npm install`
   - **Start Command:** `npx ts-node -r tsconfig-paths/register src/index.ts`
   - **Instance Type:** Free
5. Environment Variables — thêm tất cả từ `.env`:

```env
NODE_ENV=production
DEV_APP_PORT=10000
URL_FORNT_END=https://trendify.vercel.app

# MongoDB Atlas
DEV_DB_HOST=cluster.mongodb.net
# Hoặc dùng full URI:
MONGODB_URI=mongodb+srv://user:pass@cluster/trendify

# Redis (Upstash)
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6380

# RabbitMQ (CloudAMQP)
AMQP_URL=amqps://xxx

# Các keys khác giữ nguyên từ .env hiện tại
ACCESS_TOKEN_SECRET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=ap-southeast-1
S3_BUCKET=trendify-media
MAIL_ADMIN=...
APP_PASSWORD=...
```

> **Lưu ý:** Render free tier **sleep sau 15 phút** không có request → cold start ~30s.
> Upgrade lên $7/tháng để luôn active.

---

### Bước 4: Deploy Frontend lên Vercel

1. Vào [vercel.com](https://vercel.com) → New Project → Import repo
2. **Framework Preset:** Vite
3. **Root Directory:** `trendify-portal`
4. **Build Command:** `yarn build`
5. **Output Directory:** `dist`
6. Environment Variables:
```env
VITE_API_URL=https://trendify-backend.onrender.com/api
VITE_SOCKET_URL=https://trendify-backend.onrender.com
```

---

### Bước 5: Deploy AI Service lên Render

1. New Web Service → chọn folder `trendify-ai`
2. **Build Command:** `pip install -r requirements.txt`
3. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables từ `trendify-ai/.env`

---

## Option B: VPS với Docker Compose (Production thực sự)

**Chi phí: ~$6-12/tháng (DigitalOcean Droplet 2GB RAM)**

**Stack:**
- 1 VPS chạy tất cả với Docker Compose
- Nginx làm reverse proxy + SSL (Let's Encrypt)
- PM2 hoặc Docker process manager

### docker-compose.yml (tổng quan)

```yaml
version: '3.8'
services:
  frontend:
    build: ./trendify-portal
    ports: ["3000:3000"]

  backend:
    build: ./trendify-backed
    ports: ["8000:8000"]
    depends_on: [mongodb, redis, rabbitmq]
    env_file: ./trendify-backed/.env.production

  ai:
    build: ./trendify-ai
    ports: ["8001:8001"]
    depends_on: [mongodb, redis]

  mongodb:
    image: mongo:7
    volumes: ["mongo_data:/data/db"]

  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]

  rabbitmq:
    image: rabbitmq:3-management
    ports: ["15672:15672"]

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf"]

volumes:
  mongo_data:
  redis_data:
```

---

## ⚠️ Vấn đề cần giải quyết trước khi deploy

### 1. Backend config kết nối Redis/RabbitMQ
Hiện `.env` không có `REDIS_URL` hay `AMQP_URL` — cần check code đang đọc variables như thế nào:

```bash
grep -rn "ioredis\|redis\|amqp\|REDIS\|AMQP" trendify-backed/src/config/
```

### 2. Socket.IO CORS
Khi deploy, `URL_FORNT_END` phải trỏ đúng domain frontend production.

### 3. Cookies / JWT
Backend dùng `cookie-parser` — trên production cần `sameSite: 'none'` và `secure: true` cho cross-origin cookies.

### 4. .env không được commit lên Git
Kiểm tra `.gitignore` có bao gồm `.env` không. **Không bao giờ push secrets lên GitHub.**

---

## Tóm tắt bước làm ngay

| Thứ tự | Việc cần làm | Ưu tiên |
|---|---|---|
| 1 | Tạo MongoDB Atlas cluster | 🔴 Critical |
| 2 | Tạo Redis Upstash | 🔴 Critical |
| 3 | Tạo RabbitMQ CloudAMQP | 🔴 Critical |
| 4 | Thêm `start` script cho backend | 🔴 Critical |
| 5 | Deploy backend lên Render | 🟡 |
| 6 | Set `VITE_API_URL` + deploy frontend lên Vercel | 🟡 |
| 7 | Deploy AI service | 🟢 Optional |
| 8 | Test full flow | 🟡 |
