# 🐳 Docker Setup Instructions

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- 4GB+ RAM available
- 10GB+ free disk space

### One-Command Setup
```bash
# Clone and setup
git clone <your-repo>
cd windsurf-project-2

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d
```

## 📋 Services Running

| Service | Port | Access URL | Purpose |
|---------|------|------------|---------|
| **School App** | 3000 | http://localhost:3000 | Main application |
| **PostgreSQL** | 5432 | localhost:5432 | Primary database |
| **MongoDB** | 27017 | localhost:27017 | Document database |
| **Redis** | 6379 | localhost:6379 | Cache/sessions |
| **Nginx** | 80/443 | http://localhost | Reverse proxy |
| **Elasticsearch** | 9200 | http://localhost:9200 | Search engine |
| **Kibana** | 5601 | http://localhost:5601 | Search dashboard |

## 🔧 Management Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f school-app
```

### Restart Service
```bash
docker-compose restart school-app
```

### Access Container Shell
```bash
docker-compose exec school-app sh
```

## 🗄️ Database Access

### PostgreSQL
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d school_erp

# From your machine
psql -h localhost -p 5432 -U postgres -d school_erp
```

### MongoDB
```bash
# Connect to MongoDB
docker-compose exec mongodb mongo -u admin -p mongo123 school_erp

# From your machine
mongo --host localhost --port 27017 -u admin -p mongo123 school_erp
```

### Redis
```bash
# Connect to Redis
docker-compose exec redis redis-cli -a redis123

# From your machine
redis-cli -h localhost -p 6379 -a redis123
```

## 📁 Project Structure

```
windsurf-project-2/
├── docker-compose.yml          # Docker services definition
├── app/                        # Application code
│   ├── Dockerfile             # Application container
│   ├── server.js              # Express server
│   ├── package.json           # Dependencies
│   └── config/                # Database configurations
├── database/                   # Database initialization
│   ├── init/                  # PostgreSQL init scripts
│   └── mongo-init/            # MongoDB init scripts
├── nginx/                      # Nginx configuration
│   ├── nginx.conf
│   └── ssl/
└── .env.example               # Environment variables template
```

## 🔒 Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | postgres | postgres123 |
| MongoDB | admin | mongo123 |
| Redis | - | redis123 |

⚠️ **Change these in production!**

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check database status
docker-compose ps

# Restart database services
docker-compose restart postgres mongodb redis
```

### Application Not Starting
```bash
# Check application logs
docker-compose logs school-app

# Rebuild application
docker-compose build school-app
```

### Volume Issues
```bash
# Remove volumes (WARNING: This deletes data)
docker-compose down -v
docker volume prune
```

## 📊 Monitoring

### Health Checks
```bash
# Application health
curl http://localhost:3000/health

# Database health
docker-compose exec postgres pg_isready -U postgres
docker-compose exec mongodb mongo --eval "db.adminCommand('ping')"
docker-compose exec redis redis-cli ping
```

### Resource Usage
```bash
# Container resource usage
docker stats

# Disk usage
docker system df
```

## 🔄 Development Workflow

### Make Changes to Application
```bash
# Restart application with changes
docker-compose restart school-app

# Rebuild if package.json changed
docker-compose build school-app
```

### Add New Dependencies
```bash
# Add to app/package.json
# Then rebuild
docker-compose build school-app
```

### Database Migrations
```bash
# Run migrations in PostgreSQL container
docker-compose exec postgres psql -U postgres -d school_erp -f /path/to/migration.sql
```

## 🌐 Network Configuration

All services communicate through the `school_network` bridge network with subnet `172.20.0.0/16`.

### Service Communication
- **App → PostgreSQL**: `postgres:5432`
- **App → MongoDB**: `mongodb:27017`
- **App → Redis**: `redis:6379`

## 📱 Access from Host Machine

Services are exposed to host machine as configured in `docker-compose.yml`. Use `localhost` with the specified ports.

## 🔧 Custom Configuration

### Environment Variables
Copy `.env.example` to `.env` and modify as needed.

### Custom Ports
Edit `ports` section in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change to port 8080
```

### Resource Limits
Add resource constraints to services:
```yaml
services:
  school-app:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## 📦 Production Deployment

For production, consider:
- Use environment-specific `.env` file
- Enable SSL/TLS certificates
- Configure proper backup strategies
- Set up monitoring and alerting
- Use external database services
- Implement proper logging

## 🆘 Support

### Common Issues
1. **Docker not installed**: Install Docker Desktop
2. **Ports in use**: Change ports in docker-compose.yml
3. **Insufficient RAM**: Close other applications
4. **Permission issues**: Run with sudo if needed

### Getting Help
- Check logs: `docker-compose logs <service>`
- Verify configuration: `docker-compose config`
- Network issues: `docker network ls`

---

**🎉 Your complete School ERP environment is ready!**

**Access your application at: http://localhost:3000**
