#!/bin/bash

# Exit on error
set -e

# Create required directories
mkdir -p nginx/certbot/conf nginx/certbot/www

# Check if domain name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <domain_name>"
  echo "Example: $0 example.com"
  exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

echo "Setting up production environment for domain: $DOMAIN with email: $EMAIL"

# Update nginx configuration with correct domain
sed -i "s/example.com/$DOMAIN/g" nginx/nginx.conf
sed -i "s/localhost/$DOMAIN/g" nginx/nginx.conf

# Make sure .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file with default values"
  cat > .env << EOF
SECRET_KEY=$(openssl rand -hex 32)
DB_NAME=orthotics_portal
DB_USER=postgres
DB_PASSWORD=$(openssl rand -hex 16)
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN
EOF
else
  echo ".env file already exists, keeping current values"
fi

# Create SSL certificate initialization script
cat > init-letsencrypt.sh << EOF
#!/bin/bash

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

domains=($DOMAIN www.$DOMAIN)
rsa_key_size=4096
data_path="./nginx/certbot"
email="$EMAIL"
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

if [ -d "$data_path/conf/live/$DOMAIN" ]; then
  read -p "Existing data found for $DOMAIN. Continue and replace existing certificate? (y/N) " decision
  if [ "\$decision" != "Y" ] && [ "\$decision" != "y" ]; then
    exit
  fi
fi

echo "Creating dummy certificate for $DOMAIN..."
mkdir -p "$data_path/conf/live/$DOMAIN"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:1024 -days 1\
    -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "Starting nginx..."
docker-compose up --force-recreate -d nginx

echo "Deleting dummy certificate for $DOMAIN..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

echo "Requesting Let's Encrypt certificate for $DOMAIN..."
# Join domains to -d args
domain_args=""
for domain in "\${domains[@]}"; do
  domain_args="\$domain_args -d \$domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ \$staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    \$staging_arg \
    \$email_arg \
    \$domain_args \
    --rsa-key-size \$rsa_key_size \
    --agree-tos \
    --force-renewal" certbot

echo "Restarting nginx..."
docker-compose exec nginx nginx -s reload
EOF

chmod +x init-letsencrypt.sh

echo "Setup complete!"
echo "Next steps:"
echo "1. Review the generated .env file and update values as needed"
echo "2. Run './init-letsencrypt.sh' to obtain SSL certificates"
echo "3. Run 'docker-compose -f docker-compose.prod.yml up -d' to start the production environment" 