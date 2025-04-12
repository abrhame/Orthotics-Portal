# Orthotics Portal

A comprehensive web application for managing custom orthotics prescriptions, patients, and orders.

## Project Overview

The Orthotics Portal is designed for clinicians to create and manage custom orthotics prescriptions, submit them to labs for manufacturing, and track their status. The application includes patient management, detailed prescription creation, order tracking, and reporting capabilities.

## Technology Stack

### Backend

- **Framework**: Django & Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Task Queue**: Celery & Redis
- **File Storage**: Local/S3
- **Documentation**: Swagger/OpenAPI

### Frontend

- **Framework**: React.js
- **State Management**: Redux
- **UI Components**: Material-UI
- **HTTP Client**: Axios

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (planned)

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Running the Application

1. Clone the repository:

```bash
git clone https://github.com/yourusername/orthotics-portal.git
cd orthotics-portal
```

2. Start the services:

```bash
docker-compose up -d
```

3. Access the application:

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/v1
   - API Documentation: http://localhost:8000/api/docs

4. Create a superuser for admin access:

```bash
docker-compose exec backend python manage.py createsuperuser
```

## Project Structure

```
orthotics-portal/
├── frontend/           # React.js frontend application
├── backend/            # Django backend API
├── .env                # Environment variables
├── docker-compose.yml  # Docker Compose configuration
├── .gitignore          # Git ignore file
└── README.md           # Project documentation
```

## Development

For detailed instructions on how to develop and extend the application, see:

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The project was developed based on requirements from orthotics specialists.
- Special thanks to all contributors.
