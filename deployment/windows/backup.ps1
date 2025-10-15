# Backup Script for Forensics System
# Run from deployment/windows directory

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$backupFile = "backups/forensics-backup-$timestamp.sql"

Write-Host "Starting database backup..." -ForegroundColor Yellow

# Create backups directory if it doesn't exist
if (-not (Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" | Out-Null
}

# Backup database
docker exec forensics_postgres pg_dump -U postgres postgres > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backup created: $backupFile" -ForegroundColor Green
    
    # Compress backup
    Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
    Remove-Item $backupFile
    
    Write-Host "✓ Backup compressed: $backupFile.zip" -ForegroundColor Green
    
    # Remove backups older than 30 days
    Get-ChildItem "backups/*.zip" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
    Write-Host "✓ Old backups cleaned up" -ForegroundColor Green
} else {
    Write-Host "✗ Backup failed!" -ForegroundColor Red
    exit 1
}
