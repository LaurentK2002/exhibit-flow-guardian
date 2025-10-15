# Restore Script for Forensics System
# Usage: .\restore.ps1 backup-file.sql.zip

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

if (-not (Test-Path "backups/$BackupFile")) {
    Write-Host "✗ Backup file not found: backups/$BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "WARNING: This will overwrite the current database!" -ForegroundColor Yellow
$confirm = Read-Host "Type 'YES' to continue"

if ($confirm -ne "YES") {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "Extracting backup..." -ForegroundColor Yellow
Expand-Archive -Path "backups/$BackupFile" -DestinationPath "backups/temp" -Force

$sqlFile = Get-ChildItem "backups/temp/*.sql" | Select-Object -First 1

Write-Host "Restoring database..." -ForegroundColor Yellow
Get-Content $sqlFile.FullName | docker exec -i forensics_postgres psql -U postgres postgres

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Restore failed!" -ForegroundColor Red
}

# Cleanup
Remove-Item "backups/temp" -Recurse -Force
