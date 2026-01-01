# WhatsApp Baileys Bot

A WhatsApp bot implementation using `baileys` with phone number pairing support.

## Features

- ✅ Phone number pairing (via QR code or pairing code)
- ✅ Message handling
- ✅ Session persistence
- ✅ TypeScript support
- ✅ Structured logging with Pino

## Installation

```bash
cd baileys-bot
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your settings:
```env
PHONE_NUMBER=1234567890  # Optional: Your phone number (with country code)
AUTH_DIR=./auth          # Directory to store session data
LOG_LEVEL=info           # Log level
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## How It Works

1. **First Run**: The bot will generate a QR code. Scan it with your WhatsApp app to authenticate.
2. **Session Persistence**: After the first authentication, the session is saved in the `auth` directory. Subsequent runs will automatically reconnect.
3. **Phone Number Pairing**: While Baileys primarily uses QR codes, you can also use pairing codes that appear in the terminal.

## Project Structure

```
baileys-bot/
├── src/
│   └── index.ts          # Main bot implementation
├── auth/                  # Session data (created automatically)
├── dist/                  # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

- The bot will automatically reconnect if the connection is lost (unless logged out)
- Session data is stored in the `auth` directory - keep this secure
- The bot will echo back messages as an example - modify the message handler to implement your logic

## Differences from whatsapp-web.js

- **Baileys** is a lightweight library that directly implements WhatsApp's protocol
- **No Puppeteer/Chrome** required - runs natively in Node.js
- **Faster** and more efficient
- **Phone number pairing** is supported through QR codes or pairing codes


