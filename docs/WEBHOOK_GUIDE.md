# Webhook Integration Guide

This guide explains how to set up and use webhooks in the CRM system to automatically receive leads from external sources.

## Overview

Webhooks allow external services to send lead data directly to your CRM workspace. When a webhook receives data, it automatically creates a new lead in your system.

## Supported Webhook Types

### 1. Facebook Lead Ads
Receive leads directly from Facebook Lead Ads campaigns.

**Setup:**
1. Create a webhook with type "facebook_leads"
2. Use the generated webhook URL in your Facebook Lead Ads configuration
3. Configure the webhook to receive "lead.created" events

**Data Format:**
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "leadgen_id": "123456789",
            "first_name": "John",
            "last_name": "Smith",
            "email": "john@example.com",
            "phone_number": "+1234567890",
            "company_name": "Acme Corp"
          }
        }
      ]
    }
  ]
}
```

### 2. Google Forms
Receive form submissions from Google Forms.

**Setup:**
1. Create a webhook with type "google_forms"
2. Configure Google Forms to send data to the webhook URL
3. Use Google Apps Script or Zapier for integration

**Data Format:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp"
}
```

### 3. Zapier Integration
Connect with 5000+ apps through Zapier.

**Setup:**
1. Create a webhook with type "zapier"
2. Use the webhook URL in your Zapier workflow
3. Configure Zapier to send lead data in the expected format

### 4. Mailchimp
Sync new subscribers from Mailchimp lists.

**Data Format:**
```json
{
  "email_address": "john@example.com",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "John",
    "LNAME": "Smith",
    "PHONE": "+1234567890",
    "COMPANY": "Acme Corp"
  }
}
```

### 5. HubSpot
Sync contacts from HubSpot CRM.

**Data Format:**
```json
{
  "id": "contact_id",
  "properties": {
    "firstname": "John",
    "lastname": "Smith",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp"
  }
}
```

### 6. Salesforce
Sync leads from Salesforce.

**Data Format:**
```json
{
  "Id": "lead_id",
  "FirstName": "John",
  "LastName": "Smith",
  "Email": "john@example.com",
  "Phone": "+1234567890",
  "Company": "Acme Corp",
  "LeadSource": "Website"
}
```

### 7. Custom Webhook
Create a custom webhook for any service.

**Data Format:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "source": "website",
  "value": 5000,
  "custom_fields": {
    "campaign": "Q1 2024",
    "utm_source": "google"
  }
}
```

## Webhook Security

### Signature Verification
Webhooks support signature verification to ensure data integrity:

1. Each webhook has a unique secret key
2. Include the signature in the `X-Webhook-Signature` header
3. Generate signature using HMAC-SHA256 with the webhook secret

**Example (Node.js):**
```javascript
const crypto = require('crypto');

const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(requestBody)
  .digest('hex');

// Include in request header
headers['X-Webhook-Signature'] = `sha256=${signature}`;
```

## Webhook Configuration

### Events
Configure which events trigger the webhook:
- `lead.created` - New lead created
- `lead.updated` - Lead information updated
- `lead.deleted` - Lead deleted
- `contact.created` - New contact created
- `contact.updated` - Contact updated

### Retry Configuration
Configure retry behavior for failed webhook requests:
- **Max Retries**: 0-10 (default: 3)
- **Retry Delay**: 100-60000ms (default: 1000ms)

### Custom Transformation Rules
For custom webhooks, you can define transformation rules to map incoming data:

```json
{
  "name": "full_name",
  "email": "email_address",
  "phone": "phone_number",
  "company": {
    "path": "organization.name",
    "transform": "uppercase"
  }
}
```

## API Endpoints

### Create Webhook
```http
POST /api/webhooks
Content-Type: application/json

{
  "workspaceId": "workspace_id",
  "name": "Facebook Lead Ads",
  "webhookType": "facebook_leads",
  "events": ["lead.created"]
}
```

### Get Webhooks
```http
GET /api/webhooks?workspaceId=workspace_id
```

### Update Webhook
```http
PUT /api/webhooks/webhook_id
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": true
}
```

### Delete Webhook
```http
DELETE /api/webhooks/webhook_id
```

## Testing Webhooks

### Using cURL
```bash
curl -X POST https://your-domain.com/api/webhooks/receive/webhook_id \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=signature" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "source": "test"
  }'
```

### Using Postman
1. Import the provided Postman collection
2. Set the webhook_id variable
3. Send test requests to verify webhook functionality

## Monitoring and Logs

### Webhook Statistics
Each webhook tracks:
- Total requests received
- Successful requests
- Failed requests
- Last triggered time
- Success rate percentage

### Webhook Logs
All webhook requests are logged with:
- Request details (headers, body, IP)
- Response status and body
- Processing time
- Error messages (if any)
- Associated lead ID (if created)

### Log Retention
Webhook logs are automatically deleted after 90 days to manage storage.

## Best Practices

1. **Use HTTPS**: Always use HTTPS for webhook URLs in production
2. **Verify Signatures**: Implement signature verification for security
3. **Handle Retries**: Configure appropriate retry settings
4. **Monitor Performance**: Regularly check webhook statistics and logs
5. **Test Thoroughly**: Test webhooks with sample data before going live
6. **Document Integrations**: Keep documentation of your webhook integrations

## Troubleshooting

### Common Issues

**Webhook not receiving data:**
- Check if webhook is active
- Verify the webhook URL is correct
- Check external service configuration

**Signature verification failing:**
- Ensure secret key is correct
- Verify signature generation algorithm
- Check request body encoding

**Leads not being created:**
- Check webhook logs for errors
- Verify data format matches expected schema
- Ensure required fields are present

**High failure rate:**
- Check external service data format
- Review transformation rules
- Monitor webhook logs for error patterns

### Getting Help

If you need assistance with webhook setup:
1. Check the webhook logs for error details
2. Review this documentation
3. Contact support with webhook ID and error details
