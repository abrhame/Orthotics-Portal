# Orthotics Portal Fixes

This document explains the issues identified and the fixes implemented to resolve them.

## Issue: PostgreSQL Collation Version Warning

The warning message `database "orthotics_portal" has no actual collation version, but a version was recorded` indicates a PostgreSQL version compatibility issue. This typically happens when:

1. A database created with one PostgreSQL version is accessed by a different version
2. There was an issue with database initialization
3. The database was moved or copied from one system to another

## Fixes Implemented

### 1. Collation Version Fix

We added the command `ALTER DATABASE orthotics_portal REFRESH COLLATION VERSION;` in multiple places:

- In the `docker-compose.yml` file for development
- In the `docker-compose.prod.yml` file for production
- As a standalone script in `backend/scripts/fix_collation.sh`
- In the `start.sh` script

### 2. Improved Docker Configuration

- Updated PostgreSQL configuration with `max_connections=200` to handle more connections
- Added `PGPASSWORD` environment variable to ensure proper database connection
- Added healthchecks for Redis to prevent connection issues
- Set `PYTHONUNBUFFERED=1` to ensure Python logs are displayed properly

### 3. Fix Scripts

- **fix-all.sh**: A comprehensive script that fixes all common issues
- **reset-db.sh**: Updated to properly find and remove the PostgreSQL volume regardless of naming
- **start.sh**: Enhanced with database collation fixes and better container status checking

## Usage Instructions

### For First-Time Setup or Complete Reset

```bash
./fix-all.sh
```

This script will:

1. Stop all containers
2. Ask if you want to reset the database (recommended for first-time setup)
3. Rebuild all containers from scratch
4. Fix collation issues
5. Run migrations
6. Create a superuser

### For Quick Start (After Setup)

```bash
./start.sh
```

This will start the application and apply the collation fix.

### If Database Issues Persist

```bash
./reset-db.sh
```

This will completely remove the database volume, allowing for a fresh start.

## Access Information

- Application: http://localhost:8000/
- Admin interface: http://localhost:8000/admin/
- Username: admin
- Password: adminpassword

## Troubleshooting

If you still encounter issues:

1. Check the logs with:

   ```bash
   docker compose logs -f
   ```

2. Ensure PostgreSQL is running properly:

   ```bash
   docker compose exec db psql -U postgres -c "\l"
   ```

3. For persistent database issues, completely reset:
   ```bash
   docker compose down -v
   docker compose up -d
   ```
