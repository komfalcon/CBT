import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@ObjectType()
class AuthTokensResponse {
  @Field()
  requiresMFA!: boolean;

  @Field({ nullable: true })
  tempToken?: string;

  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshToken?: string;
}

@ObjectType()
class RefreshTokenResponse {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;
}

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
    const response = await this.authService.register({
      fullName,
      email,
      password,
      phone,
      role: role as RegisterDto['role'],
    });
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

  @Mutation(() => AuthTokensResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('ipAddress', { nullable: true }) ipAddress?: string,
  ): Promise<AuthTokensResponse> {
    return this.authService.loginWithCredentials(email, password, ipAddress);
  }

  @Mutation(() => AuthTokensResponse)
  async verifyOtp(
    @Args('tempToken') tempToken: string,
    @Args('otp') otp: string,
    @Args('ipAddress', { nullable: true }) ipAddress?: string,
  ): Promise<AuthTokensResponse> {
    return this.authService.verifyOtp(tempToken, otp, ipAddress);
  }

  @Mutation(() => RefreshTokenResponse)
  async refreshToken(@Args('refreshToken') refreshToken: string): Promise<RefreshTokenResponse> {
    return this.authService.refreshTokens(refreshToken);
  }
}
