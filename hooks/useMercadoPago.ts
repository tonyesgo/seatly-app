export const useMercadoPago = () => {
  const createPreference = async ({
    title,
    userEmail,
    barId,
    matchId,
    name,
    phone,
    people,
    pricePerPerson,
    barName,
    matchTeams,
  }: {
    title: string;
    userEmail: string;
    barId: string;
    matchId: string;
    name: string;
    phone: string;
    people: number;
    pricePerPerson: number;
    barName: string;
    matchTeams: string;
  }) => {
    const token = process.env.EXPO_PUBLIC_MP_ACCESS_TOKEN;
    const totalPrice = pricePerPerson * people;

    const successUrl = `ido10s://payment/success?barId=${barId}&matchId=${matchId}&name=${encodeURIComponent(
      name
    )}&phone=${phone}&people=${people}&barName=${encodeURIComponent(
      barName
    )}&matchTeams=${encodeURIComponent(matchTeams)}`;

    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              title,
              unit_price: totalPrice,
              quantity: 1,
            },
          ],
          payer: {
            email: userEmail,
          },
          back_urls: {
            success: successUrl,
            failure: 'ido10s://payment/failure',
            pending: 'ido10s://payment/pending',
          },
          auto_return: 'approved',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.init_point) {
        console.error('❌ MercadoPago ERROR:', data);
        throw new Error('No se pudo generar el link de pago');
      }

      console.log('✅ MercadoPago init_point:', data.init_point);
      return data.init_point;
    } catch (err) {
      console.error('❗ Error inesperado en createPreference:', err);
      throw err;
    }
  };

  return { createPreference };
};
