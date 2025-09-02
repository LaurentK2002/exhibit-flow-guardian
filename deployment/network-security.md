# 🛡️ Network Security Configuration for Law Enforcement Deployment

## Network Topology

```
Internet (Blocked)
        |
    [Firewall]
        |
  [DMZ Network] (Optional)
        |
  [Internal Network]
        |
[Forensics Server]
192.168.1.100
        |
    [Clients]
192.168.1.101-150
```

## 🔒 Network Isolation Requirements

### 1. Physical Network Separation
- **Dedicated VLAN** for forensics system
- **No internet access** (air-gapped)
- **Isolated from general IT network**
- **Separate from evidence storage network**

### 2. Access Control Lists (ACLs)
```bash
# Example Cisco/Router ACL
access-list 100 permit tcp 192.168.1.0 0.0.0.255 host 192.168.1.100 eq 443
access-list 100 permit tcp 192.168.1.0 0.0.0.255 host 192.168.1.100 eq 22
access-list 100 deny ip any any
```

### 3. Firewall Configuration
```bash
# Ubuntu UFW Rules
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default deny outgoing
sudo ufw default deny forward

# Allow specific local network access only
sudo ufw allow from 192.168.1.0/24 to any port 443
sudo ufw allow from 192.168.1.0/24 to any port 22

# Enable firewall
sudo ufw enable
```

## 🖥️ Server Configuration

### 1. Network Interface Configuration
```bash
# /etc/netplan/01-netcfg.yaml (Ubuntu)
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: false
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 192.168.1.1  # Local DNS only
      routes:
        - to: 0.0.0.0/0
          via: 192.168.1.1
          metric: 100
          # Block internet access
        - to: 0.0.0.0/0
          via: 127.0.0.1
          metric: 1
```

### 2. DNS Configuration (Local Only)
```bash
# /etc/systemd/resolved.conf
[Resolve]
DNS=192.168.1.1
FallbackDNS=
Domains=police.local
DNSSEC=allow-downgrade
DNSOverTLS=no
Cache=yes
```

### 3. NTP Configuration (Local Time Server)
```bash
# /etc/systemd/timesyncd.conf
[Time]
NTP=192.168.1.1  # Local time server
FallbackNTP=
RootDistanceMaxSec=5
PollIntervalMinSec=32
PollIntervalMaxSec=2048
```

## 🔐 SSL/TLS Configuration

### 1. Certificate Authority Setup
```bash
# Create local Certificate Authority
openssl genrsa -out ca-key.pem 4096
openssl req -new -x509 -days 3650 -key ca-key.pem -out ca-cert.pem \
  -subj "/C=US/ST=State/L=City/O=Police Department/CN=Police Root CA"

# Create server certificate
openssl genrsa -out server-key.pem 4096
openssl req -new -key server-key.pem -out server.csr \
  -subj "/C=US/ST=State/L=City/O=Police Department/CN=forensics.police.local"

# Sign server certificate
openssl x509 -req -days 365 -in server.csr -CA ca-cert.pem -CAkey ca-key.pem \
  -CAcreateserial -out server-cert.pem
```

### 2. Strong SSL Configuration
```nginx
# Nginx SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 5m;
ssl_stapling off;  # No internet access
ssl_stapling_verify off;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## 🖱️ Client Configuration

### 1. Workstation Security
```bash
# Group Policy (Windows Domain)
# Computer Configuration > Administrative Templates > Network
- DNS Client: Turn off multicast name resolution (Enabled)
- Network Connections: Prohibit access to properties of components (Enabled)
- Network Connections: Ability to change properties (Disabled)

# Registry entries
[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters]
"DisableIPSourceRouting"=dword:00000002
"EnableICMPRedirect"=dword:00000000
"EnableDeadGWDetect"=dword:00000000
```

### 2. Browser Configuration
```javascript
// Chrome Enterprise Policy
{
  "HomepageLocation": "https://forensics.police.local",
  "HomepageIsNewTabPage": false,
  "DefaultSearchProviderEnabled": false,
  "BookmarkBarEnabled": false,
  "PasswordManagerEnabled": false,
  "AutofillAddressEnabled": false,
  "AutofillCreditCardEnabled": false,
  "SafeBrowsingEnabled": false,  // No internet access
  "NetworkPredictionOptions": 2,  // Never predict
  "URLBlacklist": ["*://*/*"],
  "URLWhitelist": ["https://forensics.police.local/*"]
}
```

## 📊 Network Monitoring

### 1. Traffic Monitoring
```bash
# Monitor network connections
sudo netstat -tulpn | grep :443
sudo ss -tulpn | grep :443

# Monitor traffic patterns
sudo tcpdump -i eth0 -n -c 100

# Check for unexpected connections
sudo lsof -i :443
```

### 2. Intrusion Detection
```bash
# Install and configure Fail2Ban
sudo apt install fail2ban

# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = 443
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
```

### 3. Log Monitoring
```bash
# Monitor authentication logs
sudo tail -f /var/log/auth.log

# Monitor web access logs
sudo tail -f /var/log/nginx/access.log

# Monitor application logs
docker-compose logs -f app | grep -i error
```

## 🚨 Incident Response

### 1. Network Isolation Procedures
```bash
# Emergency network isolation
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT DROP

# Allow only localhost
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A OUTPUT -o lo -j ACCEPT
```

### 2. Evidence Preservation
```bash
# Capture network state
sudo netstat -tulpn > network_state_$(date +%Y%m%d_%H%M%S).txt
sudo ss -tulpn > socket_state_$(date +%Y%m%d_%H%M%S).txt
sudo iptables -L -n -v > firewall_state_$(date +%Y%m%d_%H%M%S).txt

# Capture memory dump (if needed)
sudo dd if=/dev/mem of=memory_dump_$(date +%Y%m%d_%H%M%S).raw
```

### 3. Recovery Procedures
```bash
# Restore from clean backup
docker-compose down
docker system prune -a
docker-compose up -d

# Verify system integrity
docker-compose exec app /health-check.sh
./deployment/monitor.sh
```

## 📋 Network Security Checklist

- [ ] Physical network isolation implemented
- [ ] VLAN configuration completed
- [ ] Firewall rules configured and tested
- [ ] Internet access blocked and verified
- [ ] SSL certificates installed and configured
- [ ] Client workstations configured
- [ ] Network monitoring tools installed
- [ ] Intrusion detection system configured
- [ ] Log monitoring implemented
- [ ] Incident response procedures documented
- [ ] Emergency isolation procedures tested
- [ ] Recovery procedures tested
- [ ] Network topology documented
- [ ] Security policies implemented
- [ ] Staff training completed

**⚠️ CRITICAL**: Test all network security measures before deployment and regularly audit the configuration!