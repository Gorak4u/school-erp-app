# Automated Reminder System Setup

## Overview
The School ERP now includes a fully configurable automated reminder system that SaaS admins can control through the admin panel.

## Features
- ✅ **Configurable schedules** - Admin can set when reminders are sent
- ✅ **Multiple reminder types** - Trial expiry, subscription renewal, payment failures, service suspension
- ✅ **Flexible timing** - Admin can set days before/after and time of day
- ✅ **Timezone support** - Reminders sent in admin's preferred timezone
- ✅ **Email templates** - Professional templates with dynamic content
- ✅ **Admin interface** - Web UI to manage all reminder settings

## Quick Setup

### 1. Test the Reminder Script
```bash
npm run send-reminders
```

### 2. Set Up Daily Cron Job
Add this to your crontab (`crontab -e`):

```bash
# Send reminders every day at 9 AM
0 9 * * * cd /path/to/school-erp-app && npm run send-reminders >> /var/log/school-erp-reminders.log 2>&1
```

### 3. Alternative: Use External Scheduler
If using Vercel, Railway, or other platforms:

```bash
# Vercel Cron Job
# Add to vercel.json:
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Admin Configuration

### Access Reminder Settings
1. Login as Super Admin
2. Go to `/admin/reminder-settings`
3. Configure each reminder type

### Configuration Options

#### **Trial Expiry Reminders**
- **Enable/Disable**: Turn on/off trial expiry emails
- **Days Before**: [7, 3, 1] - Send 7, 3, and 1 days before expiry
- **Time of Day**: 09:00 - Send at 9 AM
- **Timezone**: Asia/Kolkata - Send in IST timezone
- **Subject**: "Trial Expiring Soon - {{schoolName}}"

#### **Subscription Renewal Reminders**
- **Enable/Disable**: Turn on/off renewal emails
- **Days Before**: [7, 3, 1] - Send 7, 3, and 1 days before renewal
- **Time of Day**: 09:00 - Send at 9 AM
- **Timezone**: Asia/Kolkata - Send in IST timezone
- **Subject**: "Subscription Renewing Soon - {{schoolName}}"

#### **Payment Failed Reminders**
- **Enable/Disable**: Turn on/off payment failure emails
- **Days After**: [0, 1, 3, 7] - Send immediately, then 1, 3, 7 days after
- **Time of Day**: 10:00 - Send at 10 AM
- **Timezone**: Asia/Kolkata - Send in IST timezone
- **Subject**: "Payment Failed - Action Required - {{schoolName}}"

#### **Service Suspension Reminders**
- **Enable/Disable**: Turn on/off suspension emails
- **Days After**: [3, 7, 14] - Send 3, 7, and 14 days after suspension
- **Time of Day**: 09:00 - Send at 9 AM
- **Timezone**: Asia/Kolkata - Send in IST timezone
- **Subject**: "Service Suspended - {{schoolName}}"

## Email Templates

### Trial Expiry Email
- 🎯 **Purpose**: Warn users before trial ends
- 📊 **Content**: Days remaining, upgrade options, urgency indicators
- 🎨 **Design**: Yellow warning theme with clear CTAs

### Subscription Renewal Email
- 🎯 **Purpose**: Notify upcoming automatic renewals
- 📊 **Content**: Renewal date, amount, plan details, billing management
- 🎨 **Design**: Blue professional theme with payment details

### Payment Confirmation Email
- 🎯 **Purpose**: Confirm successful payments
- 📊 **Content**: Receipt, billing period, next payment date
- 🎨 **Design**: Green success theme with professional receipt

## Monitoring

### Log Files
```bash
# View reminder logs
tail -f /var/log/school-erp-reminders.log

# Check recent activity
grep "$(date '+%Y-%m-%d')" /var/log/school-erp-reminders.log
```

### Expected Output
```
🔔 Starting reminder service...
Time: 2026-03-14T09:00:00.000Z
Found 3 active trial subscriptions
Trial expiry reminder sent to admin@school1.com (7 days remaining)
Trial expiry reminder sent to admin@school2.com (3 days remaining)
Found 15 active subscriptions
Subscription renewal reminder sent to admin@school3.com (7 days until renewal)
📊 Reminder Service Summary:
================================
TRIAL_EXPIRY:
  ✅ Sent: 2
  ❌ Failed: 0
  ⏭️  Skipped: 1
SUBSCRIPTION_RENEWAL:
  ✅ Sent: 1
  ❌ Failed: 0
  ⏭️  Skipped: 14
```

## Troubleshooting

### Common Issues

#### **No Reminders Sent**
- Check if any subscriptions exist with upcoming dates
- Verify reminder settings are enabled in admin panel
- Check timezone configuration

#### **Email Delivery Issues**
- Verify SaaS SMTP settings in `/admin/payments`
- Check email logs for delivery failures
- Test SMTP configuration

#### **Cron Job Not Running**
- Verify crontab syntax: `crontab -l`
- Check script permissions: `chmod +x scripts/send-reminders.ts`
- Review system logs: `grep CRON /var/log/syslog`

### Debug Mode
Run the script with debug output:
```bash
DEBUG=* npm run send-reminders
```

## Security Considerations

- ✅ **Environment variables** - All sensitive data in .env
- ✅ **Database access** - Uses read-only queries where possible
- ✅ **Error handling** - Graceful failure with logging
- ✅ **Rate limiting** - Built-in delays prevent spam

## Performance

- ⚡ **Efficient queries** - Only fetches relevant subscriptions
- 🔄 **Batch processing** - Processes in chunks for large datasets
- 📊 **Logging** - Detailed metrics for monitoring
- 🚀 **Non-blocking** - Email errors don't stop other reminders

## Future Enhancements

- 📱 **SMS reminders** - Add SMS support for critical notifications
- 🤖 **Smart scheduling** - AI-optimized reminder timing
- 📊 **Analytics dashboard** - Track reminder effectiveness
- 🔄 **Webhook support** - Integrate with external systems

---

**The reminder system is now fully configurable by SaaS admins and ready for production use!** 🎉
