# Content Broadcasting System

Backend-only Content Broadcasting System for teachers, principals, and student-facing live content access.

## Tech stack

- Node.js 20+
- Express.js
- MySQL
- JWT authentication
- bcrypt password hashing
- Multer file uploads with local storage or optional S3 storage
- Redis caching for the public live API, optional
- Express rate limiting for the public live API

## Features

- Principal and teacher authentication
- Role-based access control
- Teacher content upload with subject, file, description, start time, end time, and rotation duration
- JPG, PNG, and GIF upload validation
- 10 MB default upload size limit
- Principal approval and rejection workflow
- Rejection reason storage
- Teacher status view for uploaded content
- Principal list, pending list, pagination, and filters
- Teacher-specific public live API
- Optional subject filter on the live API
- Independent subject-wise rotation
- Edge-case handling for no approved content, inactive schedules, and invalid subjects
- Subject-wise usage analytics
- Optional S3 cloud file storage
- OpenAPI and Postman documentation

## Folder structure

```text
src/
  config/          Database and environment config
  controllers/     Request handlers
  middlewares/     Auth, RBAC, validation, upload, rate limit, errors
  models/          Database access layer
  routes/          API route definitions
  services/        Business logic
  utils/           Shared helpers and constants
migrations/        SQL migrations
scripts/           Migration and seed scripts
docs/              OpenAPI documentation
postman/           Postman collection
uploads/           Local upload storage
```

## Setup with Docker

```bash
cp .env.example .env
docker compose up --build
```

In another terminal, seed users:

```bash
docker compose exec app npm run seed
```

The API will be available at:

```text
http://localhost:4000
```

## Local setup

Start MySQL locally, then create the database and user:

```sql
CREATE DATABASE content_broadcasting_system;
CREATE USER 'content_user'@'%' IDENTIFIED BY 'content_password';
GRANT ALL PRIVILEGES ON content_broadcasting_system.* TO 'content_user'@'%';
FLUSH PRIVILEGES;
```

Install dependencies and run migrations:

```bash
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
```

## Permanent Deployment

The repository includes `render.yaml` for deploying the API as a Render web service.

For this MySQL backend, create a hosted MySQL database first and add its connection string as `DATABASE_URL` during deployment:

```text
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

The deployment start command waits for the database, runs migrations, seeds demo users, and starts the API. After deployment, the Swagger URL will be:

```text
https://YOUR-SERVICE.onrender.com/swagger/index.html
```

Local upload storage is fine for a demo, but it is not durable on free web service filesystems. For long-lived uploaded files, set `STORAGE_DRIVER=s3` and configure the S3 variables.

## Seeded users

| Role | Email | Password | Public endpoint key |
|---|---|---|---|
| Principal | principal@content-broadcasting-system.local | Principal@123 | - |
| Teacher | teacher1@content-broadcasting-system.local | Teacher@123 | teacher-1 |
| Teacher | teacher2@content-broadcasting-system.local | Teacher@123 | teacher-2 |
| Teacher | teacher3@content-broadcasting-system.local | Teacher@123 | teacher-3 |

The exact numeric IDs depend on the database state. The seed script prints the created or existing users and their public slugs.

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | HTTP server port |
| `PUBLIC_BASE_URL` | Base URL used to build file URLs |
| `DATABASE_URL` | MySQL connection string, for example `mysql://user:password@host:3306/database` |
| `MYSQLHOST` | MySQL host when `DATABASE_URL` is not set |
| `MYSQLPORT` | MySQL port when `DATABASE_URL` is not set |
| `MYSQLDATABASE` | MySQL database name when `DATABASE_URL` is not set |
| `MYSQLUSER` | MySQL user when `DATABASE_URL` is not set |
| `MYSQLPASSWORD` | MySQL password when `DATABASE_URL` is not set |
| `MYSQL_SSL` | Set to `true` or `require` for hosted MySQL providers that require TLS |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry, for example `7d` |
| `STORAGE_DRIVER` | `local` or `s3`. Defaults to `local` |
| `UPLOAD_DIR` | Local upload directory used when `STORAGE_DRIVER=local` |
| `MAX_FILE_SIZE_MB` | Maximum upload size in MB |
| `DEFAULT_ROTATION_MINUTES` | Default duration for one content item in a subject cycle |
| `PUBLIC_RATE_LIMIT_PER_MINUTE` | Public live API requests per minute per IP |
| `REDIS_URL` | Optional Redis URL. Leave empty to disable Redis caching |
| `LIVE_CACHE_TTL_SECONDS` | Cache TTL for `/content/live` responses |
| `AWS_REGION` | AWS region used by the S3 client |
| `AWS_ACCESS_KEY_ID` | Optional local AWS access key. In production, an IAM role can be used instead |
| `AWS_SECRET_ACCESS_KEY` | Optional local AWS secret key |
| `AWS_SESSION_TOKEN` | Optional temporary AWS session token, supported by the AWS SDK default credential chain |
| `AWS_S3_BUCKET` | S3 bucket name, required when `STORAGE_DRIVER=s3` |
| `AWS_S3_PREFIX` | S3 object key prefix for uploaded content |
| `AWS_S3_PUBLIC_BASE_URL` | Optional public CDN or bucket base URL used when signed URLs are disabled |
| `AWS_S3_ENDPOINT` | Optional custom endpoint for LocalStack, MinIO, or S3-compatible storage |
| `AWS_S3_FORCE_PATH_STYLE` | Set to `true` for many S3-compatible/local endpoints |
| `AWS_S3_ACL` | Optional object ACL such as `public-read`; leave empty for buckets with ACLs disabled |
| `AWS_S3_SIGNED_URLS` | `true` by default. Returns temporary signed GET URLs for S3 objects |
| `AWS_S3_SIGNED_URL_EXPIRES_SECONDS` | Signed file URL expiry in seconds. Defaults to `900` |

## Storage configuration

### Local storage

Local storage is enabled by default:

```env
STORAGE_DRIVER=local
UPLOAD_DIR=uploads/content
PUBLIC_BASE_URL=http://localhost:4000
```

Uploaded files are written to `uploads/content` and served through `/uploads`.

### S3 storage

Switch to S3 by setting:

```env
STORAGE_DRIVER=s3
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_PREFIX=content-broadcasting-system-content
AWS_S3_SIGNED_URLS=true
```

For local development, provide `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. On AWS-hosted deployments, the AWS SDK can use an instance/task role or another default credential provider. With `AWS_S3_SIGNED_URLS=true`, API responses return temporary signed file URLs so the bucket can remain private.

To serve through a public bucket or CDN instead, set `AWS_S3_SIGNED_URLS=false` and provide `AWS_S3_PUBLIC_BASE_URL`, for example a CloudFront distribution or public bucket URL. `AWS_S3_ENDPOINT` and `AWS_S3_FORCE_PATH_STYLE=true` are included for LocalStack, MinIO, or other S3-compatible storage. `AWS_S3_ACL` is optional and should stay empty when the bucket has ACLs disabled.

## API quick start

### Swagger UI

Open the hosted Swagger UI at:

```text
http://localhost:4000/swagger/index.html
```

The raw OpenAPI file is still available at:

```text
http://localhost:4000/docs/openapi.yaml
```

## Frontend demo console

The frontend demo is kept outside this backend repository at:

```text
~/Desktop/Content Broadcasting System frontend
```

Open `~/Desktop/Content Broadcasting System frontend/index.html` in a browser, or serve it with a tiny static server:

```bash
cd "$HOME/Desktop/Content Broadcasting System frontend"
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

Use it to demonstrate the backend flow end to end: health check, principal and teacher login, content upload, teacher status, principal approval or rejection, schedule update, public live content, and analytics. The `Run Demo Flow` button uses the seeded accounts and generates a PNG upload automatically. The API base field defaults to `http://localhost:4000` and can be changed in the UI.

Start the backend as usual:

```bash
npm run migrate
npm run seed
npm run dev
```

### Health check

```bash
curl http://localhost:4000/health
```

### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"principal@content-broadcasting-system.local","password":"Principal@123"}'
```

Use the returned token as:

```text
Authorization: Bearer <token>
```

### Principal creates a teacher

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <principal_token>" \
  -d '{"name":"Teacher Four","email":"teacher4@content-broadcasting-system.local","password":"Teacher@123","role":"teacher"}'
```

### Teacher uploads content

```bash
curl -X POST http://localhost:4000/api/content \
  -H "Authorization: Bearer <teacher_token>" \
  -F "title=Algebra Practice" \
  -F "subject=maths" \
  -F "description=Class 8 worksheet" \
  -F "start_time=2026-04-25T09:00:00+05:30" \
  -F "end_time=2026-04-30T18:00:00+05:30" \
  -F "rotation_duration_minutes=5" \
  -F "file=@/path/to/file.png"
```

Upload response status is `pending`. A schedule row is created immediately, but content is only live after principal approval and only inside the configured time window.

### Teacher views uploaded content status

```bash
curl http://localhost:4000/api/content/mine \
  -H "Authorization: Bearer <teacher_token>"
```

### Principal views pending content

```bash
curl http://localhost:4000/api/content/pending \
  -H "Authorization: Bearer <principal_token>"
```

### Principal approves content

```bash
curl -X PATCH http://localhost:4000/api/content/1/approve \
  -H "Authorization: Bearer <principal_token>"
```

### Principal rejects content

```bash
curl -X PATCH http://localhost:4000/api/content/1/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <principal_token>" \
  -d '{"reason":"Please upload a clearer image."}'
```

### Teacher updates schedule

```bash
curl -X PATCH http://localhost:4000/api/content/1/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{"start_time":"2026-04-25T09:00:00+05:30","end_time":"2026-04-30T18:00:00+05:30","rotation_duration_minutes":10}'
```

### Public live content API

Teacher-specific endpoint:

```bash
curl http://localhost:4000/content/live/teacher-1
```

Subject-specific endpoint:

```bash
curl "http://localhost:4000/content/live/teacher-1?subject=maths"
```

The API also supports `/api/content/live/teacher-1`.

When no live content exists, the response is:

```json
{
  "success": true,
  "message": "No content available",
  "data": null
}
```

## Scheduling and rotation behavior

Each teacher has independent subject slots. For example, Teacher 1 Maths and Teacher 2 Maths do not share a rotation cycle.

Only content that matches all of these rules can appear in the public live API:

1. Uploaded by the requested teacher.
2. Status is `approved`.
3. Has both `start_time` and `end_time`.
4. Current time is inside the start and end window.
5. Has a schedule row for its teacher and subject slot.

The scheduler sorts active content in a subject by `rotation_order`. It sums the item durations to form a cycle, calculates the current offset inside that cycle, and returns the matching item. When the cycle reaches the end, it loops continuously.

If no subject is provided, the public endpoint returns the active item for each currently live subject. If a subject is provided, it returns the active item for only that subject.

## Principal filters

```bash
curl "http://localhost:4000/api/content?status=approved&subject=maths&page=1&limit=20" \
  -H "Authorization: Bearer <principal_token>"
```

Supported filters:

- `status`
- `subject`
- `teacher_id`
- `page`
- `limit`

## Analytics

Subject-wise analytics:

```bash
curl "http://localhost:4000/api/analytics/subjects?from=2026-04-01&to=2026-05-01" \
  -H "Authorization: Bearer <principal_token>"
```

Content usage analytics:

```bash
curl http://localhost:4000/api/analytics/content/1 \
  -H "Authorization: Bearer <principal_token>"
```

Analytics events are recorded when the public API returns live content.

## API documentation

- OpenAPI file: `docs/openapi.yaml`
- Postman collection: `postman/Content-Broadcasting-System.postman_collection.json`
- Local OpenAPI URL after the server starts: `http://localhost:4000/docs/openapi.yaml`
- Local Postman collection URL after the server starts: `http://localhost:4000/postman/Content-Broadcasting-System.postman_collection.json`

## Run tests

```bash
npm test
```

The included test file covers rotation selection for multiple content items and loop behavior.
