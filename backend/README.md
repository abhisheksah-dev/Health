# Health Platform Backend

A comprehensive backend system for a health management platform built with Node.js, Express, and MongoDB.

## Features

- User Authentication (Patients & Doctors)
- Appointment Management
- Health Records Management
- Doctor Reviews & Ratings
- Email Notifications
- File Uploads
- API Security
- Rate Limiting
- Error Handling
- Testing Setup

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Redis (Caching)
- Jest (Testing)
- ESLint & Prettier
- Docker Support

## Prerequisites

- Node.js >= 14.0.0
- MongoDB >= 4.4
- Redis (optional, for caching)
- SMTP Server (for emails)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd health-platform-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env` file with your configuration.

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
backend/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Database models
├── routes/            # API routes
├── tests/             # Test files
├── utils/             # Utility functions
├── uploads/           # File uploads
├── app.js            # Express app
├── server.js         # Server entry point
└── package.json      # Project dependencies
```

## API Documentation

### Authentication

#### Register Patient
```http
POST /api/v1/auth/register/patient
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "passwordConfirm": "Password123!",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "zipCode": "10001"
    }
}
```

#### Register Doctor
```http
POST /api/v1/auth/register/doctor
Content-Type: application/json

{
    "name": "Dr. Jane Smith",
    "email": "jane@example.com",
    "password": "Password123!",
    "passwordConfirm": "Password123!",
    "phoneNumber": "+1234567890",
    "specialization": "Cardiology",
    "licenseNumber": "MD123456",
    "qualifications": [{
        "degree": "MD",
        "institution": "Harvard Medical School",
        "year": 2010
    }],
    "clinicDetails": {
        "name": "Heart Care Clinic",
        "consultationFee": 100
    }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "Password123!"
}
```

### Appointments

#### Create Appointment
```http
POST /api/v1/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
    "doctor": "doctor_id",
    "date": "2024-03-20",
    "startTime": "10:00",
    "endTime": "11:00",
    "type": "consultation",
    "reason": "Regular checkup"
}
```

### Health Records

#### Create Health Record
```http
POST /api/v1/health-records
Authorization: Bearer <token>
Content-Type: application/json

{
    "patient": "patient_id",
    "type": "consultation",
    "diagnosis": "Common cold",
    "symptoms": ["fever", "cough"],
    "vitalSigns": {
        "temperature": 98.6,
        "bloodPressure": {
            "systolic": 120,
            "diastolic": 80
        }
    }
}
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Code Quality

Lint code:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## Security Features

- JWT Authentication
- Password Hashing
- Rate Limiting
- CORS Protection
- Helmet Security Headers
- Input Validation
- XSS Protection
- SQL Injection Prevention

## Error Handling

The API uses a centralized error handling mechanism with custom error classes. All errors are properly formatted and returned to the client with appropriate status codes.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@healthplatform.com or create an issue in the repository. 