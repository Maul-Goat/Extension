# kaycee-tiktok-api

FastAPI + yt-dlp untuk mengambil data TikTok. Di-deploy terpisah di Vercel.

## Endpoints

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/analyze?username=xxx` | Ambil 30 video terbaru user |
| GET | `/api/user?username=xxx` | Profil user (avatar, nickname, followers) |
| GET | `/` | Health check |

## Deploy ke Vercel

1. Push folder ini ke GitHub repo baru (misal: `kaycee-tiktok-api`)
2. Import repo ke [vercel.com](https://vercel.com) → Deploy
3. Catat URL-nya (misal: `https://kaycee-tiktok-api.vercel.app`)
4. Set env var di repo **kaycee-auth-server**:
   ```
   TIKTOK_API_URL = https://kaycee-tiktok-api.vercel.app
   ```

## Struktur

```
kaycee-tiktok-api/
├── api/
│   └── index.py      ← FastAPI app
├── requirements.txt
└── vercel.json
```
