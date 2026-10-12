jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verifySync: jest.fn(),
}));

const { AuthService } = require('../dist/auth/auth.service');

describe('AuthService Google login verification', () => {
  function createService({ payload, user } = {}) {
    const service = new AuthService(
      {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => (user ? [user] : []),
            }),
          }),
        }),
      },
      {},
      { get: () => 'google-client-id' },
      {},
    );

    service.googleClient.verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => payload,
    });
    service.completeLogin = jest.fn().mockResolvedValue({
      requiresMFA: false,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    return service;
  }

  it('verifies the credential locally with the configured Google client ID', async () => {
    const user = {
      id: 'user-1',
      email: 'candidate@example.com',
      fullName: 'Candidate',
      account_status: 'active',
      profile_photo_url: 'https://example.com/avatar.jpg',
      mfa_enabled: false,
    };
    const service = createService({
      payload: {
        email: user.email,
        email_verified: true,
        name: user.fullName,
        picture: user.profile_photo_url,
      },
      user,
    });

    await expect(service.loginWithGoogle('google-id-token')).resolves.toMatchObject({
      requiresMFA: false,
    });
    expect(service.googleClient.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: 'google-client-id',
    });
    expect(service.completeLogin).toHaveBeenCalledWith(user, undefined);
  });

  it('rejects credentials without a verified Google email', async () => {
    const service = createService({
      payload: {
        email: 'candidate@example.com',
        email_verified: false,
      },
    });

    await expect(service.loginWithGoogle('google-id-token')).rejects.toThrow(
      'Failed to verify Google token.',
    );
    expect(service.completeLogin).not.toHaveBeenCalled();
  });
});
