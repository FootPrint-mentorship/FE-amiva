/**
 * E.164 assembly shared by every phone input (register, onboarding, settings,
 * complete-profile). Born from a live signup failure (23 Sep 2026): a user
 * picked +234 AND typed the number starting with 234, the form submitted
 * +2342347061294574 (17 digits), and the server's regex rejection surfaced —
 * under the wrong field — as raw pattern text.
 */

export const E164_RE = /^\+[1-9]\d{6,14}$/;

/** Country-code + national digits → E.164. Strips leading zeros and a
 * retyped country code (kept only when dropping it is what makes the number
 * fit E.164's 15-digit cap, so short legit numbers that happen to start with
 * the code digits are left alone). */
export function buildE164(cc: string, digits: string): string {
  const ccDigits = cc.replace(/\D/g, "");
  let national = digits.replace(/\D/g, "").replace(/^0+/, "");
  if (national.startsWith(ccDigits) && (ccDigits + national).length > 15) {
    national = national.slice(ccDigits.length).replace(/^0+/, "");
  }
  return `+${ccDigits}${national}`;
}

export function isValidE164(value: string): boolean {
  return E164_RE.test(value);
}

export const PHONE_ERROR = "That doesn't look like a valid phone number — check the digits (no country code needed, it's already selected).";
