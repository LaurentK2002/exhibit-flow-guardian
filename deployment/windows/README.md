# Windows 11 Server Deployment Guide

## Prerequisites

1. **Windows 11** (Home, Pro, or Enterprise)
2. **Docker Desktop for Windows** (with WSL2)
3. **Administrator privileges**

## Quick Start

### 1. Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Run the installer
3. Ensure "Use WSL 2 instead of Hyper-V" is checked
4. Restart your computer when prompted

### 2. Run Setup Script

Open PowerShell as Administrator and run:

```powershell
cd deployment/windows
.\setup.ps1
```

This script will:
- Check prerequisites
- Generate SSL certificates
- Create environment configuration
- Set up the database
- Start all services

### 3. Access the System

After setup completes:

**From the Windows 11 server:**
- https://localhost or https://127.0.0.1

**From other devices on your network:**
- https://YOUR-WINDOWS-IP (e.g., https://192.168.1.100)

To find your Windows IP:
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

## Network Access Configuration

### Allow Through Windows Firewall

The setup script automatically creates firewall rules, but you can verify:

```powershell
# Check firewall rules
Get-NetFirewallRule -DisplayName "Forensics System*"

# Or manually add rules
New-NetFirewallRule -DisplayName "Forensics System HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Forensics System HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### Static IP Recommendation

For stable access, configure a static IP on your Windows 11 server:

1. Open Settings → Network & Internet → Advanced network settings
2. Click on your network adapter → View additional properties
3. Click "Edit" next to IP assignment
4. Choose "Manual" and enter:
   - IP address: (e.g., 192.168.1.100)
   - Subnet mask: 255.255.255.0
   - Gateway: Your router IP (usually 192.168.1.1)
   - DNS: 8.8.8.8 (Google DNS)

## Managing the System

### Start Services
```powershell
cd deployment/windows
docker-compose up -d
```

### Stop Services
```powershell
cd deployment/windows
docker-compose down
```

### View Logs
```powershell
docker-compose logs -f
```

### Restart Services
```powershell
docker-compose restart
```

### Check Status
```powershell
docker-compose ps
```

## Backup and Restore

### Backup Database
```powershell
.\backup.ps1
```
Backups are stored in `deployment/windows/backups/`

### Restore Database
```powershell
.\restore.ps1 backup-2024-01-15.sql
```

## Troubleshooting

### Docker Desktop not starting
- Ensure WSL2 is installed: `wsl --install`
- Update Windows to latest version
- Enable virtualization in BIOS

### Cannot access from other devices
- Check Windows Firewall rules
- Verify IP address with `ipconfig`
- Ensure devices are on same network
- Try pinging the server from other devices

### Port conflicts
If ports 80/443 are in use:
1. Stop IIS: `iisreset /stop`
2. Or change ports in `.env` file

### Services won't start
```powershell
# Reset everything
docker-compose down -v
docker-compose up -d
```

## Security Considerations

1. **Change default passwords** in `.env` file
2. **Use strong passwords** for production
3. **Keep system updated**: Run Windows Update regularly
4. **Backup regularly**: Run `.\backup.ps1` daily
5. **Network isolation**: Keep this on a secure network segment

## System Requirements

- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 50GB available space
- **CPU**: 4 cores recommended
- **Network**: Gigabit Ethernet recommended

## Default Credentials

After setup, create your first admin user through the Supabase dashboard:

1. Open: http://localhost:8000 (Supabase Studio)
2. Navigate to Authentication → Users
3. Add your admin user
4. Update role in profiles table

## Support

For issues, check:
- Docker Desktop logs: Docker Desktop → Troubleshoot → View logs
- Application logs: `docker-compose logs -f app`
- Database logs: `docker-compose logs -f postgres`
