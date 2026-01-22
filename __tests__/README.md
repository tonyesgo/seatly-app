# Tests de Seatly

Esta carpeta contiene todos los tests automatizados para la aplicación Seatly.

## Configuración

Jest está configurado con:
- **Preset**: `react-native`
- **Setup file**: [jest.setup.js](../jest.setup.js)
- **Config**: [jest.config.js](../jest.config.js)

## Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (re-ejecuta al guardar cambios)
npm run test:watch

# Ejecutar tests con reporte de cobertura
npm run test:coverage

# Ejecutar un archivo de test específico
npm test -- --testPathPatterns=useMercadoPago.test.ts
```

## Archivos de Test

### 1. `setup.test.ts`
Tests simples para verificar que Jest está configurado correctamente.

**Cobertura:**
- Configuración básica de Jest
- Operaciones aritméticas
- Manejo de strings, arrays y objetos

### 2. `hooks/useMercadoPago.test.ts` ✅ 100% Coverage
Tests para el hook de integración con MercadoPago.

**Casos cubiertos:**
- ✅ Creación exitosa de preferencia de pago
- ✅ Manejo de errores HTTP (400, 500, etc.)
- ✅ Manejo de respuesta sin `init_point`
- ✅ Manejo de errores de red
- ✅ Manejo de JSON inválido
- ✅ Validación de estructura de datos para múltiples personas

**Archivo testeado:** [hooks/useMercadoPago.ts](../hooks/useMercadoPago.ts)

### 3. `utils/matchFilters.test.ts`
Tests para la lógica de filtrado de partidos deportivos.

**Casos cubiertos:**

#### Filtro de Búsqueda
- ✅ Filtrar por nombre de equipo (case insensitive)
- ✅ Búsqueda con mayúsculas
- ✅ Retornar todos cuando búsqueda está vacía
- ✅ Retornar array vacío cuando no hay coincidencias

#### Filtro de Deporte
- ✅ Filtrar por deporte (Fútbol, Baloncesto, etc.)
- ✅ Case insensitive

#### Filtro de Liga
- ✅ Filtrar por liga (Liga MX, NBA, La Liga, etc.)

#### Filtro de Fecha
- ✅ Filtrar partidos de hoy
- ✅ Filtrar partidos de mañana
- ✅ Filtrar partidos de fin de semana (viernes, sábado, domingo)
- ✅ Filtrar partidos dentro de 7 días

#### Filtros Combinados
- ✅ Aplicar múltiples filtros simultáneamente
- ✅ Manejo cuando filtros no coinciden

**Lógica testeada:** Basada en [app/tabs/index.tsx](../app/tabs/index.tsx:187-211)

### 4. `utils/reservationValidation.test.ts`
Tests para la validación del formulario de reservación.

**Casos cubiertos:**

#### Validación de Campos Completos
- ✅ Fallar cuando nombre está vacío
- ✅ Fallar cuando personas está vacío
- ✅ Fallar cuando teléfono está vacío
- ✅ Pasar cuando todos los campos están completos

#### Validación de Número de Personas
- ✅ Fallar con 0 personas
- ✅ Fallar con números negativos
- ✅ Fallar cuando no es un número
- ✅ Pasar con 1 persona
- ✅ Pasar con grupos grandes (20+ personas)

#### Validación de Teléfono
- ✅ Rechazar teléfonos con menos de 10 dígitos
- ✅ Rechazar teléfonos con más de 10 dígitos
- ✅ Rechazar teléfonos con letras
- ✅ Rechazar teléfonos con espacios
- ✅ Rechazar teléfonos con caracteres especiales (-, (), etc.)
- ✅ Aceptar teléfonos válidos de 10 dígitos

#### Validación de Promoción
- ✅ Rechazar cuando promoción es null/undefined
- ✅ Rechazar cuando promoción no tiene precio
- ✅ Rechazar cuando precio no es un número
- ✅ Aceptar promociones válidas
- ✅ Aceptar promociones con precio 0 (gratis)

#### Casos Edge
- ✅ Nombres con caracteres especiales (acentos, ñ)
- ✅ Nombres muy largos
- ✅ Números decimales para personas
- ✅ Espacios en blanco en teléfono

**Lógica testeada:** Basada en [app/tabs/reserve.tsx](../app/tabs/reserve.tsx:168-183)

## Resumen de Coverage

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
hooks/useMercadoPago  |   100%  |  83.33%  |   100%  |  100%
```

## Mocks Configurados

En [jest.setup.js](../jest.setup.js):
- ✅ expo-router
- ✅ Firebase (auth, firestore)
- ✅ expo-location
- ✅ expo-notifications
- ✅ @react-navigation/native
- ✅ global fetch

## Próximos Tests Recomendados

1. **Componentes de UI**
   - ThemedButton
   - ThemedInput
   - ThemedText

2. **Screens**
   - Login flow
   - Register flow
   - Reservation flow completo

3. **Integración con Firebase**
   - Autenticación
   - Queries a Firestore
   - Storage de imágenes

4. **Navigation**
   - Flujo de navegación completo
   - Deep linking

5. **Hooks adicionales**
   - useNotifications
   - useColorScheme

## Comandos Útiles

```bash
# Ver solo tests que fallaron
npm test -- --onlyFailures

# Ejecutar tests en modo verbose
npm test -- --verbose

# Actualizar snapshots
npm test -- --updateSnapshot

# Ejecutar tests de un directorio específico
npm test -- __tests__/hooks

# Ejecutar con debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Debugging Tests

Para debuggear un test en VSCode, agrega este breakpoint en tu test y ejecuta con el debugger de VSCode:

```typescript
it('should do something', () => {
  debugger; // El debugger se detendrá aquí
  expect(myFunction()).toBe(expected);
});
```

## CI/CD

Para integrar tests en CI/CD, agrega a tu pipeline:

```yaml
- name: Run tests
  run: npm test -- --ci --coverage --maxWorkers=2
```

## Contribuir

Al agregar nuevas funcionalidades:
1. Escribe tests ANTES de implementar (TDD)
2. Asegúrate de que todos los tests pasen (`npm test`)
3. Verifica el coverage (`npm run test:coverage`)
4. Documenta casos edge en los tests
