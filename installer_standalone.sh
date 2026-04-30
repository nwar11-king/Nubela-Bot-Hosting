#!/bin/bash
# Nebula Hosting / BotHosting.site Installer
# Version: 1.0.0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${GREEN}"
echo " ███▄    █ ▓█████  ▄▄▄▄   █    ██  ██▓    ▄▄▄      "
echo " ██ ▀█   █ ▓█   ▀ ▓█████▄ ██  ▓██▒▓██▒   ▒████▄    "
echo "▓██  ▀█ ██▒▒███   ▒██▒ ▄██▓██  ▒██░▒██░   ▒██  ▀█▄  "
echo "▓██▒  ▐▌██▒▒▓█  ▄ ▒██░█▀  ▓██  ░██░▒██░   ░██▄▄▄▄██ "
echo "▒██░   ▓██░░▒████▒░▓█  ▀█▓░▒█████▓ ░██████▒▓█   ▓██▒"
echo -e "${NC}"

function show_menu() {
    echo -e "${BLUE}==============================================${NC}"
    echo -e "${YELLOW}       NEBULA SYSTEM INSTALLER MENU (v1.1)   ${NC}"
    echo -e "${BLUE}==============================================${NC}"
    echo "1) Install Nebula Panel (Full Stack)"
    echo "2) Install Compute Node (Daemon)"
    echo "3) Configure Nginx Reverse Proxy"
    echo "4) Setup Cloudflare Tunnel"
    echo "5) Install MySQL Database Server"
    echo "6) System Health Check"
    echo "7) Exit"
    echo -e "${BLUE}==============================================${NC}"
}

function install_dependencies() {
    echo -e "${YELLOW}Checking and installing core dependencies...${NC}"
    sudo apt-get update
    sudo apt-get install -y curl wget git software-properties-common ca-certificates gnupg lsb-release
}

function install_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}Installing Docker Engine...${NC}"
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker $USER
        echo -e "${GREEN}Docker installed successfully.${NC}"
    else
        echo -e "${GREEN}Docker is already installed.${NC}"
    fi
}

function setup_panel() {
    echo -e "${YELLOW}--- Beginning Panel Installation ---${NC}"
    read -p "Enter your Domain (e.g. panel.bothosting.site): " DOMAIN
    read -p "Install MySQL Database? [y/n]: " INSTALL_DB
    read -p "Web Server: [1] Nginx [2] Cloudflare Tunnel: " WEB_SERVER
    
    install_dependencies
    
    if [ "$INSTALL_DB" == "y" ]; then
        echo -e "${GREEN}📦 Installing MySQL...${NC}"
        sudo apt-get install -y mysql-server
        sudo mysql -e "CREATE DATABASE IF NOT EXISTS nebula;"
        echo -e "${GREEN}✅ Database 'nebula' created.${NC}"
    fi

    if [ "$WEB_SERVER" == "1" ]; then
        echo -e "${GREEN}🌐 Configuring Nginx for $DOMAIN...${NC}"
        sudo apt-get install -y nginx certbot python3-certbot-nginx
        cat <<EOF | sudo tee /etc/nginx/sites-available/nebula.conf
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
        sudo ln -sf /etc/nginx/sites-available/nebula.conf /etc/nginx/sites-enabled/
        sudo systemctl restart nginx
        echo -e "${YELLOW}Would you like to run Certbot for SSL? [y/n]${NC}"
        read SSL_RUN
        if [ "$SSL_RUN" == "y" ]; then
            sudo certbot --nginx -d $DOMAIN
        fi
    elif [ "$WEB_SERVER" == "2" ]; then
        setup_cloudflare
    fi

    echo -e "${GREEN}==============================================${NC}"
    echo -e "${GREEN}      PANEL INSTALLATION INFRA READY!         ${NC}"
    echo -e "${YELLOW}      URL: https://$DOMAIN                   ${NC}"
    echo -e "${GREEN}==============================================${NC}"
}

function setup_node() {
    echo -e "${YELLOW}Deploying Hosting Node...${NC}"
    install_docker
    echo -e "${YELLOW}Enter your Panel API Key:${NC}"
    read API_KEY
    # Save key and start node daemon
    sudo mkdir -p /etc/nebula
    echo "{\"key\": \"$API_KEY\"}" | sudo tee /etc/nebula/config.json
    echo -e "${GREEN}Node configuration written to /etc/nebula/config.json${NC}"
}

function setup_cloudflare() {
    echo -e "${GREEN}☁️ Setting up Cloudflare Tunnel...${NC}"
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    echo -e "${YELLOW}Please run 'cloudflared tunnel login' manually to authenticate.${NC}"
}

while true; do
    show_menu
    read -p "Select choice [1-7]: " choice
    case $choice in
        1) setup_panel ;;
        2) setup_node ;;
        3) 
            read -p "Domain for Nginx: " DOMAIN
            # Reuse logic or call a function
            ;;
        4) setup_cloudflare ;;
        5) 
            echo -e "${GREEN}Installing MySQL Server...${NC}"
            sudo apt-get install -y mysql-server
            ;;
        6)
            echo -e "${YELLOW}Running Health Check...${NC}"
            df -h
            free -m
            ;;
        7)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option!${NC}"
            ;;
    esac
done
