import type { ServiceTier } from '@/types';

interface BookingConfirmationParams {
  customerName: string;
  bookingRef: string;
  tier: ServiceTier;
  categoryName: string;
  scheduledDatetime: string;
  address: string;
  suburb: string;
  postcode: string;
  bedrooms: number;
  bathrooms: number;
  totalPriceCents: number;
}

const TIER_COLOR: Record<ServiceTier, string> = {
  Silver: '#64748b',
  Gold: '#d97706',
  Pro: '#7c3aed',
};

const TIER_INCLUDES: Record<ServiceTier, string[]> = {
  Silver: ['Vacuuming all rooms', 'Mopping hard floors', 'Bathroom clean', 'Kitchen wipe-down'],
  Gold: ['All Silver included', 'Window wiping', 'Deep kitchen scrub', 'Skirting boards'],
  Pro: ['All Gold included', 'Inside oven clean', 'Inside fridge clean', 'Top-rated pros only'],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function shortRef(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function buildBookingConfirmationEmail(p: BookingConfirmationParams) {
  const tierColor = TIER_COLOR[p.tier];
  const includes = TIER_INCLUDES[p.tier];
  const ref = shortRef(p.bookingRef);
  const price = formatPrice(p.totalPriceCents);
  const date = formatDate(p.scheduledDatetime);
  const time = formatTime(p.scheduledDatetime);

  const subject = `Booking confirmed — ${p.tier} Home Cleaning on ${date}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:#059669;border-radius:12px;padding:10px 14px;">
                    <span style="color:#ffffff;font-size:15px;font-weight:800;letter-spacing:-0.3px;">Urban Clap AU</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;padding:32px 32px 24px;">

              <!-- Header -->
              <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Booking Confirmed</p>
              <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.2;">
                Your clean is booked, ${p.customerName.split(' ')[0]}!
              </h1>

              <!-- Tier badge row -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                <tr>
                  <td style="background:${tierColor}1a;border:1px solid ${tierColor}33;border-radius:999px;padding:5px 14px;">
                    <span style="color:${tierColor};font-size:13px;font-weight:700;">${p.tier} ${p.categoryName}</span>
                  </td>
                  <td width="12"></td>
                  <td style="background:#f1f5f9;border-radius:999px;padding:5px 14px;">
                    <span style="color:#64748b;font-size:12px;font-weight:600;font-family:monospace;">Ref #${ref}</span>
                  </td>
                </tr>
              </table>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Date &amp; Time</p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${date}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${time}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;border-top:1px solid #e2e8f0;padding-top:16px;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Address</p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${p.address}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${p.suburb} ${p.postcode}</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e2e8f0;padding-top:16px;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Property</p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${p.bedrooms} bedroom${p.bedrooms !== 1 ? 's' : ''} · ${p.bathrooms} bathroom${p.bathrooms !== 1 ? 's' : ''}</p>
                  </td>
                </tr>
              </table>

              <!-- What's included -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a;">What&apos;s included</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                ${includes.map((item) => `
                <tr>
                  <td width="20" valign="top" style="padding-bottom:6px;">
                    <span style="color:#059669;font-size:15px;">✓</span>
                  </td>
                  <td style="padding-bottom:6px;font-size:14px;color:#475569;">${item}</td>
                </tr>`).join('')}
              </table>

              <!-- Price row -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="border-top:2px solid #e2e8f0;padding-top:20px;margin-bottom:28px;">
                <tr>
                  <td style="font-size:14px;color:#64748b;font-weight:600;">Total paid</td>
                  <td align="right" style="font-size:22px;font-weight:800;color:#0f172a;">${price}</td>
                </tr>
                <tr>
                  <td colspan="2" align="right" style="font-size:11px;color:#94a3b8;padding-top:2px;">AUD incl. GST</td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings"
                      style="display:inline-block;background:#059669;color:#ffffff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:12px;text-decoration:none;">
                      View My Bookings
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Urban Clap AU Pty Ltd · ABN 00 000 000 000<br />
                Questions? Reply to this email or call <strong>1800 URBAN AU</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
