import { NextRequest, NextResponse } from 'next/server';
import { Webhook, WebhookLog, Lead } from '@/lib/mongodb/client';
import { webhookLeadSchema } from '@/lib/security/validation';
import crypto from 'crypto';

// POST /api/webhooks/receive/[id] - Receive webhook data
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now();
  const webhookId = params.id;
  
  try {
    // Find the webhook
    const webhook = await Webhook.findById(webhookId);
    if (!webhook || !webhook.isActive) {
      return NextResponse.json(
        { error: 'Webhook not found or inactive' },
        { status: 404 }
      );
    }

    // Get request details
    const method = request.method;
    const url = request.url;
    const headers = Object.fromEntries(request.headers.entries());
    const userAgent = headers['user-agent'] || '';
    const ipAddress = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
    
    let body: any;
    let rawBody: string;
    
    try {
      rawBody = await request.text();
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (error) {
      // Log the failed request
      await WebhookLog.create({
        webhookId,
        workspaceId: webhook.workspaceId,
        method,
        url,
        headers,
        body: rawBody,
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: 'Invalid JSON payload',
        userAgent,
        ipAddress
      });

      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Verify webhook signature if secret is provided in headers
    const signature = headers['x-webhook-signature'] || headers['x-hub-signature-256'];
    if (signature && webhook.secret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhook.secret)
        .update(rawBody)
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      if (expectedSignature !== providedSignature) {
        await WebhookLog.create({
          webhookId,
          workspaceId: webhook.workspaceId,
          method,
          url,
          headers,
          body,
          processingTime: Date.now() - startTime,
          success: false,
          errorMessage: 'Invalid webhook signature',
          userAgent,
          ipAddress
        });

        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Transform the data based on webhook type
    let leadData: any;
    
    try {
      leadData = transformWebhookData(body, webhook.webhookType, webhook.transformationRules);
    } catch (error) {
      await WebhookLog.create({
        webhookId,
        workspaceId: webhook.workspaceId,
        method,
        url,
        headers,
        body,
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: `Data transformation failed: ${error.message}`,
        userAgent,
        ipAddress
      });

      return NextResponse.json(
        { error: 'Data transformation failed' },
        { status: 400 }
      );
    }

    // Validate the transformed lead data
    const validationResult = webhookLeadSchema.safeParse(leadData);
    if (!validationResult.success) {
      await WebhookLog.create({
        webhookId,
        workspaceId: webhook.workspaceId,
        method,
        url,
        headers,
        body,
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        userAgent,
        ipAddress
      });

      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // Create the lead
    const lead = await Lead.create({
      workspaceId: webhook.workspaceId,
      name: validationResult.data.name,
      email: validationResult.data.email,
      phone: validationResult.data.phone,
      company: validationResult.data.company,
      source: validationResult.data.source || webhook.webhookType,
      value: validationResult.data.value || 0,
      status: 'new',
      customFields: validationResult.data.custom_fields || {},
      createdBy: webhook.createdBy,
      notes: `Created via ${webhook.name} webhook`
    });

    // Update webhook statistics
    await Webhook.findByIdAndUpdate(webhookId, {
      $inc: { 
        totalRequests: 1,
        successfulRequests: 1
      },
      lastTriggered: new Date()
    });

    // Log successful request
    await WebhookLog.create({
      webhookId,
      workspaceId: webhook.workspaceId,
      method,
      url,
      headers,
      body,
      responseStatus: 200,
      responseBody: { success: true, leadId: lead._id },
      processingTime: Date.now() - startTime,
      success: true,
      leadId: lead._id.toString(),
      userAgent,
      ipAddress
    });

    return NextResponse.json({
      success: true,
      leadId: lead._id,
      message: 'Lead created successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Update webhook statistics for failed request
    await Webhook.findByIdAndUpdate(webhookId, {
      $inc: { 
        totalRequests: 1,
        failedRequests: 1
      }
    });

    // Log failed request
    try {
      await WebhookLog.create({
        webhookId,
        workspaceId: webhook?.workspaceId || 'unknown',
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        body: {},
        processingTime: Date.now() - startTime,
        success: false,
        errorMessage: error.message || 'Internal server error',
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Transform webhook data based on the webhook type
function transformWebhookData(data: any, webhookType: string, customRules?: any): any {
  // Apply custom transformation rules first
  if (customRules && Object.keys(customRules).length > 0) {
    return applyCustomTransformation(data, customRules);
  }

  // Default transformations based on webhook type
  switch (webhookType) {
    case 'facebook_leads':
      return transformFacebookLeads(data);
    case 'google_forms':
      return transformGoogleForms(data);
    case 'zapier':
      return transformZapier(data);
    case 'mailchimp':
      return transformMailchimp(data);
    case 'hubspot':
      return transformHubspot(data);
    case 'salesforce':
      return transformSalesforce(data);
    default:
      return data; // For custom webhooks, use data as-is
  }
}

function transformFacebookLeads(data: any): any {
  // Facebook Lead Ads format
  const leadData = data.entry?.[0]?.changes?.[0]?.value?.leadgen_id ? 
    data.entry[0].changes[0].value : data;

  return {
    name: `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || leadData.full_name,
    email: leadData.email,
    phone: leadData.phone_number,
    company: leadData.company_name,
    source: 'facebook_leads',
    custom_fields: {
      facebook_lead_id: leadData.leadgen_id || leadData.id,
      ad_id: leadData.ad_id,
      form_id: leadData.form_id,
      ...leadData.custom_fields
    }
  };
}

function transformGoogleForms(data: any): any {
  // Google Forms format
  return {
    name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    email: data.email,
    phone: data.phone,
    company: data.company,
    source: 'google_forms',
    custom_fields: data.custom_fields || {}
  };
}

function transformZapier(data: any): any {
  // Zapier typically sends clean data
  return {
    name: data.name || data.full_name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    source: 'zapier',
    value: data.value,
    custom_fields: data.custom_fields || {}
  };
}

function transformMailchimp(data: any): any {
  // Mailchimp subscriber data
  const mergeFields = data.merge_fields || {};
  return {
    name: `${mergeFields.FNAME || ''} ${mergeFields.LNAME || ''}`.trim(),
    email: data.email_address,
    phone: mergeFields.PHONE,
    company: mergeFields.COMPANY,
    source: 'mailchimp',
    custom_fields: {
      mailchimp_id: data.id,
      status: data.status,
      ...mergeFields
    }
  };
}

function transformHubspot(data: any): any {
  // HubSpot contact data
  const properties = data.properties || {};
  return {
    name: `${properties.firstname || ''} ${properties.lastname || ''}`.trim(),
    email: properties.email,
    phone: properties.phone,
    company: properties.company,
    source: 'hubspot',
    custom_fields: {
      hubspot_id: data.id,
      ...properties
    }
  };
}

function transformSalesforce(data: any): any {
  // Salesforce lead data
  return {
    name: `${data.FirstName || ''} ${data.LastName || ''}`.trim(),
    email: data.Email,
    phone: data.Phone,
    company: data.Company,
    source: 'salesforce',
    custom_fields: {
      salesforce_id: data.Id,
      lead_source: data.LeadSource,
      ...data
    }
  };
}

function applyCustomTransformation(data: any, rules: any): any {
  // Apply custom transformation rules
  const result: any = {};
  
  for (const [targetField, sourceField] of Object.entries(rules)) {
    if (typeof sourceField === 'string') {
      // Simple field mapping
      result[targetField] = getNestedValue(data, sourceField);
    } else if (typeof sourceField === 'object' && sourceField.path) {
      // Complex field mapping with transformations
      let value = getNestedValue(data, sourceField.path);
      
      if (sourceField.transform) {
        // Apply transformation function (basic string operations)
        switch (sourceField.transform) {
          case 'uppercase':
            value = value?.toString().toUpperCase();
            break;
          case 'lowercase':
            value = value?.toString().toLowerCase();
            break;
          case 'trim':
            value = value?.toString().trim();
            break;
        }
      }
      
      result[targetField] = value;
    }
  }
  
  return result;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
