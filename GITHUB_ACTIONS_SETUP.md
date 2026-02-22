# GitHub Actions: Automated Token Refresh Setup

This guide walks you through setting up automated daily token refresh using GitHub Actions.

## What This Does

```
Every day at 2 AM UTC:
  1. GitHub Actions runs the refresh workflow
  2. Script logs into your Synapse account
  3. Gets a fresh access token
  4. Updates .env file automatically
  5. Commits and pushes changes to your repo
  6. Bot picks up new token on next deployment
```

**Result:** Your bot's token refreshes automatically every day. Zero manual work after setup.

---

## Prerequisites

1. **Repository on GitHub** - Your bot code must be in a GitHub repo
2. **Bot account password** - You'll need the actual password (not token) for your bot user
3. **Access to GitHub Secrets** - Settings → Secrets and variables → Actions

---

## Step 1: Add GitHub Secrets

This is the most important step. Your secrets store sensitive credentials safely.

### Go to Repository Settings

1. Open your repository on GitHub
2. Click: **Settings** → **Secrets and variables** → **Actions**
3. Click: **New repository secret**

### Add Three Secrets

Create these three secrets (they're already in your repo, just need to add to Actions):

**Secret 1: HOMESERVER_URL**
- Name: `HOMESERVER_URL`
- Value: `https://synapse-production-ea3f.up.railway.app`
- Click: **Add secret**

**Secret 2: BOT_USERNAME**
- Name: `BOT_USERNAME`
- Value: `rathtest==`
- Click: **Add secret**

**Secret 3: BOT_PASSWORD**
- Name: `BOT_PASSWORD`
- Value: Your bot account's **PASSWORD** (not the token!)
  - This is what you use to log into Synapse web interface
  - If your bot user doesn't have a password, you'll need to set one first

---

## Step 2: Verify Files Are in Place

Check that these files exist in your repository:

```
.github/workflows/refresh-token.yml  ← GitHub Action workflow
scripts/refresh-token.js              ← Token refresh script
.env                                  ← Will be auto-updated
```

If they're missing, create them now (see "File Contents" section below).

---

## Step 3: Test the Workflow

### Manual Test (First Time)

1. Go to your repository on GitHub
2. Click: **Actions** tab
3. Click: **Daily Token Refresh** workflow
4. Click: **Run workflow** → **Run workflow**
5. Watch it run (should take ~30 seconds)

### What You'll See

✅ **Success:**
```
✅ Login successful!
   User ID: @rathtest==:synapse-production-ea3f.up.railway.app
   New token: mat_xxxxx...xxxxx

✅ .env file updated with new token
✨ Token refresh completed successfully!
```

❌ **Common Errors:**

**"Invalid password"**
- Your BOT_PASSWORD secret is wrong
- Fix: Go to Settings → Secrets → Edit BOT_PASSWORD

**"Unknown user"**
- Your BOT_USERNAME secret is wrong
- Fix: Go to Settings → Secrets → Edit BOT_USERNAME

**"ECONNREFUSED"**
- Can't reach your Synapse server
- Fix: Check HOMESERVER_URL is correct and reachable

### Check the .env File

After successful run:
1. Go to your repository
2. Open `.env` file
3. Look for `ACCESS_TOKEN=mat_xxxxx`
4. Should be different from before ✅

---

## Step 4: Schedule It

The workflow runs automatically at **2 AM UTC every day**.

To change the time, edit `.github/workflows/refresh-token.yml`:

```yaml
on:
  schedule:
    # Change this line to desired time
    - cron: '0 2 * * *'    # 2 AM UTC, every day
```

### Common Times (UTC to Local)

```
'0 2 * * *'   →  2 AM UTC  (midnight EST, 9 PM PST)
'0 3 * * *'   →  3 AM UTC  (midnight CST, 10 PM PST)
'0 8 * * *'   →  8 AM UTC  (3 AM EST, midnight PST)
'30 2 * * *'  →  2:30 AM UTC
```

[Cron schedule generator](https://crontab.guru/)

---

## Step 5: Configure Your Bot to Auto-Deploy

When `.env` is updated, you want your bot to restart with the new token.

### Option A: Railway Deploy on Push (Recommended)

If your bot is deployed on Railway:

1. Go to Railway Dashboard
2. Select your service
3. Settings → Auto-Deploy
4. Enable: "Deploy on GitHub push"

Now when the workflow pushes the new token, Railway automatically redeploys!

### Option B: Manual Deployment

```bash
# After workflow runs and pushes new token
git pull  # Get latest .env
npm start # Restart bot with new token
```

### Option C: Self-Hosted with PM2

```bash
# Add to crontab to restart bot daily (separate from token refresh)
0 2 * * * pm2 restart matrix-bot > /dev/null 2>&1
```

---

## Step 6: Monitor the Workflow

### Check Status

Go to **Actions** tab, you'll see:

```
✅ Daily Token Refresh
   Scheduled daily at 2 AM UTC
   Last run: 2 days ago
   Status: Success
```

### View Logs

Click on any run to see detailed logs:
- Login attempt
- Token generation
- .env update confirmation

### Email Notifications

GitHub can email you if workflow fails:
- Go to **Settings** → **Notifications**
- Check: "Email notifications for failed workflow runs"

---

## How It Works (Technical Details)

### The Refresh Process

```
1. GitHub Actions triggers workflow at 2 AM UTC
   ↓
2. Checkout your repository
   ↓
3. Setup Node.js environment
   ↓
4. Install matrix-bot-sdk library
   ↓
5. Run refresh-token.js script:
   - Read HOMESERVER_URL, BOT_USERNAME, BOT_PASSWORD from GitHub Secrets
   - Create MatrixClient and login with username/password
   - Synapse returns new access_token
   - Script updates .env: ACCESS_TOKEN=mat_new_token
   ↓
6. Configure Git and commit changes
   ↓
7. Push .env back to repository
   ↓
8. (If configured) Railway auto-deploys
   ↓
9. Bot restarts with new token ✅
```

### Security

- Secrets are **encrypted** at rest and in transit
- Secrets are **not printed** in logs
- Secrets are **never displayed** on GitHub UI
- Only visible to you and GitHub Actions

---

## Troubleshooting

### Workflow doesn't run automatically

**Check:**
1. Is the repository public? (free GitHub lets private repos use Actions)
2. Are GitHub Actions enabled? (Settings → Actions → Enable actions)
3. Check schedule: `cron: '0 2 * * *'` (time in UTC)

**Fix:**
```bash
git push  # Trigger workflow manually by pushing
```

### "GitHub can't find refresh-token.yml"

**Cause:** File wasn't in the repo when you enabled Actions

**Fix:**
```bash
git add .github/workflows/refresh-token.yml
git add scripts/refresh-token.js
git commit -m "Add automated token refresh"
git push
```

### .env isn't updating

**Check:**
1. Workflow ran successfully (check Actions tab)
2. GitHub Secrets are set correctly
3. BOT_PASSWORD is correct (you can log into Synapse with it)

**Debug:**
```bash
# Run script locally to test
BOT_USERNAME=rathtest== \
BOT_PASSWORD=your_password \
HOMESERVER_URL=https://synapse-production-ea3f.up.railway.app \
node scripts/refresh-token.js
```

### Bot doesn't pick up new token

**Check:**
1. New token is in `.env` file ✓
2. Did you restart the bot after workflow runs?
3. Is your bot service set to auto-deploy on git push?

**Fix for PM2:**
```bash
# Pull latest .env
git pull

# Rebuild and restart
npm run build
pm2 restart matrix-bot
```

---

## Monitoring & Alerts

### View Recently Updated Tokens

```bash
# See commit history of .env
git log --oneline -- .env

# Should show:
🔄 Automated token refresh - 2026-02-23 02:00:00 UTC
🔄 Automated token refresh - 2026-02-22 02:00:00 UTC
🔄 Automated token refresh - 2026-02-21 02:00:00 UTC
```

### Test Manually

Click "Run workflow" in Actions tab to force a refresh now:

```bash
# Manual refresh at any time
# Go to Actions → Daily Token Refresh → Run workflow
```

### Set Up Alerts

If you want to be notified when refresh fails:

1. **GitHub UI:** Settings → Notifications → Email on failed workflow
2. **Slack:** Add to chat → Install GitHub app → Subscribe to workflow
3. **Discord:** Add GitHub webhook and subscribe to actions

---

## Disabling Auto-Refresh

If you want to stop automatic refresh:

### Temporarily

Go to **Actions** → disable the workflow (toggles it off)

### Permanently

Delete these files:
```bash
rm .github/workflows/refresh-token.yml
rm scripts/refresh-token.js
git commit -m "Remove automated token refresh"
git push
```

---

## Costs

- **GitHub Actions:** Free! (includes 2,000 minutes/month)
- **This workflow:** Uses ~1 minute per day = ~30 minutes/month
- You'll never exceed the free tier ✅

---

## File Contents

If you need to recreate the files:

### `.github/workflows/refresh-token.yml`

See [refresh-token.yml](../../.github/workflows/refresh-token.yml) in the repo

### `scripts/refresh-token.js`

See [refresh-token.js](../../scripts/refresh-token.js) in the repo

---

## Checklist

- [ ] Created repository on GitHub
- [ ] Added `HOMESERVER_URL` as GitHub Secret
- [ ] Added `BOT_USERNAME` as GitHub Secret
- [ ] Added `BOT_PASSWORD` as GitHub Secret
- [ ] Verified `.github/workflows/refresh-token.yml` exists
- [ ] Verified `scripts/refresh-token.js` exists
- [ ] Ran workflow manually (Actions → Run workflow)
- [ ] Confirmed .env was updated with new token
- [ ] Restarted bot with new token
- [ ] Set up auto-deploy (Railway or other)
- [ ] Monitored first automatic run (check Actions tab tomorrow)

---

## Next Steps

1. **Today:** Set up GitHub Secrets and test the workflow
2. **Tomorrow:** Check that automatic run succeeded
3. **This week:** Verify .env is updating daily
4. **Ongoing:** Monitor Actions tab weekly

---

## Questions?

Check the [PRODUCTION_SETUP.md](../PRODUCTION_SETUP.md) guide for more context on token lifecycle and refresh strategies.
