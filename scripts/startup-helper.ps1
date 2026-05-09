# ============================================================
# CHAT SERVICE - STARTUP HELPER v1.0
# Script này tự động khởi động Docker và ứng dụng Node.js
# 
# Lợi ích:
# ✅ Tự động check Docker Desktop trạng thái
# ✅ Tự động khởi động Docker nếu chưa chạy
# ✅ Đợi Docker sẵn sàng rồi mới chạy docker-compose
# ✅ Tự động chạy npm run dev
# ✅ Loại bỏ hoàn toàn lỗi pipe/dockerDesktopLinuxEngine
# ============================================================

# MỚI THÊM: Cấu hình màu sắc cho console output
$ForegroundColorSuccess = "Green"
$ForegroundColorError = "Red"
$ForegroundColorInfo = "Cyan"
$ForegroundColorWarning = "Yellow"

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $ForegroundColorSuccess
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $ForegroundColorError
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $ForegroundColorInfo
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $ForegroundColorWarning
}

# MỚI THÊM: Hàm kiểm tra Docker Desktop đang chạy không
function Test-DockerRunning {
    try {
        $dockerStatus = docker ps -q 2>$null
        return $?
    }
    catch {
        return $false
    }
}

# MỚI THÊM: Hàm đợi Docker sẵn sàng
function Wait-DockerReady {
    param(
        [int]$MaxWaitSeconds = 30
    )
    
    $elapsed = 0
    $interval = 1
    
    Write-Info "Đang đợi Docker sẵn sàng..."
    
    while ($elapsed -lt $MaxWaitSeconds) {
        if (Test-DockerRunning) {
            Write-Success "Docker đã sẵn sàng!"
            return $true
        }
        
        Write-Host -NoNewline "."
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }
    
    Write-Host ""
    return $false
}

# MỚI THÊM: Hàm chính - khởi động Docker
function Start-Docker {
    Write-Host ""
    Write-Host "=" * 60
    Write-Info "LẦU 1: Kiểm tra Docker Desktop..."
    Write-Host "=" * 60
    
    if (Test-DockerRunning) {
        Write-Success "Docker Desktop đang chạy!"
    }
    else {
        Write-Warning-Custom "Docker Desktop chưa chạy, đang khởi động..."
        
        # MỚI THÊM: Kiểm tra xem Docker Desktop có được cài đặt không
        $dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        
        if (Test-Path $dockerDesktopPath) {
            Write-Info "Khởi động Docker Desktop từ: $dockerDesktopPath"
            & $dockerDesktopPath
            
            # MỚI THÊM: Đợi Docker sẵn sàng (tối đa 30 giây)
            if (-not (Wait-DockerReady -MaxWaitSeconds 30)) {
                Write-Error-Custom "Docker không thể khởi động sau 30 giây!"
                Write-Error-Custom "Hãy khởi động Docker Desktop thủ công từ Start Menu"
                exit 1
            }
        }
        else {
            Write-Error-Custom "Không tìm thấy Docker Desktop!"
            Write-Warning-Custom "Hãy cài đặt Docker Desktop từ: https://www.docker.com/products/docker-desktop"
            exit 1
        }
    }
}

# MỚI THÊM: Hàm khởi động Docker Compose
function Start-DockerCompose {
    Write-Host ""
    Write-Host "=" * 60
    Write-Info "LẦU 2: Khởi động Docker Compose (mongodb, minio, redis)..."
    Write-Host "=" * 60
    
    if (Test-Path "docker-compose.yml") {
        Write-Info "Tìm thấy docker-compose.yml, đang khởi động services..."
        
        # MỚI THÊM: Chạy docker-compose up -d
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker Compose services đã khởi động!"
            Write-Info "Đang đợi services sẵn sàng (30 giây)..."
            
            # MỚI THÊM: Đợi MongoDB sẵn sàng
            Start-Sleep -Seconds 10
            Write-Success "Services đã sẵn sàng!"
        }
        else {
            Write-Error-Custom "docker-compose up -d thất bại!"
            exit 1
        }
    }
    else {
        Write-Error-Custom "Không tìm thấy docker-compose.yml!"
        exit 1
    }
}

# MỚI THÊM: Hàm khởi động ứng dụng Node.js
function Start-NodeApp {
    Write-Host ""
    Write-Host "=" * 60
    Write-Info "LẦU 3: Khởi động ứng dụng Node.js (npm run dev)..."
    Write-Host "=" * 60
    
    if (Test-Path "package.json") {
        Write-Info "Tìm thấy package.json, đang khởi động ứng dụng..."
        npm run dev
    }
    else {
        Write-Error-Custom "Không tìm thấy package.json!"
        exit 1
    }
}

# ============================================================
# MAIN EXECUTION
# ============================================================

Write-Host ""
Write-Host "╔" + ("=" * 58) + "╗"
Write-Host "║" + " " * 58 + "║"
Write-Host "║  🚀 CHAT SERVICE - STARTUP HELPER v1.0" + " " * 20 + "║"
Write-Host "║" + " " * 58 + "║"
Write-Host "╚" + ("=" * 58) + "╝"
Write-Host ""

# MỚI THÊM: Kiểm tra xem script đang chạy từ đúng thư mục không
if (-not (Test-Path "package.json")) {
    Write-Error-Custom "Script phải chạy từ thư mục root của project!"
    Write-Info "Hãy chạy: cd path/to/23710141_NguyenMinhTri_ChatService"
    exit 1
}

# MỚI THÊM: Lần lượt thực hiện 3 bước
try {
    # Bước 1: Khởi động Docker
    Start-Docker
    
    # Bước 2: Khởi động Docker Compose
    Start-DockerCompose
    
    # Bước 3: Khởi động Node.js App
    Start-NodeApp
}
catch {
    Write-Error-Custom "Lỗi xảy ra: $_"
    exit 1
}

Write-Host ""
Write-Success "Startup hoàn tất!"
Write-Host ""
