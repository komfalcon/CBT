import { UserRole } from '../../users/schemas/user.schema';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  tokenType?: 'access' | 'refresh' | 'email_verification' | 'mfa' | 'password_reset';
  purpose?: 'email_verification' | 'mfa' | 'password_reset';
};
