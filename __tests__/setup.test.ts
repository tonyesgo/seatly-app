/**
 * Test simple para verificar que Jest está configurado correctamente
 */

describe('Jest Setup', () => {
  it('should be configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
  });

  it('should handle string operations', () => {
    const greeting = 'Hello';
    const name = 'Seatly';
    expect(`${greeting} ${name}`).toBe('Hello Seatly');
  });

  it('should handle arrays', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toHaveLength(3);
    expect(fruits).toContain('banana');
  });

  it('should handle objects', () => {
    const user = { name: 'Tony', email: 'tony@seatly.com' };
    expect(user).toHaveProperty('name');
    expect(user.email).toBe('tony@seatly.com');
  });
});
