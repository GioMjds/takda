export const PH_PHONE_REGEX = /^(09|\+639)\d{9}$/;

export function isValidPHPhone(phone: string): boolean {
  return PH_PHONE_REGEX.test(phone);
}

export function normalizePhone(phone: string): string {
  // Strip spaces, dashes, or parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('09') && cleaned.length === 11) {
    return `+639${cleaned.slice(2)}`;
  }
  if (cleaned.startsWith('+639') && cleaned.length === 13) {
    return cleaned;
  }
  return cleaned;
}
