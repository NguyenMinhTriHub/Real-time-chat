Write-Host "--- Buoc 1: Dang lam sach va va loi bao mat ---" -ForegroundColor Yellow
# Xoa file lock cu de tao ban moi sach se
if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" }
npm install
# Lenh nay se ep buoc cac ban va duoc ap dung
npm audit fix --force

# 2. Restart Docker containers
Write-Host "--- Buoc 2: Dang khoi dong Docker ---" -ForegroundColor Yellow
docker compose down
docker compose up -d --build

# 3. Wait for services to be ready
Write-Host "--- Buoc 3: Doi 10 giay cho Database... ---" -ForegroundColor Yellow
Start-Sleep -s 10

# 4. Check connections
Write-Host "--- Buoc 4: Dang kiem tra ket noi ---" -ForegroundColor Yellow
npm run test:connections

Write-Host "--- XONG! He thong da san sang tai http://localhost:3002 ---" -ForegroundColor Green