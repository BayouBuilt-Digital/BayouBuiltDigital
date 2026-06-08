import Stripe from 'stripe';

/**
 * Stripe client configured for the Cloudflare Workers runtime: it uses the
 * fetch-based HTTP client instead of Node's http module.
 *
 * @param {import('hono').Context} c
 */
export function getStripe(c) {
  return new Stripe(c.env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
    appInfo: { name: 'BayouBuilt Digital', url: 'https://bayoubuilt-digital.com' },
  });
}

/**
 * Verify and parse a Stripe webhook on Workers. Signature verification must be
 * async here because it relies on the Web Crypto (SubtleCrypto) provider.
 *
 * @param {import('hono').Context} c
 * @param {string} rawBody  the exact raw request body
 * @param {string} signature  the `stripe-signature` header
 */
export async function constructWebhookEvent(c, rawBody, signature) {
  const stripe = getStripe(c);
  return stripe.webhooks.constructEventAsync(
    rawBody,
    signature,
    c.env.STRIPE_WEBHOOK_SECRET,
    undefined,
    Stripe.createSubtleCryptoProvider(),
  );
}
