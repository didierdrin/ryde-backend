# Railway Deployment Setup

## Environment Variables to Set in Railway

Go to your Railway project → Variables tab and add these:

### Required Variables

1. **DATABASE_URL**
   ```
   postgresql://neondb_owner:npg_FrO9ghpAHw0D@ep-delicate-butterfly-agxf8267-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

2. **JWT_SECRET**
   ```
   Generate a strong random string (at least 32 characters)
   Example: openssl rand -base64 32
   ```

3. **CORS_ORIGIN**
   ```
   Add your frontend URLs (comma-separated, no spaces)
   Example: https://your-dashboard.com,https://your-mobile-app.com
   ```

### Optional Variables

- **NODE_ENV**: Set to `production` (Railway may set this automatically)
- **PORT**: Railway sets this automatically, don't override it
- **JWT_EXPIRES_IN**: Default is `7d` (optional)

### Export PDF email (Resend)

Add these on the **ryde-backend** Railway service (not the frontend):

| Variable | Value |
|----------|--------|
| `RESEND_API_KEY` | `re_…` from [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM` | `onboarding@resend.dev` (testing) or your verified domain address |

Optional:

- `EXPORT_BODY_LIMIT` — default `15mb` (large PDF uploads)
- `EXPORT_PDF_MAX_BYTES` — default `10485760` (10 MB decoded PDF cap)

After changing variables, **redeploy** the backend. Verify while logged in:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://ryde-backend-production.up.railway.app/api/export/status
```

Expect: `{"emailConfigured":true,...}`

**Resend testing:** with `onboarding@resend.dev`, mail only delivers to the email on your Resend account until you verify a custom domain.

## Railway Configuration

1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Root Directory**: `ryde-backend` (if deploying from monorepo)

## Database Migrations

Run migrations after deployment:

```bash
# Connect to Railway CLI or use Railway dashboard terminal
npm run migrate
```

Or run migrations manually via Railway's database connection.

## Health Check

After deployment, test the API:
```bash
curl https://ryde-backend-production.up.railway.app/api/health
```

## Notes

- Railway automatically sets `PORT` environment variable
- Make sure `CORS_ORIGIN` includes your frontend domains
- Use HTTPS URLs in `CORS_ORIGIN` for production
- Keep `JWT_SECRET` secure and never commit it to git
