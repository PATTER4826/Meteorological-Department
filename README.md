# 🇹🇭 THAI WEATHER & DISASTER AI CENTER
### ศูนย์แจ้งเตือนสภาพอากาศและภัยพิบัติแห่งชาติ (ระบบเชื่อมต่อ Discord Bot และ Web Dashboard)

ระบบ Full-Stack Production-Ready สำหรับตรวจจับ วิเคราะห์ แจ้งเตือน และแสดงผลข้อมูลสภาพอากาศและภัยพิบัติสำหรับประเทศไทยแบบใกล้เคียง Real-time โดยประสานพลังระหว่าง Data Provider ทางการ, Gemini 3.8 Flash AI Model, Discord Notification Bot, และ Interactive Leaflet Thailand Map

---

## 🌟 จุดเด่นของระบบ (Core Features)

1. **Near Real-time Hazard Detection**:
   - **แผ่นดินไหว (Earthquake)**: เชื่อมต่อ API สดจาก USGS Seismology ตรวจจับคลื่นแผ่นดินไหวในไทยและประเทศเพื่อนบ้าน พร้อมคำนวณระยะห่าง (Haversine KM) จากจุดศูนย์กลางถึงชายแดนไทย
   - **สภาพอากาศ & เรดาร์ฝน (Weather & Rain Radar)**: ดึงข้อมูลจาก Open-Meteo & กรมอุตุนิยมวิทยา (TMD) สำหรับทุกจังหวัดหลัก (อุณหภูมิ, ลม, ความกดอากาศ, ปริมาณฝนสะสม)
   - **คุณภาพอากาศ PM2.5 (Air Quality)**: ดึงข้อมูลค่าฝุ่น PM2.5 / PM10 / AQI เปรียบเทียบเกณฑ์มาตรฐานกรมควบคุมมลพิษ (PCD)
   - **สถานการณ์น้ำท่า (Flood Hydrological Basins)**: ตรวจวัดระดับน้ำเทียบกับตลิ่ง (ม.รทก.) ในลุ่มน้ำเจ้าพระยา, ปิง, วัง, ยม, น่าน, มูล, ชี
   - **พายุหมุนเขตร้อน (Storm / Cyclone)**: ติดตามทิศทางลม ความกดอากาศ และแนวเส้นทางพายุ

2. **AI Risk Analysis & Truthfulness Enforcement**:
   - วิเคราะห์เหตุการณ์ด้วยโมเดล **Gemini 3.8 Flash** ผ่าน SDK `@google/genai`
   - **กฎเหล็ก Human Safety**: AI ทำหน้าที่วิเคราะห์ความเสี่ยง ไม่สร้างข้อมูลปลอม และแยกส่วนเด็ดขาดระหว่าง:
     - 📌 **FACT**: ข้อมูลข้อเท็จจริงจากสถานีตรวจวัด
     - 🤖 **AI ANALYSIS**: การประเมินผลกระทบและความเร่งด่วน
     - 🛡️ **RECOMMENDATIONS**: คำแนะนำความปลอดภัย พร้อมข้อความกำกับ *"โปรดติดตามประกาศอย่างเป็นทางการจากหน่วยงานราชการ"*

3. **Multi-Channel Notification & Escalation Engine**:
   - ส่ง Rich Embed แจ้งเตือนเข้า Discord Channel ตามหมวดหมู่ (`#critical-alert`, `#weather`, `#earthquake`, `#flood`, `#pm25`)
   - ระบบ **Anti-Spam Fingerprint**: ป้องกันการส่งข้อความซ้ำซ้อน
   - ระบบ **Alert Escalation**: หากระดับความรุนแรงเพิ่มขึ้น (เช่น WATCH ➡️ WARNING ➡️ CRITICAL) ระบบจะส่งสัญญาณเตือนใหม่ทันที
   - รองรับ Discord Slash Commands (`/status`, `/alerts`, `/earthquake`, `/flood`, `/pm25`, `/weather`)

4. **Interactive Leaflet Thailand Map**:
   - แสดงขอบเขตประเทศไทยแบบ High-Contrast Dark Mode
   - Marker แสดงสถานะภัยพิบัติพร้อมวงรัศมีความเสี่ยง (Risk Radius Buffers)
   - ตัวกรองเปิด/ปิด Layer (Earthquake, Flood, Storm, Rain, PM2.5)

5. **AI Emergency Assistant & Daily Briefing**:
   - ระบบถาม-ตอบสถานการณ์ภัยพิบัติโดยอ้างอิงจากข้อมูลจริงในระบบเท่านั้น
   - สรุปภาพรวมสถานการณ์ประเทศไทยประจำวันอัตโนมัติ

6. **Admin Dashboard & Setup Wizard**:
   - แผงควบคุมเปิด/ปิด Data Provider และตั้งค่า Polling Interval
   - ระบบจำลองสถานการณ์ฉุกเฉิน (Disaster Simulator) พร้อมป้ายกำกับ `⚠️ DEMO DATA`

---

## 🏗️ Architecture

```
Data Sources (USGS, Open-Meteo, ThaiWater, TMD, CAMS PCD)
  ↓
Data Collector & Normalizer
  ↓
Validation & Deduplication Engine (Fingerprint Cache)
  ↓
In-Memory Store / PostgreSQL (Prisma ORM)
  ↓
AI Analysis Engine (Gemini 3.8 Flash)
  ↓
Notification Router (Anti-Spam & Escalation)
  ↓
├── Discord Bot / Webhook Dispatcher
└── Web Dashboard (Server-Sent Events: /api/realtime)
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet Map, Recharts, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Server-Sent Events (SSE)
- **AI**: `@google/genai` (Model: `gemini-3.8-flash`)
- **Database**: Prisma ORM, PostgreSQL Schema (`prisma/schema.prisma`)
- **Discord**: Discord Embeds, Webhook Dispatcher, Slash Command Handler
- **DevOps**: Docker, Docker Compose

---

## ⚙️ Environment Configuration (.env)

คัดลอกไฟล์ `.env.example` ไปเป็น `.env`:

```bash
cp .env.example .env
```

| ตัวแปร | รายละเอียด |
|---|---|
| `GEMINI_API_KEY` | คีย์สำหรับเรียกใช้งาน Gemini AI (วิเคราะห์ภัยพิบัติและ AI Chat) |
| `DATABASE_URL` | URL สำหรับเชื่อมต่อฐานข้อมูล PostgreSQL ผ่าน Prisma |
| `REDIS_URL` | URL สำหรับเชื่อมต่อ Redis Cache / Queue |
| `DISCORD_TOKEN` | Bot Token สำหรับเชื่อมต่อ Discord Gateway |
| `DISCORD_WEBHOOK_CRITICAL` | Webhook URL สำหรับห้องแจ้งเตือนระดับวิกฤต (#critical-alert) |
| `DISCORD_WEBHOOK_WEATHER` | Webhook URL สำหรับห้องรายงานสภาพอากาศ (#weather) |
| `DISCORD_WEBHOOK_EARTHQUAKE` | Webhook URL สำหรับห้องแผ่นดินไหว (#earthquake) |
| `DISCORD_WEBHOOK_FLOOD` | Webhook URL สำหรับห้องระดับน้ำและน้ำท่วม (#flood) |
| `DISCORD_WEBHOOK_PM25` | Webhook URL สำหรับห้องฝุ่น PM2.5 (#pm25) |

---

## 🚀 การติดตั้งและเริ่มรันระบบ (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันในโหมด Development (Full-Stack Express + Vite)
```bash
npm run dev
```
เซิร์ฟเวอร์จะเปิดที่: `http://localhost:3000`

### 3. Build สำหรับ Production
```bash
npm run build
npm start
```

### 4. รันผ่าน Docker Compose (Full Stack + PostgreSQL + Redis)
```bash
docker-compose up --build -d
```

---

## 📡 REST API Documentation

- `GET /api/events` : รายการเหตุการณ์ทั้งหมด (รองรับ filter: `type`, `severity`, `province`, `limit`)
- `GET /api/events/:id` : รายละเอียดเหตุการณ์รายตัว
- `GET /api/alerts` : เหตุการณ์ที่กำลัง Active เฉพาะระดับ WARNING และ CRITICAL
- `GET /api/weather` : ข้อมูลตรวจวัดสภาพอากาศรายภูมิภาค
- `GET /api/earthquakes` : รายงานแผ่นดินไหวล่าสุดจาก USGS พร้อมระยะห่างถึงไทย
- `GET /api/floods` : ข้อมูลระดับน้ำลุ่มน้ำหลักจาก ThaiWater
- `GET /api/pm25` : ค่าฝุ่น PM2.5 และ AQI ทั่วประเทศ
- `GET /api/storms` : ข้อมูลพายุหมุนเขตร้อนที่กำลังติดตาม
- `GET /api/health` : สถานะสุขภาพระบบ (Database, Redis, Discord, AI, Providers)
- `GET /api/summary` : รายงานสรุปสถานการณ์ประเทศไทยประจำวันโดย AI
- `POST /api/chat` : ถาม-ตอบกับ AI ผู้ช่วยฉุกเฉิน (Grounded data)
- `GET /api/realtime` : สตรีมข้อมูลสดผ่าน Server-Sent Events (SSE)

### Admin Endpoints:
- `GET /api/admin/providers` : ตรวจสอบ Data Provider
- `PATCH /api/admin/providers/:id` : เปิด/ปิด หรือปรับความถี่การดึงข้อมูล
- `POST /api/admin/providers/:id/run` : บังคับดึงข้อมูลทันที (Force Sync)
- `POST /api/admin/discord/test` : ทดสอบส่ง Discord Webhook
- `POST /api/admin/simulate` : จำลองภัยพิบัติ (`EARTHQUAKE`, `FLOOD`, `STORM`, `PM25`)

---

## 📄 License
ระบบนี้พัฒนาภายใต้สัญญาอนุญาตเปิดเผยซอร์สโค้ดเพื่อประโยชน์สาธารณะและการเฝ้าระวังภัยพิบัติแห่งชาติ
