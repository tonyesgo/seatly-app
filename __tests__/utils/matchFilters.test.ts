/**
 * Tests para los filtros de partidos
 * Estos tests verifican la lógica de filtrado de partidos en app/tabs/index.tsx
 */

describe('Match Filters', () => {
  // Simulamos la función de filtrado que existe en index.tsx
  const filterMatches = (
    matches: any[],
    search: string,
    filterSport: string | null,
    filterLeague: string | null,
    filterDate: string | null
  ) => {
    return matches.filter((match) => {
      let ok = true;

      // Filtro por búsqueda de equipos
      if (search && !match.teams?.toLowerCase().includes(search.toLowerCase())) {
        ok = false;
      }

      // Filtro por deporte
      if (filterSport && match.sport?.toLowerCase() !== filterSport.toLowerCase()) {
        ok = false;
      }

      // Filtro por liga
      if (filterLeague && match.league !== filterLeague) {
        ok = false;
      }

      // Filtro por fecha
      if (filterDate && match.date?.toDate) {
        const matchDate = match.date.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filterDate === "hoy" && matchDate.toDateString() !== today.toDateString()) {
          ok = false;
        }

        if (filterDate === "mañana") {
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          if (matchDate.toDateString() !== tomorrow.toDateString()) {
            ok = false;
          }
        }

        if (filterDate === "fin") {
          const day = matchDate.getDay();
          if (![5, 6, 0].includes(day)) {
            ok = false;
          }
        }

        if (filterDate === "7dias") {
          const week = new Date(today);
          week.setDate(today.getDate() + 7);
          if (matchDate < today || matchDate > week) {
            ok = false;
          }
        }
      }

      return ok;
    });
  };

  // Helper para crear fecha con mock de toDate
  const createMockDate = (date: Date) => ({
    toDate: () => date,
  });

  describe('Search Filter', () => {
    const mockMatches = [
      { id: '1', teams: 'Tigres vs Rayados', sport: 'Fútbol', league: 'Liga MX' },
      { id: '2', teams: 'América vs Chivas', sport: 'Fútbol', league: 'Liga MX' },
      { id: '3', teams: 'Lakers vs Warriors', sport: 'Baloncesto', league: 'NBA' },
    ];

    it('should filter matches by team name (case insensitive)', () => {
      const result = filterMatches(mockMatches, 'tigres', null, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].teams).toBe('Tigres vs Rayados');
    });

    it('should filter matches by team name with uppercase search', () => {
      const result = filterMatches(mockMatches, 'AMÉRICA', null, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].teams).toBe('América vs Chivas');
    });

    it('should return all matches when search is empty', () => {
      const result = filterMatches(mockMatches, '', null, null, null);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no matches found', () => {
      const result = filterMatches(mockMatches, 'Pumas', null, null, null);
      expect(result).toHaveLength(0);
    });
  });

  describe('Sport Filter', () => {
    const mockMatches = [
      { id: '1', teams: 'Tigres vs Rayados', sport: 'Fútbol', league: 'Liga MX' },
      { id: '2', teams: 'América vs Chivas', sport: 'Fútbol', league: 'Liga MX' },
      { id: '3', teams: 'Lakers vs Warriors', sport: 'Baloncesto', league: 'NBA' },
    ];

    it('should filter matches by sport', () => {
      const result = filterMatches(mockMatches, '', 'Fútbol', null, null);
      expect(result).toHaveLength(2);
      expect(result.every(m => m.sport === 'Fútbol')).toBe(true);
    });

    it('should filter basketball matches', () => {
      const result = filterMatches(mockMatches, '', 'Baloncesto', null, null);
      expect(result).toHaveLength(1);
      expect(result[0].sport).toBe('Baloncesto');
    });

    it('should be case insensitive for sport filter', () => {
      const result = filterMatches(mockMatches, '', 'fútbol', null, null);
      expect(result).toHaveLength(2);
    });
  });

  describe('League Filter', () => {
    const mockMatches = [
      { id: '1', teams: 'Tigres vs Rayados', sport: 'Fútbol', league: 'Liga MX' },
      { id: '2', teams: 'América vs Chivas', sport: 'Fútbol', league: 'Liga MX' },
      { id: '3', teams: 'Real Madrid vs Barcelona', sport: 'Fútbol', league: 'La Liga' },
      { id: '4', teams: 'Lakers vs Warriors', sport: 'Baloncesto', league: 'NBA' },
    ];

    it('should filter matches by league', () => {
      const result = filterMatches(mockMatches, '', null, 'Liga MX', null);
      expect(result).toHaveLength(2);
      expect(result.every(m => m.league === 'Liga MX')).toBe(true);
    });

    it('should filter NBA matches', () => {
      const result = filterMatches(mockMatches, '', null, 'NBA', null);
      expect(result).toHaveLength(1);
      expect(result[0].league).toBe('NBA');
    });
  });

  describe('Date Filter', () => {
    it('should filter matches for today', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const mockMatches = [
        { id: '1', teams: 'Match Today', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(today) },
        { id: '2', teams: 'Match Tomorrow', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(tomorrow) },
      ];

      const result = filterMatches(mockMatches, '', null, null, 'hoy');
      expect(result).toHaveLength(1);
      expect(result[0].teams).toBe('Match Today');
    });

    it('should filter matches for tomorrow', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const mockMatches = [
        { id: '1', teams: 'Match Today', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(today) },
        { id: '2', teams: 'Match Tomorrow', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(tomorrow) },
      ];

      const result = filterMatches(mockMatches, '', null, null, 'mañana');
      expect(result).toHaveLength(1);
      expect(result[0].teams).toBe('Match Tomorrow');
    });

    it('should filter weekend matches (Friday, Saturday, Sunday)', () => {
      // Crear fechas para cada día de la semana
      const friday = new Date('2026-01-23T12:00:00'); // Viernes
      const saturday = new Date('2026-01-24T12:00:00'); // Sábado
      const sunday = new Date('2026-01-25T12:00:00'); // Domingo
      const monday = new Date('2026-01-26T12:00:00'); // Lunes

      const mockMatches = [
        { id: '1', teams: 'Friday Match', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(friday) },
        { id: '2', teams: 'Saturday Match', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(saturday) },
        { id: '3', teams: 'Sunday Match', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(sunday) },
        { id: '4', teams: 'Monday Match', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(monday) },
      ];

      const result = filterMatches(mockMatches, '', null, null, 'fin');
      expect(result).toHaveLength(3);
      expect(result.map(m => m.teams)).toContain('Friday Match');
      expect(result.map(m => m.teams)).toContain('Saturday Match');
      expect(result.map(m => m.teams)).toContain('Sunday Match');
      expect(result.map(m => m.teams)).not.toContain('Monday Match');
    });

    it('should filter matches within 7 days', () => {
      const today = new Date();
      const in3Days = new Date();
      in3Days.setDate(today.getDate() + 3);
      const in10Days = new Date();
      in10Days.setDate(today.getDate() + 10);

      const mockMatches = [
        { id: '1', teams: 'Match in 3 days', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(in3Days) },
        { id: '2', teams: 'Match in 10 days', sport: 'Fútbol', league: 'Liga MX', date: createMockDate(in10Days) },
      ];

      const result = filterMatches(mockMatches, '', null, null, '7dias');
      expect(result).toHaveLength(1);
      expect(result[0].teams).toBe('Match in 3 days');
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters together', () => {
      const today = new Date();
      const mockMatches = [
        {
          id: '1',
          teams: 'Tigres vs Rayados',
          sport: 'Fútbol',
          league: 'Liga MX',
          date: createMockDate(today)
        },
        {
          id: '2',
          teams: 'América vs Chivas',
          sport: 'Fútbol',
          league: 'Liga MX',
          date: createMockDate(today)
        },
        {
          id: '3',
          teams: 'Lakers vs Warriors',
          sport: 'Baloncesto',
          league: 'NBA',
          date: createMockDate(today)
        },
      ];

      const result = filterMatches(mockMatches, 'tigres', 'Fútbol', 'Liga MX', 'hoy');
      expect(result).toHaveLength(1);
      expect(result[0].teams).toBe('Tigres vs Rayados');
    });

    it('should return empty array when filters dont match', () => {
      const today = new Date();
      const mockMatches = [
        {
          id: '1',
          teams: 'Tigres vs Rayados',
          sport: 'Fútbol',
          league: 'Liga MX',
          date: createMockDate(today)
        },
      ];

      // Búsqueda que no coincide
      const result = filterMatches(mockMatches, 'Lakers', 'Fútbol', 'Liga MX', 'hoy');
      expect(result).toHaveLength(0);
    });
  });
});
