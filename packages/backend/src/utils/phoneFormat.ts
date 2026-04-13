/**
 * Ghanaian phone number utilities.
 *
 * Valid local prefixes per SRS §4.5: 024, 025, 026, 027, 028, 059
 * Also accepts 020, 023, 050 (Vodafone/AirtelTigo).
 */

const VALID_PREFIXES = ['024', '025', '026', '027', '028', '059', '020', '023', '050', '055', '057'];

/**
 * Validates a Ghanaian phone number (local format: 0XXXXXXXXX).
 */
export function isValidGhanaPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s|-/g, '');
  if (!/^0\d{9}$/.test(cleaned)) return false;
  const prefix = cleaned.substring(0, 3);
  return VALID_PREFIXES.includes(prefix);
}

/**
 * Converts local Ghanaian number (0XXXXXXXXX) to international format (233XXXXXXXXX).
 */
export function toInternationalFormat(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.startsWith('0')) {
    return '233' + cleaned.substring(1);
  }
  if (cleaned.startsWith('+233')) {
    return cleaned.substring(1); // strip +
  }
  return cleaned;
}

/**
 * Converts international format (233XXXXXXXXX) back to local (0XXXXXXXXX).
 */
export function toLocalFormat(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.startsWith('233')) {
    return '0' + cleaned.substring(3);
  }
  return cleaned;
}
