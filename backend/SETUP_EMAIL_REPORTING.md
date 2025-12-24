# Quick Start Guide: Inventory Email Reporting

## What Was Implemented

A complete email reporting system that:
- ✅ Sends inventory summary reports (item name, remaining quantity) to merchants
- ✅ Handles 1000+ merchants efficiently using a queue system
- ✅ Sends each email separately (no CC/BCC)
- ✅ Uses SendGrid for reliable email delivery
- ✅ Includes automated scheduling (weekdays at 9 AM)
- ✅ Has retry logic for failed emails
- ✅ Provides beautiful HTML email templates

## Quick Setup (3 Steps)

### Step 1: Install Redis

**Windows:**
```bash
choco install redis-64
# Then run: redis-server
```

**Mac:**
```bash
brew install redis
brew services start redis
```

### Step 2: Configure SendGrid

1. Go to [SendGrid](https://app.sendgrid.com/settings/api_keys) and create an API key
2. Verify your sender email at [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
3. Update your `.env` file:

```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 3: Start the Application

```bash
cd backend
npm run start:dev
```

The system will automatically:
- Create the merchants table
- Seed sample merchants
- Start the email queue
- Enable the scheduler

## How to Use

### 1. Add Merchants (via API)

```bash
POST /merchants
{
  "name": "John Doe",
  "email": "john@example.com",
  "companyName": "Acme Corp",
  "receiveReports": true
}
```

### 2. Send Reports

**To all merchants:**
```bash
POST /reports/send-to-all
```

**To specific merchant:**
```bash
POST /reports/send-to-merchant/:merchantId
```

### 3. Monitor Progress

```bash
GET /email/queue-stats
```

## What Each File Does

### New Modules Created:

1. **`src/email/`** - SendGrid integration and email formatting
   - `email.service.ts` - Sends emails, generates HTML templates
   - `email.processor.ts` - Processes queued emails with retry logic
   - `email.module.ts` - Email module configuration

2. **`src/merchants/`** - Merchant management
   - `merchants.service.ts` - CRUD operations for merchants
   - `entities/merchant.entity.ts` - Merchant database model
   - `merchants.controller.ts` - API endpoints

3. **`src/reports/`** - Report generation and sending
   - `reports.service.ts` - Generates inventory reports, sends emails
   - `reports.controller.ts` - API endpoints for triggering reports

### Updated Files:

- `app.module.ts` - Added new modules and Bull/Schedule configuration
- `.env.example` - Added SendGrid and Redis configuration
- `seeder.service.ts` - Added merchant seeding

### Documentation:

- `EMAIL_REPORTING.md` - Complete documentation with troubleshooting

## Testing

1. **Create a test merchant with YOUR email:**
```bash
POST /merchants
{
  "name": "Test User",
  "email": "your-email@example.com",
  "receiveReports": true
}
```

2. **Send a test report:**
```bash
POST /reports/send-to-merchant/{merchant-id}
```

3. **Check your inbox!** 📧

## Architecture Overview

```
API Request → ReportsService → EmailService → Bull Queue → EmailProcessor → SendGrid → 📧
```

- **ReportsService**: Gets inventory data, generates reports
- **EmailService**: Formats emails, manages queue
- **Bull Queue**: Stores jobs, handles retries
- **EmailProcessor**: Processes jobs, sends via SendGrid

## Common Issues

❌ **"Sender email not verified"**
- Go to SendGrid settings and verify your email

❌ **"Redis connection refused"**
- Make sure Redis is running: `redis-server`

❌ **Emails not sending**
- Check `GET /email/queue-stats` for failed jobs
- Verify API key in `.env`

## Production Checklist

Before going live with 1000+ merchants:

- [ ] Upgrade SendGrid to paid plan (Essentials or higher)
- [ ] Use domain authentication (not just single sender)
- [ ] Set up Redis persistence/clustering
- [ ] Add monitoring for failed jobs
- [ ] Test with small batches first (10-50 merchants)
- [ ] Add unsubscribe links to emails
- [ ] Configure rate limiting based on SendGrid plan

## Next Steps

1. **Customize the email template** in `email.service.ts`
2. **Adjust the schedule** in `reports.service.ts` (currently weekdays at 9 AM)
3. **Import your merchant list** via the API
4. **Test with a few merchants** before full rollout
5. **Monitor the queue** regularly

## Support

- Full documentation: [EMAIL_REPORTING.md](EMAIL_REPORTING.md)
- SendGrid docs: https://docs.sendgrid.com
- Bull queue docs: https://github.com/OptimalBits/bull

---

**Ready to send your first report?** Follow the Quick Setup above! 🚀
