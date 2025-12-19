#!/bin/bash

# SP Vault Remote Monitoring Script: monitors Backend VM logs from Monitor VM via SSH
BACKEND_VM_IP="172.16.190.142"
BACKEND_USER="ubuntu"
BACKEND_LOG_PATH="~/sp-vault/server/logs/requests.log"
TAIL_COUNT=50

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}SP Vault Remote Monitoring Script${NC}"
echo -e "${BLUE}Monitoring logs from Backend VM: ${BACKEND_VM_IP}${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Test SSH connection to Backend VM
echo -e "${BLUE}Testing connection to Backend VM...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${BACKEND_USER}@${BACKEND_VM_IP} "echo 'Connected'" 2>/dev/null; then
    echo -e "${RED}ERROR: Cannot connect to Backend VM at ${BACKEND_VM_IP}${NC}"
    echo -e "${YELLOW}Setting up SSH key authentication...${NC}"
    echo ""
    echo "Run these commands to set up passwordless SSH:"
    echo "  ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ''"
    echo "  ssh-copy-id ${BACKEND_USER}@${BACKEND_VM_IP}"
    echo ""
    echo "Or enter password when prompted:"
    ssh ${BACKEND_USER}@${BACKEND_VM_IP} "echo 'Connection test'" || exit 1
fi

echo -e "${GREEN}Connection successful!${NC}"
echo ""

# Check if log file exists on Backend VM
if ! ssh ${BACKEND_USER}@${BACKEND_VM_IP} "test -f ${BACKEND_LOG_PATH}" 2>/dev/null; then
    echo -e "${YELLOW}Log file not found on Backend VM. Waiting for logs to be created...${NC}"
    echo ""
fi

# Function to format log entry
format_log() {
    local line=$1
    
    # Check if jq is available, otherwise use basic parsing
    if command -v jq &> /dev/null; then
        local timestamp=$(echo "$line" | jq -r '.timestamp // "N/A"' 2>/dev/null)
        local type=$(echo "$line" | jq -r '.type // "N/A"' 2>/dev/null)
        local method=$(echo "$line" | jq -r '.method // "N/A"' 2>/dev/null)
        local url=$(echo "$line" | jq -r '.url // "N/A"' 2>/dev/null)
        local status=$(echo "$line" | jq -r '.statusCode // "N/A"' 2>/dev/null)
    else
        # Basic parsing without jq
        local timestamp=$(echo "$line" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        local type=$(echo "$line" | grep -o '"type":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        local method=$(echo "$line" | grep -o '"method":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        local url=$(echo "$line" | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        local status=$(echo "$line" | grep -o '"statusCode":[0-9]*' | cut -d':' -f2 || echo "N/A")
    fi
    
    if [ "$type" = "REQUEST" ]; then
        echo -e "${GREEN}[$timestamp]${NC} ${BLUE}$method${NC} $url"
    elif [ "$type" = "RESPONSE" ]; then
        if [ "$status" != "N/A" ] && [ -n "$status" ]; then
            if [ "$status" -ge 200 ] && [ "$status" -lt 300 ] 2>/dev/null; then
                echo -e "${GREEN}[$timestamp]${NC} ${GREEN}Response $status${NC} $method $url"
            elif [ "$status" -ge 400 ] && [ "$status" -lt 500 ] 2>/dev/null; then
                echo -e "${GREEN}[$timestamp]${NC} ${YELLOW}Response $status${NC} $method $url"
            elif [ "$status" -ge 500 ] 2>/dev/null; then
                echo -e "${GREEN}[$timestamp]${NC} ${RED}Response $status${NC} $method $url"
            else
                echo -e "${GREEN}[$timestamp]${NC} ${BLUE}Response $status${NC} $method $url"
            fi
        else
            echo -e "${GREEN}[$timestamp]${NC} ${BLUE}Response${NC} $method $url"
        fi
    else
        # Fallback: just show the line
        echo -e "${BLUE}$line${NC}"
    fi
}

# Show last N entries from Backend VM
echo -e "${YELLOW}Fetching last $TAIL_COUNT log entries from Backend VM...${NC}"
echo ""
ssh ${BACKEND_USER}@${BACKEND_VM_IP} "tail -n $TAIL_COUNT ${BACKEND_LOG_PATH} 2>/dev/null" | while read -r line; do
    if [ ! -z "$line" ]; then
        format_log "$line"
    fi
done

echo ""
echo -e "${BLUE}--- Monitoring new entries in real-time (from Backend VM: ${BACKEND_VM_IP}) ---${NC}"
echo ""

# Monitor new entries in real-time via SSH
ssh ${BACKEND_USER}@${BACKEND_VM_IP} "tail -f ${BACKEND_LOG_PATH} 2>/dev/null" | while read -r line; do
    if [ ! -z "$line" ]; then
        format_log "$line"
    fi
done


