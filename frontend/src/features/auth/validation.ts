/**
 * Single source of truth for candidate password rules on the frontend.
 * Used by Register and Reset Password.
 *
 * NOTE: backend/src/auth/dto/register.dto.ts currently only enforces MinLength(8).
 * The other three rules are enforced client-side only (see FLAGS in the walkthrough).
 */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'One symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export type PasswordStrength = '' | 'Weak' | 'Medium' | 'Strong';

export function evaluatePassword(password: string) {
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));
  const passedCount = results.filter((r) => r.passed).length;
  const strength: PasswordStrength =
    passedCount === 0 ? '' : passedCount <= 2 ? 'Weak' : passedCount === 3 ? 'Medium' : 'Strong';
  return { results, passedCount, strength, isValid: passedCount === PASSWORD_RULES.length };
}

/** Nigerian mobile number: +234 or 0 prefix, then 10 digits starting 7/8/9. Empty is allowed (optional). */
export function isValidNigerianPhone(value: string): boolean {
  const cleaned = value.replace(/[\s-]/g, '');
  if (!cleaned) return true;
  return /^(?:\+234|0)[789][01]\d{8}$/.test(cleaned);
}
