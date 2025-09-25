# WhatsApp Business Bot API

A robust, production-ready WhatsApp Business Bot API built with Node.js, Express, and TypeScript. This API provides comprehensive WhatsApp client management with MongoDB session persistence, real-time WebSocket communication, and multi-client support.

## 🚀 Features

- **Multi-Client Support** - Manage multiple WhatsApp client instances simultaneously
- **MongoDB Session Persistence** - Automatic session storage and restoration
- **Real-time WebSocket Communication** - Live QR code and status updates
- **Robust Error Handling** - Comprehensive error management with custom error classes
- **TypeScript Support** - Full type safety and IntelliSense
- **File Upload Support** - Send text messages, files, or both
- **Phone Number Validation** - Built-in WhatsApp phone number verification
- **Automatic Cleanup** - Proper resource management and cleanup
- **Production Ready** - Optimized for Docker and production environments

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- Yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-business-bot
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/whatsapp-bot
   ```

4. **Build the project**
   ```bash
   yarn build
   ```

5. **Start the server**
   ```bash
   yarn start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/whatsapp
```

### Authentication
No authentication required for this API.

### Health Check
```
GET /api/health
```

### Root Endpoint
```
GET /
```
Returns API information and available endpoints.

---

## 🔗 API Endpoints

### 1. Initialize WhatsApp Client

**POST** `/login`

Initialize a new WhatsApp client and wait for it to be ready.

**Request Body:**
```json
{
  "clientId": "user-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp client 'user-1' is ready and connected.",
  "data": {
    "clientId": "user-1",
    "status": "CONNECTED",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Client initialized successfully
- `400` - Invalid client ID
- `500` - Initialization failed

---

### 2. Get QR Code

**GET** `/qr/:clientId`

Get the current QR code for a specific client.

**Parameters:**
- `clientId` (string) - The client identifier

**Response:**
```json
{
  "success": true,
  "message": "QR code retrieved successfully",
  "data": {
    "clientId": "user-1",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` - QR code retrieved successfully
- `404` - Client not found
- `422` - Client already connected

---

### 3. Check Phone Registration

**POST** `/check-registration`

Check if a phone number is registered on WhatsApp.

**Request Body:**
```json
{
  "clientId": "user-1",
  "phone": "+923001234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number registration status checked",
  "data": {
    "clientId": "user-1",
    "phone": "+923001234567",
    "isRegistered": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Registration status checked
- `400` - Invalid phone number format
- `404` - Client not found
- `422` - Client not ready

---

### 4. Send Message

**POST** `/send`

Send a text message, file, or both to a phone number.

**Request Body (Text Message):**
```json
{
  "clientId": "user-1",
  "phone": "+923001234567",
  "message": "Hello from WhatsApp Bot!"
}
```

**Request Body (File Upload - FormData):**
```
clientId: user-1
phone: +923001234567
message: Here's your document!
file: [File object]
```

**Response:**
```json
{
  "success": true,
  "message": "Text message sent successfully to +923001234567",
  "data": {
    "clientId": "user-1",
    "phone": "+923001234567",
    "message": "Hello from WhatsApp Bot!",
    "file": null,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**File Response:**
```json
{
  "success": true,
  "message": "File sent successfully to +923001234567",
  "data": {
    "clientId": "user-1",
    "phone": "+923001234567",
    "message": "Here's your document!",
    "file": {
      "filename": "document.pdf",
      "type": "application/pdf",
      "size": 1024000
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Message sent successfully
- `400` - Invalid request data
- `404` - Client not found
- `422` - Client not ready

---

### 5. Get Client Status

**GET** `/status?clientId=:clientId`

Get the current status of a specific client.

**Query Parameters:**
- `clientId` (string) - The client identifier

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp client 'user-1' status retrieved successfully",
  "data": {
    "clientId": "user-1",
    "status": "CONNECTED",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possible Status Values:**
- `NOT_INITIALIZED` - Client not created
- `PAIRING` - Client created, waiting for QR
- `AWAITING_SCAN` - QR code generated, waiting for scan
- `LOADING` - WhatsApp is initializing
- `CONNECTED` - Successfully connected
- `DISCONNECTED` - Connection lost
- `AUTH_FAILED` - Authentication failed
- `ERROR` - General error
- `TIMEOUT` - Operation timed out

---

### 6. Logout Client

**POST** `/logout/:clientId`

Logout and reset a specific client.

**Parameters:**
- `clientId` (string) - The client identifier

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp client 'user-1' logged out successfully",
  "data": {
    "clientId": "user-1",
    "status": "DISCONNECTED",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Client logged out successfully
- `400` - Client ID required
- `404` - Client not found
- `500` - Logout failed

---

## 🔌 WebSocket Integration

### Connection
Connect to the WebSocket server for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws')

ws.onopen = () => {
  console.log('Connected to WebSocket')
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Received:', data)
}
```

### Message Types

#### 1. QR Code Updates
```json
{
  "type": "qr-code",
  "clientId": "user-1",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. Status Updates
```json
{
  "type": "status-update",
  "clientId": "user-1",
  "status": "AWAITING_SCAN",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### React Integration Example

```jsx
import React, { useState, useEffect } from 'react'

function WhatsAppClient({ clientId }) {
  const [qrCode, setQrCode] = useState(null)
  const [status, setStatus] = useState('NOT_INITIALIZED')
  const [ws, setWs] = useState(null)

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000/ws')
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.clientId === clientId) {
        if (data.type === 'qr-code') {
          setQrCode(data.qrCode)
        } else if (data.type === 'status-update') {
          setStatus(data.status)
          if (data.status === 'CONNECTED') {
            setQrCode(null) // Hide QR code when connected
          }
        }
      }
    }
    
    setWs(websocket)
    
    return () => websocket.close()
  }, [clientId])

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/whatsapp/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      })
      const result = await response.json()
      console.log('Login result:', result)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div>
      <h2>WhatsApp Client: {clientId}</h2>
      <p>Status: {status}</p>
      
      {qrCode && (
        <div>
          <p>Scan this QR code with your WhatsApp mobile app:</p>
          <img src={qrCode} alt="QR Code" />
        </div>
      )}
      
      {status === 'NOT_INITIALIZED' && (
        <button onClick={handleLogin}>Initialize Client</button>
      )}
    </div>
  )
}

export default WhatsAppClient
```

---

## 📱 Phone Number Format

All phone numbers must be in international format:
- **Format**: `+92XXXXXXXXXX` (for Pakistan)
- **Example**: `+923001234567`
- **Validation**: Automatically validated by the API

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment | `development` | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |

### Chrome Arguments (Optimized for Performance)

The API uses optimized Chrome arguments for better performance:
- `--no-sandbox`
- `--disable-setuid-sandbox`
- `--disable-dev-shm-usage`
- `--disable-accelerated-2d-canvas`
- `--no-first-run`
- `--no-zygote`
- `--disable-gpu`
- `--disable-background-timer-throttling`
- `--disable-backgrounding-occluded-windows`
- `--disable-renderer-backgrounding`
- `--disable-features=TranslateUI`
- `--disable-ipc-flooding-protection`

---

## 🚀 Scripts

```bash
# Development
yarn dev          # Start development server with hot reload
yarn build        # Build TypeScript to JavaScript
yarn start        # Start production server

# Code Quality
yarn lint         # Run ESLint
yarn type-check   # Run TypeScript type checking
```

---

## 🏗️ Architecture

### Service Structure
```
src/
├── api/
│   ├── middleware/     # Validation and error handling
│   └── routes/         # API route definitions
├── services/
│   ├── whatsapp.service.ts    # Core WhatsApp management
│   ├── websocket.service.ts   # WebSocket communication
│   └── global.ts              # Global service instances
└── server.ts          # Main server setup
```

### Key Components

1. **WhatsAppService** - Core client management
2. **WebSocketService** - Real-time communication
3. **Validation Middleware** - Request validation
4. **Error Handler** - Centralized error management

---

## 🔒 Error Handling

The API uses custom error classes for better error management:

- `WhatsAppClientError` - General client errors
- `WhatsAppTimeoutError` - Operation timeout errors
- `WhatsAppNotReadyError` - Client not ready errors

All errors include:
- Descriptive error messages
- Client ID context
- Error codes for programmatic handling
- HTTP status codes

---

## 📊 Performance

### Optimizations
- **Parallel Operations** - Multiple clients can run simultaneously
- **Memory Management** - Automatic cleanup of resources
- **Timeout Handling** - Prevents hanging operations
- **Chrome Optimization** - Optimized browser arguments
- **MongoDB Indexing** - Efficient session storage

### Resource Usage
- **Memory**: ~50MB base + ~20MB per client
- **CPU**: Low usage with optimized Chrome args
- **Storage**: Session data stored in MongoDB

---

## 🐛 Troubleshooting

### Common Issues

1. **Client not connecting**
   - Check MongoDB connection
   - Verify phone number format
   - Check Chrome installation

2. **QR code not appearing**
   - Ensure WebSocket connection is active
   - Check client initialization
   - Verify browser permissions

3. **Memory leaks**
   - Use proper client cleanup
   - Monitor active client count
   - Restart server if needed

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ using Node.js, TypeScript, and WhatsApp Web.js**