import { createBooking, refreshQueueToken } from '../api';

global.fetch = jest.fn() as any;

describe('lib/api queue wrappers', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockReset();
  });

  it('calls POST /v1/businesses/:slug/bookings with idempotency header', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        booking: {
          id: 'b_1',
          tenantId: 't_1',
          businessId: 'biz_1',
          serviceId: 's1',
          slotStart: '2026-07-20T09:00:00.000Z',
          customerName: 'Juan',
          customerPhone: '+639171234567',
          status: 'PENDING',
          source: 'ONLINE',
          createdAt: '2026-07-20T08:00:00.000Z',
          updatedAt: '2026-07-20T08:00:00.000Z',
        },
        queueToken: 'token_123',
        queueTokenExpiresAt: '2026-07-21T09:00:00.000Z',
      }),
    });

    const res = await createBooking(
      'test-biz',
      {
        serviceId: 's1',
        slotStart: '2026-07-20T09:00:00.000Z',
        customerName: 'Juan',
        customerPhone: '+639171234567',
      },
      'idempotency_key_1',
    );

    expect(res.queueToken).toBe('token_123');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/businesses/test-biz/bookings'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Idempotency-Key': 'idempotency_key_1',
        }),
      }),
    );
  });

  it('calls POST /v1/bookings/:id/queue-token to refresh queue token', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        booking: {
          id: 'b_123',
          tenantId: 't_1',
          businessId: 'biz_1',
          serviceId: 's1',
          slotStart: '2026-07-20T09:00:00.000Z',
          customerName: 'Juan',
          customerPhone: '+639171234567',
          status: 'PENDING',
          source: 'ONLINE',
          createdAt: '2026-07-20T08:00:00.000Z',
          updatedAt: '2026-07-20T08:00:00.000Z',
        },
        queueToken: 'token_refreshed',
        queueTokenExpiresAt: '2026-07-21T09:00:00.000Z',
      }),
    });

    const res = await refreshQueueToken('b_123', '+639171234567');

    expect(res.queueToken).toBe('token_refreshed');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/bookings/b_123/queue-token'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone: '+639171234567' }),
      }),
    );
  });
});
