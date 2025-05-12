import multiprocessing

# Gunicorn configuration
bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gthread"
threads = 2
timeout = 120
keepalive = 5

# Logging
accesslog = "/var/log/orthotics/access.log"
errorlog = "/var/log/orthotics/error.log"
loglevel = "info"

# SSL Configuration (if needed)
# keyfile = "/etc/ssl/private/key.pem"
# certfile = "/etc/ssl/certs/cert.pem" 