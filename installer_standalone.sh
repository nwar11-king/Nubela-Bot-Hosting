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
    echo "3) Configure Nginx & Auto-SSL"
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
    echo -e "${YELLOW}Deploying Nebula Panel...${NC}"
    install_dependencies
    install_docker
    # Example: Clone your repo here once on GitHub
    # git clone https://github.com/your-username/nebula-panel.git /var/www/nebula
    echo -e "${GREEN}Panel infrastructure ready.${NC}"
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

while true; do
    show_menu
    read -p "Select choice [1-6]: " choice
    case $choice in
        1) setup_panel ;;
        2) setup_node ;;
        3) 
            sudo apt-get install -y nginx
            echo "Nginx installed. Basic config running on port 80."
            ;;
        4)
            echo "Installing Cloudflared..."
            curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
            sudo dpkg -i cloudflared.deb
            ;;
        5)
            echo "Cleaning up..."
            sudo apt-get autoremove -y
            ;;
        6)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option!${NC}"
            ;;
    esac
done
