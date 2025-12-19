#!/bin/bash

echo "SP Vault - Environment Setup"
echo "============================"
echo ""

# Check if .env already exists
if [ -f "server/.env" ]; then
    echo "WARNING: .env file already exists!"
    read -p "Do you want to overwrite it? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

echo "Choose your MongoDB setup:"
echo "1) Local MongoDB (Default - Required for VM deployment)"
echo "2) MongoDB Atlas (Cloud - For local development only)"
echo ""
read -p "Enter choice (1 or 2, default is 1): " choice
choice=${choice:-1}

if [ "$choice" = "1" ]; then
    echo ""
    echo "Local MongoDB Setup:"
    echo "For local development (Mac):"
    echo "  brew tap mongodb/brew"
    echo "  brew install mongodb-community"
    echo "  brew services start mongodb-community"
    echo ""
    echo "For VM deployment, use Database VM IP:"
    echo "  mongodb://172.16.190.141:27017/spvault"
    echo ""
    read -p "Enter MongoDB connection (default: mongodb://localhost:27017/spvault): " mongo_input
    if [ -z "$mongo_input" ]; then
        mongo_uri="mongodb://localhost:27017/spvault"
    else
        mongo_uri="$mongo_input"
    fi
    echo "Using: $mongo_uri"
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "MongoDB Atlas Setup (Local development only):"
    echo "1. Go to: https://www.mongodb.com/cloud/atlas/register"
    echo "2. Create a free account and cluster"
    echo "3. Create a database user"
    echo "4. Whitelist your IP (or use 0.0.0.0/0 for testing)"
    echo "5. Get your connection string"
    echo ""
    read -p "Paste your MongoDB Atlas connection string: " mongo_uri
    
    # Add database name if not present
    if [[ ! "$mongo_uri" == *"/spvault"* ]]; then
        mongo_uri="${mongo_uri%/}"
        mongo_uri="${mongo_uri}?retryWrites=true&w=majority"
        if [[ "$mongo_uri" == *"?"* ]]; then
            mongo_uri="${mongo_uri}/spvault"
        else
            mongo_uri="${mongo_uri}/spvault?retryWrites=true&w=majority"
        fi
    fi
else
    echo "Invalid choice. Using default local MongoDB."
    mongo_uri="mongodb://localhost:27017/spvault"
fi

# Generate JWT secret
jwt_secret=$(openssl rand -base64 32 2>/dev/null || echo "sp-vault-super-secret-jwt-key-change-in-production-$(date +%s)")

# Create .env file
cat > server/.env << EOF
PORT=5001
NODE_ENV=development
MONGODB_URI=$mongo_uri
JWT_SECRET=$jwt_secret
EOF

echo ""
echo "SUCCESS: .env file created in server/.env"
echo ""
echo "You can now start the application:"
echo "  npm run dev-backend    # Terminal 1"
echo "  npm run dev-frontend   # Terminal 2"

