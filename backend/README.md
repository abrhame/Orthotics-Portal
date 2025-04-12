# Orthotics Portal Backend

This is the backend API for the Orthotics Portal application, built with Django and Django REST Framework.

## Features

- JWT authentication
- Patient management
- Prescription creation and management
- Order tracking
- Invoice generation
- PDF generation
- Template management

## Prerequisites

- Python 3.11 or higher
- PostgreSQL
- Redis (for Celery)

## Development Setup

### Using Docker (Recommended)

1. Make sure you have Docker and Docker Compose installed.
2. From the project root, run:

```bash
docker-compose up -d
```

This will start the backend, frontend, database, and Redis services.

### Manual Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

   - Copy `.env.example` to `.env` and edit as needed.

4. Run migrations:

```bash
python manage.py migrate
```

5. Create a superuser:

```bash
python manage.py createsuperuser
```

6. Start the development server:

```bash
python manage.py runserver
```

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Running Tests

```bash
python manage.py test
```

## Deployment

For production deployment, consider:

- Using Gunicorn as the WSGI server
- Setting up Nginx as a reverse proxy
- Configuring proper SSL certificates
- Setting appropriate environment variables for production
- Using a managed database service

## Project Structure

```
backend/
├── orthotics_portal/       # Main Django project
│   ├── api/                # API-related code
│   ├── core/               # Core functionality
│   ├── users/              # User management
│   ├── patients/           # Patient management
│   ├── prescriptions/      # Prescription management
│   ├── orders/             # Order management
│   ├── invoices/           # Invoice generation
│   └── templates/          # Prescription templates
├── mediafiles/             # Uploaded media
├── staticfiles/            # Static files
├── manage.py               # Django management script
├── requirements.txt        # Python dependencies
└── Dockerfile              # Docker configuration
```
