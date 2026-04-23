import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => String)
  async register(
    @Args('fullName') fullName: string,
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('phone', { nullable: true }) phone?: string,
    @Args('role', { nullable: true }) role?: string,
  ) {
    const response = await this.authService.register({ fullName, email, password, phone, role });
    return response.message;
  }

  @Mutation(() => String)
  async verifyEmail(@Args('token') token: string) {
    const response = await this.authService.verifyEmail(token);
    return response.message;
  }

  @Mutation(() => String)
  async forgotPassword(@Args('email') email: string) {
    const response = await this.authService.forgotPassword(email);
    return response.message;
  }

  @Mutation(() => String)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('ipAddress', { nullable: true }) ipAddress?: string,
  ) {
    const response = await this.authService.loginWithCredentials(email, password, ipAddress);
    return JSON.stringify(response);
  }

  @Mutation(() => String)
  async verifyOtp(
    @Args('tempToken') tempToken: string,
    @Args('otp') otp: string,
    @Args('ipAddress', { nullable: true }) ipAddress?: string,
  ) {
    const response = await this.authService.verifyOtp(tempToken, otp, ipAddress);
    return JSON.stringify(response);
  }

  @Mutation(() => String)
  async refreshToken(@Args('refreshToken') refreshToken: string) {
    const response = await this.authService.refreshTokens(refreshToken);
    return JSON.stringify(response);
  }
}
