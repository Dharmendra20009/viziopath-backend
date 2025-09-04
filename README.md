# Viziopath Backend API

A comprehensive, production-ready backend API for Viziopath (viziopath.info) built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication with secure cookies
  - User registration with email verification
  - Password reset functionality
  - Account lockout protection
  - Role-based access control

- **User Profile Management**
  - Comprehensive user profiles
  - Professional experience and education tracking
  - Skills and social media integration
  - Privacy settings and visibility controls
  - Profile search and suggestions

- **Security Features**
  - Rate limiting and DDoS protection
  - Helmet.js security headers
  - CORS configuration for viziopath.info
  - Input validation and sanitization
  - Secure password hashing with bcrypt

- **File Management**
  - Profile picture uploads
  - Cloudinary integration for cloud storage
  - File type and size validation
  - Automatic cleanup of temporary files

- **Email Services**
  - Welcome emails for new users
  - Email verification system
  - Password reset emails
  - Professional email templates

## 🛠️ Tech Stack

- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with secure cookies
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer with SMTP
- **Validation**: Joi, Mongoose validation
- **Testing**: Jest + Supertest

## 📁 Project Structure

```
src/
├── config/          # Database and configuration
├── controllers/     # Route controllers
├── middlewares/     # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── utils/           # Utility functions
└── app.js          # Express app configuration

server.js            # Main server file
package.json         # Dependencies and scripts
env.example          # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- MongoDB instance
- SMTP server (Gmail, SendGrid, etc.)
- Cloudinary account (optional, for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/viziopath/viziopath-backend.git
   cd viziopath-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/viziopath
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/viziopath

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Frontend URLs
FRONTEND_URL=https://viziopath.info
FRONTEND_DEV_URL=http://localhost:5173

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 📚 API Documentation

### Base URL
```
https://your-domain.com/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User registration | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/profile` | Update user profile | Yes |
| PUT | `/auth/change-password` | Change password | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |
| GET | `/auth/verify-email/:token` | Verify email | No |
| POST | `/auth/logout` | User logout | Yes |
| DELETE | `/auth/account` | Delete account | Yes |

### Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile/search` | Search profiles | No |
| GET | `/profile/:userId` | Get user profile | No |
| GET | `/profile/me/profile` | Get own profile | Yes |
| PUT | `/profile/me/profile` | Update own profile | Yes |
| PUT | `/profile/me/avatar` | Update avatar | Yes |
| GET | `/profile/suggestions` | Get suggestions | Yes |

### Example API Calls

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

#### Get Profile (with auth)
```bash
curl -X GET http://localhost:5000/api/profile/me/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for viziopath.info domain
- **Helmet**: Security headers and CSP
- **Input Validation**: Request body validation
- **SQL Injection Protection**: MongoDB with Mongoose
- **XSS Protection**: Content Security Policy
- **CSRF Protection**: Secure cookie settings

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📦 Production Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure production SMTP settings
5. Set up Cloudinary (if using file uploads)

### PM2 Process Manager

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database

```bash
# Seed database
npm run db:seed

# Run migrations
npm run db:migrate
```

## 📊 Monitoring & Logging

- Health check endpoint: `/health`
- API documentation: `/api/docs`
- Structured logging with Morgan
- Error tracking and monitoring
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: `/api/docs` endpoint
- **Issues**: GitHub Issues
- **Email**: support@viziopath.info
- **Website**: [viziopath.info](https://viziopath.info)

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection established
- [ ] SMTP settings configured
- [ ] JWT secret set
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented

---

**Built with ❤️ for Viziopath**


