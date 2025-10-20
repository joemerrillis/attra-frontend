/**
 * Mask a name for free tier display
 * "John Smith" → "J••• S••••"
 */
export function maskName(name: string): string {
  if (!name) return '';

  const parts = name.trim().split(' ');
  return parts
    .map(part => {
      if (part.length === 0) return '';
      return part[0] + '•'.repeat(Math.max(part.length - 1, 3));
    })
    .join(' ');
}

/**
 * Mask an email address
 * "john@example.com" → "j•••@exa••••.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '•••@••••.com';

  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '•'.repeat(Math.min(local.length - 1, 3));

  const domainParts = domain.split('.');
  const maskedDomain = domainParts
    .map((part, i) => {
      if (i === domainParts.length - 1) return part; // Keep TLD
      return part.slice(0, 3) + '•'.repeat(Math.max(part.length - 3, 2));
    })
    .join('.');

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Mask a phone number
 * "(555) 123-4567" → "•••-•••-4567"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '•••-•••-••••';

  // Extract digits only
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 4) return '•••-•••-••••';

  const last4 = digits.slice(-4);
  return `•••-•••-${last4}`;
}

/**
 * Format contact data with masking based on access level
 */
export function formatContactForDisplay(
  contact: any,
  hasAccess: boolean
) {
  if (hasAccess) {
    return {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      masked: false,
    };
  }

  return {
    name: contact.name, // Name always visible
    email: maskEmail(contact.email),
    phone: maskPhone(contact.phone),
    masked: true,
  };
}
