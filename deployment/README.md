# 🔒 Forensics Case Management System - Local Network Deployment

## Overview
This guide provides complete instructions for deploying the Forensics Case Management System on a **local network** without internet connectivity, specifically designed for **law enforcement agencies**.

## 🛡️ Security Features
- **Air-gapped deployment** (no internet required)
- **End-to-end encryption** with SSL/TLS
- **Role-based access control** (RBAC)
- **Audit logging** for all actions
- **Secure password policies**
- **Session management**
- **Data backup & recovery**

## 📋 Prerequisites

### Hardware Requirements
- **Minimum**: 4 CPU cores, 8GB RAM, 100GB storage
- **Recommended**: 8 CPU cores, 16GB RAM, 500GB SSD
- **Network**: Dedicated server on local network

### Software Requirements
- **Operating System**: Ubuntu 20.04+ LTS or CentOS 8+
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+

## 🚀 Quick Start Deployment

### 1. Initial Setup
```bash
# Clone the repository (from your exported GitHub repo)
git clone /path/to/your/forensics-system
cd forensics-system

# Make setup script executable
chmod +x deployment/setup.sh

# Run the setup script
./deployment/setup.sh
```

### 2. Start the System
```bash
# Start all services
docker-compose -f deployment/docker-compose.yml up -d

# Check system status
./deployment/monitor.sh
```

### 3. Access the System
- **URL**: `https://your-server-ip`
- **Default Login**: `admin@police.local` / `admin123`
- **⚠️ CHANGE DEFAULT PASSWORD IMMEDIATELY**

## 🔧 Configuration

### Environment Variables
Edit `deployment/.env` file:
```bash
# Database Security
DB_PASSWORD=YourSecurePassword123!
POSTGRES_USER=forensics_admin
POSTGRES_DB=forensics_db

# Application Security
JWT_SECRET=your-super-secure-jwt-secret-64-chars-minimum
NODE_ENV=production

# Network Configuration
APP_PORT=3000
NGINX_HTTPS_PORT=443
```

### SSL Certificate Configuration
```bash
# Option 1: Use your organization's CA certificate
cp your-cert.pem deployment/ssl/cert.pem
cp your-key.pem deployment/ssl/key.pem

# Option 2: Generate new self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout deployment/ssl/key.pem \
  -out deployment/ssl/cert.pem -days 365 -nodes \
  -subj "/C=US/ST=YourState/L=YourCity/O=YourDepartment/CN=forensics.local"
```

## 👥 User Management

### Creating Users
```bash
# Access the database
docker-compose exec postgres psql -U forensics_admin -d forensics_db

# Create a new user
INSERT INTO profiles (full_name, badge_number, role, email, password_hash, department) 
VALUES (
  'Detective John Smith',
  'DET001',
  'investigator',
  'j.smith@police.local',
  '$2b$12$hashed_password_here',
  'Cyber Crimes Unit'
);
```

### User Roles
- **admin**: Full system access, user management
- **supervisor**: Case management, team oversight
- **investigator**: Case creation and management
- **forensic_analyst**: Evidence analysis and reporting
- **exhibit_officer**: Physical evidence management
- **commanding_officer**: High-level overview and reporting

## 🔒 Security Hardening

### 1. Storage Policies
The system implements Row-Level Security (RLS) policies for document storage:

**Reference Letter Access**:
- **Analysts**: Can view reference letters only for cases they are assigned to
- **Exhibit Officers**: Can upload, update, and delete reference letters
- **Naming Convention**: Reference letters must follow the format `reference-letters/<lab-sequence>-<timestamp>-reference-letter.<ext>`
  - Example: `reference-letters/0001-1704067200000-reference-letter.pdf`
- **File Path**: All reference letters stored in `case-documents` bucket under `reference-letters/` folder

**Case Document Access**:
- **Case Participants**: Users assigned to a case (as assigned_to, supervisor_id, analyst_id, or exhibit_officer_id) can view all documents in their case folder
- **Folder Structure**: Documents organized by case ID (`case-documents/<case-id>/`)

These policies are automatically applied during database initialization and ensure secure access control at the storage layer.

### 2. Network Security
```bash
# Configure firewall (Ubuntu/Debian)
sudo ufw allow 22/tcp     # SSH (change default port)
sudo ufw allow 443/tcp    # HTTPS only
sudo ufw deny 80/tcp      # Block HTTP
sudo ufw enable

# Configure firewall (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --remove-service=http
sudo firewall-cmd --reload
```

### 3. System Hardening
```bash
# Disable SSH root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Set up fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Database Security
```bash
# Backup encryption
gpg --gen-key  # Generate GPG key for backup encryption

# Add to backup script
gpg --encrypt --recipient your-email@police.local backup_file.sql.gz
```

## 💾 Backup & Recovery

### Automated Backups
Backups run daily at 2 AM automatically. Manual backup:
```bash
# Create immediate backup
docker-compose exec backup /backup-script.sh

# List available backups
ls -la deployment/backups/

# Restore from backup
docker-compose exec postgres psql -U forensics_admin -d forensics_db < backup_file.sql
```

### Backup Strategy
- **Daily**: Automated database backups
- **Weekly**: Full system backup (database + uploads)
- **Monthly**: Archive backups to external storage
- **Retention**: 30 days online, 1 year archived

## 📊 Monitoring & Maintenance

### System Monitoring
```bash
# Check system status
./deployment/monitor.sh

# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Performance Monitoring
```bash
# Database performance
docker-compose exec postgres psql -U forensics_admin -d forensics_db -c "
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats WHERE tablename IN ('cases','exhibits','profiles');
"

# Application metrics
curl -s https://localhost/health
```

### Maintenance Tasks
- **Daily**: Check system status and logs
- **Weekly**: Review backup integrity
- **Monthly**: Update SSL certificates if needed
- **Quarterly**: Security audit and user review

## 🚨 Troubleshooting

### Common Issues

**Issue**: Cannot access HTTPS site
```bash
# Check SSL certificate
openssl x509 -in deployment/ssl/cert.pem -text -noout

# Check Nginx configuration
docker-compose exec nginx nginx -t
```

**Issue**: Database connection failed
```bash
# Check database status
docker-compose exec postgres pg_isready -U forensics_admin

# Check database logs
docker-compose logs postgres
```

**Issue**: Application not responding
```bash
# Restart application
docker-compose restart app

# Check application logs
docker-compose logs app
```

### Support & Maintenance

For ongoing support:
1. **System Logs**: Located in `deployment/logs/`
2. **Database Logs**: `docker-compose logs postgres`
3. **Application Logs**: `docker-compose logs app`
4. **Backup Logs**: Check backup success in `deployment/backups/`

## 🔄 Updates & Patches

### Applying Updates
```bash
# Pull latest code (if available)
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Apply database migrations if needed
docker-compose exec postgres psql -U forensics_admin -d forensics_db -f /path/to/migration.sql

# Restart services
docker-compose down && docker-compose up -d
```

## 📞 Emergency Procedures

### System Recovery
```bash
# Emergency stop
docker-compose down

# Restore from backup
docker-compose exec postgres psql -U forensics_admin -d forensics_db < latest_backup.sql

# Restart system
docker-compose up -d
```

### Data Recovery
1. Stop all services
2. Restore database from latest backup
3. Restore uploaded files from backup
4. Restart services
5. Verify data integrity

---

## 📋 Deployment Checklist

- [ ] Hardware requirements met
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Firewall configured
- [ ] System hardening applied
- [ ] Default passwords changed
- [ ] Backup system tested
- [ ] Monitoring configured
- [ ] User accounts created
- [ ] System documentation updated
- [ ] Emergency procedures tested

**⚠️ CRITICAL**: Always test the complete system in a staging environment before deploying to production!