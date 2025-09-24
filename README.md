# WhatsApp Business Bot API

A comprehensive Node.js TypeScript API for WhatsApp Business automation with multi-client support, file uploads, and session management.

## 🚀 Features

- **Multi-Client Support**: Manage multiple WhatsApp accounts simultaneously
- **File Upload**: Send text messages, files, or both using FormData
- **Session Management**: Persistent sessions with MongoDB support
- **QR Code Authentication**: Secure login with QR code scanning
- **Phone Number Validation**: Built-in Pakistani phone number validation
- **Real-time Status**: Check client connection status and QR codes
- **Error Handling**: Comprehensive error handling and logging

## 📋 Prerequisites

- Node.js 18+ 
- TypeScript 5.0+
- MongoDB (for session persistence)
- WhatsApp account

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-business-bot
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/whatsapp-sessions
   ```

4. **Build and Run**
   ```bash
   # Development
   yarn dev
   
   # Production
   yarn build
   yarn start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All endpoints require a `clientId` to identify which WhatsApp account to use.

---

## 🔐 WhatsApp Authentication

### 1. Initialize WhatsApp Client
**POST** `/api/whatsapp/login`

Initialize a WhatsApp client and get QR code for authentication.

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
  "message": "WhatsApp initialized successfully for client user-1. Scan the QR code to connect.",
  "data": {
    "clientId": "user-1",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "status": "waiting_for_scan"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/login \
  -H "Content-Type: application/json" \
  -d '{"clientId": "user-1"}'
```

---

### 2. Get QR Code (Polling)
**GET** `/api/whatsapp/qr/:clientId`

Get the current QR code for a specific client. Use this for polling.

**URL Parameters:**
- `clientId` (string): Unique client identifier

**Response (QR Available):**
```json
{
  "success": true,
  "message": "QR code retrieved successfully",
  "data": {
    "clientId": "user-1",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "status": "qr_available"
  }
}
```

**Response (Already Connected):**
```json
{
  "success": true,
  "message": "Client is already connected",
  "data": {
    "clientId": "user-1",
    "qrCode": null,
    "status": "connected"
  }
}
```

**Response (No QR Available):**
```json
{
  "success": false,
  "message": "QR code not available yet",
  "data": {
    "clientId": "user-1",
    "qrCode": null,
    "status": "waiting_for_qr"
  }
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/api/whatsapp/qr/user-1
```

---

### 3. Check Client Status
**GET** `/api/whatsapp/status?clientId=:clientId`

Get the current status of a WhatsApp client.

**Query Parameters:**
- `clientId` (string): Unique client identifier

**Response:**
```json
{
  "success": true,
  "message": "Status retrieved successfully",
  "data": {
    "clientId": "user-1",
    "status": "CONNECTED"
  }
}
```

**Possible Status Values:**
- `CONNECTED`: Client is connected and ready to send messages
- `CONNECTING`: Client is opening browser and connecting to WhatsApp
- `AUTHENTICATING`: Waiting for QR code scan or authentication
- `INITIALIZING`: Client created but not launched yet
- `DISCONNECTED`: Client is not paired, logged out, or idle
- `NOT_INITIALIZED`: Client doesn't exist in the system
- `TIMEOUT`: Connection timed out
- `CONFLICT`: Multiple sessions detected (only one allowed)
- `BLOCKED`: Account is blocked (proxy, SMB, or terms of service)
- `DEPRECATED`: WhatsApp Web version is outdated
- `ERROR`: An error occurred while getting status
- `UNKNOWN`: Unknown or unrecognized status

**Example cURL:**
```bash
curl -X GET "http://localhost:3000/api/whatsapp/status?clientId=user-1"
```

---

### 4. Logout Client
**POST** `/api/whatsapp/logout/:clientId`

Logout and reset a specific WhatsApp client.

**URL Parameters:**
- `clientId` (string): Unique client identifier

**Response:**
```json
{
  "success": true,
  "message": "Client user-1 reset successfully",
  "data": {
    "status": "LOGGED OUT"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/logout/user-1
```

---

## 📱 Messaging

### 5. Send Message or File
**POST** `/api/whatsapp/send`

Send text message, file, or both to a phone number using FormData.

**Content-Type:** `multipart/form-data`

**Form Data Fields:**
- `clientId` (string): Unique client identifier
- `phone` (string): Phone number in format `+92XXXXXXXXXX`
- `text` (string, optional): Text message to send
- `file` (File, optional): File to send

**Note:** Either `text` or `file` must be provided. If both are provided, only the file will be sent with the text as caption.

#### Send Text Message Only

**Form Data:**
```
clientId: user-1
phone: +923001234567
text: Hello! This is a test message.
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "clientId": "user-1",
    "phone": "+923001234567",
    "message": "Hello! This is a test message.",
    "file": null
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -F "clientId=user-1" \
  -F "phone=+923001234567" \
  -F "text=Hello! This is a test message."
```

#### Send File Only

**Form Data:**
```
clientId: user-1
phone: +923001234567
file: [PDF file]
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "clientId": "user-1",
    "phone": "+923001234567",
    "message": null,
    "file": {
      "filename": "document.pdf",
      "type": "application/pdf",
      "size": 245760
    }
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -F "clientId=user-1" \
  -F "phone=+923001234567" \
  -F "file=@/path/to/document.pdf"
```

#### Send File with Caption

**Form Data:**
```
clientId: user-1
phone: +923001234567
text: Here's your invoice!
file: [PDF file]
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "clientId": "user-1",
    "phone": "+923001234567",
    "message": "Here's your invoice!",
    "file": {
      "filename": "invoice.pdf",
      "type": "application/pdf",
      "size": 245760
    }
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -F "clientId=user-1" \
  -F "phone=+923001234567" \
  -F "text=Here's your invoice!" \
  -F "file=@/path/to/invoice.pdf"
```

---

## 📞 Phone Number Validation

### 6. Check Registration
**POST** `/api/whatsapp/check-registration`

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
  "message": "Registration status checked",
  "data": {
    "clientId": "user-1",
    "phone": "+923001234567",
    "isRegistered": true
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/check-registration \
  -H "Content-Type: application/json" \
  -d '{"clientId": "user-1", "phone": "+923001234567"}'
```

---

## 🏥 Health Check

### 7. API Health Check
**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp Business Bot API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/api/health
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |

### Phone Number Format

All phone numbers must be in Pakistani format:
- **Format:** `+92XXXXXXXXXX`
- **Example:** `+923001234567`
- **Length:** 13 characters total

### File Upload Limits

- **Maximum file size:** 50MB
- **Supported formats:** All file types
- **Storage:** In-memory processing

---

## 🚨 Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "clientId is required",
  "error": "Bad Request"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Client user-1 not found",
  "error": "Not Found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to send message: Connection timeout",
  "error": "Internal Server Error"
}
```

---

## 📝 Usage Examples

### JavaScript/Node.js

```javascript
// Send text message
const formData = new FormData()
formData.append('clientId', 'user-1')
formData.append('phone', '+923001234567')
formData.append('text', 'Hello from WhatsApp Bot!')

const response = await fetch('http://localhost:3000/api/whatsapp/send', {
  method: 'POST',
  body: formData
})

const result = await response.json()
console.log(result)
```

### Python

```python
import requests

# Send file with caption
files = {'file': open('document.pdf', 'rb')}
data = {
    'clientId': 'user-1',
    'phone': '+923001234567',
    'text': 'Here is your document!'
}

response = requests.post(
    'http://localhost:3000/api/whatsapp/send',
    files=files,
    data=data
)

print(response.json())
```

### PHP

```php
<?php
// Send text message
$data = [
    'clientId' => 'user-1',
    'phone' => '+923001234567',
    'text' => 'Hello from PHP!'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:3000/api/whatsapp/send');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

---

## 🛠️ Development

### Project Structure
```
src/
├── api/
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   └── routes/
│       ├── index.ts
│       └── whatsapp.routes.ts
├── services/
│   ├── whatsapp.service.ts
│   └── index.ts
├── types/
│   └── business.ts
└── server.ts
```

### Available Scripts

```bash
# Development with hot reload
yarn dev

# Build TypeScript
yarn build

# Start production server
yarn start

# Type checking
yarn tsc --noEmit
```

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📞 Support

For support and questions, please open an issue in the repository.