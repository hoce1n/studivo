# Cron Job Setup for Renewal Reminders

This document outlines the steps to set up and secure the `renewal-reminders` cron job on a self-hosted Linux VPS. This cron job is responsible for sending push notifications for upcoming renewals and expired subscriptions, and for automatically resetting the `paymentStatus` of expired subscriptions to `unpaid`.

## 1. How the Cron Route Works

The `/api/cron/renewal-reminders` API route is a Next.js Serverless Function designed to be triggered periodically. It performs the following actions:

*   **Fetches Subscriptions**: It queries the database for active subscriptions that are either near their end date (within a configurable `maxReminderDaysBefore`, default 14 days) or have already expired.
*   **Filters Reminders**: It filters these subscriptions based on the study hall's notification settings (`renewalRemindersEnabled` and `expiryRemindersEnabled`) and the `reminderDaysBefore` threshold.
*   **Resets Payment Status**: For any active subscriptions that have expired and still have `paymentStatus` set to `paid`, it automatically updates their `paymentStatus` to `unpaid` within a Prisma transaction. This ensures that operators are aware of overdue payments for expired subscriptions.
*   **Deduplicates Notifications**: It checks `RenewalReminder` records to prevent sending duplicate notifications for the same event on the same day.
*   **Sends Push Notifications**: For eligible subscriptions, it constructs a push notification message and sends it to all `admin` and `staff` users associated with the respective study hall who have active push subscriptions.
*   **Logs Activity**: It logs the outcome of the reminder process, including the number of candidates, reminders sent, push deliveries, skipped reminders, stale subscriptions, and failed deliveries.

### Security

The route is protected by a `CRON_SECRET` environment variable. This secret must be provided in the `Authorization` header as a Bearer token. If `CRON_SECRET` is not set, the route is accessible only in a non-production environment (`NODE_ENV !== "production"`).

**Method**: The route accepts both `GET` and `POST` requests.

## 2. Setting Up the Cron Job on Linux VPS

We recommend using `crontab` for scheduling this job. `crontab` is a standard utility on Linux systems for scheduling commands to run periodically.

### Prerequisites

*   **Node.js Environment**: Ensure your Node.js application is running and accessible (e.g., via `pm2`, `systemd`, or a similar process manager).
*   **Environment Variables**: The `CRON_SECRET` environment variable must be set in your application's environment. This can be done in your `.env.local` file or directly in your process manager's configuration.

### Steps to Add the Crontab Entry

1.  **Generate a Secure `CRON_SECRET`**: Create a strong, random string to use as your `CRON_SECRET`. You can generate one using `openssl`:
    ```bash
    openssl rand -base64 32
    ```
    Copy this generated string.

2.  **Set `CRON_SECRET` in your application's environment**: Add the generated secret to your `.env.local` file (if you're using one) or configure it directly in your process manager (e.g., `pm2 setenv <APP_NAME> CRON_SECRET "YOUR_GENERATED_SECRET"`).

3.  **Open Crontab Editor**: Log in to your VPS via SSH and open your crontab for editing:
    ```bash
    crontab -e
    ```
    If prompted, choose your preferred text editor (e.g., `nano` or `vim`).

4.  **Add the Cron Entry**: Add the following line to the end of the file. This example schedules the job to run daily at 03:00 AM (server time).

    ```cron
    0 3 * * * curl -s -H 
'Authorization: Bearer YOUR_CRON_SECRET' http://localhost:3000/api/cron/renewal-reminders >> /var/log/studivo-cron.log 2>&1
    ```

    **Explanation of the cron entry:**
    *   `0 3 * * *`: This specifies the schedule. It means "at 03:00 AM every day".
        *   `0`: Minute (0-59)
        *   `3`: Hour (0-23)
        *   `*`: Day of month (1-31)
        *   `*`: Month (1-12)
        *   `*`: Day of week (0-7, where 0 or 7 is Sunday)
    *   `curl -s`: Executes a `curl` command silently (no progress meter).
    *   `-H 'Authorization: Bearer YOUR_CRON_SECRET'`: Sets the `Authorization` header with your secret token. **Remember to replace `YOUR_CRON_SECRET` with the actual secret you generated.**
    *   `http://localhost:3000/api/cron/renewal-reminders`: The URL of your cron route. **Ensure `localhost:3000` matches your application's actual address and port on the VPS.**
    *   `>> /var/log/studivo-cron.log 2>&1`: Redirects both standard output and standard error to a log file. This is crucial for debugging.

5.  **Save and Exit**: Save the crontab file (e.g., `Ctrl+X`, then `Y`, then `Enter` for `nano`).

## 3. Handling Logging

The cron job output is redirected to `/var/log/studivo-cron.log`. You can view this log file to check the execution status and any errors:

```bash
cat /var/log/studivo-cron.log
# Or to view in real-time:
tail -f /var/log/studivo-cron.log
```

Ensure the `studivo` user (or the user running the cron job) has write permissions to `/var/log/` or choose a different log directory if necessary.

## 4. Testing the Route Manually

You can test the cron route manually using `curl` from your VPS. Replace `YOUR_CRON_SECRET` with your actual secret.

```bash
curl -H 'Authorization: Bearer YOUR_CRON_SECRET' http://localhost:3000/api/cron/renewal-reminders
```

**Expected Output (Success):**

```json
{"ok":true,"candidates":X,"remindersSent":Y,"pushDeliveries":Z,"skipped":A,"staleSubscriptions":B,"failedDeliveries":C}
```

**Expected Output (Unauthorized):**

```json
{"error":"Unauthorized"}
```

If you get an unauthorized error, double-check your `CRON_SECRET` and the `Authorization` header format.

## 5. Force-Running the Cron Job

To force-run the cron job at any time, simply execute the `curl` command directly in your VPS terminal:

```bash
curl -H 'Authorization: Bearer YOUR_CRON_SECRET' http://localhost:3000/api/cron/renewal-reminders
```

This will trigger the same logic as the scheduled cron job. Remember to check the log file (`/var/log/studivo-cron.log`) for output.

## 6. Payment Status Reset Logic (Bonus)

The `renewal-reminders` cron job now includes logic to automatically reset the `paymentStatus` of expired subscriptions. When the cron job runs, it will:

1.  Identify all active subscriptions whose `endDate` is in the past.
2.  If any of these expired subscriptions have `paymentStatus` set to `paid`, it will update their `paymentStatus` to `unpaid`.
3.  This update happens within a Prisma transaction to ensure data consistency.

This ensures that operators are automatically alerted to expired subscriptions that still show as `paid`, prompting them to follow up on outstanding payments or update the subscription status manually if needed.
