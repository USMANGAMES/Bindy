# Bindy Backend API (Gemma server)

Frontend `.env` da faqat bitta o‘zgaruvchi:

```
VITE_API_URL=http://SIZNING-SERVER:8000
```

Serveringizda quyidagi endpointlar bo‘lishi kerak.

---

## Auth (login / register)

**Server kerak emas** — foydalanuvchilar brauzerda saqlanadi:

- Fayl: `src/data/usersStore.ts`
- Saqlash joyi: `localStorage` (`bindy-users` kaliti)

Register → JS obyektga yoziladi. Login → shu ro‘yxatdan qidiriladi.

---

## 1. AI tahlil — Gemma

**POST** `/api/v1/analyze`

`multipart/form-data`:
| Field | Type |
|-------|------|
| `image` | file (jpg/png) |

Gemma **o‘zi** bin yoki trash ekanini aniqlaydi — frontend category yubormaydi.

**Javob (200):**
```json
{
  "ok": true,
  "category": "bin",
  "type": "plastic",
  "confidence": 92,
  "label": "Plastic & PET"
}
```

`category`: `"bin"` yoki `"trash"` — **majburiy**, AI aniqlaydi.

**Xato (200):**
```json
{ "ok": false }
```

`type`: `plastic` | `glass` | `paper` | `mixed` | `organic`

Ball frontend beradi: trash = **5**, bin = **6** (AI dan kelmaydi).

---

## 2. Reportlar — hammaga ko‘rinsin

**GET** `/api/v1/reports`

**Javob:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "lat": 41.2995,
      "lng": 69.2401,
      "category": "trash",
      "type": "mixed",
      "label": "Noqonuniy musor joyi",
      "photoUrl": "data:image/jpeg;base64,...",
      "userName": "Ali",
      "createdAt": "2026-06-20T12:00:00Z",
      "points": 5
    }
  ]
}
```

**POST** `/api/v1/reports`

`Content-Type: application/json`

```json
{
  "lat": 41.2995,
  "lng": 69.2401,
  "category": "bin",
  "type": "plastic",
  "label": "Plastic & PET",
  "photoUrl": "optional base64",
  "userName": "Ali",
  "points": 6
}
```

**Javob:**
```json
{ "report": { ...same fields..., "id": "new-uuid" } }
```

---

## CORS

Frontend manzillaringizni ruxsat bering:
- `http://localhost:5173`
- `http://100.x.x.x:5173` (Tailscale)
- Production domain

---

## Server env (Gemma — frontend emas)

Server `.env` da:
```
GEMMA_MODEL=gemma-4-12b
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://...
CORS_ORIGINS=http://localhost:5173,http://100.x.x.x:5173
```

Gemma model fayllari serverda — frontendga **API kalit kerak emas**.
