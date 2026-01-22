/**
 * Tests para el hook useMercadoPago
 * Verifica que el hook crea preferencias de pago correctamente
 */

import { useMercadoPago } from '@/hooks/useMercadoPago';

describe('useMercadoPago Hook', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  describe('createPreference', () => {
    it('should create a payment preference successfully', async () => {
      const mockResponse = {
        init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { createPreference } = useMercadoPago();

      const result = await createPreference({
        title: 'Reserva en Bar Deportivo',
        userEmail: 'test@example.com',
        barId: 'bar123',
        matchId: 'match456',
        people: 4,
        pricePerPerson: 200,
        reservationId: 'res789',
      });

      expect(result).toBe(mockResponse.init_point);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://admin.seatlyapp.com/api/createPreference',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Reserva en Bar Deportivo',
            userEmail: 'test@example.com',
            barId: 'bar123',
            matchId: 'match456',
            people: 4,
            pricePerPerson: 200,
            reservationId: 'res789',
          }),
        }
      );
    });

    it('should throw error when response is not ok', async () => {
      const mockErrorResponse = {
        error: 'Error al crear preferencia',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      });

      const { createPreference } = useMercadoPago();

      await expect(
        createPreference({
          title: 'Reserva en Bar Deportivo',
          userEmail: 'test@example.com',
          barId: 'bar123',
          matchId: 'match456',
          people: 4,
          pricePerPerson: 200,
          reservationId: 'res789',
        })
      ).rejects.toThrow('Error al crear preferencia');
    });

    it('should throw error when init_point is missing', async () => {
      const mockResponse = {
        // Sin init_point
        preference_id: '123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { createPreference } = useMercadoPago();

      await expect(
        createPreference({
          title: 'Reserva en Bar Deportivo',
          userEmail: 'test@example.com',
          barId: 'bar123',
          matchId: 'match456',
          people: 4,
          pricePerPerson: 200,
          reservationId: 'res789',
        })
      ).rejects.toThrow('No se recibió el link de pago (init_point)');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { createPreference } = useMercadoPago();

      await expect(
        createPreference({
          title: 'Reserva en Bar Deportivo',
          userEmail: 'test@example.com',
          barId: 'bar123',
          matchId: 'match456',
          people: 4,
          pricePerPerson: 200,
          reservationId: 'res789',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { createPreference } = useMercadoPago();

      // El código tiene un catch que devuelve {} en caso de error JSON
      // Pero debería lanzar error porque no hay init_point en {}
      await expect(
        createPreference({
          title: 'Reserva en Bar Deportivo',
          userEmail: 'test@example.com',
          barId: 'bar123',
          matchId: 'match456',
          people: 4,
          pricePerPerson: 200,
          reservationId: 'res789',
        })
      ).rejects.toThrow('No se recibió el link de pago (init_point)');
    });

    it('should send correct data structure for multiple people', async () => {
      const mockResponse = {
        init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=456',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { createPreference } = useMercadoPago();

      await createPreference({
        title: 'Mesa para 8 personas',
        userEmail: 'grupo@example.com',
        barId: 'bar999',
        matchId: 'match888',
        people: 8,
        pricePerPerson: 150,
        reservationId: 'res111',
      });

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );

      expect(callBody.people).toBe(8);
      expect(callBody.pricePerPerson).toBe(150);
      expect(callBody.title).toBe('Mesa para 8 personas');
    });
  });
});
