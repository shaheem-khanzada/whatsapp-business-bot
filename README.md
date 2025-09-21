# WhatsApp Business Bot API

A production-ready Node.js TypeScript API for WhatsApp Business automation, specifically designed for water delivery services.

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Start the API server
npm run api:dev
```

### 2. WhatsApp Login

1. **Initialize WhatsApp and get QR code:**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/login
   ```

2. **Scan the QR code** with your WhatsApp mobile app:
   - Open WhatsApp → Settings → Linked Devices → Link a Device
   - Scan the QR code from the API response

3. **Check connection status:**
   ```bash
   curl -X GET http://localhost:3000/api/whatsapp/status
   ```

## 📋 API Endpoints

### WhatsApp Management
- `POST /api/whatsapp/login` - Initialize WhatsApp and get QR code
- `GET /api/whatsapp/status` - Get WhatsApp connection status
- `POST /api/whatsapp/check-registration` - Check if phone number is registered
- `POST /api/whatsapp/bulk-check-registration` - Check multiple phone numbers

### Delivery Operations
- `POST /api/delivery/confirm` - Send delivery confirmation message

### Notifications
- `POST /api/notifications/announcement` - Send service announcement
- `POST /api/notifications/delivery-delay` - Send delivery delay notification
- `POST /api/notifications/service-resumption` - Send service resumption notification
- `POST /api/notifications/emergency` - Send emergency notification
- `POST /api/notifications/weather-alert` - Send weather alert

### Invoice Management
- `POST /api/invoices/send` - Send invoice PDF
- `POST /api/invoices/payment-reminder` - Send payment reminder with invoice

## 🧪 Postman Testing

### 1. WhatsApp Login
```http
POST http://localhost:3000/api/whatsapp/login
Content-Type: application/json

{}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp initialized successfully. Scan the QR code to connect.",
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "status": "waiting_for_scan"
  }
}
```

### 2. Check WhatsApp Status
```http
GET http://localhost:3000/api/whatsapp/status
```

**Response:**
```json
{
  "success": true,
  "message": "Status retrieved successfully",
  "data": {
    "status": "CONNECTED"
  }
}
```

### 3. Send Delivery Confirmation
```http
POST http://localhost:3000/api/delivery/confirm
Content-Type: application/json

{
  "customerId": "1",
  "bottlesDelivered": 2,
  "emptyBottlesCollected": 3,
  "totalAmount": 100,
  "deliveryPerson": "Muhammad Hassan",
  "notes": "Regular delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery confirmation sent successfully",
  "data": {
    "deliveryId": "DEL-1703123456789"
  }
}
```

### 4. Send Service Announcement
```http
POST http://localhost:3000/api/notifications/announcement
Content-Type: application/json

{
  "title": "New Delivery Schedule",
  "message": "Starting next week, we will be delivering on Tuesdays and Fridays instead of Mondays and Thursdays.",
  "customerIds": ["1", "2", "3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement sent to 3 customers",
  "data": {
    "title": "New Delivery Schedule",
    "message": "Starting next week, we will be delivering on Tuesdays and Fridays instead of Mondays and Thursdays.",
    "targetArea": null
  }
}
```

### 5. Send Invoice
```http
POST http://localhost:3000/api/invoices/send
Content-Type: application/json

{
  "customerId": "1",
  "totalAmount": 100,
  "items": [
    {
      "description": "Water Delivery - 2 bottles",
      "quantity": 2,
      "rate": 50,
      "amount": 100
    }
  ],
  "pdfUrl": "https://example.com/invoice.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice sent successfully",
  "data": {
    "invoiceId": "INV-1703123456789"
  }
}
```

## 🔧 Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# WhatsApp Configuration
ADMIN_PHONE=+923161137297

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Invoice Configuration
URL=http://localhost:3000
```

## 🏗️ Project Structure

```
src/
├── api/
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── delivery.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── invoice.routes.ts
│   │   ├── whatsapp.routes.ts
│   │   └── index.ts
│   └── server.ts
├── services/
│   ├── whatsapp.service.ts
│   ├── delivery.service.ts
│   ├── notification.service.ts
│   ├── invoice.service.ts
│   └── index.ts
├── templates/
│   └── messageTemplates.ts
├── types/
│   └── business.ts
└── main.ts
```

## 🚀 Production Deployment

### 1. Build the project
```bash
npm run api:build
```

### 2. Start production server
```bash
npm start
```

### 3. Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=https://yourdomain.com
```

## 📱 WhatsApp Integration

The API uses `whatsapp-web.js` library which:
- Connects to WhatsApp Web
- Requires QR code scanning for authentication
- Stores session data locally
- Supports sending text messages, images, and PDFs
- Handles bulk messaging with rate limiting

## 🔒 Security Features

- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation
- Error handling

## 📊 Monitoring

- Health check endpoint: `GET /api/health`
- API documentation: `GET /`
- Request logging with Morgan
- Error tracking

## 🛠️ Development

```bash
# Development mode with auto-reload
npm run api:dev

# Build TypeScript
npm run build

# Run tests (if available)
npm test
```

## 📝 Notes

- WhatsApp session data is stored in `.wwebjs_auth/` directory
- QR code is generated as base64 data URL for easy display in admin panels
- All message templates are centralized in `src/templates/messageTemplates.ts`
- Phone numbers should be in international format (+923161137297)
- Rate limiting prevents spam and ensures WhatsApp compliance

## 🤝 Support

For issues and questions, please check the API documentation at `http://localhost:3000/` when the server is running.