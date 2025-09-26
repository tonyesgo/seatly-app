// hooks/useMercadoPago.ts
const DASHBOARD_BASE_URL = 'https://admin.seatlyapp.com';

export const useMercadoPago = () => {
  const createPreference = async ({
    title,
    userEmail,
    barId,
    matchId,
    people,
    pricePerPerson,
    reservationId,   // debe venir de la reserva "pending"
  }: {
    title: string;
    userEmail: string;
    barId: string;
    matchId: string;
    people: number;
    pricePerPerson: number;
    reservationId: string;
  }) => {
    try {
      const res = await fetch(`${DASHBOARD_BASE_URL}/api/createPreference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          userEmail,
          barId,
          matchId,
          people,
          pricePerPerson,
          reservationId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('❌ createPreference HTTP error', res.status, data);
        throw new Error(data?.error || 'Fallo al crear preferencia');
      }
      if (!data?.init_point) {
        console.error('❌ createPreference sin init_point', data);
        throw new Error('No se recibió el link de pago (init_point)');
      }

      return data.init_point as string;
    } catch (err: any) {
      console.error('❗ Error en createPreference:', err);
      throw err;
    }
  };

  return { createPreference };
};
