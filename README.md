# Server Session Management System

A robust server-side application for managing web tool authentication sessions.

## Features

- Automated login and session management for multiple tools
- Secure session storage in MongoDB
- Stealth browser automation with Puppeteer
- Rate limiting and compression for better performance
- CORS protection

## Supported Tools

- Creativsea
- DesignBeastApp
- Peeksta
- WinningHunter
- Academun

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
PORT=3000
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Run the server:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /start-session/:toolName`: Start a new session for a specific tool
- `GET /get-session/:toolName`: Retrieve the latest session for a specific tool

## Requirements

- Node.js 18.x
- MongoDB
