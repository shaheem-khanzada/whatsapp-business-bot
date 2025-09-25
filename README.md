# WhatsApp Business Bot API

A robust, production-ready WhatsApp Business Bot API built with Node.js, Express, and TypeScript. This API provides comprehensive WhatsApp client management with MongoDB session persistence, real-time WebSocket communication, and multi-client support.

## 🚀 Features

- **Multi-Client Support** - Manage multiple WhatsApp client instances simultaneously
- **MongoDB Session Persistence** - Automatic session storage and restoration using wwebjs-mongo
- **Real-time WebSocket Communication** - Live QR code and status updates
- **Robust Error Handling** - Comprehensive error management with custom error classes
- **TypeScript Support** - Full type safety and IntelliSense
- **File Upload Support** - Send text messages, files, or both using FormData
- **Phone Number Validation** - Built-in WhatsApp phone number verification (+92 format)
- **Automatic Cleanup** - Proper resource management and cleanup
- **Session Restoration** - Automatic client restoration on server restart
- **Rate Limiting** - Built-in rate limiting for API protection
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

**Request Body (Text Message - JSON):**
```json
{
  "clientId": "user-1",
  "phone": "+923001234567",
  "text": "Hello from WhatsApp Bot!"
}
```

**Request Body (File Upload - FormData):**
```
Content-Type: multipart/form-data

clientId: user-1
phone: +923001234567
text: Here's your document! (optional - used as caption)
file: [File object]
```

**Note:** The send endpoint uses FormData for file uploads. Use `text` field instead of `message` for the text content.

**Response (Text Message):**
```json
{
  "success": true,
  "message": "Text message sent successfully to +923001234567",
  "data": {
    "message": {
      "id": {
        "fromMe": true,
        "remote": "923001234567@c.us",
        "id": "3EB0C767D26B5C8C4C4C",
        "_serialized": "true_923001234567@c.us_3EB0C767D26B5C8C4C4C"
      },
      "body": "Hello from WhatsApp Bot!",
      "type": "chat",
      "timestamp": 1642248600,
      "from": "923001234567@c.us",
      "to": "923001234567@c.us",
      "hasMedia": false
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (File Upload):**
```json
{
  "success": true,
  "message": "File sent successfully to +923001234567",
  "data": {
    "message": {
      "id": {
        "fromMe": true,
        "remote": "923001234567@c.us",
        "id": "3EB0C767D26B5C8C4C4C",
        "_serialized": "true_923001234567@c.us_3EB0C767D26B5C8C4C4C"
      },
      "body": "Here's your document!",
      "type": "image",
      "timestamp": 1642248600,
      "from": "923001234567@c.us",
      "to": "923001234567@c.us",
      "hasMedia": true,
      "media": {
        "mimetype": "application/pdf",
        "filename": "document.pdf"
      }
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

## 💾 MongoDB Session Management

The API automatically manages WhatsApp sessions using MongoDB for persistence:

### Session Storage
- **Automatic Storage** - Sessions are automatically saved to MongoDB
- **GridFS Integration** - Uses GridFS for efficient session data storage
- **Session Restoration** - Clients are automatically restored on server restart
- **Multi-Client Support** - Each client has its own isolated session

### Session Lifecycle
1. **Login** - Client creates session and stores in MongoDB
2. **Active** - Session remains active while client is connected
3. **Restoration** - Session is restored when server restarts
4. **Cleanup** - Sessions are cleaned up when clients logout

### Session Configuration
```javascript
// Session is automatically configured with:
{
  clientId: 'unique-client-id',
  store: MongoStore,
  dataPath: '.wwebjs_auth',
  backupSyncIntervalMs: 300000 // 5 minutes
}
```

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

  const handleSendMessage = async (phone, text) => {
    try {
      const formData = new FormData()
      formData.append('clientId', clientId)
      formData.append('phone', phone)
      formData.append('text', text)
      
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      console.log('Message sent:', result)
    } catch (error) {
      console.error('Send failed:', error)
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
- **Format**: `+92[0-9]{10}` (for Pakistan - exactly 10 digits after +92)
- **Example**: `+923001234567`
- **Validation**: Automatically validated by the API using regex pattern

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment | `development` | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `ADMIN_PHONE` | Admin phone number for notifications | - | No |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | - | No |
| `URL` | Base URL for the application | - | No |
| `PUPPETEER_EXECUTABLE_PATH` | Custom Chrome/Chromium path | Auto-detected | No |

### Chrome Arguments (Optimized for Performance)

The API uses optimized Chrome arguments for better performance:
- `--no-sandbox`
- `--disable-setuid-sandbox`

**Note:** The Chrome arguments have been simplified for better compatibility and performance. Additional arguments can be added in the `CONSTANTS.CHROME_ARGS` array in the WhatsApp service.

---

## 🚀 Scripts

```bash
# Development
yarn dev          # Start development server with hot reload
yarn build        # Build TypeScript to JavaScript
yarn start        # Start production server
yarn watch        # Start with ts-node watch mode
yarn api          # Start API server with ts-node

# Code Quality
yarn build        # Compile TypeScript to JavaScript
```

---

## 🏗️ Architecture

### Service Structure
```
src/
├── api/
│   ├── middleware/           # Validation and error handling
│   │   ├── errorHandler.ts   # Custom error classes and handlers
│   │   └── validation.ts     # Request validation middleware
│   └── routes/               # API route definitions
│       ├── index.ts          # Main router with health check
│       └── whatsapp.routes.ts # WhatsApp-specific routes
├── services/
│   ├── whatsapp.service.ts   # Core WhatsApp management
│   ├── websocket.service.ts  # WebSocket communication
│   ├── global.ts             # Global service instances
│   └── index.ts              # Service exports
├── types/
│   └── business.ts           # Business entity types
├── templates/                # Message templates (empty)
└── server.ts                 # Main server setup
```

### Key Components

1. **WhatsAppService** - Core client management with MongoDB session persistence
2. **WebSocketService** - Real-time communication for QR codes and status updates
3. **Validation Middleware** - Request validation for phone numbers and file uploads
4. **Error Handler** - Centralized error management with custom error classes
5. **MongoDB Integration** - Session storage and restoration using wwebjs-mongo
6. **Multi-Client Support** - Manage multiple WhatsApp instances simultaneously

---

## 🔒 Error Handling

The API uses custom error classes for better error management:

- `AppError` - Custom application errors with status codes
- `WhatsAppTimeoutError` - Operation timeout errors
- `WhatsAppClientError` - General client errors

All errors include:
- Descriptive error messages
- HTTP status codes (400, 404, 422, 500, etc.)
- Error types for programmatic handling
- Timestamp and request path information
- Development stack traces (in development mode)

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