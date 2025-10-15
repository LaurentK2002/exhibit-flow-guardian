# Windows 11 Forensics System Setup Script
# Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Forensics Case Management System Setup" -ForegroundColor Cyan
Write-Host "Windows 11 Local Server Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check Docker Desktop installation
Write-Host "Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Desktop not found!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check Docker Compose
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose not found!" -ForegroundColor Red
    exit 1
}

# Get Windows IP address
Write-Host ""
Write-Host "Detecting network configuration..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
Write-Host "✓ Server IP Address: $ipAddress" -ForegroundColor Green
Write-Host "  Other devices can access the system at: https://$ipAddress" -ForegroundColor Cyan

# Create directories
Write-Host ""
Write-Host "Creating directories..." -ForegroundColor Yellow
$directories = @(
    "ssl",
    "backups",
    "logs",
    "uploads",
    "supabase/volumes/db/data",
    "supabase/volumes/storage",
    "supabase/volumes/logs"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Created $dir" -ForegroundColor Green
    }
}

# Generate SSL certificates
Write-Host ""
Write-Host "Generating SSL certificates..." -ForegroundColor Yellow
if (-not (Test-Path "ssl/cert.pem")) {
    # Using OpenSSL in Git Bash if available, otherwise skip SSL generation
    $openssl = Get-Command openssl -ErrorAction SilentlyContinue
    if ($openssl) {
        & openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=TZ/ST=Tanzania/L=Dar-es-Salaam/O=Tanzania Police/CN=$ipAddress"
        Write-Host "✓ SSL certificates generated" -ForegroundColor Green
    } else {
        Write-Host "⚠ OpenSSL not found. SSL certificates not generated." -ForegroundColor Yellow
        Write-Host "  System will still work but HTTPS may show warnings." -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ SSL certificates already exist" -ForegroundColor Green
}

# Generate secure secrets
Write-Host ""
Write-Host "Generating secure secrets..." -ForegroundColor Yellow

function New-SecurePassword {
    param([int]$Length = 32)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $password = ""
    $random = New-Object System.Random
    for ($i = 0; $i -lt $Length; $i++) {
        $password += $chars[$random.Next(0, $chars.Length)]
    }
    return $password
}

$dbPassword = New-SecurePassword -Length 24
$jwtSecret = New-SecurePassword -Length 32
$anonKey = New-SecurePassword -Length 32
$serviceRoleKey = New-SecurePassword -Length 32

# Create .env file
Write-Host "Creating environment configuration..." -ForegroundColor Yellow
$envContent = @"
# Database Configuration
DB_PASSWORD=$dbPassword
POSTGRES_PASSWORD=$dbPassword
DATABASE_URL=postgresql://postgres:$dbPassword@postgres:5432/postgres

# Supabase Configuration
JWT_SECRET=$jwtSecret
ANON_KEY=$anonKey
SERVICE_ROLE_KEY=$serviceRoleKey
SUPABASE_URL=http://$ipAddress:8000
SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey

# Application Configuration
APP_PORT=3000
SERVER_IP=$ipAddress

# Network Configuration
EXTERNAL_IP=$ipAddress
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8
Write-Host "✓ Environment configuration created" -ForegroundColor Green

# Configure Windows Firewall
Write-Host ""
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow

$firewallRules = @(
    @{Name="Forensics System HTTP"; Port=80},
    @{Name="Forensics System HTTPS"; Port=443},
    @{Name="Forensics System App"; Port=3000},
    @{Name="Supabase Studio"; Port=8000},
    @{Name="PostgreSQL"; Port=5432}
)

foreach ($rule in $firewallRules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Remove-NetFirewallRule -DisplayName $rule.Name
    }
    New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -LocalPort $rule.Port -Protocol TCP -Action Allow | Out-Null
    Write-Host "✓ Firewall rule created: $($rule.Name) (Port $($rule.Port))" -ForegroundColor Green
}

# Create docker-compose.yml with Supabase
Write-Host ""
Write-Host "Creating Docker Compose configuration..." -ForegroundColor Yellow

$composeContent = @"
version: '3.8'

services:
  postgres:
    image: supabase/postgres:15.1.0.147
    container_name: forensics_postgres
    environment:
      POSTGRES_PASSWORD: `${DB_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - ./supabase/volumes/db/data:/var/lib/postgresql/data
      - ../database-schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - forensics_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  supabase-auth:
    image: supabase/gotrue:v2.99.0
    container_name: forensics_auth
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: http://`${EXTERNAL_IP}:8000
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: `${DATABASE_URL}
      GOTRUE_SITE_URL: http://`${EXTERNAL_IP}:3000
      GOTRUE_JWT_SECRET: `${JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_MAILER_AUTOCONFIRM: true
    ports:
      - "9999:9999"
    restart: unless-stopped
    networks:
      - forensics_network

  supabase-rest:
    image: postgrest/postgrest:v11.2.2
    container_name: forensics_rest
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      PGRST_DB_URI: `${DATABASE_URL}
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: `${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
    ports:
      - "3001:3000"
    restart: unless-stopped
    networks:
      - forensics_network

  supabase-realtime:
    image: supabase/realtime:v2.25.35
    container_name: forensics_realtime
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: `${DB_PASSWORD}
      DB_NAME: postgres
      DB_SSL: "false"
      PORT: 4000
      JWT_SECRET: `${JWT_SECRET}
    ports:
      - "4000:4000"
    restart: unless-stopped
    networks:
      - forensics_network

  supabase-storage:
    image: supabase/storage-api:v0.43.11
    container_name: forensics_storage
    depends_on:
      postgres:
        condition: service_healthy
      supabase-rest:
        condition: service_started
    environment:
      ANON_KEY: `${ANON_KEY}
      SERVICE_KEY: `${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://supabase-rest:3000
      PGRST_JWT_SECRET: `${JWT_SECRET}
      DATABASE_URL: `${DATABASE_URL}
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: local
      GLOBAL_S3_BUCKET: local-storage
    volumes:
      - ./supabase/volumes/storage:/var/lib/storage
    ports:
      - "5000:5000"
    restart: unless-stopped
    networks:
      - forensics_network

  supabase-studio:
    image: supabase/studio:20231123-64a766c
    container_name: forensics_studio
    depends_on:
      - postgres
    environment:
      SUPABASE_URL: http://`${EXTERNAL_IP}:8000
      STUDIO_PG_META_URL: http://supabase-rest:3001
      SUPABASE_ANON_KEY: `${ANON_KEY}
      SUPABASE_SERVICE_KEY: `${SERVICE_ROLE_KEY}
    ports:
      - "8000:3000"
    restart: unless-stopped
    networks:
      - forensics_network

  app:
    build:
      context: ../..
      dockerfile: deployment/Dockerfile
    container_name: forensics_app
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      VITE_SUPABASE_URL: http://`${EXTERNAL_IP}:8000
      VITE_SUPABASE_ANON_KEY: `${ANON_KEY}
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - forensics_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: forensics_nginx
    depends_on:
      - app
    volumes:
      - ../nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
    networks:
      - forensics_network

volumes:
  postgres_data:

networks:
  forensics_network:
    driver: bridge
"@

$composeContent | Out-File -FilePath "docker-compose.yml" -Encoding utf8
Write-Host "✓ Docker Compose configuration created" -ForegroundColor Green

# Start services
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Cyan

docker-compose up -d

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Application (This PC): http://localhost or https://localhost" -ForegroundColor White
Write-Host "  Application (Network): http://$ipAddress or https://$ipAddress" -ForegroundColor White
Write-Host "  Supabase Studio: http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Database Credentials:" -ForegroundColor Cyan
Write-Host "  Host: localhost (or $ipAddress from network)" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  Database: postgres" -ForegroundColor White
Write-Host "  Username: postgres" -ForegroundColor White
Write-Host "  Password: (saved in .env file)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open Supabase Studio: http://localhost:8000" -ForegroundColor White
Write-Host "  2. Create your first admin user" -ForegroundColor White
Write-Host "  3. Access the app from any device: https://$ipAddress" -ForegroundColor White
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop system: docker-compose down" -ForegroundColor White
Write-Host "  Restart: docker-compose restart" -ForegroundColor White
Write-Host "  Backup: .\backup.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Storage Security:" -ForegroundColor Cyan
Write-Host "  - Reference letters must be named: reference-letters/<lab-sequence>-<timestamp>-reference-letter.<ext>" -ForegroundColor White
Write-Host "  - Analysts can only view reference letters for their assigned cases" -ForegroundColor White
Write-Host "  - Exhibit officers can upload, update, and delete reference letters" -ForegroundColor White
Write-Host "  - Case participants can view documents in their case folders" -ForegroundColor White
Write-Host ""
