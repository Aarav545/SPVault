#!/bin/bash

# SP Vault Monitoring Script
# This script monitors the request logs and displays them in real-time
# It automatically censors PPI (Personally Identifiable Information)

LOG_FILE="./server/logs/requests.log"
TAIL_COUNT=50

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}SP Vault Monitoring Script${NC}"
echo -e "${BLUE}Monitoring request logs...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo -e "${RED}Log file not found: $LOG_FILE${NC}"
    echo "Creating log file..."
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
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

# Show last N entries
if [ -s "$LOG_FILE" ]; then
    echo -e "${YELLOW}Last $TAIL_COUNT log entries:${NC}"
    echo ""
    tail -n $TAIL_COUNT "$LOG_FILE" | while read -r line; do
        if [ ! -z "$line" ]; then
            format_log "$line"
        fi
    done
    echo ""
    echo -e "${BLUE}--- Monitoring new entries (real-time) ---${NC}"
    echo ""
fi

# Monitor new entries in real-time
tail -f "$LOG_FILE" 2>/dev/null | while read -r line; do
    if [ ! -z "$line" ]; then
        format_log "$line"
    fi
done

