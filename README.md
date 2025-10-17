# Blueprint - Event Management Application

A full-stack event management application built with Next.js, Node.js, MySQL, and MinIO, orchestrated with Docker.

## 🏗️ Architecture

The application consists of the following services:

- **Frontend**: Next.js application (TypeScript, React)
- **Backend**: Node.js API with Express and Prisma ORM
- **Database**: MySQL 8.0
- **Storage**: MinIO (S3-compatible object storage for images)
- **Proxy**: Nginx reverse proxy

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blueprint
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

**⚠️ IMPORTANT**: Edit the `.env` file and change the default passwords, especially:

- `JWT_SECRET` - Used for authentication tokens
- `MYSQL_ROOT_PASSWORD` - MySQL root password
- `MYSQL_PASSWORD` - Application database password
- `MINIO_SECRET_KEY` - MinIO secret key

Generate secure values using:

```bash
# For JWT_SECRET (64 characters)
openssl rand -base64 64

# For passwords (32 characters)
openssl rand -base64 32
```

### 3. Build and Start Services

```bash
docker-compose up --build
```

Or run in detached mode:

```bash
docker-compose up -d --build
```

### 4. Access the Application

Once all services are healthy:

- **Application**: http://localhost
- **MinIO Console**: http://localhost:9000

## 🛠️ Docker Commands

### Start Services

```bash
docker-compose up -d
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ deletes all data)

```bash
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild Specific Service

```bash
docker-compose up -d --build backend
```

### Check Service Status

```bash
docker-compose ps
```

### Execute Commands in Container

```bash
# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec db mysql -u blueprint -p
```

## 📁 Project Structure

```
blueprint/
├── backend/              # Node.js API
│   ├── Dockerfile
│   ├── prisma/          # Database schema and migrations
│   ├── controllers/     # API controllers
│   ├── routes/          # API routes
│   └── middleware/      # Authentication & upload middleware
├── frontend/            # Next.js application
│   ├── Dockerfile
│   └── src/            # Application source code
├── nginx/               # Reverse proxy configuration
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml   # Docker orchestration
└── .env                # Environment variables
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

| Variable           | Description                   | Default            |
| ------------------ | ----------------------------- | ------------------ |
| `PUBLIC_URL`       | Public URL of the application | `http://localhost` |
| `JWT_SECRET`       | Secret for JWT token signing  | _(must be set)_    |
| `MYSQL_DATABASE`   | MySQL database name           | `blueprint`        |
| `MYSQL_USER`       | MySQL user                    | `blueprint`        |
| `MYSQL_PASSWORD`   | MySQL password                | `blueprint`        |
| `MINIO_ACCESS_KEY` | MinIO access key              | `blueprint`        |
| `MINIO_SECRET_KEY` | MinIO secret key              | `blueprint`        |
| `MINIO_BUCKET`     | MinIO bucket name             | `blueprint`        |

### Port Configuration

Default ports:

- HTTP: `80` (nginx)
- MinIO API: `9000`
- Backend: `8000` (internal)
- Frontend: `3000` (internal)

## 🗄️ Database Management

### Run Migrations

Migrations are automatically run when the backend container starts. To run manually:

```bash
docker-compose exec backend npx prisma migrate deploy
```

### Access Database

```bash
docker-compose exec db mysql -u blueprint -p blueprint
```

## 🐛 Troubleshooting

### Services Not Starting

1. Check service status:

   ```bash
   docker-compose ps
   ```

2. View logs for errors:

   ```bash
   docker-compose logs
   ```

3. Ensure ports 80 and 9000 are not in use by other applications

### Database Connection Issues

- Wait for the database health check to pass (can take 30-40 seconds)
- Verify `DATABASE_URL` in backend logs
- Check database is running: `docker-compose ps db`

### Permission Issues (Linux/Mac)

If you encounter permission issues with volumes:

```bash
sudo chown -R $USER:$USER .
```

### Rebuild from Scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🔐 Security Notes

- **Never commit `.env` file to version control**
- Change all default passwords before deploying to production
- Use strong, randomly generated passwords
- Keep `JWT_SECRET` secure and unique per environment
- For production, use HTTPS and set `PUBLIC_URL` accordingly

## 📝 Development

### Local Development Without Docker

See individual README files:

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
