# Medusa E-commerce Store with Traefik

A full-stack e-commerce solution using Medusa backend, Next.js storefront, and Traefik as a reverse proxy/load balancer.

## Architecture

- **Traefik**: Reverse proxy and load balancer
- **Medusa Backend**: E-commerce backend API (Port 9000)
- **Medusa Admin**: Admin dashboard (Port 5173)
- **Storefront**: Next.js frontend (Port 8000)
- **PostgreSQL**: Database
- **Redis**: Cache and session storage
- **MinIO**: Object storage for files and images

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Running in Development Mode (Recommended)

Development mode includes hot reloading for both backend and frontend.

1. Clone the repository and navigate to the project root:

```bash
cd /home/oussama/Projects/my-medusa-store
```

2. Start all services in development mode:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Or use the shorthand:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

3. Watch logs (optional):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

4. Access the applications:
   - **Storefront**: http://localhost or http://shop.localhost
   - **Admin Dashboard**: http://admin.localhost
   - **Backend API**: http://api.localhost
   - **Traefik Dashboard**: http://traefik.localhost or http://localhost:8080
   - **MinIO Console**: http://minio.localhost
   - **MinIO API**: http://minio-api.localhost

5. Create an admin user:

```bash
docker compose exec medusa yarn medusa user -e admin@example.com -p supersecret
```

### Running in Production Mode

For production deployment without hot reloading:

```bash
docker compose up -d
```

## Services Overview

### Traefik (Load Balancer)

- Routes traffic to appropriate services
- Provides SSL termination (when configured)
- Dashboard available at port 8080

### Medusa Backend

- RESTful API for e-commerce operations
- Admin API endpoints
- Store API endpoints
- Available at http://api.localhost

### Medusa Admin

- Admin dashboard built with Vite
- Manage products, orders, customers
- Available at http://admin.localhost

### Development Workflow

The development setup includes:

- **Hot Module Replacement (HMR)** for Next.js storefront
- **Live reload** for Medusa backend
- **Volume mounts** for instant code changes
- **Debug logging** enabled

### Individual Service Management

Stop all services:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Rebuild a specific service:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build medusa
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build storefront
```

View logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f medusa
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f storefront
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f traefik
```

Restart a service:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart medusa
```

### Helper Scripts

Create these helper scripts in the root directory for convenience:

**dev-up.sh**:

```bash
#!/bin/bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d "$@"
```

**dev-down.sh**:

```bash
#!/bin/bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down "$@"
```

**dev-logs.sh**:

```bash
#!/bin/bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$@"
```

Make them executable:

```bash
chmod +x dev-up.sh dev-down.sh dev-logs.sh
```

Then use:

```bash
./dev-up.sh
./dev-logs.sh medusa
./dev-down.sh
```

### Environment Variables

#### Development Environment

Edit `.env.dev` for shared development configuration.

#### Medusa Backend

Edit `medusa/.env` for backend-specific configuration.

#### Storefront

Edit `medusa-storefront/.env.local` for storefront-specific
docker compose logs -f medusa
docker compose logs -f storefront
docker compose logs -f traefik

````

### Environment Variables

#### Medusa Backend
Edit `medusa/.env` for backend configuration.

#### Storefront
Edit `medusa-storefront/.env.local` for storefront configuration.

## Traefik Configuration

Traefik is configured via Docker labels in the `docker-compose.yml` file. Key features:

- **Automatic service discovery**: Traefik automatically detects services
- **Load balancing**: Distributes traffic across service instances
- **Path-based routing**: Routes based on hostnames and paths
- **Health checks**: Only routes to healthy containers

### Custom Domain Routing

To use custom domains locally, add entries to `/etc/hosts`:

```bash
127.0.0.1 shop.localhost
127.0.0.1 admin.localhost
127.0.0.1 api.localhost
127.0.0.1 traefik.localhost
127.0.0.1 minio.localhost
````

## Production Deployment

For production:

1. Update Traefik configuration for SSL/TLS:
   - Add Let's Encrypt certificate resolver
   - Enable HTTPS redirects
   - Configure proper domain names

2. Update environment variables for production
3. Use secrets management for sensitive data
4. Configure proper database backups
5. Set up monitoring and logging

## Troubleshooting

### Services not accessible

Check if all services are running:

```bash
docker compose ps
```

### Check service logs

```bash
docker compose logs -f [service-name]
```

### Restart a service

```bash
docker compose restart [service-name]
```

### Clean restart

```bash
docker compose down -v
docker compose up -d
```

## License

MIT
