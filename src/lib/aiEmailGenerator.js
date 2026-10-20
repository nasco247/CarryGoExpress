// ─── CarryGoExpress AI Email Synthesizer & Professional Templates ──────────
// Generates beautifully formatted, realistic emails with subject, body, and HTML preview.
// Uses Gemini API when available, with a built-in smart template engine fallback.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

export const EMAIL_TEMPLATES = [
  {
    id: 'order_confirmation',
    name: 'Order Confirmation & Tracking',
    category: 'Orders',
    subject: 'Your CarryGoExpress Order #[Order_ID] is Confirmed! 🚀',
    body: `Dear [Customer_Name],

Thank you for choosing CarryGoExpress! We are thrilled to confirm that your order #[Order_ID] has been successfully processed and verified.

Order Highlights:
• Order Number: #[Order_ID]
• Items: [Order_Items]
• Total Amount: [Order_Total]
• Estimated Delivery: Within 24-48 Hours with Insured Express Courier

Our dispatch logistics team is currently conducting quality inspections and securely packing your electronics with anti-static tamper-proof sealing. You will receive live GPS tracking updates as soon as the courier is en route.

If you have any questions or require special delivery instructions, simply reply to this email or contact support@carrygoexpress.store.

Warm regards,
CarryGoExpress Fulfillment Team
support@carrygoexpress.store | https://www.carrygoexpress.store/`,
    ctaText: 'View Order Status',
    ctaUrl: 'https://www.carrygoexpress.store/orders'
  },
  {
    id: 'shipping_dispatched',
    name: 'Dispatch & Out for Delivery',
    category: 'Logistics',
    subject: 'Out for Delivery: Your CarryGoExpress Package is on the Way! 🚚',
    body: `Hello [Customer_Name],

Great news! Your package has been handed over to our dedicated express courier and is currently out for delivery to your designated shipping destination.

Delivery Details:
• Delivery Address: [Delivery_Address]
• Assigned Courier: CarryGoExpress Direct Dispatch
• ETA: Today before 6:00 PM

Please ensure someone is available at the delivery location to inspect and acknowledge receipt of the security package.

Thank you for shopping with CarryGoExpress!

Best regards,
CarryGoExpress Logistics Operations
support@carrygoexpress.store`,
    ctaText: 'Track Delivery Live',
    ctaUrl: 'https://www.carrygoexpress.store/orders'
  },
  {
    id: 'payment_received',
    name: 'Payment & Wallet Credited Receipt',
    category: 'Billing',
    subject: 'Official Receipt: Payment Confirmed - CarryGoExpress',
    body: `Dear [Customer_Name],

This email confirms that your payment of [Amount] has been successfully verified and credited.

Transaction Summary:
• Transaction Reference: [Reference]
• Amount Received: [Amount]
• Payment Channel: Card / Wallet / Verified Transfer
• Account Balance: Updated in your CarryGoExpress wallet

You can view your full transaction history and download official tax receipts anytime from your account dashboard.

Thank you for your business.

Sincerely,
CarryGoExpress Accounts & Finance
support@carrygoexpress.store`,
    ctaText: 'View Wallet Balance',
    ctaUrl: 'https://www.carrygoexpress.store/transactions'
  },
  {
    id: 'support_resolution',
    name: 'Customer Support Response & Resolution',
    category: 'Support',
    subject: 'Update Regarding Your Inquiry [Ticket_ID] - CarryGoExpress Support',
    body: `Hi [Customer_Name],

Thank you for reaching out to CarryGoExpress customer support. We have thoroughly reviewed your inquiry regarding [Topic].

Resolution Details:
• Case Reference: [Ticket_ID]
• Status: Resolved
• Resolution Note: Our support engineering team has addressed the reported issue and verified that everything is operating normally.

Your satisfaction is our utmost priority. If you need any further assistance, feel free to reply directly to this message.

Kind regards,
CarryGoExpress Customer Support Team
support@carrygoexpress.store | +1 (800) CARRYGO`,
    ctaText: 'Contact Support Hub',
    ctaUrl: 'https://www.carrygoexpress.store/contact'
  },
  {
    id: 'warranty_certificate',
    name: '1-Year Official Warranty Certificate',
    category: 'Warranty',
    subject: 'Your 1-Year CarryGoExpress Electronics Warranty is Activated 🛡️',
    body: `Dear [Customer_Name],

Congratulations on your new gadget purchase! This email serves as your official 1-Year Comprehensive Manufacturer & Store Warranty Certificate.

Warranty Coverage:
• Covered Device: [Device_Name]
• Serial / IMEI: [Serial_Number]
• Coverage Period: 365 Days from Purchase
• Covered: Factory hardware defects, component failure, power issues, and display anomalies.

Keep this email for your records. In the unlikely event you require service, simply reply with your order number for expedited priority repair or replacement.

Warm regards,
CarryGoExpress Technical Care
support@carrygoexpress.store`,
    ctaText: 'Warranty Policy',
    ctaUrl: 'https://www.carrygoexpress.store/terms'
  },
  {
    id: 'exclusive_promo',
    name: 'VIP Gadget Special Offer & Promo Code',
    category: 'Marketing',
    subject: 'Exclusive VIP Offer: Unlock $50 Off Flagship Gadgets! 🎁',
    body: `Hello [Customer_Name],

As a valued CarryGoExpress client, you have unlocked an exclusive VIP reward towards our latest arrivals:

• Promo Voucher: VIPGOGO50
• Value: $50 OFF any order over $300
• Valid On: Flagship Smartphones, MacBooks, Audio Systems & Wearables
• Expiration: Valid for the next 72 hours only

Use promo code VIPGOGO50 at checkout to claim your savings. Stock is strictly limited on flagship models.

Happy shopping!

Best regards,
CarryGoExpress VIP Concierge
support@carrygoexpress.store | https://www.carrygoexpress.store/`,
    ctaText: 'Shop VIP Deals Now',
    ctaUrl: 'https://www.carrygoexpress.store/deals'
  },
  {
    id: 'custom_blank',
    name: 'Custom Clean Template',
    category: 'General',
    subject: 'Important Update from CarryGoExpress',
    body: `Dear [Customer_Name],

We hope this email finds you well.

We are writing to provide you with an important update regarding your account and services with CarryGoExpress.

[Message_Body]

Please let us know if you have any questions or if we can assist you in any way.

Best regards,
CarryGoExpress Support Team
support@carrygoexpress.store`,
    ctaText: 'Visit CarryGoExpress',
    ctaUrl: 'https://www.carrygoexpress.store/'
  }
]

// ── Smart AI Generator with Gemini API & Heuristic Fallback ───────────────────
export async function generateEmailWithAI(prompt, context = {}) {
  const customerName = context.customerName || 'Valued Customer'
  const orderId = context.orderId || 'CG-' + Math.floor(100000 + Math.random() * 900000)
  const recipient = context.recipient || 'customer@example.com'

  // Attempt real Gemini API if key is present
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'AIzaSyDemoKey') {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`
      const systemInstruction = `You are the official Customer Communications Director for CarryGoExpress, a premier online gadget and consumer electronics store (https://www.carrygoexpress.store, official email support@carrygoexpress.store).
Write an authentic, highly professional, warm, and helpful email based on the prompt.
Return ONLY valid JSON matching this schema:
{
  "subject": "Compelling subject line with emoji where appropriate",
  "body": "Full body text with greeting, clear paragraphs, bullet points if helpful, professional sign-off with CarryGoExpress team",
  "ctaText": "Short button text e.g. Track Order, View Receipt, Contact Support",
  "ctaUrl": "Relevant URL e.g. https://www.carrygoexpress.store/orders"
}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemInstruction}\n\nUSER PROMPT: ${prompt}\nRECIPIENT: ${recipient}\nCUSTOMER NAME: ${customerName}\nORDER ID: ${orderId}` }]
          }],
          generationConfig: {
            temperature: 0.7,
            response_mime_type: 'application/json'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          return {
            subject: parsed.subject,
            body: parsed.body,
            ctaText: parsed.ctaText || 'Visit Store',
            ctaUrl: parsed.ctaUrl || 'https://www.carrygoexpress.store/'
          }
        }
      }
    } catch (e) {
      console.warn('[AI Email Generator] Gemini API error, falling back to smart engine:', e)
    }
  }

  // ── Smart Engine Fallback (Instant, zero latency, guaranteed quality) ─────────
  const lowerPrompt = prompt.toLowerCase()

  if (lowerPrompt.includes('delay') || lowerPrompt.includes('apolog')) {
    return {
      subject: `Notice: Delivery Schedule Update for Your Order #${orderId} - CarryGoExpress`,
      body: `Dear ${customerName},

We are writing to personally inform you regarding your recent CarryGoExpress order #${orderId}.

Due to a temporary logistics delay during our express courier dispatch route, your delivery has been rescheduled. We sincerely apologize for any inconvenience this may cause you.

Updated Logistics Schedule:
• Order Number: #${orderId}
• Revised Delivery Window: Tomorrow between 10:00 AM – 2:00 PM
• Courier Priority: First-tier express dispatch with zero delivery fee
• Compensation Credit: As a gesture of our appreciation for your patience, we have credited $15 to your CarryGoExpress account wallet for future orders.

Our operations team is actively monitoring your package to ensure it arrives in pristine, factory-sealed condition.

If you have any questions or need to specify an alternate delivery address, please reply directly to this email.

Warm regards,
CarryGoExpress Customer Happiness & Dispatch
support@carrygoexpress.store | https://www.carrygoexpress.store/`,
      ctaText: 'Track Order Live',
      ctaUrl: 'https://www.carrygoexpress.store/orders'
    }
  }

  if (lowerPrompt.includes('refund') || lowerPrompt.includes('return')) {
    return {
      subject: `Refund Approved & Processed for Order #${orderId} - CarryGoExpress`,
      body: `Hello ${customerName},

We are pleased to inform you that your return request for order #${orderId} has been successfully verified, and your full refund has been approved and issued.

Refund Details:
• Order ID: #${orderId}
• Refund Method: Original Payment Method / CarryGoExpress Wallet
• Processing Time: Instant for wallet balance, or 1–3 business days for bank cards
• Return Status: Closed & Complete

No further action is required on your part. A copy of your official refund receipt is attached to your account portal.

Thank you for your valued understanding and for being a part of CarryGoExpress.

Best regards,
CarryGoExpress Finance & Returns Team
support@carrygoexpress.store`,
      ctaText: 'View Wallet & Refund',
      ctaUrl: 'https://www.carrygoexpress.store/transactions'
    }
  }

  if (lowerPrompt.includes('ship') || lowerPrompt.includes('track') || lowerPrompt.includes('courier')) {
    return {
      subject: `Your CarryGoExpress Package #${orderId} Has Shipped! 🚀`,
      body: `Hi ${customerName},

Great news! Your package for order #${orderId} has officially left our central fulfillment center and is on its way to you.

Dispatch Information:
• Order Reference: #${orderId}
• Courier: CarryGo Express Priority Van
• Status: In Transit
• Estimated Arrival: Today before 6:00 PM
• Delivery Address: Verified Customer Address

Your package is protected by our 100% Insured Delivery Guarantee. Please have a valid ID ready upon delivery.

Warm regards,
CarryGoExpress Logistics Team
support@carrygoexpress.store`,
      ctaText: 'Track Package',
      ctaUrl: 'https://www.carrygoexpress.store/orders'
    }
  }

  // Default professional tailored response
  return {
    subject: `Update from CarryGoExpress Regarding: ${prompt.slice(0, 45)}${prompt.length > 45 ? '...' : ''}`,
    body: `Dear ${customerName},

Thank you for contacting CarryGoExpress. We are following up regarding: "${prompt}".

Summary & Updates:
• Reference ID: #${orderId}
• Account: ${recipient}
• Status: Reviewed & In Progress

Our dedicated team has documented your request and ensured that all necessary measures are in place to deliver the highest quality experience with your electronics and gadgets.

If there is anything else you need or if your requirements change, simply reply to this email at support@carrygoexpress.store.

Warm regards,
The CarryGoExpress Team
support@carrygoexpress.store | https://www.carrygoexpress.store/`,
    ctaText: 'Visit Store Portal',
    ctaUrl: 'https://www.carrygoexpress.store/'
  }
}

// ── HTML Email Renderer for Live Interactive Preview ──────────────────────────
export function renderEmailHtml({ subject, body, recipientName, ctaText, ctaUrl }) {
  const formattedBody = (body || '')
    .split('\n\n')
    .map(p => {
      if (p.startsWith('•') || p.includes('\n•')) {
        const items = p.split('\n').filter(Boolean)
        return `<ul style="margin: 14px 0; padding-left: 20px; line-height: 1.7; color: #d1d5db;">${items.map(it => `<li style="margin-bottom: 6px;">${it.replace(/^•\s*/, '')}</li>`).join('')}</ul>`
      }
      return `<p style="margin: 14px 0; line-height: 1.65; color: #e5e7eb;">${p.replace(/\n/g, '<br/>')}</p>`
    })
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'CarryGoExpress'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    
    <!-- Top Cyan Accent Bar -->
    <div style="height: 4px; background: linear-gradient(90deg, #00d4ff 0%, #0070f3 100%);"></div>

    <!-- Header -->
    <div style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1f2937; display: flex; align-items: center; justify-content: space-between;">
      <table style="width: 100%;">
        <tr>
          <td>
            <div style="display: inline-block; vertical-align: middle;">
              <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">CarryGo<span style="color: #00d4ff;">Express</span></span>
            </div>
          </td>
          <td style="text-align: right;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #00d4ff; background-color: rgba(0, 212, 255, 0.1); padding: 5px 10px; border-radius: 20px; border: 1px solid rgba(0, 212, 255, 0.25);">Official Notice</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <h1 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 20px; line-height: 1.4;">
        ${subject || 'Notice from CarryGoExpress'}
      </h1>

      <div style="font-size: 14px; color: #d1d5db;">
        ${formattedBody}
      </div>

      ${ctaText ? `
      <div style="margin: 32px 0 24px 0; text-align: center;">
        <a href="${ctaUrl || 'https://www.carrygoexpress.store/'}" style="display: inline-block; background-color: #00d4ff; color: #0b0f17; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(0, 212, 255, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
          ${ctaText}
        </a>
      </div>
      ` : ''}

      <!-- Security guarantee callout -->
      <div style="margin-top: 28px; padding: 14px 18px; background-color: rgba(255, 255, 255, 0.03); border: 1px solid #1f2937; border-radius: 10px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 24px; vertical-align: top; font-size: 16px;">🛡️</td>
            <td style="padding-left: 10px; font-size: 12px; color: #9ca3af; line-height: 1.5;">
              <strong style="color: #e5e7eb;">Authenticity & Warranty Guarantee:</strong> All electronics purchased from CarryGoExpress include manufacturer direct warranty and express insured delivery.
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0d131f; padding: 24px 32px; border-top: 1px solid #1f2937; font-size: 11px; color: #6b7280; line-height: 1.6;">
      <p style="margin: 0 0 8px 0; color: #9ca3af;">
        Sent officially from <strong>support@carrygoexpress.store</strong> | PrivateEmail Verified
      </p>
      <p style="margin: 0 0 8px 0;">
        CarryGoExpress Central Hub, 2349 Brentwood Drive, Austin, TX 78749, United States · Registered Electronics Store
      </p>
      <p style="margin: 0;">
        This email was intended for the recipient. If you received this in error, please disregard.
      </p>
    </div>
  </div>
</body>
</html>
`
}
