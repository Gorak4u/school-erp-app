/**
 * Email Components - High-Class Professional Email Building Blocks
 * 
 * World-class email components with:
 * - Modern gradient design
 * - Dark mode support
 * - Mobile responsive (600px max-width)
 * - Professional typography
 * - WCAG 2.1 AA accessibility
 * 
 * @module EmailComponents
 */

export interface SchoolBranding {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface EmailStyles {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  cardBackground: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
}

/**
 * Generate default styles based on primary color
 */
export function generateStyles(primaryColor: string = '#2563eb'): EmailStyles {
  return {
    primaryColor,
    accentColor: '#1e40af',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    mutedTextColor: '#64748b',
    borderColor: '#e2e8f0',
    cardBackground: '#ffffff',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    dangerColor: '#ef4444'
  };
}

/**
 * Email Document Wrapper
 * Provides the full HTML document structure
 */
export function emailDocument(content: string, title: string = 'School ERP'): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <style type="text/css">
    /* Reset and base styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-padding { padding: 20px !important; }
      .email-header { padding: 24px 20px !important; }
      .email-footer { padding: 24px 20px !important; }
      .hide-mobile { display: none !important; }
      .mobile-text-center { text-align: center !important; }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #0f172a !important; }
      .email-content { background-color: #1e293b !important; }
      .email-card { background-color: #334155 !important; border-color: #475569 !important; }
      .email-text { color: #f1f5f9 !important; }
      .email-muted { color: #94a3b8 !important; }
    }
    
    /* Client-specific fixes */
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    #outlook a { padding: 0; }
  </style>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${content}
</body>
</html>`;
}

/**
 * Email Container - Main wrapper
 */
export function emailContainer(content: string, maxWidth: number = 600): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-body" style="background-color: #f8fafc;">
  <tr>
    <td style="padding: 20px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${maxWidth}" class="email-container" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        ${content}
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * Email Header with School Branding
 */
export function emailHeader(branding: SchoolBranding, styles: EmailStyles): string {
  const { name, logo } = branding;
  const { primaryColor } = styles;
  
  return `<tr>
    <td class="email-header" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%); padding: 32px; text-align: center;">
      ${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}" width="80" height="80" style="border-radius: 8px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none'">` : ''}
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${escapeHtml(name)}</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; font-weight: 500;">School Management System</p>
    </td>
  </tr>`;
}

/**
 * Email Content Area
 */
export function emailContent(content: string, padding: number = 32): string {
  return `<tr>
    <td class="email-padding" style="padding: ${padding}px; background-color: #ffffff;" class="email-content">
      ${content}
    </td>
  </tr>`;
}

/**
 * Email Footer with Contact Info
 */
export function emailFooter(branding: SchoolBranding, styles: EmailStyles): string {
  const { name, address, phone, email, website } = branding;
  const { primaryColor, mutedTextColor } = styles;
  
  const year = new Date().getFullYear();
  
  return `<tr>
    <td class="email-footer" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px; text-align: center;">
      ${address || phone || email ? `<p style="color: #94a3b8; margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
        ${address ? `📍 ${escapeHtml(address)}<br/>` : ''}
        ${phone ? `📞 ${escapeHtml(phone)}<br/>` : ''}
        ${email ? `✉️ ${escapeHtml(email)}<br/>` : ''}
        ${website ? `🌐 ${escapeHtml(website)}` : ''}
      </p>` : ''}
      
      <p style="color: #64748b; margin: 16px 0 0; font-size: 13px;">
        © ${year} ${escapeHtml(name)}. All rights reserved.
      </p>
      
      <p style="color: #475569; margin: 8px 0 0; font-size: 11px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </td>
  </tr>`;
}

/**
 * Content Card - White card with shadow
 */
export function contentCard(content: string, styles: EmailStyles, accent: boolean = false): string {
  const { cardBackground, borderColor, primaryColor } = styles;
  const borderLeft = accent ? `border-left: 4px solid ${primaryColor};` : '';
  
  return `<div class="email-card" style="background-color: ${cardBackground}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 24px; margin: 16px 0; ${borderLeft}">
    ${content}
  </div>`;
}

/**
 * Greeting Text
 */
export function greeting(name: string, styles: EmailStyles): string {
  return `<p style="color: ${styles.textColor}; font-size: 16px; margin: 0 0 16px; font-weight: 600;">
    Dear ${escapeHtml(name)},
  </p>`;
}

/**
 * Paragraph Text
 */
export function paragraph(text: string, styles: EmailStyles, align: 'left' | 'center' | 'right' = 'left'): string {
  return `<p style="color: ${styles.mutedTextColor}; font-size: 14px; line-height: 1.6; margin: 0 0 16px; text-align: ${align};">
    ${text}
  </p>`;
}

/**
 * Primary CTA Button
 */
export function primaryButton(text: string, url: string, styles: EmailStyles): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
  <tr>
    <td style="border-radius: 8px; background: linear-gradient(135deg, ${styles.primaryColor} 0%, ${adjustColor(styles.primaryColor, -20)} 100%); text-align: center; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
      <a href="${escapeHtml(url)}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Secondary Button (Outlined)
 */
export function secondaryButton(text: string, url: string, styles: EmailStyles): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
  <tr>
    <td style="border-radius: 8px; border: 2px solid ${styles.primaryColor}; text-align: center;">
      <a href="${escapeHtml(url)}" style="display: inline-block; padding: 12px 30px; color: ${styles.primaryColor}; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Data Table for displaying structured information
 */
export interface TableRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export function dataTable(rows: TableRow[], styles: EmailStyles): string {
  const rowsHtml = rows.map(row => {
    const valueStyle = row.highlight 
      ? `color: ${styles.primaryColor}; font-weight: 700;` 
      : `color: ${styles.textColor};`;
    
    return `<tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${styles.borderColor}; color: ${styles.mutedTextColor}; font-size: 13px; width: 40%;">${escapeHtml(row.label)}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid ${styles.borderColor}; ${valueStyle} font-size: 14px; text-align: right;">${row.value}</td>
    </tr>`;
  }).join('');
  
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>`;
}

/**
 * Status Badge
 */
export function statusBadge(status: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info', styles: EmailStyles): string {
  const colors = {
    success: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
    warning: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    danger: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    info: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }
  };
  
  const color = colors[type];
  
  return `<span style="display: inline-block; padding: 6px 12px; background-color: ${color.bg}; color: ${color.text}; border: 1px solid ${color.border}; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;">
    ${escapeHtml(status)}
  </span>`;
}

/**
 * Info Box - Callout for important information
 */
export function infoBox(title: string, content: string, type: 'info' | 'warning' | 'success' | 'error' = 'info', styles: EmailStyles): string {
  const colors = {
    info: { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ️' },
    warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠️' },
    success: { bg: '#ecfdf5', border: '#10b981', icon: '✅' },
    error: { bg: '#fef2f2', border: '#ef4444', icon: '❌' }
  };
  
  const color = colors[type];
  
  return `<div style="background-color: ${color.bg}; border-left: 4px solid ${color.border}; border-radius: 6px; padding: 16px; margin: 16px 0;">
    <p style="margin: 0 0 8px; font-weight: 600; color: ${styles.textColor}; font-size: 14px;">${color.icon} ${escapeHtml(title)}</p>
    <div style="color: ${styles.mutedTextColor}; font-size: 13px; line-height: 1.5;">
      ${content}
    </div>
  </div>`;
}

/**
 * Divider Line
 */
export function divider(styles: EmailStyles): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
    <tr>
      <td style="border-top: 1px solid ${styles.borderColor}; height: 1px; font-size: 0;">&nbsp;</td>
    </tr>
  </table>`;
}

/**
 * List Component
 */
export function list(items: string[], styles: EmailStyles, ordered: boolean = false): string {
  const tag = ordered ? 'ol' : 'ul';
  const itemsHtml = items.map(item => 
    `<li style="color: ${styles.mutedTextColor}; font-size: 14px; line-height: 1.6; margin: 8px 0;">${item}</li>`
  ).join('');
  
  return `<${tag} style="margin: 16px 0; padding-left: 24px;">
    ${itemsHtml}
  </${tag}>`;
}

/**
 * Two Column Layout
 */
export function twoColumn(left: string, right: string, styles: EmailStyles): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td width="50%" valign="top" style="padding-right: 12px;">
        ${left}
      </td>
      <td width="50%" valign="top" style="padding-left: 12px;">
        ${right}
      </td>
    </tr>
  </table>`;
}

/**
 * Signature Block
 */
export function signature(name: string, title: string, styles: EmailStyles): string {
  return `<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${styles.borderColor};">
    <p style="color: ${styles.textColor}; font-size: 14px; margin: 0 0 4px; font-weight: 600;">Best regards,</p>
    <p style="color: ${styles.mutedTextColor}; font-size: 14px; margin: 0;">
      <strong style="color: ${styles.textColor};">${escapeHtml(name)}</strong><br>
      ${escapeHtml(title)}
    </p>
  </div>`;
}

/**
 * Progress Indicator (for multi-step processes)
 */
export function progressIndicator(steps: string[], currentStep: number, styles: EmailStyles): string {
  const stepWidth = 100 / steps.length;
  
  const stepsHtml = steps.map((step, index) => {
    const isActive = index <= currentStep;
    const isCurrent = index === currentStep;
    
    const bgColor = isActive ? styles.primaryColor : styles.borderColor;
    const textColor = isActive ? '#ffffff' : styles.mutedTextColor;
    const borderColor = isCurrent ? adjustColor(styles.primaryColor, 20) : bgColor;
    
    return `<td width="${stepWidth.toFixed(2)}%" style="padding: 0 4px;">
      <div style="background-color: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 6px; padding: 8px; text-align: center;">
        <span style="color: ${textColor}; font-size: 11px; font-weight: 600; display: block;">Step ${index + 1}</span>
        <span style="color: ${textColor}; font-size: 10px; display: block; margin-top: 2px;">${escapeHtml(step)}</span>
      </div>
    </td>`;
  }).join('');
  
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
    <tr>
      ${stepsHtml}
    </tr>
  </table>`;
}

/**
 * Helper: Escape HTML entities
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Helper: Adjust color brightness
 */
function adjustColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse RGB
  const num = parseInt(hex, 16);
  const r = (num >> 16) + percent;
  const g = ((num >> 8) & 0x00FF) + percent;
  const b = (num & 0x00FF) + percent;
  
  // Clamp values
  const clamp = (val: number) => Math.max(0, Math.min(255, val));
  
  return `#${(1 << 24 | clamp(r) << 16 | clamp(g) << 8 | clamp(b)).toString(16).slice(1)}`;
}

/**
 * Build complete branded email
 */
export function buildBrandedEmail(params: {
  branding: SchoolBranding;
  subject: string;
  greeting?: string;
  content: string;
  footer?: boolean;
  styles?: Partial<EmailStyles>;
}): string {
  const { branding, subject, greeting, content, footer = true, styles: customStyles } = params;
  
  const styles = {
    ...generateStyles(branding.primaryColor || '#2563eb'),
    ...customStyles
  };
  
  let bodyContent = '';
  
  if (greeting) {
    bodyContent += `<p style="color: ${styles.textColor}; font-size: 16px; margin: 0 0 16px; font-weight: 600;">Dear ${escapeHtml(greeting)},</p>`;
  }
  
  bodyContent += content;
  
  const fullContent = emailHeader(branding, styles) +
    emailContent(bodyContent, 32) +
    (footer ? emailFooter(branding, styles) : '');
  
  return emailDocument(emailContainer(fullContent), subject);
}

export default {
  document: emailDocument,
  container: emailContainer,
  header: emailHeader,
  content: emailContent,
  footer: emailFooter,
  card: contentCard,
  greeting,
  paragraph,
  button: primaryButton,
  secondaryButton,
  table: dataTable,
  badge: statusBadge,
  infoBox,
  divider,
  list,
  twoColumn,
  signature,
  progress: progressIndicator,
  build: buildBrandedEmail,
  generateStyles
};
