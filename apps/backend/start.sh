#!/bin/sh

# Run migrations and start server
echo "Running database migrations..."
yarn medusa db:migrate

echo "Seeding database..."
yarn run seed || echo "Seeding failed, continuing..."

# is ADMIN_USER_EMAIL and ADMIN_USER_PASSWORD set?
if [ -z "$ADMIN_USER_EMAIL" ] || [ -z "$ADMIN_USER_PASSWORD" ]; then
  echo "ADMIN_USER_EMAIL and ADMIN_USER_PASSWORD environment variables are not set. Skipping admin user creation."
else
  echo "Creating admin user..."
  yarn medusa user -e "$ADMIN_USER_EMAIL" -p "$ADMIN_USER_PASSWORD"

fi
echo "Starting Medusa server..."
yarn run start