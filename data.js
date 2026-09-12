/* OneTRIP demo data — one trip, one shared source of truth.
   Every object carries tripId so the prototype behaves like one database. */

const TRIP_ID = 'trip_tokyo';

// JPY per 1 unit of currency. Fixed demo rates — Trip Brain never invents these.
const RATES = { AUD: 99.35, USD: 150.5, GBP: 191.2, EUR: 163.4, JPY: 1 };
const SYM = { AUD: '$', USD: 'US$', GBP: '£', EUR: '€', JPY: '¥' };

// Demo clock: Tuesday 14 October 2025, 09:25 (Day 3 of the trip)
const NOW = new Date('2025-10-14T09:25:00');

const S = {
  tripId: TRIP_ID,
  me: 'jennie',
  reporting: 'AUD',
  travelMode: false,
  trip: {
    id: TRIP_ID, name: 'Tokyo Trip', destination: 'Tokyo, Japan', emoji: '🗼',
    start: '2025-10-12', end: '2025-10-20', currency: 'JPY', home: 'AUD',
    styles: ['Balanced', 'Food'], code: 'TOKYO-82K', link: 'onetrip.app/join/TOKYO82',
    status: 'active',
  },
  people: [
    { id: 'jennie', name: 'Jennie', role: 'owner', color: '#0F766E', initials: 'Je', joined: true },
    { id: 'john', name: 'John', role: 'traveller', color: '#2457C5', initials: 'Jo', joined: true },
    { id: 'mary', name: 'Mary', role: 'traveller', color: '#B45309', initials: 'Ma', joined: true },
    { id: 'tom', name: 'Tom', role: 'traveller', color: '#6D28D9', initials: 'To', joined: true },
    { id: 'sarah', name: 'Sarah', role: 'traveller', color: '#BE185D', initials: 'Sa', joined: true },
  ],
  permissions: {
    owner: { itinerary: true, expenses: true, vote: true, invite: true, bookings: true },
    admin: { itinerary: true, expenses: true, vote: true, invite: true, bookings: true },
    traveller: { itinerary: true, expenses: true, vote: true, invite: false, bookings: false },
    viewer: { itinerary: false, expenses: false, vote: true, invite: false, bookings: false },
  },
  budget: {
    total: 5000, currency: 'AUD',
    categories: { Accommodation: 1700, Food: 900, Activities: 800, Transport: 600, Shopping: 500, Other: 500 },
  },
  places: [
    { id: 'hilton', name: 'Hilton Tokyo', type: 'hotel', area: 'Shinjuku', x: 118, y: 186, rating: 4.5, price: '¥¥¥¥', emoji: '🏨', fromHotel: 0, address: '6-6-2 Nishi-Shinjuku, Tokyo' },
    { id: 'narita', name: 'Narita Airport', type: 'transport', area: 'Narita', x: 372, y: 62, emoji: '✈️', fromHotel: 85, address: 'Narita, Chiba' },
    { id: 'shibuya', name: 'Shibuya Crossing', type: 'activity', area: 'Shibuya', x: 122, y: 302, rating: 4.6, price: 'Free', emoji: '🚶', fromHotel: 12 },
    { id: 'meiji', name: 'Meiji Shrine', type: 'activity', area: 'Harajuku', x: 128, y: 240, rating: 4.7, price: 'Free', emoji: '⛩️', fromHotel: 10 },
    { id: 'harajuku', name: 'Takeshita Street', type: 'shopping', area: 'Harajuku', x: 146, y: 252, rating: 4.3, price: '¥¥', emoji: '🛍️', fromHotel: 12 },
    { id: 'yoyogi', name: 'Yoyogi Park', type: 'activity', area: 'Harajuku', x: 108, y: 256, rating: 4.5, price: 'Free', emoji: '🌳', fromHotel: 10 },
    { id: 'teamlab', name: 'teamLab Planets', type: 'activity', area: 'Toyosu', x: 302, y: 404, rating: 4.6, price: '¥¥', emoji: '🎨', fromHotel: 35, address: '6-1-16 Toyosu, Koto City' },
    { id: 'sushihouse', name: 'Sushi House', type: 'restaurant', area: 'Ginza', x: 250, y: 282, rating: 4.7, price: '¥¥¥', emoji: '🍣', fromHotel: 15, estPP: 6500, hours: '11:30–14:30, 17:30–22:30', address: '4-2-15 Ginza, Chuo City' },
    { id: 'tokyoitalian', name: 'Tokyo Italian', type: 'restaurant', area: 'Shibuya', x: 140, y: 314, rating: 4.5, price: '¥¥', emoji: '🍝', fromHotel: 8, estPP: 4500, hours: '17:00–23:00' },
    { id: 'bbqgarden', name: 'BBQ Garden', type: 'restaurant', area: 'Ebisu', x: 152, y: 352, rating: 4.4, price: '¥¥', emoji: '🥩', fromHotel: 20, estPP: 5000, hours: '17:00–24:00' },
    { id: 'izakaya', name: 'Izakaya Torimaru', type: 'restaurant', area: 'Shinjuku', x: 134, y: 196, rating: 4.4, price: '¥¥', emoji: '🏮', fromHotel: 4, estPP: 4300 },
    { id: 'ramen', name: 'Ramen Alley', type: 'restaurant', area: 'Shibuya', x: 110, y: 312, rating: 4.5, price: '¥', emoji: '🍜', fromHotel: 12, estPP: 1500 },
    { id: 'sushigo', name: 'Sushi Go Round', type: 'restaurant', area: 'Shinjuku', x: 126, y: 176, rating: 4.2, price: '¥', emoji: '🍣', fromHotel: 5, estPP: 1400 },
    { id: 'disney', name: 'Tokyo Disneyland', type: 'activity', area: 'Maihama', x: 376, y: 430, rating: 4.8, price: '¥¥¥', emoji: '🎢', fromHotel: 55 },
    { id: 'tsukiji', name: 'Tsukiji Outer Market', type: 'restaurant', area: 'Tsukiji', x: 282, y: 318, rating: 4.6, price: '¥¥', emoji: '🐟', fromHotel: 25, estPP: 2500 },
    { id: 'ginza', name: 'Ginza', type: 'shopping', area: 'Ginza', x: 264, y: 296, rating: 4.5, price: '¥¥¥', emoji: '🛍️', fromHotel: 20 },
    { id: 'fuji', name: 'Mount Fuji · Kawaguchiko', type: 'activity', area: 'Yamanashi', x: 28, y: 468, rating: 4.9, price: '¥¥', emoji: '🗻', fromHotel: 120 },
    { id: 'asakusa', name: 'Asakusa', type: 'activity', area: 'Asakusa', x: 318, y: 152, rating: 4.6, price: 'Free', emoji: '🏮', fromHotel: 30 },
    { id: 'sensoji', name: 'Senso-ji', type: 'activity', area: 'Asakusa', x: 326, y: 138, rating: 4.7, price: 'Free', emoji: '🏯', fromHotel: 30 },
    { id: 'akihabara', name: 'Akihabara', type: 'shopping', area: 'Akihabara', x: 282, y: 206, rating: 4.4, price: '¥¥', emoji: '🕹️', fromHotel: 22 },
    { id: 'shibuyasky', name: 'Shibuya Sky', type: 'activity', area: 'Shibuya', x: 128, y: 296, rating: 4.7, price: '¥¥', emoji: '🌆', fromHotel: 12 },
    { id: 'kaguya', name: 'Kaguya Department Store', type: 'shopping', area: 'Shibuya', x: 116, y: 288, rating: 4.1, price: '¥¥', emoji: '🏬', fromHotel: 11 },
    { id: 'tokyostation', name: 'Tokyo Station', type: 'transport', area: 'Marunouchi', x: 262, y: 262, emoji: '🚄', fromHotel: 18 },
  ],
  itinerary: [
    // Day 1 — Sun 12 Oct
    { id: 'i1', day: 1, start: '14:30', end: '15:10', title: 'Arrive Narita', placeId: 'narita', emoji: '✈️', category: 'transport', status: 'completed', booking: 'booked', bookingId: 'b_flight', people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i2', day: 1, start: '15:10', end: '16:30', title: 'Narita Express to Shinjuku', placeId: 'tokyostation', emoji: '🚄', category: 'transport', status: 'completed', booking: 'none', costJpy: 16000, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i3', day: 1, start: '17:00', end: '17:30', title: 'Hotel check-in', placeId: 'hilton', emoji: '🏨', category: 'stay', status: 'completed', booking: 'booked', bookingId: 'b_hotel', people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i4', day: 1, start: '18:30', end: '19:45', title: 'Shibuya walk', placeId: 'shibuya', emoji: '🚶', category: 'activity', status: 'completed', booking: 'none', travelMin: 12, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i5', day: 1, start: '20:00', end: '22:00', title: 'Dinner', placeId: 'izakaya', emoji: '🏮', category: 'food', status: 'completed', booking: 'none', travelMin: 15, costJpy: 21500, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    // Day 2 — Mon 13 Oct
    { id: 'i6', day: 2, start: '08:30', end: '09:15', title: 'Breakfast', placeId: 'hilton', emoji: '☕', category: 'food', status: 'completed', booking: 'none', costJpy: 6300, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i7', day: 2, start: '10:00', end: '20:00', title: 'Tokyo Disneyland', placeId: 'disney', emoji: '🎢', category: 'activity', status: 'completed', booking: 'booked', bookingId: 'b_disney', travelMin: 55, costJpy: 45600, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i8', day: 2, start: '21:00', end: '22:00', title: 'Sushi dinner', placeId: 'sushigo', emoji: '🍣', category: 'food', status: 'completed', booking: 'none', travelMin: 50, costJpy: 6900, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    // Day 3 — Tue 14 Oct (today)
    { id: 'i9', day: 3, start: '08:00', end: '08:40', title: 'Breakfast', placeId: 'hilton', emoji: '☕', category: 'food', status: 'completed', booking: 'none', costJpy: 3300, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i10', day: 3, start: '08:50', end: '09:40', title: 'Meiji Shrine', placeId: 'meiji', emoji: '⛩️', category: 'activity', status: 'confirmed', booking: 'none', travelMin: 10, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i11', day: 3, start: '10:00', end: '12:00', title: 'teamLab Planets', placeId: 'teamlab', emoji: '🎨', category: 'activity', status: 'confirmed', booking: 'booked', bookingId: 'b_teamlab', travelMin: 35, costJpy: 16000, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i12', day: 3, start: '12:30', end: '13:45', title: 'Lunch', placeId: 'sushihouse', emoji: '🍣', category: 'food', status: 'confirmed', booking: 'none', travelMin: 25, costJpy: 18400, people: ['jennie', 'john', 'mary', 'tom', 'sarah'], note: 'Counter seats booked under Jennie' },
    { id: 'i13', day: 3, start: '14:00', end: '16:30', title: 'Harajuku', placeId: 'harajuku', emoji: '🛍️', category: 'activity', status: 'confirmed', booking: 'none', travelMin: 20, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i14', day: 3, start: '17:00', end: '18:30', title: 'Shopping', placeId: 'kaguya', emoji: '🛍️', category: 'shopping', status: 'confirmed', booking: 'none', travelMin: 8, people: ['jennie', 'mary', 'sarah'] },
    { id: 'i15', day: 3, start: '19:30', end: '21:00', title: 'Dinner', placeId: 'ramen', emoji: '🍜', category: 'food', status: 'confirmed', booking: 'none', travelMin: 5, costJpy: 9000, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    // Day 4 — Wed 15 Oct
    { id: 'i16', day: 4, start: '08:00', end: '10:30', title: 'Tsukiji Market', placeId: 'tsukiji', emoji: '🐟', category: 'food', status: 'confirmed', booking: 'none', travelMin: 25, costJpy: 12500, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i17', day: 4, start: '11:00', end: '13:30', title: 'Ginza', placeId: 'ginza', emoji: '🏙️', category: 'activity', status: 'confirmed', booking: 'none', travelMin: 8, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i18', day: 4, start: '14:00', end: '17:00', title: 'Shopping', placeId: 'ginza', emoji: '🛍️', category: 'shopping', status: 'confirmed', booking: 'none', travelMin: 0, people: ['jennie', 'mary', 'sarah', 'tom'] },
    { id: 'i19', day: 4, start: '19:00', end: '21:00', title: 'Dinner', placeId: 'tokyoitalian', emoji: '🍝', category: 'food', status: 'proposed', booking: 'none', travelMin: 25, costJpy: 13000, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    // Day 5 — Thu 16 Oct
    { id: 'i20', day: 5, start: '07:30', end: '19:00', title: 'Mount Fuji day trip', placeId: 'fuji', emoji: '🗻', category: 'activity', status: 'confirmed', booking: 'needed', travelMin: 120, costJpy: 38000, people: ['jennie', 'john', 'mary', 'tom', 'sarah'], note: 'Bus tour — 4 of 5 voted for the bus option' },
    // Day 6 — Fri 17 Oct
    { id: 'i21', day: 6, start: '09:30', end: '10:00', title: 'Asakusa', placeId: 'asakusa', emoji: '🏮', category: 'activity', status: 'confirmed', booking: 'none', travelMin: 30, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i22', day: 6, start: '10:00', end: '12:00', title: 'Senso-ji', placeId: 'sensoji', emoji: '🏯', category: 'activity', status: 'confirmed', booking: 'none', travelMin: 5, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i23', day: 6, start: '12:30', end: '13:30', title: 'Lunch', placeId: 'asakusa', emoji: '🍜', category: 'food', status: 'idea', booking: 'none', travelMin: 5, costJpy: 8000, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i24', day: 6, start: '14:00', end: '17:30', title: 'Akihabara', placeId: 'akihabara', emoji: '🕹️', category: 'activity', status: 'confirmed', booking: 'none', travelMin: 15, people: ['jennie', 'john', 'tom'] },
    // Day 7 — Sat 18 Oct
    { id: 'i25', day: 7, start: '10:30', end: '12:00', title: 'Brunch', placeId: 'hilton', emoji: '🥐', category: 'food', status: 'confirmed', booking: 'none', costJpy: 9000, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i26', day: 7, start: '12:30', end: '15:00', title: 'Free time · Yoyogi Park', placeId: 'yoyogi', emoji: '🌳', category: 'free', status: 'confirmed', booking: 'none', travelMin: 10, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i27', day: 7, start: '15:30', end: '17:00', title: 'Shibuya Sky', placeId: 'shibuyasky', emoji: '🌆', category: 'activity', status: 'confirmed', booking: 'booked', bookingId: 'b_sky', travelMin: 12, costJpy: 12500, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i28', day: 7, start: '18:30', end: '19:15', title: 'Drinks · Shibuya', placeId: 'shibuya', emoji: '🍻', category: 'food', status: 'idea', booking: 'none', travelMin: 5, costJpy: 6000, people: ['john', 'tom', 'sarah'] },
    // Day 8 — Sun 19 Oct
    { id: 'i29', day: 8, start: '10:00', end: '13:00', title: 'Shibuya', placeId: 'shibuya', emoji: '🚶', category: 'activity', status: 'confirmed', booking: 'none', travelMin: 12, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i30', day: 8, start: '19:00', end: '21:00', title: 'Farewell dinner', placeId: 'izakaya', emoji: '🏮', category: 'food', status: 'confirmed', booking: 'none', travelMin: 15, costJpy: 20000, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i31', day: 8, start: '21:30', end: '22:30', title: 'Packing', placeId: 'hilton', emoji: '🧳', category: 'free', status: 'confirmed', booking: 'none', people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    // Day 9 — Mon 20 Oct
    { id: 'i32', day: 9, start: '09:00', end: '09:30', title: 'Hotel check-out', placeId: 'hilton', emoji: '🏨', category: 'stay', status: 'confirmed', booking: 'booked', bookingId: 'b_hotel', people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i33', day: 9, start: '10:00', end: '11:30', title: 'Airport transfer', placeId: 'narita', emoji: '🚐', category: 'transport', status: 'voting', booking: 'needed', costJpy: 12000, travelMin: 85, people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { id: 'i34', day: 9, start: '14:20', end: '14:20', title: 'Flight home', placeId: 'narita', emoji: '✈️', category: 'transport', status: 'confirmed', booking: 'booked', bookingId: 'b_flight', people: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
  ],
  bookings: [
    { id: 'b_flight', type: 'flight', title: 'Pacifica Air PA 21 · SYD → NRT', ref: 'PA7K2Q', provider: 'Pacifica Air', date: '2025-10-12', status: 'confirmed', costAud: 5900, note: 'Paid before the trip — not counted in the trip budget', docId: 'd_flight', details: { Outbound: 'Sun 12 Oct, 08:05 → 16:40', Return: 'Mon 20 Oct, 14:20 → 01:15 (+1)', Passengers: '5', Seats: '34A–34E' } },
    { id: 'b_hotel', type: 'hotel', title: 'Hilton Tokyo', ref: 'HT-88213', provider: 'Hilton', date: '2025-10-12', status: 'confirmed', costJpy: 220000, paidJpy: 163900, docId: 'd_hotel', details: { 'Check-in': 'Sun 12 Oct', 'Check-out': 'Mon 20 Oct', Guests: '5 · 2 twin rooms + 1 single', Balance: '¥56,100 due at check-out' } },
    { id: 'b_teamlab', type: 'activity', title: 'teamLab Planets · 10:00 entry', ref: 'TL-4410', provider: 'teamLab', date: '2025-10-14', status: 'confirmed', costJpy: 16000, docId: 'd_teamlab', details: { Tickets: '5 × adult', Entry: 'Tue 14 Oct, 10:00' } },
    { id: 'b_disney', type: 'activity', title: 'Tokyo Disneyland · 1-day passport', ref: 'TDR-91K', provider: 'Tokyo Disney Resort', date: '2025-10-13', status: 'confirmed', costJpy: 45600, docId: 'd_disney', details: { Tickets: '5 × adult', Date: 'Mon 13 Oct' } },
    { id: 'b_sky', type: 'activity', title: 'Shibuya Sky · 15:40 slot', ref: 'SKY-2203', provider: 'Shibuya Sky', date: '2025-10-18', status: 'confirmed', costJpy: 12500, docId: 'd_sky', details: { Tickets: '5 × adult', Entry: 'Sat 18 Oct, 15:40' } },
  ],
  documents: [
    { id: 'd_flight', name: 'Pacifica Air e-tickets.pdf', category: 'Flights', size: '212 KB', linked: { type: 'booking', id: 'b_flight' }, addedBy: 'jennie', date: '2025-09-02' },
    { id: 'd_hotel', name: 'Hotel confirmation.pdf', category: 'Hotels', size: '140 KB', linked: { type: 'booking', id: 'b_hotel' }, addedBy: 'jennie', date: '2025-09-10' },
    { id: 'd_teamlab', name: 'teamLab tickets.pdf', category: 'Activities', size: '96 KB', linked: { type: 'booking', id: 'b_teamlab' }, addedBy: 'mary', date: '2025-10-13' },
    { id: 'd_disney', name: 'Disneyland passports.pdf', category: 'Activities', size: '188 KB', linked: { type: 'booking', id: 'b_disney' }, addedBy: 'john', date: '2025-10-05' },
    { id: 'd_sky', name: 'Shibuya Sky tickets.pdf', category: 'Activities', size: '77 KB', linked: { type: 'booking', id: 'b_sky' }, addedBy: 'sarah', date: '2025-10-11' },
    { id: 'd_ins', name: 'Travel insurance policy.pdf', category: 'Insurance', size: '410 KB', linked: null, addedBy: 'jennie', date: '2025-09-14' },
    { id: 'd_taxi', name: 'Taxi receipt.jpg', category: 'Receipts', size: '1.2 MB', linked: { type: 'expense', id: 'e9' }, addedBy: 'jennie', date: '2025-10-13' },
    { id: 'd_rail', name: 'Narita Express tickets.png', category: 'Transport', size: '640 KB', linked: { type: 'expense', id: 'e2' }, addedBy: 'tom', date: '2025-10-12' },
  ],
  decisions: [
    {
      id: 'dec_satdinner', title: 'Saturday dinner', question: 'Where should we eat?', status: 'open', deadline: '2025-10-17', day: 7, slot: '19:30', category: 'Food',
      options: [
        { id: 'o_sushi', placeId: 'sushihouse', estPP: 6500 },
        { id: 'o_italian', placeId: 'tokyoitalian', estPP: 4500 },
        { id: 'o_bbq', placeId: 'bbqgarden', estPP: 5000 },
      ],
      votes: {
        o_sushi: { john: 'love', mary: 'love', sarah: 'love' },
        o_italian: { john: 'good', mary: 'love', sarah: 'maybe' },
        o_bbq: { john: 'maybe', mary: 'good', sarah: 'no' },
      },
      confirmedOptionId: null,
    },
    {
      id: 'dec_fuji', title: 'Mount Fuji tour', question: 'How do we get to Fuji on Thursday?', status: 'almost', deadline: '2025-10-15', day: 5, slot: '07:30', category: 'Activities',
      options: [
        { id: 'o_bus', label: 'Guided bus tour', sub: 'Pick-up at hotel · 11 hours', estPP: 7600 },
        { id: 'o_van', label: 'Private van', sub: 'Door to door · flexible stops', estPP: 18000 },
        { id: 'o_train', label: 'Train + local bus', sub: 'Do it ourselves · 2h40 each way', estPP: 6000 },
      ],
      votes: {
        o_bus: { jennie: 'love', john: 'love', mary: 'good', sarah: 'love' },
        o_van: { jennie: 'maybe', john: 'no', mary: 'good', sarah: 'maybe' },
        o_train: { jennie: 'no', john: 'maybe', mary: 'no', sarah: 'no' },
      },
      confirmedOptionId: null,
    },
    {
      id: 'dec_transfer', title: 'Airport transfer', question: 'How do we get to Narita on Monday?', status: 'open', deadline: '2025-10-18', day: 9, slot: '10:00', category: 'Transport',
      options: [
        { id: 'o_shuttle', label: 'Hotel limousine bus', sub: '10:00 from hotel · 95 min', estPP: 3200 },
        { id: 'o_nex', label: 'Narita Express', sub: 'From Shinjuku · 80 min', estPP: 3250 },
        { id: 'o_taxivan', label: 'Taxi van', sub: 'Door to door · 70 min', estPP: 6000 },
      ],
      votes: {
        o_shuttle: { tom: 'love', sarah: 'good' },
        o_nex: { tom: 'good', sarah: 'love' },
        o_taxivan: { tom: 'no', sarah: 'maybe' },
      },
      confirmedOptionId: null,
    },
  ],
  expenses: [
    { id: 'e1', merchant: 'Hilton Tokyo · deposit', placeId: 'hilton', category: 'Accommodation', jpy: 163900, currency: 'JPY', date: '2025-10-12', time: '17:05', payer: 'jennie', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🏨' },
    { id: 'e2', merchant: 'Narita Express', placeId: 'tokyostation', category: 'Transport', jpy: 16000, currency: 'JPY', date: '2025-10-12', time: '15:02', payer: 'tom', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🚄', docId: 'd_rail' },
    { id: 'e3', merchant: 'Izakaya Torimaru', placeId: 'izakaya', category: 'Food', jpy: 21500, currency: 'JPY', date: '2025-10-12', time: '21:48', payer: 'john', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🏮' },
    { id: 'e4', merchant: 'Suica top-ups', category: 'Transport', jpy: 15000, currency: 'JPY', date: '2025-10-12', time: '16:40', payer: 'john', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🎫' },
    { id: 'e5', merchant: 'Hotel breakfast', placeId: 'hilton', category: 'Food', jpy: 6300, currency: 'JPY', date: '2025-10-13', time: '08:50', payer: 'mary', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '☕' },
    { id: 'e6', merchant: 'Tokyo Disneyland tickets', placeId: 'disney', category: 'Activities', jpy: 45600, currency: 'JPY', date: '2025-10-13', time: '09:30', payer: 'john', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🎟️', bookingId: 'b_disney' },
    { id: 'e7', merchant: 'teamLab Planets tickets', placeId: 'teamlab', category: 'Activities', jpy: 16000, currency: 'JPY', date: '2025-10-13', time: '10:12', payer: 'mary', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🎟️', bookingId: 'b_teamlab' },
    { id: 'e8', merchant: 'Disneyland lunch', placeId: 'disney', category: 'Food', jpy: 12400, currency: 'JPY', date: '2025-10-13', time: '13:20', payer: 'sarah', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🍔' },
    { id: 'e9', merchant: 'Taxi', category: 'Transport', jpy: 4800, currency: 'JPY', date: '2025-10-13', time: '20:35', payer: 'jennie', participants: ['jennie', 'john', 'tom'], split: 'Equal', emoji: '🚕', docId: 'd_taxi' },
    { id: 'e10', merchant: 'Coffee & snacks', category: 'Food', jpy: 5960, currency: 'JPY', date: '2025-10-13', time: '15:10', payer: 'tom', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🧋' },
    { id: 'e11', merchant: 'Kaguya Department Store', placeId: 'kaguya', category: 'Shopping', jpy: 14300, currency: 'JPY', date: '2025-10-13', time: '19:05', payer: 'mary', participants: ['mary', 'sarah'], split: 'Equal', emoji: '🛍️' },
    { id: 'e12', merchant: 'Uniqlo Shinjuku', category: 'Shopping', jpy: 12500, currency: 'JPY', date: '2025-10-13', time: '19:40', payer: 'tom', participants: ['tom', 'john'], split: 'Equal', emoji: '👕' },
    { id: 'e13', merchant: 'Sushi Go Round', placeId: 'sushigo', category: 'Food', jpy: 6900, currency: 'JPY', date: '2025-10-13', time: '21:50', payer: 'john', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🍣' },
    { id: 'e14', merchant: 'Disneyland snacks', placeId: 'disney', category: 'Food', jpy: 4100, currency: 'JPY', date: '2025-10-13', time: '17:00', payer: 'tom', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🍿' },
    { id: 'e15', merchant: 'Konbini breakfast', category: 'Food', jpy: 3300, currency: 'JPY', date: '2025-10-14', time: '08:05', payer: 'jennie', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🍙' },
    { id: 'e16', merchant: 'Taxi to Meiji Shrine', category: 'Transport', jpy: 5900, currency: 'JPY', date: '2025-10-14', time: '08:45', payer: 'john', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🚕' },
    { id: 'e17', merchant: 'Ramen Alley', placeId: 'ramen', category: 'Food', jpy: 7200, currency: 'JPY', date: '2025-10-13', time: '12:10', payer: 'john', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🍜' },
    { id: 'e18', merchant: 'Airport snacks', placeId: 'narita', category: 'Food', jpy: 4300, currency: 'JPY', date: '2025-10-12', time: '16:05', payer: 'john', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🥪' },
    { id: 'e19', merchant: 'Konbini drinks', category: 'Food', jpy: 5600, currency: 'JPY', date: '2025-10-13', time: '22:15', payer: 'john', participants: ['jennie', 'john', 'mary', 'tom', 'sarah'], split: 'Equal', emoji: '🥤' },
  ],
  // Money already paid between travellers (kept so balances stay honest)
  settlements: [
    { id: 's1', from: 'sarah', to: 'jennie', jpy: 62700, date: '2025-10-13', note: 'Bank transfer for hotel deposit share', status: 'paid' },
    { id: 's2', from: 'mary', to: 'jennie', jpy: 27600, date: '2025-10-13', note: 'Bank transfer for hotel deposit share', status: 'paid' },
    { id: 's3', from: 'tom', to: 'jennie', jpy: 24400, date: '2025-10-13', note: 'Bank transfer for hotel deposit share', status: 'paid' },
    { id: 's4', from: 'jennie', to: 'john', jpy: 12300, date: '2025-10-13', note: 'Cash', status: 'paid' },
  ],
  inbox: [
    { id: 'in1', name: 'Hotel confirmation.pdf', kind: 'pdf', status: 'done', result: 'Linked to Hilton Tokyo booking', addedBy: 'jennie', when: 'Sep 10' },
    { id: 'in2', name: 'restaurant screenshot.png', kind: 'screenshot', status: 'done', result: 'Saved BBQ Garden as a place', addedBy: 'tom', when: 'Oct 9' },
    { id: 'in3', name: 'Flight booking email', kind: 'email', status: 'done', result: 'Linked to Pacifica Air booking', addedBy: 'jennie', when: 'Sep 2' },
    { id: 'in4', name: 'Taxi receipt', kind: 'receipt', status: 'done', result: 'Added ¥4,800 Transport expense', addedBy: 'jennie', when: 'Yesterday' },
  ],
  notifications: [
    { id: 'n1', icon: '🗳', text: 'Mary voted for Sushi House.', when: '8:12 AM', unread: true, go: ['decision', 'dec_satdinner'] },
    { id: 'n2', icon: '💰', text: 'John added ¥5,900 taxi expense.', when: '8:46 AM', unread: true, go: ['money', 'expenses'] },
    { id: 'n3', icon: '🎟', text: 'teamLab entry is at 10:00 — leave the shrine by 9:25.', when: '9:00 AM', unread: true, go: ['plan'] },
    { id: 'n4', icon: '⚠️', text: 'Saturday has a 20-minute travel conflict between Shibuya Sky and drinks.', when: 'Yesterday', unread: false, go: ['plan', 7] },
    { id: 'n5', icon: '💳', text: 'Food budget is 85% used.', when: 'Yesterday', unread: false, go: ['money', 'overview'] },
    { id: 'n6', icon: '🏨', text: 'Hotel check-in tomorrow at 3:00 PM.', when: 'Sat 11 Oct', unread: false, go: ['bookings'] },
  ],
  activity: [
    { id: 'a1', who: 'mary', when: '2025-10-14T08:12', text: 'Voted ❤️ for Sushi House in Saturday dinner.' },
    { id: 'a2', who: 'john', when: '2025-10-14T08:46', text: 'Added ¥5,900 taxi expense (5 people).' },
    { id: 'a3', who: 'jennie', when: '2025-10-14T08:05', text: 'Added ¥3,300 konbini breakfast expense.' },
    { id: 'a4', who: 'sarah', when: '2025-10-13T22:30', text: 'Added Mount Fuji day trip to Thursday.' },
    { id: 'a5', who: 'mary', when: '2025-10-13T20:15', text: 'Changed Wednesday dinner from 7:00 PM to 7:30 PM, then back to 7:00 PM.' },
    { id: 'a6', who: 'john', when: '2025-10-13T21:52', text: 'Added ¥6,900 Sushi Go Round expense.' },
    { id: 'a7', who: 'tom', when: '2025-10-12T16:41', text: 'Uploaded Narita Express tickets to Transport documents.' },
    { id: 'a8', who: 'jennie', when: '2025-10-11T19:00', text: 'Started the Saturday dinner decision with 3 options.' },
  ],
  memories: { photos: 247, kmWalked: 72 },
  receipts: [],
  notes: [],
};

// Expense items for the receipt-scan demo (Sushi House lunch, today)
const DEMO_RECEIPT = {
  merchant: 'Sushi House', placeId: 'sushihouse', date: '2025-10-14', time: '13:41',
  subtotal: 16700, tax: 1700, total: 18400, currency: 'JPY', category: 'Food',
  confidence: { merchant: 0.97, date: 0.99, subtotal: 0.93, tax: 0.9, total: 0.98, currency: 0.99, category: 0.88 },
  items: [
    { name: 'Salmon sushi', jpy: 3000, who: ['john', 'jennie'] },
    { name: 'Ramen', jpy: 2000, who: ['mary'] },
    { name: 'Sashimi', jpy: 4000, who: ['jennie', 'john', 'mary', 'tom', 'sarah'] },
    { name: 'Drinks', jpy: 3500, who: ['john', 'mary', 'tom'] },
    { name: 'Dessert', jpy: 2500, who: ['sarah', 'tom'] },
  ],
};

const DAY_DATES = ['2025-10-12', '2025-10-13', '2025-10-14', '2025-10-15', '2025-10-16', '2025-10-17', '2025-10-18', '2025-10-19', '2025-10-20'];
const TODAY_DAY = 3;

/* ---------- Derived helpers (the "database" queries) ---------- */
const P = id => S.people.find(p => p.id === id);
const PL = id => S.places.find(p => p.id === id);
const IT = id => S.itinerary.find(i => i.id === id);
const BK = id => S.bookings.find(b => b.id === id);
const DEC = id => S.decisions.find(d => d.id === id);
const EXP = id => S.expenses.find(e => e.id === id);

function toHome(jpy, cur) { cur = cur || S.reporting; return jpy / RATES[cur]; }
function fmtJpy(n) { return '¥' + Math.round(n).toLocaleString('en-AU'); }
function fmtHome(jpy, opts) {
  const cur = (opts && opts.cur) || S.reporting;
  const v = toHome(jpy, cur);
  if (cur === 'JPY') return fmtJpy(v);
  const dec = (opts && opts.dec != null) ? opts.dec : (Math.abs(v) >= 1000 ? 0 : 2);
  return SYM[cur] + Math.abs(v).toLocaleString('en-AU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtHomeSigned(jpy) { return (jpy < 0 ? '−' : '') + fmtHome(jpy); }
function homeToJpy(amt, cur) { return amt * RATES[cur || S.reporting]; }
function budgetJpy() { return homeToJpy(S.budget.total, S.budget.currency); }
function catBudgetJpy(c) { return homeToJpy(S.budget.categories[c] || 0, S.budget.currency); }

function shareOf(e, pid) {
  if (!e.participants.includes(pid)) return 0;
  if (e.shares && e.shares[pid] != null) return e.shares[pid];
  return e.jpy / e.participants.length;
}
function spentJpy() { return S.expenses.reduce((a, e) => a + e.jpy, 0); }
function spentByCategory() {
  const out = {};
  Object.keys(S.budget.categories).forEach(c => out[c] = 0);
  S.expenses.forEach(e => { out[e.category] = (out[e.category] || 0) + e.jpy; });
  return out;
}
// Committed but not yet paid: hotel balance, future itinerary items with an estimate and no expense, leading option of open decisions
function committedJpy() {
  let c = 0;
  S.bookings.forEach(b => { if (b.costJpy && b.paidJpy != null) c += b.costJpy - b.paidJpy; });
  S.itinerary.forEach(i => {
    if (i.day <= TODAY_DAY || !i.costJpy || i.status === 'cancelled' || i.status === 'voting' || i.status === 'idea' || i.status === 'proposed') return;
    if (i.booking === 'none') return; // meals without a booking are not committed yet
    const paid = S.expenses.some(e => e.itemId === i.id || e.bookingId === i.bookingId && i.bookingId);
    if (!paid) c += i.costJpy;
  });
  S.decisions.forEach(d => {
    if (d.status !== 'confirmed' && d.category === 'Food') { const lead = leadingOption(d); if (lead) c += lead.estPP * S.people.length; }
  });
  return c;
}
function forecastJpy() { return spentJpy() + committedJpy(); }

function balances() {
  const net = {}; S.people.forEach(p => net[p.id] = 0);
  S.expenses.forEach(e => { net[e.payer] += e.jpy; e.participants.forEach(p => net[p] -= shareOf(e, p)); });
  S.settlements.forEach(s => { net[s.from] += s.jpy; net[s.to] -= s.jpy; });
  return net;
}
// Minimum-payment settlement (greedy)
function settlementPlan() {
  const net = balances();
  const debtors = [], creditors = [];
  Object.entries(net).forEach(([id, v]) => { if (v < -50) debtors.push({ id, v: -v }); else if (v > 50) creditors.push({ id, v }); });
  debtors.sort((a, b) => b.v - a.v); creditors.sort((a, b) => b.v - a.v);
  const plan = []; let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].v, creditors[j].v);
    plan.push({ from: debtors[i].id, to: creditors[j].id, jpy: amt });
    debtors[i].v -= amt; creditors[j].v -= amt;
    if (debtors[i].v < 1) i++; if (creditors[j].v < 1) j++;
  }
  return plan;
}

const REACT = { love: { e: '❤️', label: 'Love', w: 3 }, good: { e: '👍', label: 'Good', w: 2 }, maybe: { e: '🤔', label: 'Maybe', w: 1 }, no: { e: '👎', label: 'No', w: -2 } };
function optionCounts(d, oid) { const c = { love: 0, good: 0, maybe: 0, no: 0 }; Object.values(d.votes[oid] || {}).forEach(r => c[r]++); return c; }
function optionScore(d, oid) { return Object.values(d.votes[oid] || {}).reduce((a, r) => a + REACT[r].w, 0); }
function votersOf(d) { const s = new Set(); Object.values(d.votes).forEach(v => Object.keys(v).forEach(p => s.add(p))); return s; }
function leadingOption(d) { return [...d.options].sort((a, b) => optionScore(d, b.id) - optionScore(d, a.id))[0]; }
function optionName(o) { return o.placeId ? PL(o.placeId).name : o.label; }
function decisionStatus(d) {
  if (d.status === 'confirmed') return { label: 'Confirmed', tone: 'good' };
  const n = votersOf(d).size;
  if (n >= 4) return { label: 'Almost decided', tone: 'warn' };
  return { label: 'Needs votes', tone: 'warn' };
}

function itemsOnDay(day) { return S.itinerary.filter(i => i.day === day && i.status !== 'cancelled').sort((a, b) => a.start.localeCompare(b.start)); }
function minutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function nowMin() { return NOW.getHours() * 60 + NOW.getMinutes(); }
function fmtTime(t) { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; const hh = ((h + 11) % 12) + 1; return hh + ':' + String(m).padStart(2, '0') + ' ' + ap; }
function dayLabel(day, long) {
  const d = new Date(DAY_DATES[day - 1] + 'T00:00:00');
  return d.toLocaleDateString('en-AU', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' });
}
function dayWeekday(day) { return new Date(DAY_DATES[day - 1] + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long' }); }
function todayItems() { return itemsOnDay(TODAY_DAY); }
function currentItem() { const n = nowMin(); return todayItems().find(i => minutes(i.start) <= n && minutes(i.end) > n) || null; }
function nextItem() { const n = nowMin(); return todayItems().find(i => minutes(i.start) > n) || null; }

function healthChecks() {
  const out = [];
  const flight = S.bookings.find(b => b.type === 'flight');
  out.push(flight && flight.status === 'confirmed' ? { tone: 'good', text: 'Flights confirmed', go: ['booking', 'b_flight'] } : { tone: 'bad', text: 'Flights not confirmed', go: ['bookings'] });
  const hotel = S.bookings.find(b => b.type === 'hotel');
  out.push(hotel && hotel.status === 'confirmed' ? { tone: 'good', text: 'Hotel confirmed', go: ['booking', 'b_hotel'] } : { tone: 'bad', text: 'Hotel not confirmed', go: ['bookings'] });
  const major = S.itinerary.filter(i => i.category === 'activity' && i.costJpy && i.day > 2);
  const unbooked = major.filter(i => i.booking === 'needed');
  if (unbooked.length === 0) out.push({ tone: 'good', text: 'Major activities booked', go: ['bookings'] });
  S.decisions.filter(d => d.status !== 'confirmed').forEach(d => {
    out.push({ tone: 'warn', text: d.title + ' needs a decision', sub: votersOf(d).size + ' of ' + S.people.length + ' voted · closes ' + new Date(d.deadline + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short' }), go: ['decision', d.id], resolve: 'decision', id: d.id });
  });
  S.itinerary.filter(i => i.booking === 'needed' && i.status !== 'cancelled').forEach(i => {
    const tone = i.category === 'activity' ? 'bad' : 'warn';
    out.push({ tone, text: i.title + (i.category === 'activity' ? ' booking missing' : ' not confirmed'), sub: dayLabel(i.day) + ' · ' + fmtTime(i.start), go: ['item', i.id], resolve: 'booking', id: i.id });
  });
  const over = forecastJpy() - budgetJpy();
  if (over > 0) out.push({ tone: 'warn', text: 'Forecast is ' + fmtHome(over, { dec: 0 }) + ' over budget', sub: 'Based on paid expenses plus committed plans', go: ['money', 'overview'] });
  return out;
}
function healthOverall() {
  const c = healthChecks();
  if (c.some(x => x.tone === 'bad')) return { tone: 'bad', label: 'Needs attention' };
  if (c.filter(x => x.tone === 'warn').length > 1) return { tone: 'warn', label: 'Mostly good' };
  return { tone: 'good', label: 'Good' };
}

let _uid = 100;
const uid = p => p + '_' + (_uid++);
function logActivity(text, who) { S.activity.unshift({ id: uid('a'), who: who || S.me, when: '2025-10-14T' + String(NOW.getHours()).padStart(2, '0') + ':' + String(NOW.getMinutes()).padStart(2, '0'), text }); }
function notify(icon, text, go) { S.notifications.unshift({ id: uid('n'), icon, text, when: 'Just now', unread: true, go }); }
