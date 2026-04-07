process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
process.env.STELLAR_NETWORK = 'testnet';
process.env.STELLAR_SECRET_KEY = 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
process.env.JWT_SECRET = 'test-secret';
process.env.REDIS_URL = 'redis://localhost:6379';

import {signJwt, verifyJwt} from '../src/utils/jwt';

describe('Authentication utils', () => {
  it('should sign and verify a JWT payload', () => {
    const payload = {sub: 'user-1', email: 'audit@stellar.local', role: 'USER'};
    const token = signJwt(payload);
    const decoded = verifyJwt(token);

    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });
});
