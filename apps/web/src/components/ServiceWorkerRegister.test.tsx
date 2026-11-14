import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceWorkerRegister } from './ServiceWorkerRegister';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function stubSw() {
  const register = vi.fn().mockResolvedValue({});
  Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true });
  return register;
}

describe('ServiceWorkerRegister (NFR-11)', () => {
  it('không đăng ký ở môi trường development/test', () => {
    const register = stubSw();
    render(<ServiceWorkerRegister />);
    expect(register).not.toHaveBeenCalled();
  });

  it('đăng ký /sw.js ở production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const register = stubSw();
    render(<ServiceWorkerRegister />);
    expect(register).toHaveBeenCalledWith('/sw.js');
  });
});
