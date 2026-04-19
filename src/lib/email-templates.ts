const brand = {
  dark: '#1C1511',
  primary: '#C8896A',
  green: '#7D9B76',
  text: '#2D1F1A',
  muted: '#9E8079',
  border: '#EAE3DC',
  bg: '#F5F2EF',
  white: '#FFFFFF',
}

function emailWrapper(previewText: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ArtisanNest</title>
</head>
<body style="margin:0;padding:0;background-color:${brand.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- Hidden preview text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${brand.bg};">${previewText}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo header -->
          <tr>
            <td style="background:${brand.dark};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <div style="width:36px;height:36px;background:${brand.primary};border-radius:10px;text-align:center;line-height:36px;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-top:8px;">
                        <path d="M12 3C8.5 3 6 6.5 6 10.5C6 14.5 9 18 12 20C15 18 18 14.5 18 10.5C18 6.5 15.5 3 12 3Z" fill="white" opacity="0.95"/>
                        <path d="M12 20V23" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M9.5 22H14.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                        <circle cx="12" cy="10" r="2.5" fill="${brand.primary}"/>
                      </svg>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:20px;font-weight:700;color:white;letter-spacing:-0.3px;">ArtisanNest</div>
                    <div style="font-size:9px;color:${brand.primary};letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Handmade Crafts</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gradient accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(to right, ${brand.primary}, ${brand.green});"></td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:${brand.white};border-radius:0 0 16px 16px;overflow:hidden;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 16px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:${brand.muted};">
                © ${new Date().getFullYear()} ArtisanNest — Handmade with love
              </p>
              <p style="margin:0;font-size:12px;color:${brand.muted};">
                You received this email because you have an account at ArtisanNest.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Seller Verification Email ────────────────────────────────────────────────

export function sellerVerificationTemplate(name: string, verificationUrl: string): string {
  const content = `
    <!-- Icon hero -->
    <div style="background:linear-gradient(135deg, ${brand.primary}15, ${brand.green}15);padding:40px 32px 0;text-align:center;">
      <div style="width:64px;height:64px;background:${brand.primary}20;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;border:2px solid ${brand.primary}30;">
        <span style="font-size:28px;">✉️</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:${brand.text};letter-spacing:-0.5px;">
        Verify Your Email
      </h1>
      <p style="margin:0 0 32px;font-size:15px;color:${brand.muted};line-height:1.5;">
        One quick step to activate your seller account
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;color:${brand.text};line-height:1.6;">
        Hi <strong>${name}</strong>, welcome to ArtisanNest! 🎉
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#6B4C3B;line-height:1.7;">
        You've taken the first step toward sharing your beautiful handmade crafts with the world.
        To complete your seller account setup, please verify your email address by clicking the button below.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${verificationUrl}"
           style="display:inline-block;background:${brand.primary};color:white;font-size:15px;font-weight:600;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.2px;">
          ✓ &nbsp; Verify My Email Address
        </a>
      </div>

      <!-- Divider -->
      <div style="height:1px;background:${brand.border};margin:28px 0;"></div>

      <!-- Alternative link -->
      <p style="margin:0 0 8px;font-size:13px;color:${brand.muted};line-height:1.5;">
        Button not working? Copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
        <a href="${verificationUrl}" style="color:${brand.primary};text-decoration:none;">${verificationUrl}</a>
      </p>

      <!-- Warning box -->
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;display:flex;gap:10px;">
        <span style="font-size:16px;flex-shrink:0;">⏰</span>
        <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">
          <strong>This link expires in 1 hour.</strong> If it expires, you can request a new one from the login page.
        </p>
      </div>

      <!-- Security note -->
      <div style="margin-top:16px;background:${brand.bg};border:1px solid ${brand.border};border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:${brand.muted};line-height:1.5;">
          🔒 <strong>Didn't create this account?</strong> You can safely ignore this email. No action is needed.
        </p>
      </div>
    </div>
  `
  return emailWrapper(`Verify your ArtisanNest seller account, ${name}`, content)
}

// ─── Customer Welcome Email ───────────────────────────────────────────────────

export function customerWelcomeTemplate(name: string, storeUrl: string): string {
  const features = [
    { icon: '🎨', title: 'Unique Handmade Items', desc: 'Discover one-of-a-kind crafts made by talented artisans' },
    { icon: '🛡️', title: 'Secure Shopping', desc: 'Your orders and payments are always protected' },
    { icon: '❤️', title: 'Support Artisans', desc: 'Every purchase directly supports independent creators' },
  ]

  const content = `
    <!-- Hero -->
    <div style="background:linear-gradient(135deg, ${brand.primary}20, ${brand.green}15);padding:44px 32px 36px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">🎉</div>
      <h1 style="margin:0 0 10px;font-size:28px;font-weight:700;color:${brand.text};letter-spacing:-0.5px;">
        Welcome to ArtisanNest!
      </h1>
      <p style="margin:0;font-size:16px;color:#6B4C3B;line-height:1.5;">
        Your account is ready. Start exploring handmade crafts.
      </p>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:${brand.text};line-height:1.7;">
        Hi <strong>${name}</strong> 👋,<br/><br/>
        Thank you for joining our community of craft lovers! Your account has been created successfully and you're all set to start shopping.
      </p>

      <!-- Features -->
      <div style="margin:28px 0;">
        ${features.map((f) => `
        <div style="display:flex;gap:16px;margin-bottom:20px;align-items:flex-start;">
          <div style="width:44px;height:44px;background:${brand.primary}15;border-radius:12px;text-align:center;line-height:44px;font-size:22px;flex-shrink:0;">
            ${f.icon}
          </div>
          <div>
            <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${brand.text};">${f.title}</p>
            <p style="margin:0;font-size:13px;color:${brand.muted};line-height:1.5;">${f.desc}</p>
          </div>
        </div>`).join('')}
      </div>

      <!-- Divider -->
      <div style="height:1px;background:${brand.border};margin:28px 0;"></div>

      <!-- CTA -->
      <div style="text-align:center;margin:0 0 8px;">
        <a href="${storeUrl}"
           style="display:inline-block;background:${brand.primary};color:white;font-size:15px;font-weight:600;text-decoration:none;padding:16px 44px;border-radius:12px;letter-spacing:0.2px;">
          🛍️ &nbsp; Start Shopping
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:14px;color:${brand.muted};line-height:1.6;text-align:center;">
        Need help? Just reply to this email — we're always happy to assist.
      </p>
    </div>

    <!-- Account detail strip -->
    <div style="background:${brand.bg};border-top:1px solid ${brand.border};padding:20px 32px;">
      <p style="margin:0;font-size:13px;color:${brand.muted};text-align:center;">
        Your account: <strong style="color:${brand.text};">${name}</strong> &nbsp;·&nbsp; Role: <span style="color:${brand.green};font-weight:600;">Customer</span>
      </p>
    </div>
  `
  return emailWrapper(`Welcome to ArtisanNest, ${name}! Your account is ready.`, content)
}

// ─── Admin Notification Email ─────────────────────────────────────────────────

export function adminNotificationTemplate(
  userName: string,
  userEmail: string,
  role: 'SELLER' | 'CUSTOMER',
  registeredAt: Date,
  adminDashboardUrl: string,
): string {
  const roleColor = role === 'SELLER' ? brand.primary : brand.green
  const roleLabel = role === 'SELLER' ? 'Seller' : 'Customer'
  const roleIcon = role === 'SELLER' ? '🏪' : '👤'

  const content = `
    <!-- Alert header -->
    <div style="background:${brand.dark};padding:28px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            <div style="font-size:11px;color:${roleColor};letter-spacing:3px;text-transform:uppercase;font-weight:600;margin-bottom:6px;">
              New Registration Alert
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:white;">
              ${roleIcon} &nbsp; New ${roleLabel} Registered
            </h1>
          </td>
          <td align="right" style="vertical-align:middle;">
            <div style="background:${roleColor}25;border:1px solid ${roleColor}40;border-radius:50%;width:48px;height:48px;text-align:center;line-height:48px;font-size:22px;">
              ${roleIcon}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 24px;font-size:15px;color:#6B4C3B;line-height:1.6;">
        A new <strong>${roleLabel.toLowerCase()}</strong> has registered on ArtisanNest. Here are their details:
      </p>

      <!-- Info card -->
      <div style="background:${brand.bg};border:1px solid ${brand.border};border-radius:12px;overflow:hidden;margin-bottom:28px;">
        ${[
          { label: 'Full Name', value: userName, icon: '👤' },
          { label: 'Email Address', value: userEmail, icon: '✉️' },
          { label: 'Account Role', value: roleLabel, icon: '🏷️', highlight: true },
          { label: 'Registered At', value: registeredAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }), icon: '🕐' },
        ].map((row, i) => `
        <div style="padding:14px 20px;${i > 0 ? `border-top:1px solid ${brand.border};` : ''}display:flex;align-items:center;gap:14px;">
          <span style="font-size:16px;width:24px;text-align:center;flex-shrink:0;">${row.icon}</span>
          <div style="flex:1;">
            <div style="font-size:11px;color:${brand.muted};text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:2px;">${row.label}</div>
            <div style="font-size:14px;font-weight:600;color:${row.highlight ? roleColor : brand.text};">${row.value}</div>
          </div>
        </div>`).join('')}
      </div>

      ${role === 'SELLER' ? `
      <!-- Seller approval note -->
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
          ⚠️ <strong>Action Required:</strong> This seller's products will require your approval before going live on the marketplace. Their email must also be verified before they can log in.
        </p>
      </div>
      ` : ''}

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${adminDashboardUrl}"
           style="display:inline-block;background:${brand.dark};color:white;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
          Go to Admin Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer strip -->
    <div style="background:${brand.bg};border-top:1px solid ${brand.border};padding:16px 32px;">
      <p style="margin:0;font-size:12px;color:${brand.muted};text-align:center;">
        This notification was sent automatically by ArtisanNest · Admin Alerts
      </p>
    </div>
  `
  return emailWrapper(`New ${roleLabel} registered: ${userName} (${userEmail})`, content)
}

// ─── Order Confirmation Email ─────────────────────────────────────────────────

type OrderItem = { name: string; quantity: number; price: number }

export function orderConfirmationTemplate(
  name: string,
  orderId: number,
  items: OrderItem[],
  subtotal: number,
  shippingFee: number,
  tax: number,
  discount: number,
  total: number,
  paymentMethod: string,
  shippingMethod: string,
  shippingAddress: string,
  orderNotes: string | null,
  appUrl: string,
): string {
  const fmt = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-PK')}`
  const payLabel = paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card Payment (Stripe)'
  const shipLabel = shippingMethod === 'EXPRESS' ? 'Express (2–3 days)' : 'Standard (5–7 days)'

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 20px;border-bottom:1px solid ${brand.border};">
        <div style="font-size:14px;font-weight:600;color:${brand.text};">${item.name}</div>
        <div style="font-size:12px;color:${brand.muted};margin-top:2px;">Qty: ${item.quantity}</div>
      </td>
      <td style="padding:12px 20px;border-bottom:1px solid ${brand.border};text-align:right;font-size:14px;font-weight:600;color:${brand.text};">
        ${fmt(item.price * item.quantity)}
      </td>
    </tr>`).join('')

  const summaryRows = [
    { label: 'Subtotal', value: fmt(subtotal) },
    { label: `Shipping (${shipLabel})`, value: shippingFee === 0 ? '<span style="color:#7D9B76;font-weight:700;">Free</span>' : fmt(shippingFee) },
    { label: 'Tax (10%)', value: fmt(tax) },
    ...(discount > 0 ? [{ label: 'Coupon Discount', value: `<span style="color:#7D9B76;">−${fmt(discount)}</span>` }] : []),
  ].map((row) => `
    <tr>
      <td style="padding:8px 20px;font-size:13px;color:${brand.muted};">${row.label}</td>
      <td style="padding:8px 20px;font-size:13px;text-align:right;">${row.value}</td>
    </tr>`).join('')

  const content = `
    <!-- Hero -->
    <div style="background:linear-gradient(135deg,${brand.primary}18,${brand.green}12);padding:44px 32px 36px;text-align:center;">
      <div style="font-size:52px;margin-bottom:16px;">🎉</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:${brand.text};letter-spacing:-0.5px;">
        Order Confirmed!
      </h1>
      <p style="margin:0;font-size:15px;color:#6B4C3B;line-height:1.5;">
        Thank you, <strong>${name}</strong>. We've received your order.
      </p>
      <div style="display:inline-block;margin-top:16px;background:white;border:1px solid ${brand.border};border-radius:50px;padding:8px 22px;">
        <span style="font-size:12px;color:${brand.muted};">Order </span>
        <span style="font-size:14px;font-weight:700;color:${brand.primary};font-family:monospace;">#${orderId}</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:32px 32px 8px;">
      <p style="margin:0 0 24px;font-size:15px;color:#6B4C3B;line-height:1.7;">
        Hi <strong>${name}</strong> 👋,<br/>
        Your order has been placed successfully and is now being processed.
        We'll notify you as soon as there's an update.
      </p>
    </div>

    <!-- Items table -->
    <div style="margin:0 32px 24px;">
      <div style="font-size:11px;font-weight:700;color:${brand.muted};text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">
        Items Ordered
      </div>
      <div style="border:1px solid ${brand.border};border-radius:12px;overflow:hidden;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
          ${summaryRows}
          <tr style="background:${brand.bg};">
            <td style="padding:14px 20px;font-size:15px;font-weight:700;color:${brand.text};">Total</td>
            <td style="padding:14px 20px;font-size:18px;font-weight:700;color:${brand.primary};text-align:right;">${fmt(total)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Info cards -->
    <div style="margin:0 32px 28px;display:flex;gap:12px;flex-wrap:wrap;">
      <div style="flex:1;min-width:180px;background:${brand.bg};border:1px solid ${brand.border};border-radius:12px;padding:16px 18px;">
        <div style="font-size:11px;color:${brand.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:8px;">Payment</div>
        <div style="font-size:13px;font-weight:600;color:${brand.text};">💳 ${payLabel}</div>
        <div style="font-size:11px;color:${brand.muted};margin-top:4px;">${paymentMethod === 'COD' ? 'Pay on delivery' : 'Payment confirmed'}</div>
      </div>
      <div style="flex:1;min-width:180px;background:${brand.bg};border:1px solid ${brand.border};border-radius:12px;padding:16px 18px;">
        <div style="font-size:11px;color:${brand.muted};text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:8px;">Shipping</div>
        <div style="font-size:13px;font-weight:600;color:${brand.text};">🚚 ${shipLabel}</div>
        <div style="font-size:11px;color:${brand.muted};margin-top:4px;">${shippingAddress}</div>
      </div>
    </div>

    ${orderNotes ? `
    <div style="margin:0 32px 24px;background:#FFFBF0;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;">
      <div style="font-size:11px;color:#92400E;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">📝 Your Order Notes</div>
      <div style="font-size:13px;color:#78350F;line-height:1.6;">${orderNotes}</div>
    </div>` : ''}

    <!-- Status tracker -->
    <div style="margin:0 32px 32px;">
      <div style="font-size:11px;font-weight:700;color:${brand.muted};text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">
        Order Progress
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${['Order Placed', 'Confirmed', 'Shipped', 'Delivered'].map((step, i) => `
          <td style="text-align:center;width:25%;vertical-align:top;">
            <div style="width:32px;height:32px;border-radius:50%;margin:0 auto 8px;
              background:${i === 0 ? brand.green : brand.border};
              border:2px solid ${i === 0 ? brand.green : brand.border};
              display:flex;align-items:center;justify-content:center;font-size:14px;">
              ${i === 0 ? '✓' : `<span style="color:${brand.muted};font-size:11px;">${i + 1}</span>`}
            </div>
            <div style="font-size:11px;color:${i === 0 ? brand.green : brand.muted};font-weight:${i === 0 ? '700' : '400'};">
              ${step}
            </div>
          </td>`).join('<td style="padding-top:16px;"><div style="height:2px;background:#EAE3DC;"></div></td>')}
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:0 32px 32px;">
      <a href="${appUrl}/orders"
         style="display:inline-block;background:${brand.primary};color:white;font-size:14px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.2px;">
        🛍️ &nbsp; Track My Order
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:${brand.muted};line-height:1.6;">
        Questions? Reply to this email or visit our store.
      </p>
    </div>

    <!-- Footer strip -->
    <div style="background:${brand.bg};border-top:1px solid ${brand.border};padding:18px 32px;">
      <p style="margin:0;font-size:12px;color:${brand.muted};text-align:center;">
        Order #${orderId} · Placed on ${new Date().toLocaleDateString('en-PK', { dateStyle: 'medium' })}
      </p>
    </div>
  `
  return emailWrapper(`Your ArtisanNest order #${orderId} is confirmed!`, content)
}

// ─── Order Status Update Email ────────────────────────────────────────────────

const STATUS_META: Record<string, { emoji: string; headline: string; body: string; color: string }> = {
  PAID: {
    emoji: '✅',
    headline: 'Payment Confirmed',
    body: 'Great news! Your payment has been confirmed and your order is being prepared.',
    color: '#3B82F6',
  },
  SHIPPED: {
    emoji: '🚚',
    headline: 'Your Order is on Its Way!',
    body: 'Your order has been packed and handed over to the courier. Get ready to receive it soon!',
    color: '#8B5CF6',
  },
  DELIVERED: {
    emoji: '📦',
    headline: 'Order Delivered!',
    body: 'Your order has been delivered. We hope you love your handmade items. Please leave a review!',
    color: '#7D9B76',
  },
  CANCELLED: {
    emoji: '❌',
    headline: 'Order Cancelled',
    body: 'Your order has been cancelled. If you have questions, please contact our support team.',
    color: '#EF4444',
  },
}

export function orderStatusUpdateTemplate(
  name: string,
  orderId: number,
  status: string,
  appUrl: string,
): string {
  const meta = STATUS_META[status] ?? {
    emoji: '🔔',
    headline: 'Order Update',
    body: `Your order status has been updated to ${status}.`,
    color: brand.primary,
  }

  const steps = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED']
  const stepLabels = ['Placed', 'Confirmed', 'Shipped', 'Delivered']
  const currentIdx = steps.indexOf(status)

  const content = `
    <!-- Hero -->
    <div style="background:linear-gradient(135deg,${meta.color}18,${meta.color}08);padding:48px 32px 40px;text-align:center;">
      <div style="font-size:56px;margin-bottom:20px;">${meta.emoji}</div>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:${brand.text};letter-spacing:-0.5px;">
        ${meta.headline}
      </h1>
      <p style="margin:0;font-size:15px;color:#6B4C3B;line-height:1.6;max-width:400px;margin-left:auto;margin-right:auto;">
        ${meta.body}
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 24px;font-size:15px;color:${brand.text};line-height:1.7;">
        Hi <strong>${name}</strong>,<br/>
        Here's the latest update on your order <strong style="color:${brand.primary};font-family:monospace;">#${orderId}</strong>.
      </p>

      <!-- Status badge -->
      <div style="text-align:center;margin:0 0 32px;">
        <div style="display:inline-block;background:${meta.color}15;border:2px solid ${meta.color}30;border-radius:50px;padding:10px 28px;">
          <span style="font-size:14px;font-weight:700;color:${meta.color};">${meta.emoji} &nbsp; ${status.charAt(0) + status.slice(1).toLowerCase()}</span>
        </div>
      </div>

      <!-- Progress tracker -->
      ${status !== 'CANCELLED' ? `
      <div style="margin-bottom:32px;">
        <div style="font-size:11px;font-weight:700;color:${brand.muted};text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;text-align:center;">
          Order Journey
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${stepLabels.map((step, i) => {
              const done = i <= currentIdx
              const active = i === currentIdx
              return `
              <td style="text-align:center;width:25%;vertical-align:top;">
                <div style="width:36px;height:36px;border-radius:50%;margin:0 auto 8px;
                  background:${done ? (active ? meta.color : brand.green) : brand.border};
                  border:2px solid ${done ? (active ? meta.color : brand.green) : brand.border};
                  display:flex;align-items:center;justify-content:center;font-size:15px;color:white;">
                  ${done ? '✓' : `<span style="font-size:11px;color:${brand.muted};">${i + 1}</span>`}
                </div>
                <div style="font-size:11px;font-weight:${active ? '700' : '400'};color:${active ? meta.color : (done ? brand.green : brand.muted)};">
                  ${step}
                </div>
              </td>
              ${i < stepLabels.length - 1 ? `<td style="padding-top:18px;"><div style="height:2px;background:${i < currentIdx ? brand.green : brand.border};"></div></td>` : ''}
              `
            }).join('')}
          </tr>
        </table>
      </div>` : `
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:18px 22px;margin-bottom:28px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#B91C1C;line-height:1.6;">
          We're sorry for any inconvenience. If you believe this is a mistake,<br/>please contact us immediately.
        </p>
      </div>`}

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${appUrl}/orders"
           style="display:inline-block;background:${meta.color};color:white;font-size:14px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.2px;">
          View My Orders →
        </a>
      </div>

      <p style="margin:20px 0 0;font-size:13px;color:${brand.muted};line-height:1.6;text-align:center;">
        Need help with your order? Reply to this email and we'll assist you.
      </p>
    </div>

    <!-- Footer strip -->
    <div style="background:${brand.bg};border-top:1px solid ${brand.border};padding:18px 32px;">
      <p style="margin:0;font-size:12px;color:${brand.muted};text-align:center;">
        Order #${orderId} · ArtisanNest
      </p>
    </div>
  `
  return emailWrapper(`Order #${orderId} — ${meta.headline}`, content)
}

// ─── Email Verified Success (for the verify page) ─────────────────────────────

export function verificationSuccessTemplate(name: string, loginUrl: string): string {
  const content = `
    <div style="padding:48px 32px;text-align:center;">
      <div style="width:72px;height:72px;background:${brand.green}20;border-radius:50%;margin:0 auto 24px;border:2px solid ${brand.green}40;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">✅</span>
      </div>
      <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:${brand.text};">Email Verified!</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#6B4C3B;line-height:1.7;max-width:380px;margin-left:auto;margin-right:auto;">
        Congratulations, <strong>${name}</strong>! Your seller account is now active. You can log in and start listing your handmade crafts.
      </p>
      <a href="${loginUrl}"
         style="display:inline-block;background:${brand.green};color:white;font-size:15px;font-weight:600;text-decoration:none;padding:16px 44px;border-radius:12px;">
        Go to Login →
      </a>
    </div>
  `
  return emailWrapper(`Your ArtisanNest account is verified, ${name}!`, content)
}
