import { UserRole } from '../../users/utils';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  tokenType?: 'access' | 'refresh' | 'email_verification' | 'mfa' | 'password_reset' | 'sso';
};
