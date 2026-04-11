[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$workspace = Get-Location
Write-Host "📂 Đang làm việc tại: $workspace" -ForegroundColor Cyan

# Kiểm tra Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Lỗi: Docker chưa bật!" -ForegroundColor Red; exit 1
}

# Khởi động hạ tầng
Write-Host "🐳 Khởi động Docker Containers..." -ForegroundColor Yellow
docker compose up -d

# Đợi Health Check
Write-Host "⏳ Đợi Chat Service sẵn sàng..." -ForegroundColor Cyan
$ready = $false
for ($i=1; $i -le 10; $i++) {
    try {
        $check = Invoke-WebRequest -Uri "http://localhost:3002/health" -Method Get -ErrorAction SilentlyContinue
        if ($check.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Write-Host "." -NoNewline; Start-Sleep -Seconds 3
}

if ($ready) {
    Write-Host "`n🚀 Chạy Smoke Test..." -ForegroundColor Magenta
    k6 run tests/smoke/smoke-test.js # Cập nhật đường dẫn mới
    Write-Host "✅ HỆ THỐNG ĐÃ SẴN SÀNG!" -ForegroundColor Green
}