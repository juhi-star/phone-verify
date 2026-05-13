# Phone Verification

A full-stack phone number verification app with SMS OTP (Twilio) + demo mode. Backend is Node.js/Express/MongoDB, frontend is React 18 + Vite.

---

## Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Backend    | Node.js, Express.js, MongoDB + Mongoose   |
| SMS        | Twilio SDK                                |
| Auth       | JWT (jsonwebtoken), bcrypt                |
| Frontend   | React 18, Vite, CSS (dark theme)          |
| Validation | Joi                                       |
| Security   | Helmet, CORS, express-rate-limit          |
| Logging    | Winston + Morgan                          |
| Deployment | AWS Lambda + API Gateway                  |

---

## Project Structure

```
phone-verify/
├── backend/
│   ├── src/
│   │   ├── app.js                         # Express app
│   │   ├── server.js                      # Entry point (port bind)
│   │   ├── config/
│   │   │   └── database.js                # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── verificationController.js
│   │   ├── middleware/
│   │   │   ├── auth.js                    # JWT protect
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js                # Joi validation
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.js                    # /api/auth/*
│   │   │   └── verification.js            # /api/verify/*
│   │   ├── services/
│   │   │   ├── smsService.js              # Twilio wrapper
│   │   │   └── tokenService.js            # JWT sign/verify
│   │   └── utils/
│   │       ├── apiResponse.js
│   │       ├── logger.js
│   │       └── otpGenerator.js
│   ├── lambda.js                          # AWS Lambda handler
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html                         # Vite entry
│   ├── package.json
│   ├── vite.config.js                     # Proxy /api → backend:3000
│   └── src/
│       ├── main.jsx                       # React entry
│       ├── App.jsx                        # Root component (step flow)
│       ├── App.css                        # All styles
│       ├── api.js                         # API helper + demo mode
│       └── components/
│           ├── Logo.jsx
│           ├── Steps.jsx                  # Progress indicator
│           ├── AuthPanel.jsx              # Register / Login
│           ├── PhonePanel.jsx             # Phone number input
│           ├── OTPPanel.jsx               # 6-digit OTP + countdown
│           └── SuccessPanel.jsx           # Verified confirmation
└── README.md
```

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env        # Fill in MongoDB URI, JWT secret, Twilio creds
npm install
npm run dev                 # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Vite auto-proxies `/api/*` requests to `http://localhost:3000/api/*` — no CORS setup needed.

---

## Demo Mode (no backend required)

Set `DEMO_MODE = true` in `frontend/src/api.js` to test the full flow without a running backend:

| Step | What to enter |
|------|---------------|
| Auth | Any email + password |
| Phone | Any valid E.164 number (e.g. `+14155552671`) |
| OTP | `123456` |
| Result | Success screen with JWT token displayed |

The app shows a **"Demo mode — use 123456"** badge on the OTP screen. Set `DEMO_MODE = false` to connect to the real backend.

---

## API Reference

### Auth

#### `POST /api/auth/register`

**Body:**
```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "securepassword" }
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "name": "Ada Lovelace", "email": "...", "isPhoneVerified": false }
  }
}
```

#### `POST /api/auth/login`

```json
{ "email": "ada@example.com", "password": "securepassword" }
```

#### `GET /api/auth/me` *(protected)*

**Headers:** `Authorization: Bearer <token>`

### Phone Verification

#### `POST /api/verify/send-otp` *(protected)*

```json
{ "phone": "+14155552671" }
```

**Rate limit:** 5 requests / 15 min per IP, 30 s cooldown per user.

#### `POST /api/verify/verify-otp` *(protected)*

```json
{ "phone": "+14155552671", "otp": "482910" }
```

**Max 5 attempts** before lockout.

#### `GET /api/verify/status` *(protected)*

Returns current phone verification status.

---

## Security

- **OTPs hashed** with bcrypt — never stored in plaintext
- **JWT** carries only `id` and `email`
- **Rate limiting** globally and per-route
- **Helmet** headers (XSS, clickjacking, MIME)
- **Joi** strips unknown fields, validates all input
- **Graceful shutdown** (SIGTERM / SIGINT)

---

## AWS Deployment

### Prerequisites

- AWS CLI configured
- Serverless Framework: `npm install -g serverless`

### Deploy

```bash
cd backend
npm install serverless-http
serverless deploy
```

Store secrets in AWS SSM Parameter Store:

```bash
aws ssm put-parameter --name /phone-verify/JWT_SECRET --value "..." --type SecureString
aws ssm put-parameter --name /phone-verify/MONGODB_URI --value "..." --type SecureString
aws ssm put-parameter --name /phone-verify/TWILIO_ACCOUNT_SID --value "..." --type SecureString
aws ssm put-parameter --name /phone-verify/TWILIO_AUTH_TOKEN --value "..." --type SecureString
aws ssm put-parameter --name /phone-verify/TWILIO_PHONE_NUMBER --value "..." --type SecureString
```
