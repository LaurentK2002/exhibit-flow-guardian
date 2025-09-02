#!/bin/bash

# Forensics Case Management System - Local Deployment Setup
# For Law Enforcement Networks (Air-Gapped)

set -e

echo "🔒 Setting up Forensics Case Management System for Local Network..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sh get-docker.sh"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p {ssl,backups,logs,uploads}

# Generate SSL certificates (self-signed for local network)
echo "🔐 Generating SSL certificates..."
if [ ! -f ssl/cert.pem ]; then
    openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Law Enforcement/OU=Cyber Crimes Unit/CN=forensics.local"
    chmod 600 ssl/key.pem
    chmod 644 ssl/cert.pem
    echo "✅ SSL certificates generated"
else
    echo "✅ SSL certificates already exist"
fi

# Create environment file
echo "⚙️  Creating environment configuration..."
if [ ! -f .env ]; then
    cat > .env << EOF
# Database Configuration
DB_PASSWORD=$(openssl rand -hex 32)
POSTGRES_USER=forensics_admin
POSTGRES_DB=forensics_db

# Application Configuration
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 64)

# Network Configuration
APP_PORT=3000
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
EOF
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi

# Create backup script
echo "💾 Setting up backup system..."
cat > backup-script.sh << 'EOF'
#!/bin/sh

# Database backup script
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="forensics_db"
DB_USER="forensics_admin"
DB_HOST="postgres"

# Create backup
echo "Creating backup: $DATE"
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/forensics_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/forensics_backup_$DATE.sql

# Remove old backups (keep last 30 days)
find $BACKUP_DIR -name "forensics_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: forensics_backup_$DATE.sql.gz"
EOF

chmod +x backup-script.sh

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash

# System monitoring script for forensics system
echo "🔍 Forensics System Status Check - $(date)"
echo "================================================"

# Check Docker containers
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "💾 Database Status:"
docker-compose exec -T postgres pg_isready -U forensics_admin -d forensics_db

echo ""
echo "🌐 Application Health:"
curl -s http://localhost:3000/health || echo "❌ Application not responding"

echo ""
echo "💽 Disk Usage:"
df -h | grep -E "/$|uploads|backups"

echo ""
echo "🔄 Recent Logs (last 10 lines):"
docker-compose logs --tail=10 app
EOF

chmod +x monitor.sh

# Set file permissions
echo "🔐 Setting secure file permissions..."
chmod 600 .env
chmod 755 *.sh

# Create systemd service for auto-start
echo "🚀 Creating system service..."
sudo tee /etc/systemd/system/forensics-system.service > /dev/null << EOF
[Unit]
Description=Forensics Case Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable forensics-system.service

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Review and customize the .env file if needed"
echo "2. Start the system: docker-compose up -d"
echo "3. Access the system: https://your-server-ip"
echo "4. Login with: admin@police.local / admin123 (CHANGE PASSWORD!)"
echo ""
echo "📋 Useful commands:"
echo "• Start system:    docker-compose up -d"
echo "• Stop system:     docker-compose down"
echo "• View logs:       docker-compose logs -f"
echo "• Monitor:         ./monitor.sh"
echo "• Backup now:      docker-compose exec backup /backup-script.sh"
echo ""
echo "🔒 Security reminders:"
echo "• Change default admin password immediately"
echo "• Update SSL certificates before expiry"
echo "• Regular backups are scheduled at 2 AM daily"
echo "• Monitor system logs regularly"
EOF

chmod +x deployment/setup.sh