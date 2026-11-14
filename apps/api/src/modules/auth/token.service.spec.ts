import jwt from 'jsonwebtoken';
import { TokenService } from './token.service';

const config = { secret: 's'.repeat(32), expiresInSeconds: 3600 };

describe('TokenService (UNIT – AC-10.3, AC-11.1)', () => {
  it('ký HS256 với claim sub, role và hết hạn sau 60 phút', () => {
    const service = new TokenService(config);

    const token = service.sign({ sub: 'u1', role: 'CUSTOMER' });
    const decoded = jwt.decode(token, { complete: true }) as jwt.Jwt & { payload: jwt.JwtPayload };

    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload.sub).toBe('u1');
    expect(decoded.payload.role).toBe('CUSTOMER');
    expect(decoded.payload.exp! - decoded.payload.iat!).toBe(3600);
  });

  it('verify trả null khi token sai chữ ký, hết hạn hoặc rác', () => {
    const service = new TokenService(config);
    const forged = jwt.sign({ sub: 'u1', role: 'MANAGER' }, 'khac'.repeat(10));
    const expired = jwt.sign({ sub: 'u1', role: 'CUSTOMER' }, config.secret, { expiresIn: -10 });

    expect(service.verify(forged)).toBeNull();
    expect(service.verify(expired)).toBeNull();
    expect(service.verify('khong-phai-jwt')).toBeNull();
  });

  it('từ chối token alg=none', () => {
    const service = new TokenService(config);
    const none = jwt.sign({ sub: 'u1', role: 'MANAGER' }, '', { algorithm: 'none' });

    expect(service.verify(none)).toBeNull();
  });
});
