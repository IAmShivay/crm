import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const webhookPath = url.pathname;
    const webhookId = webhookPath.split('/').pop();

    if (!webhookId) {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
    }

    const payload = await request.json();

    // Process webhook using the database function
    const { data, error } = await supabaseAdmin.rpc('process_webhook_lead', {
      webhook_url: request.url,
      payload: payload,
    });

    if (error) {
      console.error('Webhook processing error:', error);
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      lead_id: data.lead_id,
      message: data.message,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET requests to return webhook info
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const webhookPath = url.pathname;
  
  return NextResponse.json({
    message: 'Lead webhook endpoint',
    url: request.url,
    method: 'POST',
    expected_fields: [
      'name or (first_name + last_name)',
      'email',
      'phone (optional)',
      'company (optional)',
      'source (optional)',
      'value (optional)',
      'status (optional)',
      'notes (optional)',
      'custom_fields (optional object)',
    ],
    example: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'Acme Corp',
      source: 'website',
      value: 5000,
      status: 'new',
      notes: 'Interested in premium plan',
      custom_fields: {
        utm_source: 'google',
        utm_campaign: 'summer2024',
      },
    },
  });
}