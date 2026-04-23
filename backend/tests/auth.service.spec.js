const {
  calculateLockoutDurationMs,
  getLockoutRemainingSeconds,
} = require('../dist/auth/auth.service');

describe('AuthService lockout policy', () => {
  it('returns no lockout under 5 attempts', () => {
    expect(calculateLockoutDurationMs(1)).toBe(0);
    expect(calculateLockoutDurationMs(4)).toBe(0);
  });

  it('applies correct exponential lockout durations', () => {
    expect(calculateLockoutDurationMs(5)).toBe(60_000);
    expect(calculateLockoutDurationMs(6)).toBe(5 * 60_000);
    expect(calculateLockoutDurationMs(7)).toBe(15 * 60_000);
    expect(calculateLockoutDurationMs(8)).toBe(60 * 60_000);
    expect(calculateLockoutDurationMs(20)).toBe(60 * 60_000);
  });

  it('computes remaining lockout seconds correctly', () => {
    const lockoutUntil = new Date(Date.now() + 5_000);
    const remaining = getLockoutRemainingSeconds(lockoutUntil);

    expect(remaining).toBeGreaterThanOrEqual(4);
    expect(remaining).toBeLessThanOrEqual(5);
    expect(getLockoutRemainingSeconds(undefined)).toBe(0);
    expect(getLockoutRemainingSeconds(new Date(Date.now() - 1_000))).toBe(0);
  });
});
