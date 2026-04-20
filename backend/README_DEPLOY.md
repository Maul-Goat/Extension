# Panduan Deploy — TikTok 60FPS Backend

## LANGKAH 1: Setup Supabase (Database)

1. Buka https://supabase.com → Sign up gratis
2. Buat project baru → pilih region Asia Pacific (Singapore)
3. Setelah project jalan, buka SQL Editor
4. Copy-paste isi file SUPABASE_SETUP.sql → klik Run
5. Buka Settings → API → catat:
   - Project URL (contoh: https://abcd1234.supabase.co)
   - service_role key (bukan anon key!)

## LANGKAH 2: Deploy ke Render

1. Buka https://render.com → Sign up gratis (pakai GitHub)
2. Push folder backend ke GitHub terlebih dahulu:
   - Buat repo baru di GitHub
   - Upload semua file backend ke sana
3. Di Render: New → Web Service → pilih repo GitHub kamu
4. Isi pengaturan:
   - Name: tiktok-60fps-api (bebas)
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
   - Region: Singapore
5. Tambah Environment Variables:
   - SUPABASE_URL = URL dari langkah 1
   - SUPABASE_SERVICE_KEY = service_role key dari langkah 1
   - JWT_SECRET = ketik string acak panjang (contoh: k9x2m5p8n3q7r1t4w6y0)
6. Klik Deploy

## LANGKAH 3: Update Ekstensi

1. Setelah Render deploy selesai, catat URL-nya
   (contoh: https://tiktok-60fps-api.onrender.com)
2. Buka file extension/popup.js
3. Cari baris:
   const API_URL = 'https://NAMA-APP-KAMU.onrender.com';
4. Ganti dengan URL Render kamu yang asli
5. Simpan file

## LANGKAH 4: Install Ekstensi

1. Buka Chrome → chrome://extensions/
2. Aktifkan Developer Mode (pojok kanan atas)
3. Klik "Load unpacked"
4. Pilih folder extension/
5. Ekstensi siap dipakai!

## CATATAN PENTING

- Server Render gratis akan "tidur" setelah 15 menit tidak ada request
- Request pertama setelah tidur bisa lambat ~30 detik (cold start)
- Untuk menghindari ini, bisa pakai UptimeRobot untuk ping server tiap 10 menit (gratis)

## Test Server

Buka URL ini di browser untuk cek server jalan:
https://NAMA-APP-KAMU.onrender.com/health
