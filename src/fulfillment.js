// Database fulfillment for purchases. All functions take the service-role
// admin client (RLS is bypassed server-side). Enum values match the project's
// schema: order_status='paid', entitlement_source='order', product_type='digital'.

/** Load an active product and its active price by slug. */
export async function getProductWithPrice(admin, slug) {
  const { data: product } = await admin
    .from('products')
    .select('id, slug, name, description, type, active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (!product) return null;

  const { data: price } = await admin
    .from('prices')
    .select('id, product_id, unit_amount, currency, interval, active')
    .eq('product_id', product.id)
    .eq('active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!price) return null;

  return { product, price };
}

/** Record a completed one-time purchase: order + order_item + entitlement. */
export async function recordPurchase(admin, { session, product, price, customerId, receiptUrl }) {
  const amount = session.amount_total ?? price.unit_amount;
  const currency = session.currency ?? price.currency;
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { data: order, error: oErr } = await admin
    .from('orders')
    .insert({
      customer_id: customerId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      amount_total: amount,
      currency,
      status: 'paid',
      description: product.name,
      receipt_url: receiptUrl ?? null,
    })
    .select('id')
    .single();
  if (oErr) throw new Error('orders insert: ' + oErr.message);

  const { error: iErr } = await admin.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    price_id: price.id,
    description: product.name,
    quantity: 1,
    amount,
  });
  if (iErr) throw new Error('order_items insert: ' + iErr.message);

  const { error: eErr } = await admin.from('entitlements').insert({
    customer_id: customerId,
    product_id: product.id,
    source: 'order',
    source_id: session.id,
  });
  if (eErr) throw new Error('entitlements insert: ' + eErr.message);

  return order.id;
}

/** List a customer's active entitlements with their product details. */
export async function listEntitlements(admin, customerId) {
  const { data } = await admin
    .from('entitlements')
    .select('id, granted_at, source, products(name, slug, description)')
    .eq('customer_id', customerId)
    .is('revoked_at', null)
    .order('granted_at', { ascending: false });
  return data ?? [];
}
