# Inventory Email Reporting System

This system allows you to send inventory summary reports to merchants via email using SendGrid.

## Features

- 📧 Send inventory reports to individual merchants or all merchants at once
- 📊 Automated scheduling with cron jobs (every weekday at 9 AM)
- 🔄 Queue-based email processing with retry logic for reliability
- 📈 Support for large-scale email sending (1000+ merchants)
- 🎨 Beautiful HTML email templates with inventory summaries

## Prerequisites

1. **SendGrid Account**: Sign up at [SendGrid](https://sendgrid.com)
2. **Redis**: Required for the Bull queue system

### Installing Redis

#### Windows:
```bash
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

#### macOS:
```bash
brew install redis
brew services start redis
```

#### Linux:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

## Setup Guide

### 1. Configure SendGrid

1. Log in to your SendGrid account at [https://app.sendgrid.com](https://app.sendgrid.com)

2. **Create an API Key:**
   - Navigate to **Settings** → **API Keys**
   - Click **Create API Key**
   - Choose **Full Access** or at minimum **Mail Send** permissions
   - Copy the API key (you won't be able to see it again!)

3. **Verify a Sender Identity:**
   - Navigate to **Settings** → **Sender Authentication**
   - Choose either:
     - **Single Sender Verification**: Verify a single email address
     - **Domain Authentication**: Verify your entire domain (recommended for production)
   - Follow the verification steps

### 2. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update your `.env` file with your SendGrid credentials:
```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Important:** Make sure `SENDGRID_FROM_EMAIL` matches a verified sender in your SendGrid account!

### 3. Database Migration

Add the merchants table to your database:

```bash
# The Merchant entity will be automatically created when you start the application
npm run start:dev
```

### 4. Start Redis

Make sure Redis is running before starting the application:

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it:
# Windows: redis-server
# macOS/Linux: redis-server or sudo systemctl start redis
```

## API Endpoints

### Merchant Management

#### Create a Merchant
```http
POST /merchants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "companyName": "Acme Corp",
  "receiveReports": true
}
```

#### Get All Merchants
```http
GET /merchants
Authorization: Bearer <token>
```

#### Update a Merchant
```http
PATCH /merchants/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiveReports": false
}
```

#### Delete a Merchant
```http
DELETE /merchants/:id
Authorization: Bearer <token>
```

### Inventory Reports

#### Get Inventory Summary
```http
GET /reports/inventory-summary
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "itemName": "Widget A",
    "remainingQty": 150
  },
  {
    "itemName": "Widget B",
    "remainingQty": 75
  }
]
```

#### Send Report to Specific Merchant
```http
POST /reports/send-to-merchant/:merchantId
Authorization: Bearer <token>
```

Response:
```json
{
  "message": "Inventory report queued successfully",
  "merchantId": "uuid-here"
}
```

#### Send Reports to All Active Merchants
```http
POST /reports/send-to-all
Authorization: Bearer <token>
```

Response:
```json
{
  "message": "Inventory reports queued successfully",
  "totalMerchants": 1000,
  "queued": 1000
}
```

#### Get Report Statistics
```http
GET /reports/stats
Authorization: Bearer <token>
```

Response:
```json
{
  "totalMerchants": 1000,
  "activeMerchants": 950,
  "inventoryItems": 150,
  "emailQueue": {
    "waiting": 10,
    "active": 5,
    "completed": 985,
    "failed": 0
  }
}
```

### Email Queue Status

#### Get Queue Statistics
```http
GET /email/queue-stats
Authorization: Bearer <token>
```

## Automated Scheduling

The system automatically sends inventory reports using a cron job.

**Default Schedule:** Monday to Friday at 9:00 AM

To customize the schedule, edit [reports.service.ts](src/reports/reports.service.ts):

```typescript
// Current schedule
@Cron(CronExpression.MONDAY_TO_FRIDAY_AT_9AM)

// Other examples:
@Cron(CronExpression.EVERY_DAY_AT_9AM)  // Daily at 9 AM
@Cron('0 9 * * 1')  // Every Monday at 9 AM
@Cron('0 0 1 * *')  // First day of every month at midnight
```

## Testing the System

### 1. Create Test Merchants

```bash
# Using curl
curl -X POST http://localhost:3000/merchants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Merchant",
    "email": "your-test-email@example.com",
    "receiveReports": true
  }'
```

### 2. Test Single Email

```bash
curl -X POST http://localhost:3000/reports/send-to-merchant/MERCHANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check Queue Status

```bash
curl http://localhost:3000/email/queue-stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Architecture

### Components

1. **EmailService**: Handles SendGrid integration and email formatting
2. **EmailProcessor**: Bull queue worker that processes emails with retry logic
3. **MerchantsService**: Manages merchant data and preferences
4. **ReportsService**: Generates inventory reports and coordinates email sending

### Email Queue Flow

```
┌─────────────────┐
│  API Request    │
│ (Send Reports)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ReportsService  │
│ - Get Merchants │
│ - Get Inventory │
│ - Generate HTML │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EmailService   │
│ Queue Batch     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Bull Queue    │
│  (Redis-based)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ EmailProcessor  │
│ - Retry Logic   │
│ - Rate Limiting │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    SendGrid     │
│   Send Email    │
└─────────────────┘
```

## Handling Large Scale (1000+ Merchants)

The system is designed to handle large-scale email sending efficiently:

1. **Queue-Based Processing**: Emails are queued and processed asynchronously
2. **Retry Logic**: Failed emails are automatically retried (3 attempts with exponential backoff)
3. **Rate Limiting**: SendGrid respects rate limits through queue throttling
4. **Batch Operations**: Emails are added to the queue in bulk for efficiency
5. **Monitoring**: Queue statistics help track progress and identify issues

### SendGrid Limits

- **Free Tier**: 100 emails/day
- **Essentials**: 40,000-100,000 emails/month
- **Pro**: 1.5M+ emails/month

For 1000+ merchants, you'll need at least the **Essentials** plan.

## Troubleshooting

### Emails Not Sending

1. **Check SendGrid API Key:**
   ```bash
   # Verify API key is set
   echo $SENDGRID_API_KEY
   ```

2. **Verify Sender Email:**
   - Make sure the sender email is verified in SendGrid
   - Check **Settings** → **Sender Authentication**

3. **Check Redis Connection:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

4. **Check Queue Status:**
   ```bash
   curl http://localhost:3000/email/queue-stats \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. **Check Application Logs:**
   - Look for SendGrid errors in the console output
   - Check failed job details in Bull queue

### Common Errors

**"Sender email not verified"**
- Solution: Verify your sender email in SendGrid settings

**"Redis connection refused"**
- Solution: Make sure Redis is running: `redis-server`

**"Queue stuck"**
- Solution: Restart Redis and the application

## Production Considerations

1. **Use Domain Authentication**: Verify your domain with SendGrid for better deliverability
2. **Monitor Queue**: Set up alerts for failed jobs
3. **Scale Redis**: Use Redis Cluster for high availability
4. **Rate Limiting**: Configure Bull queue concurrency based on your SendGrid plan
5. **Email Templates**: Consider using SendGrid templates for easier management
6. **Logging**: Implement proper logging and monitoring
7. **Unsubscribe**: Add unsubscribe links to comply with email regulations

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENDGRID_API_KEY` | Yes | - | Your SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Yes | - | Verified sender email address |
| `REDIS_HOST` | No | localhost | Redis server host |
| `REDIS_PORT` | No | 6379 | Redis server port |

## Support

For issues or questions:
1. Check SendGrid documentation: https://docs.sendgrid.com
2. Review Bull queue docs: https://github.com/OptimalBits/bull
3. Check application logs for specific errors
