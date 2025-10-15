# System Monitoring Script
# Run from deployment/windows directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Forensics System Status Monitor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker service
Write-Host "Docker Service:" -ForegroundColor Yellow
$dockerService = Get-Service "com.docker.service" -ErrorAction SilentlyContinue
if ($dockerService -and $dockerService.Status -eq "Running") {
    Write-Host "  ✓ Running" -ForegroundColor Green
} else {
    Write-Host "  ✗ Not Running" -ForegroundColor Red
}

Write-Host ""

# Check container status
Write-Host "Container Status:" -ForegroundColor Yellow
docker-compose ps

Write-Host ""

# Check disk space
Write-Host "Disk Space:" -ForegroundColor Yellow
$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free / 1GB, 2)
$usedGB = [math]::Round($drive.Used / 1GB, 2)
$totalGB = [math]::Round(($drive.Free + $drive.Used) / 1GB, 2)
Write-Host "  Used: $usedGB GB / $totalGB GB (Free: $freeGB GB)" -ForegroundColor White

Write-Host ""

# Check network connectivity
Write-Host "Network Configuration:" -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
Write-Host "  Server IP: $ipAddress" -ForegroundColor White
Write-Host "  Access URL: https://$ipAddress" -ForegroundColor Cyan

Write-Host ""

# Recent logs
Write-Host "Recent Application Logs (last 20 lines):" -ForegroundColor Yellow
docker-compose logs --tail=20 app

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
