[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$taskName = "ChatServiceMongoBackup"
$node = Get-Command node -ErrorAction Stop
$nodePath = $node.Source
$scriptPath = Join-Path $PSScriptRoot "backup-mongo-to-minio.js"

Write-Host "📅 Đăng ký Scheduled Task: $taskName" -ForegroundColor Cyan
Write-Host "🧭 Node executable: $nodePath" -ForegroundColor Green
Write-Host "📄 Backup script: $scriptPath" -ForegroundColor Green

$action = "`"$nodePath`" `"$scriptPath`""
$arguments = "/Create /SC DAILY /TN $taskName /TR $action /ST 02:00 /F"

Write-Host "⏰ Tạo tác vụ chạy hàng ngày lúc 02:00" -ForegroundColor Cyan
Start-Process schtasks -ArgumentList $arguments -NoNewWindow -Wait

Write-Host "✅ Scheduled Task '$taskName' đã được tạo." -ForegroundColor Green
