# eCommerce Backend

A robust and secure e-commerce backend built with Node.js, Express, and Prisma, designed for scalability and modern security standards.

## 🚀 Tech Stack

- **Backend Framework**: [Express.js](https://expressjs.com/) (v5.1.0)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **ORM**: [Prisma](https://www.prisma.io/) (v6.19.1)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: JWT (JSON Web Tokens) with Refresh Token rotation
- **Validation**: [Zod](https://zod.dev/)
- **Security**:
  - [Arcjet](https://arcjet.com/) (Bot detection, Rate limiting)
  - [Helmet](https://helmetjs.github.io/) (Security headers)
  - [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) (Password hashing)
  - Express Rate Limit & HPP
- **Logging**: [Winston](https://github.com/winstonjs/winston)
- **Email**: [Nodemailer](https://nodemailer.com/)

## ✨ Key Features

- **User Management**:
  - Role-based Access Control (USER, ADMIN, MODERATOR)
  - Secure Authentication & Refresh Token logic
  - Email Verification & Password Reset workflows
  - Account Lockout for brute-force protection
- **Product Catalog**:
  - Advanced product schema with Sub-products and Sizes
  - Vendor and Category associations
  - Soft-delete functionality for Products and Categories
  - Integrated Product Reviews and Ratings
- **Order & Cart**:
  - Dynamic Cart system with persistence
  - Comprehensive Order management and status tracking
  - Support for multiple shipping/billing addresses
- **Marketing & UX**:
  - Coupon management with usage limits
  - Configurable Banners and Top-bar Notifications
- **Security & Performance**:
  - Bot protection and rate limiting via Arcjet
  - Request sanitization and security best practices

## 📁 Project Structure

```text
src/
├── controllers/    # Request handlers
├── services/       # Business logic & database operations
├── routes/         # API route definitions
├── middleware/     # Custom security & auth middleware
├── validators/     # Zod validation schemas
├── lib/            # Shared libraries and API constants
├── utils/          # Utility functions (Email, Logger, etc.)
├── models/         # (Via Prisma Schema)
└── index.ts        # Entry point
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v20+)
- MongoDB instance (Local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (see below)
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

### Running the Project

```bash
# Development mode with nodemon
npm run dev
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | MongoDB connection string |
| `PORT` | Server port (default: 3000) |
| `JWT_SECRET` | Secret key for JWT signing |
| `ARCJET_API_KEY` | Your Arcjet API key |
| `SMTP_HOST` | Email server host |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |
| `FRONTEND_URL` | URL of your frontend application |

## 🛡️ Security

This project implements multiple layers of security, including:
- **Rate Limiting**: Prevents abuse of API endpoints.
- **Bot Detection**: Filters malicious automated traffic.
- **Sanitization**: Protects against NoSQL injection and XSS.
- **Secure Headers**: Configured via Helmet for browser safety.

## 📝 License

This project is licensed under the ISC License.
