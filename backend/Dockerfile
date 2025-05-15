# Use Python 3.9 slim image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_HOME=/app

# Set work directory
WORKDIR $APP_HOME

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        netcat-traditional \
        gcc \
        python3-dev \
        musl-dev \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create log directory and set permissions
RUN mkdir -p /var/log/orthotics \
    && chmod 777 /var/log/orthotics

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create directories for static and media files
RUN mkdir -p staticfiles media \
    && chmod 755 staticfiles media

# Create a non-root user
RUN useradd -m appuser && chown -R appuser:appuser $APP_HOME /var/log/orthotics
USER appuser

# Expose the port
EXPOSE 8000

# Run migrations and start server
CMD python manage.py migrate && \
    python manage.py collectstatic --noinput && \
    gunicorn orthotics_portal.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 