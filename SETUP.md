# Putting the site live

The site has two halves. The pages work anywhere. The backend (donations, the automatic
ledger, the staff area, the newsletter and contact forms) needs three free accounts.
Do these steps in order. Allow about an hour.

## 1. Supabase: the database

1. Create an account at supabase.com and start a new project. Pick a region close to
   Nigeria (for example London or Frankfurt). Save the database password somewhere safe.
2. Open **SQL Editor**, choose **New query**, paste in everything from
   `supabase/schema.sql`, and press **Run**. This creates the tables and the four
   starting opportunities.
3. Open **Authentication → Users → Add user**. Create one user for each person who
   should manage the site, with their email and a strong password.
4. Open **Authentication → Sign In / Providers** and turn **off** "Allow new users to
   sign up", so nobody can create their own account.
5. Open **Project Settings → API** and keep the page open. You will need the
   **Project URL**, the **anon public** key and the **service_role** key.

The service_role key can read and change everything. Treat it like a bank PIN:
never put it in the code, a chat, or an email.

## 2. Paystack: payments

1. Create a Paystack business account in the NGO's registered name. Paystack will ask
   for the CAC certificate and a bank account in the NGO's name.
2. Until Paystack approves the account you can use **test mode**, which takes pretend
   payments with Paystack's published test cards.
3. Open **Settings → API Keys & Webhooks** and copy the **Secret Key**.

## 3. Vercel: hosting

1. Create an account at vercel.com by signing in with GitHub.
2. Choose **Add New → Project** and import the `Posterity-Initiative-Impact` repository.
   Leave the build settings empty; there is nothing to build.
3. Before deploying, open **Environment Variables** and add these. The names are also
   listed in `.env.example`.

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | Project URL from Supabase |
   | `SUPABASE_ANON_KEY` | anon public key from Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase |
   | `ADMIN_EMAILS` | The staff emails from step 1.3, separated by commas |
   | `PAYSTACK_SECRET_KEY` | Secret key from Paystack |
   | `SITE_URL` | Your site address, such as `https://your-project.vercel.app` |

4. Press **Deploy**. Vercel gives you the site address.
5. If the address differs from what you put in `SITE_URL`, correct it and redeploy.

## 4. Connect Paystack to the site

In Paystack, under **Settings → API Keys & Webhooks**, set the **Webhook URL** to:

    https://YOUR-SITE-ADDRESS/api/paystack-webhook

This is how a completed payment reaches the ledger.

## 5. Check that it works

1. Open `/admin.html` on your site and sign in with a staff account.
2. Add a small expense, then open the Transparency page. It should be listed.
3. Make a test donation with a Paystack test card. Within a minute it should appear on
   the ledger as "Donation", with no name attached.
4. Send yourself a message from the Contact page and find it under **Messages**.

## Optional: emailed receipts

Create an account at resend.com, verify a sending domain, and add `RESEND_API_KEY` and
`EMAIL_FROM` in Vercel. Without these, donations still work; donors just get Paystack's
own receipt.

## Day to day

- **Opportunities, expenses, messages, subscribers**: manage them at `/admin.html`.
- **Donations**: nothing to do; they record themselves.
- **Page wording**: edit `tools/build.py`, run `python3 tools/build.py`, and push.

## Running it on your own computer

    node tools/dev-server.js

This serves the site at http://localhost:8787 with a temporary practice database that
resets every time it stops. The practice sign-in is in `tools/mock-supabase.js`.
