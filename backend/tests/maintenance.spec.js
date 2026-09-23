describe('Maintenance Mode Password Policy & Verification', () => {
  const REQUIRED_PASSWORD = 'KorexTonyFalconStark1025$';

  const verifyPassword = (providedPassword) => {
    return Boolean(providedPassword && providedPassword === REQUIRED_PASSWORD);
  };

  it('rejects empty, undefined, or null passwords', () => {
    expect(verifyPassword('')).toBe(false);
    expect(verifyPassword(undefined)).toBe(false);
    expect(verifyPassword(null)).toBe(false);
  });

  it('strictly enforces case sensitivity', () => {
    expect(verifyPassword('korexTonyFalconStark1025$')).toBe(false);
    expect(verifyPassword('KorextonyfalconStark1025$')).toBe(false);
    expect(verifyPassword('KOREXTONYFALCONSTARK1025$')).toBe(false);
    expect(verifyPassword('KorexTonyFalconStark1025')).toBe(false); // missing symbol
  });

  it('accepts the exact master password', () => {
    expect(verifyPassword('KorexTonyFalconStark1025$')).toBe(true);
  });

  describe('Route Exemption Gate', () => {
    const isExempted = (path, userRole = null) => {
      // 1. Authenticated admin bypass
      if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
      }
      // 2. System and admin route prefix exemptions
      const exemptedPaths = ['/admin', '/sys', '/health', '/system/maintenance-status', '/api/system/maintenance-status'];
      if (exemptedPaths.some((prefix) => path.startsWith(prefix))) {
        return true;
      }
      // 3. Essential auth route exemptions (including /auth/me for credential verification)
      const isAuthRoute = /^\/auth\/(login|refresh|logout|verify-otp|me)/.test(path);
      return isAuthRoute;
    };

    it('exempts admin routes, checkpoint, and auth endpoints', () => {
      expect(isExempted('/admin/overview')).toBe(true);
      expect(isExempted('/admin/candidates')).toBe(true);
      expect(isExempted('/sys/auth-checkpoint')).toBe(true);
      expect(isExempted('/system/maintenance-status')).toBe(true);
      expect(isExempted('/auth/login')).toBe(true);
      expect(isExempted('/auth/verify-otp')).toBe(true);
      expect(isExempted('/auth/me')).toBe(true); // CRITICAL: allows getMe() to succeed during maintenance
    });

    it('allows authenticated admins on any route', () => {
      expect(isExempted('/questions', 'admin')).toBe(true);
      expect(isExempted('/dashboard', 'admin')).toBe(true);
      expect(isExempted('/exam/123', 'super_admin')).toBe(true);
    });

    it('blocks unauthenticated visitors and students from general routes when maintenance is active', () => {
      expect(isExempted('/')).toBe(false);
      expect(isExempted('/dashboard', 'student')).toBe(false);
      expect(isExempted('/arena')).toBe(false);
      expect(isExempted('/exam/session-123', 'student')).toBe(false);
      expect(isExempted('/results/review-456')).toBe(false);
      expect(isExempted('/mock-setup')).toBe(false);
      expect(isExempted('/leaderboard')).toBe(false);
      expect(isExempted('/questions', 'student')).toBe(false);
    });
  });
});
