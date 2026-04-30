import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Installer Script logic
  const getInstallerScript = () => {
    return `#!/bin/bash
# Nebula Hosting / BotHosting.site Advanced Installer
# Version: 1.1.5

# Colors for output
RED='\\x1b[0;31m'
GREEN='\\x1b[0;32m'
YELLOW='\\x1b[1;33m'
BLUE='\\x1b[0;34m'
NC='\\x1b[0m' # No Color

clear
echo -e "\${GREEN}
 ███▄    █ ▓█████  ▄▄▄▄   █    ██  ██▓    ▄▄▄      
 ██ ▀█   █ ▓█   ▀ ▓█████▄ ██  ▓██▒▓██▒   ▒████▄    
▓██  ▀█ ██▒▒███   ▒██▒ ▄██▓██  ▒██░▒██░   ▒██  ▀█▄  
▓██▒  ▐▌██▒▒▓█  ▄ ▒██░█▀  ▓██  ░██░▒██░   ░██▄▄▄▄██ 
 ▒██░   ▓██░░▒████▒░▓█  ▀█▓░▒█████▓ ░██████▒▓█   ▓██▒
\${NC}"

echo -e "\${BLUE}==============================================\${NC}"
echo -e "\${YELLOW}       NEBULA SYSTEM INSTALLER (v1.1)        \${NC}"
echo -e "\${BLUE}==============================================\${NC}"

# Check for root
if [ "\$EUID" -ne 0 ] && [ "\$(id -u)" -ne 0 ]; then 
  echo -e "\${RED}Please run as root (use sudo)!\${NC}"
fi

echo "1) Install Nebula Panel (Web UI)"
echo "2) Install Nebula Node (Daemon)"
echo "3) System Health Check"
echo "4) Exit"
read -p "Select mode [1-4]: " MODE

if [ "\$MODE" == "1" ]; then
    read -p "Enter your Domain (e.g. panel.bothosting.site): " DOMAIN
    read -p "Install MySQL Database? [y/n]: " INSTALL_DB
    read -p "Web Server: [1] Nginx [2] Cloudflare Tunnel: " WEB_SERVER

    echo -e "\${YELLOW}--- Beginning Panel Installation ---\${NC}"

    # 1. Dependencies
    apt-get update && apt-get install -y curl wget git nginx certbot python3-certbot-nginx

    # 2. Database
    if [ "\$INSTALL_DB" == "y" ]; then
        echo -e "\${GREEN}📦 Installing MySQL...\${NC}"
        apt-get install -y mysql-server
        # Setup basic DB
        mysql -e "CREATE DATABASE IF NOT EXISTS nebula;"
        echo -e "\${GREEN}✅ Database 'nebula' created.\${NC}"
    fi

    # 3. Web Server
    if [ "\$WEB_SERVER" == "1" ]; then
        echo -e "\${GREEN}🌐 Configuring Nginx for \$DOMAIN...\${NC}"
        cat <<EOF > /etc/nginx/sites-available/nebula.conf
server {
    listen 80;
    server_name \$DOMAIN;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
    }
}
EOF
        ln -sf /etc/nginx/sites-available/nebula.conf /etc/nginx/sites-enabled/
        systemctl restart nginx
        echo -e "\${YELLOW}Do you want to enable SSL (Certbot)? [y/n]\${NC}"
        read SSL_CONF
        if [ "\$SSL_CONF" == "y" ]; then
            certbot --nginx -d \$DOMAIN --non-interactive --agree-tos -m admin@\$DOMAIN
        fi
    elif [ "\$WEB_SERVER" == "2" ]; then
        echo -e "\${GREEN}☁️ Setting up Cloudflare Tunnel...\${NC}"
        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        dpkg -i cloudflared.deb
        echo -e "\${YELLOW}Please run 'cloudflared tunnel login' manually after installation.\${NC}"
    fi

    echo -e "\${GREEN}==============================================\${NC}"
    echo -e "\${GREEN}      PANEL INSTALLATION COMPLETE!            \${NC}"
    echo -e "\${YELLOW}      URL: https://\$DOMAIN                   \${NC}"
    echo -e "\${GREEN}==============================================\${NC}"

elif [ "\$MODE" == "2" ]; then
    echo -e "\${YELLOW}--- Node Installation Mode ---\${NC}"
    read -p "Enter Node Name: " NODE_NAME
    read -p "Enter Panel API Key: " PANEL_KEY
    
    # Node logic (Docker based)
    if ! command -v docker &> /dev/null; then
        echo -e "\${YELLOW}Installing Docker...\${NC}"
        curl -fsSL https://get.docker.com | sh
    fi
    echo -e "\${GREEN}✅ Node '\$NODE_NAME' configured and ready to link.\${NC}"

elif [ "\$MODE" == "3" ]; then
    echo -e "\${BLUE}--- System Health Check ---\${NC}"
    if command -v lscpu &> /dev/null; then
        lscpu | grep "Model name"
    elif [ -f /proc/cpuinfo ]; then
        grep "model name" /proc/cpuinfo | head -n 1
    fi
    free -h
    df -h /
fi
`;
  };

  // Handle root level curl/wget requests for easy installation
  app.get("/", (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";
    console.log(`Incoming request to / from UA: ${userAgent}`);
    
    // Check if the request is coming from a CLI tool
    const isCli = /curl|wget|bash|fetch|insomnia|postman/i.test(userAgent);
    
    if (isCli) {
      res.setHeader("Content-Type", "text/x-shellscript");
      return res.send(getInstallerScript());
    }
    next();
  });

  // Installer Script Endpoint
  app.get("/installer.sh", (req, res) => {
    res.setHeader("Content-Type", "text/x-shellscript");
    res.send(getInstallerScript());
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.1.2" });
  });


  app.post("/api/nodes/register", (req, res) => {
    const { apiKey, name, specs } = req.body;
    console.log("Node Registration received: " + name + " with key " + apiKey);
    // In a real app, we'd verify the apiKey and update Firestore here.
    // Since we're doing client-side logic mostly, we'll just acknowledge.
    res.json({ success: true, message: "Node registered successfully" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer().catch((err) => {
  console.error("Critical Failure during server startup:");
  console.error(err);
  process.exit(1);
});
