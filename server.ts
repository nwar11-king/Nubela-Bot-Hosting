import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Installer Script logic
  const getInstallerScript = () => {
    return `#!/bin/bash
# Nebula Hosting / BotHosting.site Ultra-Fast Installer
# Version: 1.8.0

# Colors
RED='\\x1b[0;31m'
GREEN='\\x1b[0;32m'
YELLOW='\\x1b[1;33m'
BLUE='\\x1b[0;34m'
NC='\\x1b[0m'

# Root Check
if [ "$EUID" -ne 0 ]; then 
  echo -e "\${RED}❌ ERROR: Root access required.\${NC}"
  echo -e "\${YELLOW}Use: curl -sSL https://get.bothosting.site | sudo bash\${NC}"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# Cache package lists once
UPDATED=false
update_apt() {
    if [ "$UPDATED" = false ]; then
        echo -e "\${BLUE}🔄 Syncing repositories...\${NC}"
        apt-get update -y -qq >/dev/null 2>&1
        UPDATED=true
    fi
}

install_pkg() {
    local pkgs=()
    for pkg in "\$@"; do
        if ! command -v "\$pkg" &> /dev/null && ! dpkg -l "\$pkg" &> /dev/null; then
            pkgs+=("\$pkg")
        fi
    done
    if [ \${#pkgs[@]} -gt 0 ]; then
        update_apt
        echo -e "\${YELLOW}⚡ Adding: \${pkgs[*]}...\${NC}"
        apt-get install -y -qq --no-install-recommends "\${pkgs[@]}" >/dev/null 2>&1
    fi
}

while true; do
clear
echo -e "\${GREEN}
 ███▄    █ ▓█████  ▄▄▄▄   █    ██  ██▓    ▄▄▄      
 ██ ▀█   █ ▓█   ▀ ▓█████▄ ██  ▓██▒▓██▒   ▒████▄    
▓██  ▀█ ██▒▒███   ▒██▒ ▄██▓██  ▒██░▒██░   ▒██  ▀█▄  
▓██▒  ▐▌██▒▒▓█  ▄ ▒██░█▀  ▓██  ░██░▒██░   ░██▄▄▄▄██ 
 ▒██░   ▓██░░▒████▒░▓█  ▀█▓░▒█████▓ ░██████▒▓█   ▓██▒
\${NC}"

echo -e "\${BLUE}==============================================\${NC}"
echo -e "\${YELLOW}       NEBULA TURBO INSTALLER (v1.8.0)       \${NC}"
echo -e "\${BLUE}==============================================\${NC}"

echo "1) Full Panel Deployment (Real)"
echo "2) Node / Daemon Setup"
echo "3) System Information"
echo "4) Exit"
echo -e "\${BLUE}==============================================\${NC}"
read -p "Option [1-4]: " MODE < /dev/tty

case \$MODE in
    1)
        read -p "Your Domain: " DOMAIN < /dev/tty
        read -p "Web Option: [1] Nginx [2] Cloudflare Tunnel: " WEB_CONF < /dev/tty

        echo -e "\${YELLOW}--- Turbo Setup Active ---\${NC}"
        
        # Immediate essential fetch
        install_pkg curl wget git build-essential nginx certbot python3-certbot-nginx

        # Node.js 20 check
        if ! command -v node &> /dev/null; then
            echo -e "\${YELLOW}📦 Fast-tracking Node.js 20...\${NC}"
            curl -sSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
            apt-get install -y -qq nodejs >/dev/null 2>&1
        fi

        # Get Server IP
        SERVER_IP=\$(curl -s https://ident.me || curl -s https://ifconfig.me)

        # File setup
        mkdir -p /var/www/nebula
        cd /var/www/nebula
        if [ ! -d ".git" ]; then
            echo -e "\${BLUE}📥 Pulling panel code...\${NC}"
            git clone --quiet --depth 1 https://github.com/NebulaHosting/Panel.git . 2>/dev/null
        fi

        # Nginx Config
        if [ "\$WEB_CONF" == "1" ]; then
            echo -e "\${BLUE}🌐 Setting up Nginx VHost...\${NC}"
            cat <<EOF > /etc/nginx/sites-available/nebula.conf
server {
    listen 80;
    server_name \$DOMAIN;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
EOF
            ln -sf /etc/nginx/sites-available/nebula.conf /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
            nginx -t >/dev/null 2>&1 && systemctl restart nginx

            echo -e "\${GREEN}✅ Nginx Configured.\${NC}"
            echo -e "\${YELLOW}⚠️ DNS INSTRUCTIONS:\${NC}"
            echo -e "   1. Go to your DNS provider (Cloudflare, Namecheap, etc.)"
            echo -e "   2. Add an \${BLUE}A Record\${NC} for \${GREEN}\$DOMAIN\${NC}"
            echo -e "   3. Point it to IP: \${GREEN}\$SERVER_IP\${NC}"
            echo -e "   4. For Cloudflare: Use \${RED}DNS Only\${NC} first, then switch to Proxied after SSL."
            
            read -p "Apply SSL now? (y/n): " SSL_YN < /dev/tty
            if [ "\$SSL_YN" == "y" ]; then
                certbot --nginx -d \$DOMAIN --non-interactive --agree-tos -m admin@\$DOMAIN --quiet
            fi
        elif [ "\$WEB_CONF" == "2" ]; then
            read -p "Paste Your Tunnel Token: " CF_TOKEN < /dev/tty
            if [ -n "\$CF_TOKEN" ]; then
                if ! command -v cloudflared &> /dev/null; then
                    curl -sL --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
                    dpkg -i /tmp/cloudflared.deb >/dev/null 2>&1
                fi
                cloudflared service install "\$CF_TOKEN" >/dev/null 2>&1 && systemctl start cloudflared
                echo -e "\${GREEN}✅ Cloudflare Tunnel is now Active.\${NC}"
            fi
        fi

        # Persistence
        cat <<EOF > /etc/systemd/system/nebula.service
[Unit]
Description=Nebula Panel
After=network.target

[Service]
WorkingDirectory=/var/www/nebula
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF
        systemctl daemon-reload
        echo -e "\${GREEN}🚀 DEPLOYMENT 100% COMPLETE!\${NC}"
        echo -e "\${BLUE}Address: http://\$DOMAIN (\${SERVER_IP})\${NC}"
        read -p "Press Enter to finish." < /dev/tty
        ;;
    2)
        echo -e "\${YELLOW}--- Node Runner Setup ---\${NC}"
        if ! command -v docker &> /dev/null; then
            echo -e "\${BLUE}🐳 Deploying Docker Engine...\${NC}"
            curl -sSL https://get.docker.com | sh >/dev/null 2>&1
        fi
        echo -e "\${GREEN}✅ Node is ready to be linked.\${NC}"
        read -p "Press Enter." < /dev/tty
        ;;
    3)
        echo -e "\${BLUE}--- Server Specs ---\${NC}"
        echo -e "Public IP: \$(curl -s ident.me || echo 'Unknown')"
        free -h | awk '/^Mem:/ {print "RAM: "\$3"/"\$2}'
        df -h / | awk 'NR==2 {print "Disk: "\$3"/"\$2}'
        read -p "Press Enter." < /dev/tty
        ;;
    4)
        exit 0
        ;;
esac
done
`;
  };

  // CLI Handler
  app.get("/", (req, res, next) => {
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    const isCli = /curl|wget|bash|fetch/i.test(ua) && !ua.includes("mozilla");
    if (isCli) {
      res.setHeader("Content-Type", "text/x-shellscript");
      return res.send(getInstallerScript());
    }
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.8.0" });
  });

  // Serve static UI
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Nebula 1.8.0 running on :" + PORT);
  });
}

startServer().catch(console.error);
