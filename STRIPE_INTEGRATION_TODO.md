# Stripe integration: remaining setup

United Tigers uses **hosted Stripe Checkout**. The shop creates an order, sends the fan to a Stripe-hosted payment page, and marks the order paid when Stripe confirms the payment.

## Values to Replace

None. All `sample_only` parameters already use real values in the existing integration:

**Files containing these parameters:**
- [src/lib/stripe.ts](src/lib/stripe.ts)

| Field | Current Value | Notes |
|-------|--------------|-------|
| mode | `payment` | Correct: kit orders are one-time payments. |
| success_url | `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}` | Real page. `siteUrl` comes from Admin → Site settings. |
| cancel_url | `${siteUrl}/checkout?cancelled=<orderId>` | Real page. Cancelling frees the reserved stock. |
| line_items | Built from the order (`price_data` with product name, size/colour, unit price in fils) | Prices come from the shop products in Admin, so no Stripe Price IDs are needed. |

## Configured Parameters

These parameters were configured in Checkout Studio and are set in the Checkout Session call.

**Files containing these parameters:**
- [src/lib/stripe.ts](src/lib/stripe.ts)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted` (installed `stripe` SDK is 18.5, below 21.0.0; after upgrading to 21+, change this to `hosted_page`) |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: true }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` |
| submit_type | `auto` |
| saved_payment_method_options | `{ payment_method_save: "enabled" }` |
| integration_identifier | `hosted_web_0001` (not in the SDK 18.5 types, so it is passed through untyped) |
| origin_context | `web` |
| payment_method_collection | Not sent: it only applies to `subscription` mode. |

### Kept alongside the Checkout Studio parameters

| Parameter | Why it stays |
|-----------|--------------|
| customer | `saved_payment_method_options` is rejected by Stripe without a customer, so one Stripe Customer is created per order from the order's name, email and phone. |
| payment_method_types | `["card"]`. The Stripe account has no payment methods switched on for AED in the dashboard, so without this every session fails. Kept by owner decision. |
| client_reference_id, metadata | Link the payment to the order. The success page and the webhook use them to mark the order paid. |

Removed: `customer_email` (the customer now carries the email), `payment_intent_data`, `expires_at` (sessions now use Stripe's default 24-hour expiry, so an abandoned payment holds stock longer unless the fan presses cancel).

## Setup

- **Keys are not in `.env`.** They are saved in the database through **Admin → Site settings → Online payments (Stripe)**: publishable key, secret key, webhook secret and currency (`AED`). No environment variables are needed for Stripe.
- **Accept online payments** must be ticked. While it is off, the shop cannot take orders at all.
- Use **CHECK STRIPE KEYS** in Site settings after saving to confirm the secret key works.
- Dependency: `stripe` (already in `package.json`).

### To do

1. **Add the webhook** (recommended). In the Stripe dashboard → Developers → Webhooks, add an endpoint for `https://t10-production.up.railway.app/api/v1/shop/stripe/webhook` with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`. Paste its signing secret (`whsec_…`) into Site settings. Without it, an order is only marked paid when the fan returns to the success page.
2. **Optional: switch on payment methods for AED** in the Stripe dashboard (Settings → Payment methods). Once Cards (and any wallets you want) are active, `payment_method_types` can be removed from [src/lib/stripe.ts](src/lib/stripe.ts) so the dashboard controls which methods show.
3. **Deploy**: commit and push so the live site uses this code.

## Files involved

No new files were created by this task. The existing integration:

- [src/lib/stripe.ts](src/lib/stripe.ts): Checkout Session creation, payment confirmation, stock release.
- [src/app/api/v1/shop/checkout/route.ts](src/app/api/v1/shop/checkout/route.ts): creates the order and returns the Stripe link.
- [src/app/api/v1/shop/stripe/webhook/route.ts](src/app/api/v1/shop/stripe/webhook/route.ts): signed webhook.
- [src/app/api/v1/shop/checkout/cancel/route.ts](src/app/api/v1/shop/checkout/cancel/route.ts): cancel and free stock.
- [src/app/checkout/success/page.tsx](src/app/checkout/success/page.tsx): confirms the session and shows the tracking number.

## How it works

1. The fan fills in the checkout form and presses **PAY AED … SECURELY**.
2. The server reserves stock, creates an order (`UNPAID`, `PENDING`), creates a Stripe Customer and a Checkout Session, and returns the Stripe link.
3. The fan pays on the Stripe-hosted page.
4. Stripe redirects to `/checkout/success`, which confirms the session. The webhook confirms it too. The order becomes `PAID` and `CONFIRMED`, and the confirmation emails go to the fan and the admin (once only).
5. If the fan cancels, or the session expires or fails, the order is cancelled and the stock is put back.
6. Fans can follow their order at `/track-order`.

## Testing

The saved keys are **live** keys, so every payment is real. To test without charging cards:

1. Save your **test** keys (`pk_test_…`, `sk_test_…`) in Site settings, plus a test webhook secret.
2. Use Stripe test cards:
   - `4242 4242 4242 4242`: succeeds
   - `4000 0025 0000 3155`: requires 3D Secure authentication
   - `4000 0000 0000 9995`: declined (insufficient funds)
   - Any future expiry date, any 3-digit CVC, any postcode.
3. Put the live keys back when finished.

## Next steps

- Update products, prices and stock in **Admin → Shop**. Checkout uses those prices directly.
- Fulfil paid orders from **Admin → Orders** (filter by payment status `PAID`).
- Order tracking is at `/track-order`, linked from the footer.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
