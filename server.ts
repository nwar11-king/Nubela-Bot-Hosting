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
# Version: 1.9.5

# Colors
RED='\\x1b[0;31m'
GREEN='\\x1b[0;32m'
YELLOW='\\x1b[1;33m'
BLUE='\\x1b[0;34m'
NC='\\x1b[0m'

# Root Check
if [ "$EUID" -ne 0 ]; then 
  echo -e "\${RED}❌ ERROR: Root access required.\${NC}"
  echo -e "\${YELLOW}Please switch to root user (su -) and run again.\${NC}"
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
echo -e "\${YELLOW}       NEBULA TURBO INSTALLER (v1.9.5)       \${NC}"
echo -e "\${BLUE}==============================================\${NC}"

echo "1) Full Panel Deployment (Real)"
echo "2) Node / Daemon Setup"
echo "3) System Information"
echo "4) Exit"
echo -e "\${BLUE}==============================================\${NC}"
read -p "Option [1-4]: " MODE < /dev/tty

case \$MODE in
    1)
        read -p "Your Domain (e.g. panel.example.com): " DOMAIN < /dev/tty
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

        # Install Dependencies
        echo -e "\${YELLOW}📦 Installing app dependencies...\${NC}"
        npm install --production --quiet >/dev/null 2>&1

        # Nginx Config
        if [ "\$WEB_CONF" == "1" ]; then
            echo -e "\${BLUE}🌐 Setting up Nginx VHost...\${NC}"
            cat <<EOF > /etc/nginx/sites-available/nebula.conf
server {
    listen 80;
    server_name \$DOMAIN;
    
    # Fast proxy headers
    proxy_buffer_size          128k;
    proxy_buffers              4 256k;
    proxy_busy_buffers_size    256k;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        
        # Prevent "Waiting Header" timeouts
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF
            ln -sf /etc/nginx/sites-available/nebula.conf /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
            nginx -t >/dev/null 2>&1 && systemctl restart nginx
            
            read -p "Apply SSL now? (y/n): " SSL_YN < /dev/tty
            if [ "\$SSL_YN" == "y" ]; then
                certbot --nginx -d \$DOMAIN --non-interactive --agree-tos -m admin@\$DOMAIN --quiet
                W_PROTO="https"
            else
                W_PROTO="http"
            fi
        elif [ "\$WEB_CONF" == "2" ]; then
            echo -e "\${YELLOW}☁️ Cloudflare Tunnel Setup...\${NC}"
            read -p "Paste Your Tunnel Token: " CF_TOKEN < /dev/tty
            if [ -n "\$CF_TOKEN" ]; then
                if ! command -v cloudflared &> /dev/null; then
                    curl -sL --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
                    dpkg -i /tmp/cloudflared.deb >/dev/null 2>&1
                fi
                cloudflared service install "\$CF_TOKEN" >/dev/null 2>&1 && systemctl start cloudflared
                echo -e "\${GREEN}✅ Cloudflare Tunnel is now Active.\${NC}"
            fi
            W_PROTO="https" # Tunnels are usually HTTPS on the edge
        fi

        # Persistence & Startup
        echo -e "\${BLUE}⚙️ Configuring Systemd Service...\${NC}"
        
        # Detect absolute path of npm
        NPM_PATH=\$(command -v npm)
        if [ -z "\$NPM_PATH" ]; then NPM_PATH="/usr/bin/npm"; fi

        # Ensure correct permissions
        chown -R root:root /var/www/nebula
        chmod -R 755 /var/www/nebula

        cat <<EOF > /etc/systemd/system/nebula.service
[Unit]
Description=Nebula Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/nebula
ExecStart=\$NPM_PATH start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

        echo -e "\${YELLOW}🚀 Starting Nebula Panel...\${NC}"
        systemctl daemon-reload
        systemctl stop nebula >/dev/null 2>&1
        systemctl enable nebula --now >/dev/null 2>&1

        # Final Verification
        echo -e "\${YELLOW}🔍 Verifying deployment (checking port 3000)...\${NC}"
        # Give it a bit more time for initial start
        sleep 5
        READY=false
        if command -v lsof &> /dev/null; then
            if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
                READY=true
            fi
        fi

        # Summary Screen
        clear
        if [ "\$READY" = true ]; then
            echo -e "\${GREEN}🚀 DEPLOYMENT 100% SUCCESSFUL!\${NC}"
        else
            echo -e "\${YELLOW}⚠️  SERVICE REGISTERED. (Waiting for port 3000)...\${NC}"
        fi
        echo -e "\${BLUE}==============================================\${NC}"
        echo -e "URL: \${YELLOW}\$W_PROTO://\$DOMAIN\${NC}"
        echo -e "Server IP: \${YELLOW}\$SERVER_IP\${NC}"
        echo -e "\${BLUE}==============================================\${NC}"
        echo -e "\${GREEN}Next Steps:\${NC}"
        if [ "\$WEB_CONF" == "1" ]; then
            echo -e "1. Ensure DNS A Record for \${YELLOW}\$DOMAIN\${NC} points to \${YELLOW}\$SERVER_IP\${NC}"
        else
            echo -e "1. In Cloudflare Dashboard, add Public Hostname:"
            echo -e "   \${YELLOW}\$DOMAIN\${NC} -> \${YELLOW}http://localhost:3000\${NC}"
        fi
        echo -e "2. Check service status: \${CYAN}systemctl status nebula\${NC}"
        echo -e "3. View live logs: \${CYAN}journalctl -u nebula -f\${NC}"
        echo -e "\${BLUE}==============================================\${NC}"
        read -p "Press Enter to return to menu." < /dev/tty
        ;;
    2)
        echo -e "\${YELLOW}--- Node Runner Setup ---\${NC}"
        if ! command -v docker &> /dev/null; then
            echo -e "\${BLUE}🐳 Deploying Docker Engine...\${NC}"
            curl -sSL https://get.docker.com | sh >/dev/null 2>&1
            systemctl enable --now docker >/dev/null 2>&1
        fi
        echo -e "\${GREEN}✅ Node is ready to be linked.\${NC}"
        echo -e "Run nodes with Docker to ensure isolated environments."
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
    res.json({ status: "ok", version: "1.9.5" });
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
