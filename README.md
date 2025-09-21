# WhatsApp Business Bot

A Node.js TypeScript application for sending invoices via WhatsApp using the whatsapp-web.js library.

## Features

- Send text messages via WhatsApp
- Send PDF invoices as documents
- QR code authentication
- TypeScript support
- Invoice formatting with Pakistani Rupee currency

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Chrome (for Puppeteer)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Watch mode
```bash
npm run watch
```

## Configuration

The bot uses the following environment variables:
- `URL`: Base URL for invoice PDFs (default: http://localhost:3000)

## WhatsApp Authentication

1. Run the application
2. Scan the QR code that appears in the terminal with your WhatsApp mobile app
3. Go to Settings > Linked Devices > Link a Device
4. Scan the QR code

## Notes

- The bot will create a `.wwebjs_auth` folder to store session data
- Make sure the Chrome executable path in the code matches your system
- The phone number and invoice data are currently hardcoded for testing

## Project Structure

```
src/
├── main.ts           # Main application file
└── payload-types.ts  # TypeScript type definitions
```
