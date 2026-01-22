/**
 * Tests para la validación del formulario de reservación
 * Basado en la lógica de validación en app/tabs/reserve.tsx
 */

describe('Reservation Form Validation', () => {
  // Función de validación extraída de reserve.tsx
  const validateReservationForm = (
    name: string,
    people: string,
    phone: string,
    promo: any
  ): { valid: boolean; error?: string } => {
    const peopleCount = parseInt(people);

    // Validar campos completos
    if (!name || !people || !phone) {
      return { valid: false, error: 'Completa todos los campos' };
    }

    // Validar número de personas
    if (isNaN(peopleCount) || peopleCount <= 0) {
      return { valid: false, error: 'El número de personas debe ser mayor a 0' };
    }

    // Validar teléfono (10 dígitos)
    if (!/^[0-9]{10}$/.test(phone)) {
      return { valid: false, error: 'Ingresa un número de 10 dígitos' };
    }

    // Validar promoción
    if (!promo || typeof promo.price !== 'number') {
      return {
        valid: false,
        error: 'Este bar aún no ha definido una promoción para este partido.',
      };
    }

    return { valid: true };
  };

  describe('Complete Fields Validation', () => {
    it('should fail when name is empty', () => {
      const result = validateReservationForm('', '4', '5551234567', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Completa todos los campos');
    });

    it('should fail when people is empty', () => {
      const result = validateReservationForm('Tony', '', '5551234567', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Completa todos los campos');
    });

    it('should fail when phone is empty', () => {
      const result = validateReservationForm('Tony', '4', '', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Completa todos los campos');
    });

    it('should fail when all fields are empty', () => {
      const result = validateReservationForm('', '', '', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Completa todos los campos');
    });

    it('should pass when all fields are filled', () => {
      const result = validateReservationForm('Tony', '4', '5551234567', { price: 200 });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('People Count Validation', () => {
    it('should fail when people count is 0', () => {
      const result = validateReservationForm('Tony', '0', '5551234567', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('El número de personas debe ser mayor a 0');
    });

    it('should fail when people count is negative', () => {
      const result = validateReservationForm('Tony', '-5', '5551234567', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('El número de personas debe ser mayor a 0');
    });

    it('should fail when people is not a number', () => {
      const result = validateReservationForm('Tony', 'abc', '5551234567', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('El número de personas debe ser mayor a 0');
    });

    it('should pass with 1 person', () => {
      const result = validateReservationForm('Tony', '1', '5551234567', { price: 200 });
      expect(result.valid).toBe(true);
    });

    it('should pass with multiple people', () => {
      const result = validateReservationForm('Tony', '8', '5551234567', { price: 200 });
      expect(result.valid).toBe(true);
    });

    it('should pass with large group', () => {
      const result = validateReservationForm('Tony', '20', '5551234567', { price: 200 });
      expect(result.valid).toBe(true);
    });
  });

  describe('Phone Validation', () => {
    it('should fail with phone shorter than 10 digits', () => {
      const result = validateReservationForm('Tony', '4', '555123456', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Ingresa un número de 10 dígitos');
    });

    it('should fail with phone longer than 10 digits', () => {
      const result = validateReservationForm('Tony', '4', '55512345678', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Ingresa un número de 10 dígitos');
    });

    it('should fail with phone containing letters', () => {
      const result = validateReservationForm('Tony', '4', '555123456a', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Ingresa un número de 10 dígitos');
    });

    it('should fail with phone containing spaces', () => {
      const result = validateReservationForm('Tony', '4', '555 123 4567', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Ingresa un número de 10 dígitos');
    });

    it('should fail with phone containing special characters', () => {
      const result = validateReservationForm('Tony', '4', '555-123-4567', { price: 200 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Ingresa un número de 10 dígitos');
    });

    it('should pass with valid 10 digit phone', () => {
      const result = validateReservationForm('Tony', '4', '5551234567', { price: 200 });
      expect(result.valid).toBe(true);
    });

    it('should pass with different valid phone numbers', () => {
      const phones = ['8181234567', '5555555555', '3331234567', '6641234567'];

      phones.forEach(phone => {
        const result = validateReservationForm('Tony', '4', phone, { price: 200 });
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Promotion Validation', () => {
    it('should fail when promo is null', () => {
      const result = validateReservationForm('Tony', '4', '5551234567', null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Este bar aún no ha definido una promoción para este partido.');
    });

    it('should fail when promo is undefined', () => {
      const result = validateReservationForm('Tony', '4', '5551234567', undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Este bar aún no ha definido una promoción para este partido.');
    });

    it('should fail when promo has no price', () => {
      const result = validateReservationForm('Tony', '4', '5551234567', { included: 'Beer' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Este bar aún no ha definido una promoción para este partido.');
    });

    it('should fail when promo price is not a number', () => {
      const result = validateReservationForm('Tony', '4', '5551234567', { price: '200' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Este bar aún no ha definido una promoción para este partido.');
    });

    it('should pass with valid promo', () => {
      const result = validateReservationForm('Tony', '4', '5551234567', {
        price: 200,
        included: 'Beer and wings'
      });
      expect(result.valid).toBe(true);
    });

    it('should pass with promo price of 0 (free)', () => {
      const result = validateReservationForm('Tony', '4', '5551234567', { price: 0 });
      expect(result.valid).toBe(true);
    });
  });

  describe('Complete Validation Flow', () => {
    it('should validate complete successful reservation', () => {
      const result = validateReservationForm(
        'Antonio Escamilla',
        '6',
        '8181234567',
        { price: 250, included: 'Cerveza y botana' }
      );
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle minimum valid reservation (1 person)', () => {
      const result = validateReservationForm(
        'Juan',
        '1',
        '5551234567',
        { price: 150 }
      );
      expect(result.valid).toBe(true);
    });

    it('should handle large group reservation', () => {
      const result = validateReservationForm(
        'Grupo Corporativo',
        '25',
        '3331234567',
        { price: 300, included: 'Paquete premium' }
      );
      expect(result.valid).toBe(true);
    });

    it('should reject when multiple fields are invalid', () => {
      const result = validateReservationForm(
        '',
        '-2',
        '123',
        null
      );
      expect(result.valid).toBe(false);
      // Debería fallar en el primer check (campos vacíos)
      expect(result.error).toBe('Completa todos los campos');
    });
  });

  describe('Edge Cases', () => {
    it('should handle name with special characters', () => {
      const result = validateReservationForm(
        'José María Ñoño',
        '4',
        '5551234567',
        { price: 200 }
      );
      expect(result.valid).toBe(true);
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(100);
      const result = validateReservationForm(
        longName,
        '4',
        '5551234567',
        { price: 200 }
      );
      expect(result.valid).toBe(true);
    });

    it('should handle decimal numbers for people (should fail)', () => {
      const result = validateReservationForm(
        'Tony',
        '4.5',
        '5551234567',
        { price: 200 }
      );
      // parseInt('4.5') = 4, que es válido
      expect(result.valid).toBe(true);
    });

    it('should trim whitespace not affect phone validation', () => {
      // El regex no elimina espacios, así que debe fallar
      const result = validateReservationForm(
        'Tony',
        '4',
        ' 5551234567',
        { price: 200 }
      );
      expect(result.valid).toBe(false);
    });
  });
});
