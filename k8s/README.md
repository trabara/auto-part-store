# Kubernetes Configuration (k3s)

Lightweight Kubernetes manifests optimized for k3s cluster.

## k3s-Specific Features

- **Traefik** ingress controller (built-in to k3s)
- **local-path** StorageClass for persistent volumes
- No external dependencies required

## Prerequisites

```bash
# Install k3s
curl -sfL https://get.k3s.io | sh -

# Install cert-manager for TLS certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Verify storage class
kubectl get storageclass
# Should show: local-path (primary)
```

## Structure

```
k8s/
├── base/                    # Base manifests
│   ├── 00-namespace.yaml    # Namespace
│   ├── postgres.yaml        # PostgreSQL StatefulSet
│   ├── redis.yaml           # Redis Deployment
│   ├── minio.yaml           # MinIO Deployment
│   ├── medusa.yaml          # Medusa backend
│   ├── storefront.yaml      # Next.js storefront
│   ├── medusa-init.yaml     # Init Job (migrations, seed)
│   ├── network-policies.yaml # Network security
│   ├── ingress.yaml         # Traefik Ingress routes
│   └── kustomization.yaml
├── overlays/
│   ├── production/          # Production (3 replicas)
│   └── staging/            # Staging (2 replicas)
└── kustomization.yaml
```

## Local Registry Setup

Images are built locally and pushed to a local Docker registry:

```bash
# Build images
cd apps/medusa && docker build -t smap-store-medusa:latest .
cd apps/storefront && docker build -t smap-store-storefront:latest .

# Start local registry
docker run -d --name registry --network host -v /tmp/registry:/var/lib/registry registry:2

# Tag and push images
docker tag smap-store-medusa:latest localhost:5000/smap-store-medusa:latest
docker push localhost:5000/smap-store-medusa:latest
docker tag smap-store-storefront:latest localhost:5000/smap-store-storefront:latest
docker push localhost:5000/smap-store-storefront:latest

# Load into k3s (if not using registry)
sudo ctr -a /run/k3s/containerd/containerd.sock -n k8s.io images import /tmp/smap-images.tar
```

## Deploy

```bash
# Apply base manifests
kubectl apply -k k8s/base/

# Or apply generated yaml
kubectl apply -f staging.yaml
```

## DNS Configuration

Add to `/etc/hosts` for local testing:

```
<NODE_IP> api.localhost
<NODE_IP> shop.localhost
<NODE_IP> minio.localhost
<NODE_IP> minio-console.localhost
```

## Secrets Setup

Before deploying, update secrets:

```bash
# Create secrets manually
kubectl create secret generic medusa-secret \
  -n smap-store \
  --from-literal=DATABASE_URL="postgresql://medusa:password@postgres:5432/medusa-v2" \
  --from-literal=REDIS_URL="redis://:password@redis:6379" \
  --from-literal=JWT_SECRET="your-32-char-secret-min" \
  --from-literal=COOKIE_SECRET="your-32-char-secret-min"

kubectl create secret generic postgres-secret \
  -n smap-store \
  --from-literal=POSTGRES_USER=medusa \
  --from-literal=POSTGRES_PASSWORD=password \
  --from-literal=POSTGRES_DB=medusa-v2

kubectl create secret generic redis-secret \
  -n smap-store \
  --from-literal=REDIS_PASSWORD=password

kubectl create secret generic minio-secret \
  -n smap-store \
  --from-literal=MINIO_ROOT_USER=minioadmin \
  --from-literal=MINIO_ROOT_PASSWORD=password

kubectl create secret generic storefront-secret \
  -n smap-store \
  --from-literal=REVALIDATE_SECRET=your-secret

kubectl create secret generic storefront-key \
  -n smap-store \
  --from-literal=NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
```

## Init Job (medusa-init)

The `medusa-init` Job runs on deployment to:

1. Wait for postgres and redis
2. Run database migrations
3. Run seed script (if needed)
4. Extract publishable API key

```bash
# Run init job manually
kubectl apply -f k8s/base/medusa-init.yaml
kubectl logs job/medusa-init -n smap-store -f
```

## Verify

```bash
# Check pods
kubectl get pods -n smap-store

# Watch status
kubectl get pods -n smap-store -w

# Check services
kubectl get svc -n smap-store

# Check ingress
kubectl get ingress -n smap-store

# View logs
kubectl logs -l app=medusa -n smap-store -f
```

## Resource Limits

| Service    | CPU Req | CPU Lim | Mem Req | Mem Lim | Replicas |
| ---------- | ------- | ------- | ------- | ------- | -------- |
| medusa     | 100m    | 500m    | 256Mi   | 1Gi     | 2-3      |
| storefront | 50m     | 300m    | 128Mi   | 512Mi   | 2-3      |
| postgres   | 100m    | 1       | 256Mi   | 1Gi     | 1        |
| redis      | 50m     | 200m    | 64Mi    | 256Mi   | 1        |
| minio      | 100m    | 500m    | 256Mi   | 1Gi     | 1        |

## Networking

| Service    | Port      | Purpose         |
| ---------- | --------- | --------------- |
| medusa     | 9000      | API             |
| storefront | 3000      | Web             |
| postgres   | 5432      | Database        |
| redis      | 6379      | Cache           |
| minio      | 9000/9001 | Storage/Console |

## Troubleshooting

```bash
# Restart deployment
kubectl rollout restart deployment/medusa -n smap-store

# Check events
kubectl get events -n smap-store --sort-by='.lastTimestamp'

# Describe resources
kubectl describe pod -l app=medusa -n smap-store

# Check resource usage
kubectl top pods -n smap-store

# Exec into container
kubectl exec -it deploy/medusa -n smap-store -- sh

# Delete and recreate
kubectl delete -k k8s/overlays/staging
kubectl apply -k k8s/overlays/staging
```
