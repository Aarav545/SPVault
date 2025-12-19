# SP Vault - Secure Password Management System

A full-stack web application for secure password management, built as part of IT 340 - Introduction to Systems Administration.

## Project Overview

SP Vault is a web-based security and authentication platform designed to simulate a real-world password vault service. It features a clean user interface, robust encryption, and monitoring capabilities.

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Password Encryption**: AES-256-CBC (Node.js crypto)
- **Monitoring**: Custom bash script (monitor.sh)

## Project Milestones

### Milestone 1: Front-End Completion
- Basic website layout
- Login page with modern UI design
- Responsive design

### Milestone 2: Authentication Completion
- User registration system
- User login with email, password, and PIN
- Secure password and PIN hashing (bcrypt)
- JWT token-based authentication
- Request logging and PPI censoring

### Milestone 3: Password Vault Functionality
- Full CRUD operations for password entries
- AES-256-CBC encryption for stored passwords
- Password generator with customizable options
- Search and filter functionality
- Category organization
- Copy-to-clipboard functionality
- Modern, responsive UI

## Project Structure

```
sp-vault/
├── frontend/              # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Login.css
│   │   │   ├── Dashboard.js
│   │   │   └── Dashboard.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/               # Node.js/Express backend
│   ├── models/
│   │   ├── User.js
│   │   └── VaultEntry.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── vault.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── monitor.js
│   ├── logs/             # Request logs (auto-generated)
│   ├── index.js
│   └── package.json
├── monitor.sh            # Monitoring script
├── package.json          # Root package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies for both frontend and backend:**
   ```bash
   npm run install-all
   ```
   
   Or install separately:
   ```bash
   npm run install-backend
   npm run install-frontend
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/spvault
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Start MongoDB:**
   
   Make sure MongoDB is running on your system. If using a local installation:
   ```bash
   mongod
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   npm run dev-backend
   ```
   The server will run on `http://localhost:5001`

2. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev-frontend
   ```
   The frontend will run on `http://localhost:3000`

3. **Access the application:**
   
   Open your browser and navigate to `http://localhost:3000`

### Monitoring

To monitor requests and responses in real-time:

```bash
chmod +x monitor.sh
./monitor.sh
```

The monitoring script will:
- Display request logs with timestamps
- Automatically censor PPI (Personally Identifiable Information)
- Show color-coded status codes
- Monitor in real-time

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "pin": "1234"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "pin": "1234"
  }
  ```

- `GET /api/auth/verify` - Verify JWT token
  - Requires: `Authorization: Bearer <token>` header

- `GET /api/health` - Health check endpoint

### Password Vault

- `GET /api/vault/entries` - Get all password entries for authenticated user
  - Requires: `Authorization: Bearer <token>` header

- `GET /api/vault/entries/:id` - Get single password entry
  - Requires: `Authorization: Bearer <token>` header

- `POST /api/vault/entries` - Create new password entry
  - Requires: `Authorization: Bearer <token>` header
  ```json
  {
    "title": "Gmail",
    "username": "user@example.com",
    "password": "securepassword123",
    "url": "https://gmail.com",
    "notes": "Personal account",
    "category": "Email"
  }
  ```

- `PUT /api/vault/entries/:id` - Update password entry
  - Requires: `Authorization: Bearer <token>` header

- `DELETE /api/vault/entries/:id` - Delete password entry
  - Requires: `Authorization: Bearer <token>` header

- `POST /api/vault/generate` - Generate random secure password
  - Requires: `Authorization: Bearer <token>` header
  ```json
  {
    "length": 16,
    "includeUppercase": true,
    "includeLowercase": true,
    "includeNumbers": true,
    "includeSymbols": true
  }
  ```

## Security Features

- Password hashing using bcrypt (10 salt rounds)
- PIN hashing using bcrypt
- JWT token-based authentication
- AES-256-CBC encryption for stored passwords
- Request logging with automatic PPI censoring
- Input validation using express-validator
- CORS configuration
- Secure password requirements (minimum 6 characters)
- Encrypted password storage at rest
- User-specific password isolation

## Development Notes

- The frontend uses a proxy to communicate with the backend (configured in `frontend/package.json`)
- All sensitive data (passwords, PINs, tokens, emails) is automatically censored in logs
- JWT tokens expire after 24 hours
- User sessions are stored in localStorage on the frontend

## Features

### Password Management
- Create, read, update, and delete password entries
- Encrypted password storage (AES-256-CBC)
- Search passwords by title, username, or URL
- Filter by category
- Copy passwords to clipboard
- Automatic favicon display for websites
- Password strength indicator

### Password Generator
- Customizable length (default: 16 characters)
- Include/exclude uppercase letters
- Include/exclude lowercase letters
- Include/exclude numbers
- Include/exclude symbols
- Cryptographically secure random generation

### User Experience
- Modern, responsive UI
- Real-time search and filtering
- Category organization
- Empty state handling
- Loading states
- Error handling

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check your MongoDB service
- Verify the connection string in `.env` file
- Check MongoDB logs for errors

### Port Already in Use
- Change the PORT in `.env` file
- Or kill the process using the port:
  ```bash
  lsof -ti:5001 | xargs kill
  ```

### Frontend Not Connecting to Backend
- Ensure the backend is running on port 5001
- Check the proxy configuration in `frontend/package.json`
- Verify CORS settings in `server/index.js`
- For VM deployment, set `REACT_APP_API_URL` environment variable to the backend VM IP

## License

This project is created for educational purposes as part of IT 340 coursework.




xcwb eecj yadi yemp

