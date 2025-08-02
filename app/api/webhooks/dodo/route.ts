import { NextRequest, NextResponse } from 'next/server';
import { dodoPayments, DodoWebhookEvent } from '@/lib/dodo/client';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('dodo-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = dodoPayments.verifyWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event: DodoWebhookEvent = JSON.parse(body);

    // Handle different webhook events
    switch (event.type) {
      case 'customer.created':
        await handleCustomerCreated(event);
        break;
      
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCustomerCreated(event: DodoWebhookEvent) {
  const customer = event.data.object;
  
  // Update workspace with Dodo customer ID
  if (customer.metadata?.workspace_id) {
    await supabaseAdmin
      .from('workspaces')
      .update({ dodo_customer_id: customer.id })
      .eq('id', customer.metadata.workspace_id);
  }
}

async function handleSubscriptionCreated(event: DodoWebhookEvent) {
  const subscription = event.data.object;
  
  // Create or update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      workspace_id: subscription.metadata.workspace_id,
      dodo_subscription_id: subscription.id,
      dodo_customer_id: subscription.customer_id,
      plan_id: subscription.metadata.plan_id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      trial_end: subscription.trial_end,
    });
}

async function handleSubscriptionUpdated(event: DodoWebhookEvent) {
  const subscription = event.data.object;
  
  // Update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      trial_end: subscription.trial_end,
    })
    .eq('dodo_subscription_id', subscription.id);
}

async function handleSubscriptionCanceled(event: DodoWebhookEvent) {
  const subscription = event.data.object;
  
  // Update subscription status
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: subscription.canceled_at,
    })
    .eq('dodo_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(event: DodoWebhookEvent) {
  const invoice = event.data.object;
  
  // Log successful payment and update subscription if needed
  if (invoice.subscription_id) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
      })
      .eq('dodo_subscription_id', invoice.subscription_id);
  }
}

async function handlePaymentFailed(event: DodoWebhookEvent) {
  const invoice = event.data.object;
  
  // Update subscription status for failed payment
  if (invoice.subscription_id) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('dodo_subscription_id', invoice.subscription_id);
  }
}