FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    APP_USER_ID=1000 \
    APP_GROUP_ID=1000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gettext \
    netcat-openbsd \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user to run the app
RUN addgroup --system --gid ${APP_GROUP_ID} app && \
    adduser --system --uid ${APP_USER_ID} --gid ${APP_GROUP_ID} app

# Create directories for the app
RUN mkdir -p /app/media/scans/left /app/media/scans/right /app/staticfiles /app/scripts \
    && chown -R ${APP_USER_ID}:${APP_GROUP_ID} /app \
    && chmod -R 755 /app/media \
    && chmod -R 777 /app/staticfiles

# Copy the project
COPY . /app/
RUN chmod +x /app/scripts/*.sh

# Create a script to fix collation issues
RUN echo '#!/bin/bash\n\
echo "Fixing database collation..."\n\
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "ALTER DATABASE $DB_NAME REFRESH COLLATION VERSION;"\n\
' > /app/scripts/fix_collation.sh \
    && chmod +x /app/scripts/fix_collation.sh

# Set proper permissions
RUN chown -R ${APP_USER_ID}:${APP_GROUP_ID} /app \
    && chmod -R 777 /app/staticfiles

# Switch to non-root user
USER app

# Expose the port
EXPOSE 8000

# Run the application
CMD ["gunicorn", "orthotics_portal.wsgi:application", "--bind", "0.0.0.0:8000"] 