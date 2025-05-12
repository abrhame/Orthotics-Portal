# Orthotics Portal Deployment Guide

This guide provides instructions for deploying the Orthotics Portal application in a production environment using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your server
- A domain name pointing to your server
- Basic knowledge of Linux commands
- Open ports 80 and 443 on your server

## Deployment Steps

### 1. Clone the repository

```bash
git clone https://github.com/your-username/orthotics-portal.git
cd orthotics-portal
```

### 2. Set up the production environment

Run the initialization script, providing your domain name:

```bash
./init-production.sh example.com your-email@example.com
```

This script will:

- Create the necessary directories
- Generate a `.env` file with secure default values
- Configure Nginx with your domain
- Create a script to set up SSL certificates

### 3. Obtain SSL certificates

Run the Let's Encrypt initialization script:

```bash
./init-letsencrypt.sh
```

This script will obtain SSL certificates from Let's Encrypt for your domain.

### 4. Start the production environment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will start all the services defined in the production Docker Compose file in detached mode.

### 5. Verify the deployment

Visit your domain in a web browser to verify that the application is running correctly.

## Environment Variables

The following environment variables can be configured in the `.env` file:

- `SECRET_KEY`: Django secret key (automatically generated)
- `DB_NAME`: PostgreSQL database name
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password (automatically generated)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

## Maintenance

### Updating the application

```bash
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Viewing logs

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Backing up the database

```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres orthotics_portal > backup.sql
```

### Restoring the database

```bash
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres orthotics_portal
```

## Troubleshooting

### Certificate renewal

SSL certificates from Let's Encrypt are valid for 90 days. The renewal process is automated, but you can force a renewal if needed:

```bash
docker-compose -f docker-compose.prod.yml run --rm certbot renew
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Database connection issues

If the application cannot connect to the database, check the following:

1. Ensure the database service is running: `docker-compose -f docker-compose.prod.yml ps`
2. Check the database logs: `docker-compose -f docker-compose.prod.yml logs db`
3. Verify the database credentials in the `.env` file match those in the `docker-compose.prod.yml` file
