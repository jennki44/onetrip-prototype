/* OneTRIP demo data — Sydney family trip, 25 Sep – 3 Oct 2026.
   Built from the family's own day sheet. Every object carries tripId so the prototype behaves like one database. */

const TRIP_ID = 'trip_sydney';

// Base currency of the trip is AUD. RATES = how many AUD one unit of each currency buys. Fixed demo rates — Trip Brain never invents these.
const RATES = { AUD: 1, HKD: 0.195, USD: 1.52, GBP: 1.94, EUR: 1.66, JPY: 0.0101 };
const SYM = { AUD: 'A$', HKD: 'HK$', USD: 'US$', GBP: '£', EUR: '€', JPY: '¥' };
const BASE = 'AUD';

// Demo clock: Monday 28 September 2026, 09:10 (Day 4 — Coast and campus)
const NOW = new Date('2026-09-28T09:10:00');

const S = {
  tripId: TRIP_ID,
  me: 'jennie',
  reporting: 'HKD',
  travelMode: false,
  trip: {
    id: TRIP_ID, name: 'Sydney Family Trip', destination: 'Sydney, Australia', emoji: '🦘',
    start: '2026-09-25', end: '2026-10-03', currency: 'AUD', home: 'HKD',
    styles: ['Family', 'Relaxed', 'Adventure'], code: 'SYDNEY-26K', link: 'onetrip.app/join/SYDNEY26',
    status: 'active', cover: 'photos/banner2.jpg',
  },
  people: [
    { id: 'jennie', name: 'Jennie', role: 'owner', color: '#0F766E', initials: 'Je', joined: true },
    { id: 'john', name: 'John', role: 'traveller', color: '#2457C5', initials: 'Jo', joined: true },
    { id: 'mary', name: 'Mary', role: 'traveller', color: '#B45309', initials: 'Ma', joined: true },
    { id: 'tom', name: 'Tom', role: 'traveller', color: '#6D28D9', initials: 'To', joined: true },
  ],
  permissions: {
    owner: { itinerary: true, expenses: true, vote: true, invite: true, bookings: true },
    admin: { itinerary: true, expenses: true, vote: true, invite: true, bookings: true },
    traveller: { itinerary: true, expenses: true, vote: true, invite: false, bookings: false },
    viewer: { itinerary: false, expenses: false, vote: true, invite: false, bookings: false },
  },
  budget: {
    total: 28000, currency: 'HKD',
    categories: { Accommodation: 10000, Food: 6500, Activities: 4000, Transport: 5500, Shopping: 1500, Other: 500 },
  },
  days: [
    { n: 1, theme: 'Arrive and settle', stay: 'Sydney East', drive: '50 min', banner: 'photos/banner1.jpg', caption: 'Cronulla Beach and the Kurnell headland' },
    { n: 2, theme: 'Harbour day', stay: 'Sydney East', drive: 'No driving today', banner: 'photos/banner2.jpg', caption: 'Sydney Opera House and the Harbour Bridge', rule: "Leave the car at the hotel. Ferries and walking only — parking in the city is $60–80 a day." },
    { n: 3, theme: 'Blue Mountains — day return', stay: 'Sydney East', drive: '3 hr 30 return', banner: 'photos/banner3.jpg', caption: 'The Three Sisters above the Jamison Valley', rule: 'School holidays start tomorrow and fill the mountains. Today is the last quiet day up there.' },
    { n: 4, theme: 'Coast and campus', stay: 'Sydney East', drive: '30 min', banner: 'photos/banner4.jpg', caption: 'Bondi to Bronte clifftop walk' },
    { n: 5, theme: 'Grand Pacific Drive → Jervis Bay', stay: 'Huskisson · 2 nights', drive: '3 hr with stops', banner: 'photos/banner5.jpg', caption: 'Sea Cliff Bridge', rule: 'Pack light for two nights. Leave the big cases at the Sydney apartment and take an overnight bag.' },
    { n: 6, theme: 'Jervis Bay', stay: 'Huskisson', drive: '1 hr locally', banner: 'photos/banner6.jpg', caption: 'Hyams Beach, Jervis Bay' },
    { n: 7, theme: 'Back the scenic way', stay: 'Sydney East', drive: '3 hr with stops', banner: 'photos/banner7.jpg', caption: 'Fitzroy Falls' },
    { n: 8, theme: 'Free day and family dinner', stay: 'Sydney East', drive: 'Optional', banner: 'photos/banner8.jpg', caption: 'Watsons Bay and The Gap', rule: 'Deliberately unplanned. Pick one or two options, not all four.' },
    { n: 9, theme: 'Departure · flight 14:05', stay: '—', drive: '40 min', banner: 'photos/banner9.jpg', caption: 'Sydney Fish Market, Blackwattle Bay', rule: 'A 14:05 departure means terminal by 11:05 and car returned by 10:30. Pack everything the night before.' },
  ],
  places: [
    {"id": "airport", "name": "Sydney Airport", "type": "transport", "area": "Mascot", "x": 215, "y": 262, "emoji": "✈️", "fromHotel": 56, "photo": "photos/d1_0.jpg"},
    {"id": "carhire", "name": "Car rental · Ross Smith Ave", "type": "transport", "area": "Mascot", "x": 204, "y": 272, "emoji": "🚗", "fromHotel": 63, "photo": "photos/d1_1.jpg"},
    {"id": "solander", "name": "Cape Solander whale lookout", "type": "activity", "area": "Kurnell", "x": 262, "y": 352, "emoji": "🐋", "fromHotel": 117, "rating": 4.7, "price": "Free", "photo": "photos/d1_3.jpg"},
    {"id": "cronulla", "name": "Cronulla Beach", "type": "restaurant", "area": "Cronulla", "x": 214, "y": 344, "emoji": "🏖️", "fromHotel": 134, "rating": 4.5, "price": "$$", "estPP": 18, "photo": "photos/d1_5.jpg"},
    {"id": "hotel", "name": "Sydney East apartment", "type": "hotel", "area": "Randwick", "x": 312, "y": 232, "emoji": "🏨", "fromHotel": 0, "rating": 4.4, "price": "$$$", "address": "Randwick / Kensington / Coogee", "photo": "photos/d1_7.jpg"},
    {"id": "coogee", "name": "Coogee · local dinner", "type": "restaurant", "area": "Coogee", "x": 324, "y": 240, "emoji": "🍽️", "fromHotel": 8, "rating": 4.3, "price": "$$", "estPP": 38, "photo": "photos/d1_8.jpg"},
    {"id": "opera", "name": "Sydney Opera House", "type": "activity", "area": "Bennelong Point", "x": 262, "y": 158, "emoji": "🎭", "fromHotel": 49, "rating": 4.8, "price": "$$", "address": "Bennelong Point, Sydney NSW 2000", "photo": "photos/d2_1.jpg"},
    {"id": "botanic", "name": "Royal Botanic Garden → Mrs Macquarie's Chair", "type": "activity", "area": "Sydney", "x": 276, "y": 168, "emoji": "🌿", "fromHotel": 40, "rating": 4.7, "price": "Free", "photo": "photos/d2_2.jpg"},
    {"id": "rocks", "name": "The Rocks", "type": "restaurant", "area": "The Rocks", "x": 250, "y": 150, "emoji": "🥪", "fromHotel": 57, "rating": 4.6, "price": "$$", "estPP": 28, "photo": "photos/d2_3.jpg"},
    {"id": "cquay", "name": "Circular Quay Wharf 3", "type": "transport", "area": "Sydney", "x": 257, "y": 164, "emoji": "⛴️", "fromHotel": 48, "photo": "photos/d2_4.jpg"},
    {"id": "manly", "name": "Manly Wharf", "type": "activity", "area": "Manly", "x": 312, "y": 84, "emoji": "🏄", "fromHotel": 133, "rating": 4.6, "price": "$", "photo": "photos/d2_5.jpg"},
    {"id": "harbourdinner", "name": "Harbour-view restaurant · Circular Quay", "type": "restaurant", "area": "Circular Quay", "x": 254, "y": 172, "emoji": "🦪", "fromHotel": 46, "rating": 4.6, "price": "$$$", "estPP": 85, "hours": "17:30–22:00", "photo": "photos/d2_6.jpg"},
    {"id": "m4", "name": "Depart via M4", "type": "transport", "area": "Sydney", "x": 200, "y": 200, "emoji": "🚗", "fromHotel": 64, "photo": "photos/d3_1.jpg"},
    {"id": "echo", "name": "Echo Point — Three Sisters", "type": "activity", "area": "Katoomba", "x": 48, "y": 168, "emoji": "⛰️", "fromHotel": 220, "rating": 4.8, "price": "Free", "photo": "photos/d3_3.jpg"},
    {"id": "scenic", "name": "Scenic World", "type": "activity", "area": "Katoomba", "x": 40, "y": 158, "emoji": "🚡", "fromHotel": 220, "rating": 4.7, "price": "$$$", "photo": "photos/d3_4.jpg"},
    {"id": "leura", "name": "Leura Mall", "type": "restaurant", "area": "Leura", "x": 62, "y": 178, "emoji": "🍫", "fromHotel": 220, "rating": 4.5, "price": "$$", "estPP": 22, "photo": "photos/d3_5.jpg"},
    {"id": "wentworth", "name": "Wentworth Falls — Princes Rock", "type": "activity", "area": "Wentworth Falls", "x": 76, "y": 188, "emoji": "💦", "fromHotel": 216, "rating": 4.7, "price": "Free", "photo": "photos/d3_6.jpg"},
    {"id": "cahills", "name": "Cahill's Lookout", "type": "activity", "area": "Katoomba", "x": 42, "y": 148, "emoji": "🌄", "fromHotel": 220, "rating": 4.6, "price": "Free", "photo": "photos/d3_7.jpg"},
    {"id": "bondi", "name": "Bondi Beach", "type": "activity", "area": "Bondi", "x": 338, "y": 196, "emoji": "🏖️", "fromHotel": 24, "rating": 4.7, "price": "Free", "photo": "photos/d4_0.jpg"},
    {"id": "bronte_walk", "name": "Bondi to Bronte clifftop walk", "type": "activity", "area": "Bondi", "x": 336, "y": 210, "emoji": "🚶", "fromHotel": 18, "rating": 4.8, "price": "Free", "photo": "photos/d4_1.jpg"},
    {"id": "bronte", "name": "Bronte Beach kiosk", "type": "restaurant", "area": "Bronte", "x": 332, "y": 220, "emoji": "🐟", "fromHotel": 13, "rating": 4.4, "price": "$$", "estPP": 28, "hours": "07:00–16:00", "address": "Bronte Rd, Bronte NSW 2024", "photo": "photos/d4_2.jpg"},
    {"id": "unsw", "name": "UNSW Kensington campus", "type": "activity", "area": "Kensington", "x": 300, "y": 242, "emoji": "🎓", "fromHotel": 9, "rating": 4.5, "price": "Free", "photo": "photos/d4_3.jpg"},
    {"id": "relatives", "name": "Dinner with relatives", "type": "restaurant", "area": "To confirm", "x": 206, "y": 292, "emoji": "👨‍👩‍👧‍👦", "fromHotel": 110, "price": "$$", "estPP": 45, "photo": "photos/d4_4.jpg"},
    {"id": "m1", "name": "Depart via Princes Motorway", "type": "transport", "area": "Sydney", "x": 220, "y": 300, "emoji": "🚗", "fromHotel": 63, "photo": "photos/d5_1.jpg"},
    {"id": "seacliff", "name": "Sea Cliff Bridge", "type": "activity", "area": "Coalcliff", "x": 150, "y": 396, "emoji": "🌉", "fromHotel": 207, "rating": 4.8, "price": "Free", "photo": "photos/d5_3.jpg"},
    {"id": "kiama", "name": "Kiama Blowhole", "type": "activity", "area": "Kiama", "x": 110, "y": 440, "emoji": "🌊", "fromHotel": 220, "rating": 4.6, "price": "Free", "photo": "photos/d5_5.jpg"},
    {"id": "kiamaharbour", "name": "Kiama Harbour fish & chips", "type": "restaurant", "area": "Kiama", "x": 116, "y": 446, "emoji": "🍟", "fromHotel": 220, "rating": 4.4, "price": "$", "estPP": 20, "photo": "photos/d5_6.jpg"},
    {"id": "huskisson", "name": "Huskisson cottage", "type": "hotel", "area": "Huskisson", "x": 70, "y": 484, "emoji": "🏡", "fromHotel": 220, "rating": 4.6, "price": "$$", "address": "Owen St, Huskisson NSW 2540", "photo": "photos/d5_8.jpg"},
    {"id": "hyams", "name": "Hyams Beach", "type": "activity", "area": "Jervis Bay", "x": 80, "y": 498, "emoji": "🏝️", "fromHotel": 220, "rating": 4.8, "price": "Free", "photo": "photos/d5_9.jpg"},
    {"id": "booderee", "name": "Booderee National Park", "type": "activity", "area": "Jervis Bay", "x": 64, "y": 504, "emoji": "🌳", "fromHotel": 220, "rating": 4.7, "price": "$", "photo": "photos/d6_0.jpg"},
    {"id": "murrays", "name": "Murrays Beach", "type": "activity", "area": "Booderee", "x": 58, "y": 512, "emoji": "🏝️", "fromHotel": 220, "rating": 4.9, "price": "Free", "photo": "photos/d6_1.jpg"},
    {"id": "stgeorge", "name": "Cape St George Lighthouse ruins", "type": "activity", "area": "Booderee", "x": 86, "y": 512, "emoji": "🗼", "fromHotel": 220, "rating": 4.6, "price": "Free", "photo": "photos/d6_2.jpg"},
    {"id": "cruise", "name": "Dolphin Watch Cruises", "type": "activity", "area": "Huskisson", "x": 72, "y": 480, "emoji": "🐬", "fromHotel": 220, "rating": 4.8, "price": "$$$", "address": "50 Owen St, Huskisson NSW 2540", "photo": "photos/d6_3.jpg"},
    {"id": "whitesands", "name": "White Sands Walk", "type": "activity", "area": "Vincentia", "x": 78, "y": 492, "emoji": "🚶", "fromHotel": 220, "rating": 4.6, "price": "Free", "photo": "photos/d6_4.jpg"},
    {"id": "huskdinner", "name": "Huskisson · Owen St", "type": "restaurant", "area": "Huskisson", "x": 68, "y": 488, "emoji": "🍽️", "fromHotel": 220, "rating": 4.4, "price": "$$", "estPP": 40, "photo": "photos/d6_5.jpg"},
    {"id": "kvalley", "name": "Hampden Bridge, Kangaroo Valley", "type": "activity", "area": "Kangaroo Valley", "x": 96, "y": 430, "emoji": "🌉", "fromHotel": 220, "rating": 4.6, "price": "Free", "photo": "photos/d7_2.jpg"},
    {"id": "fitzroy", "name": "Fitzroy Falls", "type": "activity", "area": "Southern Highlands", "x": 86, "y": 404, "emoji": "💦", "fromHotel": 220, "rating": 4.7, "price": "Free", "photo": "photos/d7_4.jpg"},
    {"id": "berrima", "name": "Berrima village", "type": "restaurant", "area": "Berrima", "x": 100, "y": 372, "emoji": "🥧", "fromHotel": 220, "rating": 4.5, "price": "$$", "estPP": 24, "photo": "photos/d7_5.jpg"},
    {"id": "qvb", "name": "Queen Victoria Building", "type": "shopping", "area": "Sydney CBD", "x": 246, "y": 180, "emoji": "🏛️", "fromHotel": 46, "rating": 4.7, "price": "$$", "photo": "photos/d8_1.jpg"},
    {"id": "watsons", "name": "Watsons Bay and The Gap", "type": "activity", "area": "Watsons Bay", "x": 352, "y": 150, "emoji": "🐟", "fromHotel": 50, "rating": 4.7, "price": "$$", "photo": "photos/d8_2.jpg"},
    {"id": "taronga", "name": "Taronga Zoo", "type": "activity", "area": "Mosman", "x": 270, "y": 118, "emoji": "🦘", "fromHotel": 109, "rating": 4.7, "price": "$$$", "photo": "photos/d8_3.jpg"},
    {"id": "restday", "name": "Rest day at the hotel", "type": "activity", "area": "Randwick", "x": 312, "y": 232, "emoji": "😴", "fromHotel": 8, "price": "Free", "photo": "photos/d8_4.jpg"},
    {"id": "fishmarket", "name": "Sydney Fish Market", "type": "restaurant", "area": "Glebe", "x": 232, "y": 174, "emoji": "🐟", "fromHotel": 54, "rating": 4.6, "price": "$$", "estPP": 25, "address": "1 Bridge Rd, Glebe NSW 2037", "photo": "photos/d9_1.jpg"},
    {"id": "refuel", "name": "Refuel · O'Riordan St", "type": "transport", "area": "Mascot", "x": 212, "y": 266, "emoji": "⛽", "fromHotel": 58, "photo": "photos/d9_4.jpg"},
    {"id": "chinatown", "name": "Golden Century banquet hall", "type": "restaurant", "area": "Haymarket", "x": 240, "y": 190, "emoji": "🥢", "fromHotel": 46, "rating": 4.5, "price": "$$", "estPP": 55, "hours": "11:00–23:00", "photo": "photos/d2_3.jpg"},
    {"id": "barangaroo", "name": "Barangaroo waterfront", "type": "restaurant", "area": "Barangaroo", "x": 238, "y": 156, "emoji": "🍷", "fromHotel": 58, "rating": 4.4, "price": "$$$", "estPP": 75, "hours": "17:00–23:00", "photo": "photos/d2_5.jpg"}
  ],
  itinerary: [
    {"id": "i1_0", "day": 1, "start": "06:10", "title": "Sydney Airport — land", "placeId": "airport", "emoji": "✈️", "category": "transport", "status": "completed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "Sydney Airport, Mascot NSW 2020", "note": "Allow a full hour for immigration, baggage and biosecurity. Australia is strict on food — declare anything you are unsure about.", "flag": null, "photo": "photos/d1_0.jpg", "bookingId": "b_flight", "end": "07:30"},
    {"id": "i1_1", "day": 1, "start": "07:30", "title": "Collect the car", "placeId": "carhire", "emoji": "🚗", "category": "transport", "status": "completed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "Car rental returns, Ross Smith Ave, Mascot NSW 2020", "note": "The booking says 06:00. Give the rental company your flight number so they hold the car and do not mark it a no-show. Take the e-tag for tolls.", "flag": "Ask at the counter: Confirm the car takes four adults plus all luggage, and that the e-tag is activated.", "photo": "photos/d1_1.jpg", "bookingId": "b_car", "costAmt": 620, "end": "08:05"},
    {"id": "i1_3", "day": 1, "start": "08:30", "title": "Cape Solander whale lookout", "placeId": "solander", "emoji": "🐋", "category": "activity", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Cape Solander Dr, Kurnell NSW 2231", "note": "Free, covered platform, park at the door. Late September is peak southbound humpback season — mothers and calves travel close to shore. No walking required.", "flag": null, "photo": "photos/d1_3.jpg", "travelMin": 25, "end": "09:25"},
    {"id": "i1_5", "day": 1, "start": "09:45", "title": "Cronulla Beach — breakfast", "placeId": "cronulla", "emoji": "🏖️", "category": "food", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Cronulla Beach, Kingsway, Cronulla NSW 2230", "note": "CronullaFest runs 25–27 Sep at Cronulla Plaza — a free community festival. Easy first taste of Australia while you wait for check-in.", "flag": null, "photo": "photos/d1_5.jpg", "travelMin": 20, "costAmt": 68, "end": "13:25"},
    {"id": "i1_7", "day": 1, "start": "14:00", "title": "Check in, then rest", "placeId": "hotel", "emoji": "🏨", "category": "stay", "status": "completed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "Sydney East — Randwick / Kensington / Coogee", "note": "Do not skip the nap. Tomorrow is the longest day of the trip.", "flag": null, "photo": "photos/d1_7.jpg", "bookingId": "b_hotel", "travelMin": 35, "costAmt": 1140, "end": "18:30"},
    {"id": "i1_8", "day": 1, "start": "18:30", "title": "Family dinner nearby", "placeId": "coogee", "emoji": "🍽️", "category": "food", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Near accommodation", "note": "Keep it short and local. Everyone has been awake since the flight.", "flag": null, "photo": "photos/d1_8.jpg", "costAmt": 142, "end": "20:00"},
    {"id": "i2_1", "day": 2, "start": "09:30", "title": "Sydney Opera House — guided tour", "placeId": "opera", "emoji": "🎭", "category": "activity", "status": "completed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "Bennelong Point, Sydney NSW 2000", "note": "Book ahead, about one hour. Going inside is what makes this fresh even for those who have seen it many times.", "flag": null, "photo": "photos/d2_1.jpg", "bookingId": "b_opera", "costAmt": 180, "end": "11:00"},
    {"id": "i2_2", "day": 2, "start": "11:00", "title": "Royal Botanic Garden → Mrs Macquarie's Chair", "placeId": "botanic", "emoji": "🌿", "category": "activity", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Mrs Macquaries Rd, Sydney NSW 2000", "note": "Flat 2km walk through the gardens. The only spot where the Opera House and Harbour Bridge line up in one frame.", "flag": "The photo: Stand at the point itself, not the car park. Late morning light comes from behind you.", "photo": "photos/d2_2.jpg", "end": "12:30"},
    {"id": "i2_3", "day": 2, "start": "12:30", "title": "Lunch at The Rocks", "placeId": "rocks", "emoji": "🥪", "category": "food", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Playfair St, The Rocks NSW 2000", "note": "The Rocks Markets run all weekend — stalls, buskers, sandstone laneways under the bridge.", "flag": null, "photo": "photos/d2_3.jpg", "costAmt": 96, "end": "14:30"},
    {"id": "i2_4", "day": 2, "start": "14:30", "title": "Ferry to Manly", "placeId": "cquay", "emoji": "⛴️", "category": "transport", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Circular Quay Wharf 3, Alfred St, Sydney NSW 2000", "note": "Thirty minutes across the harbour and out past the Heads. Best-value harbour cruise anywhere. Manly Corso and the ocean beach at the far end.", "flag": null, "photo": "photos/d2_4.jpg", "costAmt": 86.4, "end": "17:00"},
    {"id": "i2_5", "day": 2, "start": "17:00", "title": "Sunset ferry back", "placeId": "manly", "emoji": "🏄", "category": "transport", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Manly Wharf, E Esplanade, Manly NSW 2095", "note": "City skyline lighting up as you come in. Sunset is around 5:50pm — catch the 5:00 or 5:30 sailing.", "flag": null, "photo": "photos/d2_5.jpg", "end": "19:00"},
    {"id": "i2_6", "day": 2, "start": "19:00", "title": "Family dinner · harbour view", "placeId": "harbourdinner", "emoji": "🦪", "category": "food", "status": "completed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "To confirm — see checklist", "note": "Either a harbour-view restaurant at Circular Quay or Barangaroo, or a Chinese banquet round table if relatives are joining. Book now — Saturday night in Sydney fills a month ahead.", "flag": null, "photo": "photos/d2_6.jpg", "bookingId": "b_satdinner", "costAmt": 412, "end": "20:30"},
    {"id": "i3_1", "day": 3, "start": "07:00", "title": "Depart Sydney", "placeId": "m4", "emoji": "🚗", "category": "transport", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "West on the M4 Motorway", "note": "Early start beats the coach tours to the lookouts. Roughly 1 hr 45 each way.", "flag": null, "photo": "photos/d3_1.jpg", "end": "08:00"},
    {"id": "i3_3", "day": 3, "start": "09:00", "title": "Echo Point — Three Sisters", "placeId": "echo", "emoji": "⛰️", "category": "activity", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Echo Point Rd, Katoomba NSW 2780", "note": "Free lookout, paid car park. Flat, railed and fully accessible. Get there before the buses arrive.", "flag": null, "photo": "photos/d3_3.jpg", "travelMin": 60, "end": "10:00"},
    {"id": "i3_4", "day": 3, "start": "10:00", "title": "Scenic World", "placeId": "scenic", "emoji": "🚡", "category": "activity", "status": "completed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "Cnr Violet St & Cliff Dr, Katoomba NSW 2780", "note": "Cableway, skyway and the steepest passenger railway in the world. Takes you deep into the valley with almost no walking. Book online — Sunday queues are real.", "flag": null, "photo": "photos/d3_4.jpg", "bookingId": "b_scenic", "costAmt": 236, "end": "12:30"},
    {"id": "i3_5", "day": 3, "start": "12:30", "title": "Lunch at Leura", "placeId": "leura", "emoji": "🍫", "category": "food", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Leura Mall, Leura NSW 2780", "note": "Pretty village main street, plenty of cafes. Josophan's for chocolate.", "flag": null, "photo": "photos/d3_5.jpg", "costAmt": 78, "end": "14:30"},
    {"id": "i3_6", "day": 3, "start": "14:30", "title": "Wentworth Falls — Princes Rock lookout", "placeId": "wentworth", "emoji": "💦", "category": "activity", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Falls Rd, Wentworth Falls NSW 2782", "note": "Short walk, big reward. Skip the long staircase descent to the base of the falls.", "flag": null, "photo": "photos/d3_6.jpg", "end": "16:30"},
    {"id": "i3_7", "day": 3, "start": "16:30", "title": "Cahill's Lookout", "placeId": "cahills", "emoji": "🌄", "category": "activity", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Cliff Dr, Katoomba NSW 2780", "note": "Same valley as Echo Point, a fraction of the crowd, and the best light of the day.", "flag": null, "photo": "photos/d3_7.jpg", "end": "18:00"},
    {"id": "i3_9", "day": 3, "start": "19:00", "title": "Dinner near the hotel", "placeId": "coogee", "emoji": "🍽️", "category": "food", "status": "completed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Sydney East", "note": "Something simple. It has been a long day in the car.", "flag": null, "photo": "photos/d3_9.jpg", "travelMin": 60, "costAmt": 124, "end": "20:30"},
    {"id": "i4_0", "day": 4, "start": "09:00", "title": "Bondi Beach", "placeId": "bondi", "emoji": "🏖️", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Queen Elizabeth Dr, Bondi Beach NSW 2026", "note": "Paid parking along the beachfront. Cold for swimming, perfect for walking.", "flag": null, "photo": "photos/d4_0.jpg", "end": "09:30"},
    {"id": "i4_1", "day": 4, "start": "09:30", "title": "Bondi to Bronte clifftop walk", "placeId": "bronte_walk", "emoji": "🚶", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Bondi to Bronte Coastal Walk, Bondi Beach NSW 2026", "note": "2.5km, paved, gentle steps, ocean on your left the whole way. Whales are visible from the cliffs this time of year. Extend to Coogee (6km) only if everyone is fresh.", "flag": null, "photo": "photos/d4_1.jpg", "end": "12:00"},
    {"id": "i4_2", "day": 4, "start": "12:00", "title": "Lunch at Bronte or Bondi", "placeId": "bronte", "emoji": "🐟", "category": "food", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Bronte Rd, Bronte NSW 2024", "note": "Bus back, or walk the same path in reverse.", "flag": null, "photo": "photos/d4_2.jpg", "costAmt": 112, "end": "14:30"},
    {"id": "i4_3", "day": 4, "start": "14:30", "title": "UNSW Kensington campus", "placeId": "unsw", "emoji": "🎓", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "High St, Kensington NSW 2052", "note": "Go on a weekday when the campus is alive. Forty minutes is plenty — the library lawn, the main walkway, a coffee.", "flag": null, "photo": "photos/d4_3.jpg", "end": "18:30"},
    {"id": "i4_4", "day": 4, "start": "18:30", "title": "Dinner with relatives", "placeId": "relatives", "emoji": "👨‍👩‍👧‍👦", "category": "food", "status": "voting", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "To confirm — see checklist", "note": "Ask them now which evenings they can do. Their availability decides the rest of the week.", "flag": null, "photo": "photos/d4_4.jpg", "costAmt": 180, "end": "20:00", "decisionId": "dec_relatives"},
    {"id": "i5_1", "day": 5, "start": "08:30", "title": "Depart Sydney", "placeId": "m1", "emoji": "🚗", "category": "transport", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "South via the Princes Motorway", "note": "Beat the southbound morning peak.", "flag": null, "photo": "photos/d5_1.jpg", "end": "09:00"},
    {"id": "i5_3", "day": 5, "start": "09:45", "title": "Sea Cliff Bridge", "placeId": "seacliff", "emoji": "🌉", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Lawrence Hargrave Dr, Coalcliff NSW 2508", "note": "665 metres of road cantilevered out over the open ocean. Park at the northern end and walk the pedestrian side. Bald Hill lookout is five minutes further north.", "flag": "Today's highlight: The best drive within two hours of Sydney, and new even for repeat visitors.", "photo": "photos/d5_3.jpg", "travelMin": 60, "end": "10:30"},
    {"id": "i5_5", "day": 5, "start": "11:30", "title": "Kiama Blowhole", "placeId": "kiama", "emoji": "🌊", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Blowhole Point Rd, Kiama NSW 2533", "note": "Best on a southeasterly swell. Lighthouse and rock platform right beside it, all flat ground.", "flag": null, "photo": "photos/d5_5.jpg", "travelMin": 60, "end": "12:30"},
    {"id": "i5_6", "day": 5, "start": "12:30", "title": "Lunch — Kiama Harbour", "placeId": "kiamaharbour", "emoji": "🍟", "category": "food", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Blowhole Point Rd, Kiama NSW 2533", "note": "Fish and chips by the water.", "flag": null, "photo": "photos/d5_6.jpg", "costAmt": 76, "end": "14:00"},
    {"id": "i5_8", "day": 5, "start": "15:00", "title": "Check in — Huskisson", "placeId": "huskisson", "emoji": "🏡", "category": "stay", "status": "confirmed", "booking": "needed", "people": ["jennie", "john", "mary", "tom"], "address": "Owen St, Huskisson NSW 2540", "note": "Small seaside town. Everything is walkable from the main street.", "flag": null, "photo": "photos/d5_8.jpg", "travelMin": 60, "costAmt": 520, "end": "17:00"},
    {"id": "i5_9", "day": 5, "start": "17:00", "title": "Hyams Beach — sunset", "placeId": "hyams", "emoji": "🏝️", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Cyril Ave, Hyams Beach NSW 2540", "note": "Some of the whitest sand in the world — it squeaks underfoot. Parking is limited, so go early or park in the village and walk in.", "flag": null, "photo": "photos/d5_9.jpg", "end": "18:00"},
    {"id": "i6_0", "day": 6, "start": "09:00", "title": "Booderee National Park", "placeId": "booderee", "emoji": "🌳", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Jervis Bay Rd, Jervis Bay JBT 2540", "note": "Vehicle entry fee at the gate, valid 48 hours. Card accepted.", "flag": null, "photo": "photos/d6_0.jpg", "costAmt": 17, "end": "09:30"},
    {"id": "i6_1", "day": 6, "start": "09:30", "title": "Murrays Beach", "placeId": "murrays", "emoji": "🏝️", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Murrays Beach Rd, Booderee National Park", "note": "Sheltered, turquoise water, short walk from the car park. The prettiest beach in the park.", "flag": null, "photo": "photos/d6_1.jpg", "end": "11:00"},
    {"id": "i6_2", "day": 6, "start": "11:00", "title": "Cape St George Lighthouse ruins", "placeId": "stgeorge", "emoji": "🗼", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Stony Creek Rd, Booderee National Park", "note": "Clifftop ruins and one of the best land-based whale watching headlands on the east coast. Bring binoculars.", "flag": null, "photo": "photos/d6_2.jpg", "end": "13:30"},
    {"id": "i6_3", "day": 6, "start": "13:30", "title": "Dolphin & whale cruise", "placeId": "cruise", "emoji": "🐬", "category": "activity", "status": "confirmed", "booking": "needed", "people": ["jennie", "john", "mary", "tom"], "address": "Dolphin Watch Cruises, 50 Owen St, Huskisson NSW 2540", "note": "Sheltered bay water, far gentler than the open-ocean Sydney cruises. Resident bottlenose dolphins year-round, humpbacks with calves passing through in late September.", "flag": "If anyone gets seasick: This is the cruise to do, not the Sydney one. Jervis Bay is protected water.", "photo": "photos/d6_3.jpg", "costAmt": 340, "end": "16:30"},
    {"id": "i6_4", "day": 6, "start": "16:30", "title": "White Sands Walk", "placeId": "whitesands", "emoji": "🚶", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Greenfield Beach, Vincentia NSW 2540", "note": "3km easy coastal path linking the beaches. Turn back whenever you like.", "flag": null, "photo": "photos/d6_4.jpg", "end": "18:30"},
    {"id": "i6_5", "day": 6, "start": "18:30", "title": "Dinner in Huskisson", "placeId": "huskdinner", "emoji": "🍽️", "category": "food", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Owen St, Huskisson NSW 2540", "note": "Walk from the accommodation. Book if it looks busy.", "flag": null, "photo": "photos/d6_5.jpg", "costAmt": 160, "end": "20:00"},
    {"id": "i7_0", "day": 7, "start": "09:00", "title": "Depart Huskisson", "placeId": "huskisson", "emoji": "🏡", "category": "transport", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "North-west via Kangaroo Valley", "note": "Inland route home instead of retracing the coast.", "flag": null, "photo": "photos/d7_0.jpg", "end": "09:30"},
    {"id": "i7_2", "day": 7, "start": "09:45", "title": "Hampden Bridge, Kangaroo Valley", "placeId": "kvalley", "emoji": "🌉", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Moss Vale Rd, Kangaroo Valley NSW 2577", "note": "Sandstone-turreted suspension bridge from 1898, spanning a green river valley. Coffee in the village.", "flag": null, "photo": "photos/d7_2.jpg", "travelMin": 45, "end": "10:50"},
    {"id": "i7_4", "day": 7, "start": "11:30", "title": "Fitzroy Falls", "placeId": "fitzroy", "emoji": "💦", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "1301 Nowra Rd, Fitzroy Falls NSW 2577", "note": "An 81-metre drop. Ten-minute flat walk from the visitor centre to the main lookout. Cafe and toilets on site.", "flag": "This replaces Bowral: You keep the best Southern Highlands scenery without needing an overnight stop.", "photo": "photos/d7_4.jpg", "travelMin": 40, "end": "13:00"},
    {"id": "i7_5", "day": 7, "start": "13:00", "title": "Lunch — Berrima", "placeId": "berrima", "emoji": "🥧", "category": "food", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Berrima NSW 2577", "note": "Historic sandstone village, 1830s buildings, easy parking. Robertson has the pie shop if you prefer.", "flag": null, "photo": "photos/d7_5.jpg", "costAmt": 88, "end": "15:00"},
    {"id": "i7_7", "day": 7, "start": "16:00", "title": "Back at the Sydney hotel", "placeId": "hotel", "emoji": "🏨", "category": "stay", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Sydney East", "note": "Unpack and rest.", "flag": null, "photo": "photos/d7_7.jpg", "travelMin": 60, "end": "18:30"},
    {"id": "i7_8", "day": 7, "start": "18:30", "title": "Quiet dinner", "placeId": "coogee", "emoji": "🍽️", "category": "food", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "To confirm", "note": "A driving day. Do not over-book tonight — keep it local.", "flag": null, "photo": "photos/d7_8.jpg", "costAmt": 150, "end": "20:00"},
    {"id": "i8_free", "day": 8, "start": "10:00", "end": "16:00", "title": "Free day — group decision", "placeId": null, "emoji": "🗳️", "category": "free", "status": "voting", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "note": "Deliberately unplanned. Pick one or two of the options, not all four.", "photo": "photos/banner8.jpg", "decisionId": "dec_freeday"},
    {"id": "i8_5", "day": 8, "start": "18:30", "title": "Family dinner", "placeId": null, "emoji": "🦪", "category": "food", "status": "voting", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "To confirm — see checklist", "note": "Start of the long weekend, so relatives should be free. Book ahead — Friday night before a public holiday is busy.", "flag": null, "photo": "photos/d8_5.jpg", "costAmt": 340, "end": "20:30", "decisionId": "dec_fridinner"},
    {"id": "i9_1", "day": 9, "start": "07:15", "title": "Sydney Fish Market — optional", "placeId": "fishmarket", "emoji": "🐟", "category": "activity", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "1 Bridge Rd, Glebe NSW 2037", "note": "Only if everything is packed. The new $836m market on Blackwattle Bay opened January 2026 — wave-shaped roof, 40+ traders, live auctions behind glass. Leave by 08:30, no later.", "flag": "New location: Not the old Pyrmont site. Set the GPS to 1 Bridge Road, Glebe.", "photo": "photos/d9_1.jpg", "costAmt": 100, "end": "09:00"},
    {"id": "i9_2", "day": 9, "start": "09:00", "title": "Check out", "placeId": "hotel", "emoji": "🏨", "category": "stay", "status": "confirmed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "Sydney East", "note": "Check drawers, safes, chargers, passports.", "flag": null, "photo": "photos/d9_2.jpg", "bookingId": "b_hotel", "end": "09:30"},
    {"id": "i9_4", "day": 9, "start": "09:45", "title": "Refuel near the airport", "placeId": "refuel", "emoji": "⛽", "category": "transport", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "O'Riordan St, Mascot NSW 2020", "note": "The car must come back full or they charge a premium refuelling rate. Allow 30 minutes and keep the receipt.", "flag": null, "photo": "photos/d9_4.jpg", "travelMin": 25, "end": "10:30"},
    {"id": "i9_5", "day": 9, "start": "10:30", "title": "Return the car", "placeId": "carhire", "emoji": "🚗", "category": "transport", "status": "confirmed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "Car rental returns, Ross Smith Ave, Mascot NSW 2020", "note": "Photograph the car inside and out before handing over the keys. Shuttle to the terminal from here.", "flag": null, "photo": "photos/d9_5.jpg", "bookingId": "b_car", "end": "11:05"},
    {"id": "i9_6", "day": 9, "start": "11:05", "title": "At the terminal", "placeId": "airport", "emoji": "✈️", "category": "transport", "status": "confirmed", "booking": "none", "people": ["jennie", "john", "mary", "tom"], "address": "Sydney Airport, Mascot NSW 2020", "note": "Three hours before departure. Long weekend Saturday, so check-in and security will be slow.", "flag": null, "photo": "photos/d9_6.jpg", "end": "14:05"},
    {"id": "i9_7", "day": 9, "start": "14:05", "title": "Flight departs", "placeId": "airport", "emoji": "✈️", "category": "transport", "status": "confirmed", "booking": "booked", "people": ["jennie", "john", "mary", "tom"], "address": "Sydney Airport, Mascot NSW 2020", "note": "Safe trip home.", "flag": null, "photo": "photos/d9_7.jpg", "bookingId": "b_flight", "end": "14:05"}
  ],
  bookings: [
    { id: 'b_flight', type: 'flight', title: 'Cathay Pacific CX 111 · HKG → SYD', ref: 'CX7K2Q', provider: 'Cathay Pacific', date: '2026-09-25', status: 'confirmed', costHome: 22800, note: 'Paid before the trip — not counted in the trip budget', docId: 'd_flight', details: { Outbound: 'Thu 24 Sep, 21:35 → Fri 25 Sep, 06:10', Return: 'Sat 3 Oct, 14:05 → 21:20', Passengers: '4', Seats: '41A–41D' } },
    { id: 'b_car', type: 'transport', title: 'Car hire · Toyota Kluger', ref: 'HZ-40218', provider: 'Hertz Sydney Airport', date: '2026-09-25', status: 'confirmed', costAmt: 620, docId: 'd_car', details: { 'Pick-up': 'Fri 25 Sep, 06:00 · Ross Smith Ave, Mascot', Return: 'Sat 3 Oct, by 14:30 (plan for 10:30)', Extras: 'e-tag for tolls · 4 adults + luggage confirmed', Fuel: 'Return full or premium refuelling rate applies' } },
    { id: 'b_hotel', type: 'hotel', title: 'Sydney East apartment · Randwick', ref: 'AP-88213', provider: 'Meriton Suites', date: '2026-09-25', status: 'confirmed', costAmt: 1900, paidAmt: 1140, docId: 'd_hotel', details: { 'Check-in': 'Fri 25 Sep, 14:00', 'Check-out': 'Sat 3 Oct, 09:00', Guests: '4 · 2-bedroom apartment', Balance: 'A$760 due at check-out', Storage: 'Will hold the big cases 29–30 Sep' } },
    { id: 'b_opera', type: 'activity', title: 'Sydney Opera House guided tour · 09:30', ref: 'SOH-4410', provider: 'Sydney Opera House', date: '2026-09-26', status: 'confirmed', costAmt: 180, docId: 'd_opera', details: { Tickets: '4 × adult', Entry: 'Sat 26 Sep, 09:30 · Welcome Centre' } },
    { id: 'b_satdinner', type: 'activity', title: 'Harbour-view dinner · table for 8', ref: 'R-2291', provider: 'Circular Quay', date: '2026-09-26', status: 'confirmed', costAmt: 412, details: { Table: 'Sat 26 Sep, 19:00 · 8 people incl. relatives', Note: 'Booked a month ahead' } },
    { id: 'b_scenic', type: 'activity', title: 'Scenic World · Unlimited Discovery Pass', ref: 'SW-91K', provider: 'Scenic World', date: '2026-09-27', status: 'confirmed', costAmt: 236, docId: 'd_scenic', details: { Tickets: '4 × adult', Date: 'Sun 27 Sep · any time' } },
  ],
  documents: [
    { id: 'd_flight', name: 'Cathay Pacific e-tickets.pdf', category: 'Flights', size: '212 KB', linked: { type: 'booking', id: 'b_flight' }, addedBy: 'jennie', date: '2026-07-02' },
    { id: 'd_car', name: 'Hertz car hire voucher.pdf', category: 'Transport', size: '156 KB', linked: { type: 'booking', id: 'b_car' }, addedBy: 'john', date: '2026-07-18' },
    { id: 'd_hotel', name: 'Apartment confirmation.pdf', category: 'Hotels', size: '140 KB', linked: { type: 'booking', id: 'b_hotel' }, addedBy: 'jennie', date: '2026-07-10' },
    { id: 'd_opera', name: 'Opera House tour tickets.pdf', category: 'Activities', size: '96 KB', linked: { type: 'booking', id: 'b_opera' }, addedBy: 'mary', date: '2026-09-01' },
    { id: 'd_scenic', name: 'Scenic World passes.pdf', category: 'Activities', size: '188 KB', linked: { type: 'booking', id: 'b_scenic' }, addedBy: 'tom', date: '2026-09-05' },
    { id: 'd_ins', name: 'Travel insurance policy.pdf', category: 'Insurance', size: '410 KB', linked: null, addedBy: 'jennie', date: '2026-08-14' },
    { id: 'd_fuel', name: 'Fuel receipt Katoomba.jpg', category: 'Receipts', size: '1.1 MB', linked: { type: 'expense', id: 'e14' }, addedBy: 'john', date: '2026-09-27' },
    { id: 'd_ferry', name: 'Manly ferry Opal receipt.png', category: 'Transport', size: '540 KB', linked: { type: 'expense', id: 'e8' }, addedBy: 'tom', date: '2026-09-26' },
    { id: 'd_sheet', name: 'Sydney day sheet (printable).pdf', category: 'Other', size: '2.8 MB', linked: null, addedBy: 'jennie', date: '2026-09-20' },
  ],
  decisions: [
    {
      id: 'dec_fridinner', title: 'Friday family dinner', question: 'Where do we take the relatives on Friday night?', status: 'open', deadline: '2026-09-30', day: 8, slot: '18:30', category: 'Food',
      options: [
        { id: 'o_harbour', placeId: 'harbourdinner', estPP: 85 },
        { id: 'o_banquet', placeId: 'chinatown', estPP: 55 },
        { id: 'o_barangaroo', placeId: 'barangaroo', estPP: 75 },
      ],
      votes: {
        o_harbour: { john: 'love', mary: 'love', tom: 'good' },
        o_banquet: { john: 'good', mary: 'love', tom: 'maybe' },
        o_barangaroo: { john: 'maybe', mary: 'good', tom: 'no' },
      },
      confirmedOptionId: null,
    },
    {
      id: 'dec_freeday', title: 'Friday free day', question: 'Which one or two do we do on Friday?', status: 'open', deadline: '2026-10-01', day: 8, slot: '10:00', category: 'Activities',
      options: [
        { id: 'o_qvb', placeId: 'qvb', estPP: 30 },
        { id: 'o_watsons', placeId: 'watsons', estPP: 45 },
        { id: 'o_taronga', placeId: 'taronga', estPP: 52 },
        { id: 'o_rest', placeId: 'restday', estPP: 0 },
      ],
      votes: {
        o_qvb: { mary: 'good', tom: 'maybe' },
        o_watsons: { mary: 'love', tom: 'love' },
        o_taronga: { mary: 'maybe', tom: 'good' },
        o_rest: { mary: 'no', tom: 'maybe' },
      },
      confirmedOptionId: null,
    },
    {
      id: 'dec_relatives', title: 'Dinner with relatives tonight', question: 'Which evening and where can the relatives do?', status: 'open', deadline: '2026-09-28', day: 4, slot: '18:30', category: 'Food',
      options: [
        { id: 'o_tonight', label: 'Tonight · yum cha in Hurstville', sub: 'Mon 28 Sep, 18:30 · their suggestion', estPP: 45 },
        { id: 'o_thursday', label: 'Thursday after the drive', sub: 'Thu 1 Oct, 19:00 · near the hotel', estPP: 45 },
        { id: 'o_both', label: 'Both nights', sub: 'Tonight and Friday', estPP: 45 },
      ],
      votes: { o_tonight: { john: 'love' }, o_thursday: { john: 'maybe' }, o_both: { john: 'good' } },
      confirmedOptionId: null,
    },
  ],
  expenses: [
    {"id": "e1", "merchant": "Sydney East apartment · deposit", "placeId": "hotel", "category": "Accommodation", "amt": 1140, "currency": "AUD", "date": "2026-09-25", "time": "14:10", "payer": "jennie", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🏨", "bookingId": "b_hotel"},
    {"id": "e2", "merchant": "Car hire · 9 days", "placeId": "carhire", "category": "Transport", "amt": 620, "currency": "AUD", "date": "2026-09-25", "time": "07:40", "payer": "john", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🚗", "bookingId": "b_car"},
    {"id": "e3", "merchant": "Tolls · e-tag top-up", "placeId": "carhire", "category": "Transport", "amt": 40, "currency": "AUD", "date": "2026-09-25", "time": "07:45", "payer": "john", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🛣️"},
    {"id": "e4", "merchant": "Cronulla Beach breakfast", "placeId": "cronulla", "category": "Food", "amt": 68, "currency": "AUD", "date": "2026-09-25", "time": "10:05", "payer": "jennie", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🥐"},
    {"id": "e5", "merchant": "Coogee family dinner", "placeId": "coogee", "category": "Food", "amt": 142, "currency": "AUD", "date": "2026-09-25", "time": "20:10", "payer": "mary", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🍽️"},
    {"id": "e6", "merchant": "Opera House guided tour", "placeId": "opera", "category": "Activities", "amt": 180, "currency": "AUD", "date": "2026-09-26", "time": "09:20", "payer": "mary", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🎭", "bookingId": "b_opera"},
    {"id": "e7", "merchant": "Lunch at The Rocks", "placeId": "rocks", "category": "Food", "amt": 96, "currency": "AUD", "date": "2026-09-26", "time": "13:05", "payer": "john", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🥪"},
    {"id": "e8", "merchant": "Manly ferry · 4 return", "placeId": "cquay", "category": "Transport", "amt": 86.4, "currency": "AUD", "date": "2026-09-26", "time": "14:20", "payer": "tom", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "⛴️"},
    {"id": "e9", "merchant": "Family dinner · harbour view", "placeId": "harbourdinner", "category": "Food", "amt": 412, "currency": "AUD", "date": "2026-09-26", "time": "21:15", "payer": "jennie", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🦪", "bookingId": "b_satdinner"},
    {"id": "e10", "merchant": "Scenic World tickets", "placeId": "scenic", "category": "Activities", "amt": 236, "currency": "AUD", "date": "2026-09-27", "time": "09:55", "payer": "tom", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🚡", "bookingId": "b_scenic"},
    {"id": "e11", "merchant": "Echo Point parking", "placeId": "echo", "category": "Transport", "amt": 8, "currency": "AUD", "date": "2026-09-27", "time": "09:05", "payer": "john", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🅿️"},
    {"id": "e12", "merchant": "Lunch at Leura", "placeId": "leura", "category": "Food", "amt": 78, "currency": "AUD", "date": "2026-09-27", "time": "12:50", "payer": "mary", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🍫"},
    {"id": "e13", "merchant": "Josophan's chocolate", "placeId": "leura", "category": "Shopping", "amt": 42, "currency": "AUD", "date": "2026-09-27", "time": "13:30", "payer": "tom", "participants": ["tom", "mary"], "split": "Equal", "emoji": "🍫"},
    {"id": "e14", "merchant": "Fuel · Katoomba", "placeId": "carhire", "category": "Transport", "amt": 85, "currency": "AUD", "date": "2026-09-27", "time": "17:00", "payer": "john", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "⛽"},
    {"id": "e15", "merchant": "Dinner near the hotel", "placeId": "coogee", "category": "Food", "amt": 124, "currency": "AUD", "date": "2026-09-27", "time": "19:40", "payer": "john", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🍜"},
    {"id": "e16", "merchant": "Groceries · Coles Randwick", "placeId": null, "category": "Food", "amt": 54, "currency": "AUD", "date": "2026-09-27", "time": "21:00", "payer": "mary", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "🛒"},
    {"id": "e17", "merchant": "Coffee at Bondi", "placeId": "bondi", "category": "Food", "amt": 22, "currency": "AUD", "date": "2026-09-28", "time": "09:05", "payer": "jennie", "participants": ["jennie", "john", "mary", "tom"], "split": "Equal", "emoji": "☕"},
    {"id": "e18", "merchant": "Bondi beachfront parking", "placeId": "bondi", "category": "Transport", "amt": 12, "currency": "AUD", "date": "2026-09-28", "time": "09:00", "payer": "tom", "participants": ["tom", "john"], "split": "Equal", "emoji": "🅿️"}
  ],
  // Money already paid between travellers (kept so balances stay honest)
  settlements: [
    {"id": "s1", "from": "mary", "to": "jennie", "amt": 305, "date": "2026-09-27", "note": "PayID transfer", "status": "paid"},
    {"id": "s2", "from": "tom", "to": "jennie", "amt": 368, "date": "2026-09-27", "note": "PayID transfer", "status": "paid"},
    {"id": "s3", "from": "john", "to": "jennie", "amt": 121, "date": "2026-09-27", "note": "PayID transfer", "status": "paid"}
  ],
  inbox: [
    { id: 'in1', name: 'Apartment confirmation.pdf', kind: 'pdf', status: 'done', result: 'Linked to the Sydney East apartment booking', addedBy: 'jennie', when: '10 Jul' },
    { id: 'in2', name: 'Hertz voucher email', kind: 'email', status: 'done', result: 'Linked to the car hire booking', addedBy: 'john', when: '18 Jul' },
    { id: 'in3', name: 'Scenic World screenshot.png', kind: 'screenshot', status: 'done', result: 'Added Scenic World booking (SW-91K)', addedBy: 'tom', when: '5 Sep' },
    { id: 'in4', name: 'Fuel receipt', kind: 'receipt', status: 'done', result: 'Added A$85 Transport expense', addedBy: 'john', when: 'Yesterday' },
  ],
  notifications: [
    { id: 'n1', icon: '🗳', text: 'Mary voted for the harbour-view restaurant for Friday.', when: '8:12 AM', unread: true, go: ['decision', 'dec_fridinner'] },
    { id: 'n2', icon: '💰', text: 'Jennie added A$22 coffee expense.', when: '9:05 AM', unread: true, go: ['money', 'expenses'] },
    { id: 'n3', icon: '🐋', text: 'Whales are visible from the Bondi cliffs this week — look left on the walk.', when: '9:00 AM', unread: true, go: ['item', 'i4_1'] },
    { id: 'n4', icon: '🏡', text: 'Huskisson accommodation (29–30 Sep) still has no booking. School holidays started today.', when: 'Yesterday', unread: true, go: ['item', 'i5_8'] },
    { id: 'n5', icon: '💳', text: 'Accommodation budget is 65% used with the A$760 balance still to pay.', when: 'Yesterday', unread: false, go: ['money', 'overview'] },
    { id: 'n6', icon: '⚠️', text: 'Thursday has a tight 15-minute connection between Fitzroy Falls and lunch at Berrima.', when: 'Sat 26 Sep', unread: false, go: ['plan', 7] },
  ],
  activity: [
    { id: 'a1', who: 'mary', when: '2026-09-28T08:12', text: 'Voted ❤️ for the harbour-view restaurant in Friday family dinner.' },
    { id: 'a2', who: 'jennie', when: '2026-09-28T09:05', text: 'Added A$22 coffee expense (4 people).' },
    { id: 'a3', who: 'tom', when: '2026-09-28T09:00', text: 'Added A$12 Bondi parking expense (2 people).' },
    { id: 'a4', who: 'john', when: '2026-09-27T17:02', text: 'Added A$85 fuel expense from a receipt in Trip Inbox.' },
    { id: 'a5', who: 'mary', when: '2026-09-27T16:40', text: "Moved Cahill's Lookout from 16:00 to 16:30 for better light." },
    { id: 'a6', who: 'john', when: '2026-09-26T22:05', text: 'Started the Dinner with relatives decision.' },
    { id: 'a7', who: 'tom', when: '2026-09-26T14:22', text: 'Uploaded the Manly ferry receipt to Transport documents.' },
    { id: 'a8', who: 'jennie', when: '2026-09-20T19:00', text: 'Started the Friday family dinner decision with 3 options.' },
  ],
  memories: { photos: 214, kmWalked: 38 },
  receipts: [],
  notes: [],
};

// Receipt for the scan demo — today's lunch at the Bronte Beach kiosk (prices include GST)
const DEMO_RECEIPT = {
  merchant: 'Bronte Beach kiosk', placeId: 'bronte', date: '2026-09-28', time: '12:41',
  subtotal: 111.5, tax: 0, gstIncluded: 10.14, total: 111.5, currency: 'AUD', category: 'Food',
  confidence: { merchant: 0.96, date: 0.99, subtotal: 0.94, tax: 0.9, total: 0.98, currency: 0.99, category: 0.9 },
  items: [
    { name: 'Fish & chips ×2', amt: 52, who: ['john', 'tom'] },
    { name: 'Poke bowl', amt: 24, who: ['jennie'] },
    { name: 'Flat whites ×4', amt: 22, who: ['jennie', 'john', 'mary', 'tom'] },
    { name: 'Juices ×2', amt: 13.5, who: ['mary', 'jennie'] },
  ],
};

const DAY_DATES = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'];
const TODAY_DAY = 4;

/* ---------- Derived helpers (the "database" queries) ---------- */
const P = id => S.people.find(p => p.id === id);
const PL = id => S.places.find(p => p.id === id);
const IT = id => S.itinerary.find(i => i.id === id);
const BK = id => S.bookings.find(b => b.id === id);
const DEC = id => S.decisions.find(d => d.id === id);
const EXP = id => S.expenses.find(e => e.id === id);
const DAYINFO = n => S.days.find(d => d.n === n) || {};

function toHome(amt, cur) { cur = cur || S.reporting; return amt / RATES[cur]; }
function fmtBase(n) { const v = Math.round(n * 100) / 100; return SYM[BASE] + v.toLocaleString('en-AU', { minimumFractionDigits: Number.isInteger(v) || Math.abs(v) >= 1000 ? 0 : 2, maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2 }); }
function fmtHome(amt, opts) {
  const cur = (opts && opts.cur) || S.reporting;
  const v = toHome(amt, cur);
  if (cur === BASE) return fmtBase(v);
  const dec = (opts && opts.dec != null) ? opts.dec : (cur === 'HKD' || cur === 'JPY' || Math.abs(v) >= 1000 ? 0 : 2);
  return SYM[cur] + Math.abs(v).toLocaleString('en-AU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtHomeSigned(amt) { return (amt < 0 ? '−' : '') + fmtHome(amt); }
function homeToBase(v, cur) { return v * RATES[cur || S.reporting]; }
function rateLine(cur) { cur = cur || S.reporting; return cur === BASE ? 'Amounts in ' + BASE : '1 ' + BASE + ' = ' + (1 / RATES[cur]).toFixed(2) + ' ' + cur; }
function budgetBase() { return homeToBase(S.budget.total, S.budget.currency); }
function catBudgetBase(c) { return homeToBase(S.budget.categories[c] || 0, S.budget.currency); }

function shareOf(e, pid) {
  if (!e.participants.includes(pid)) return 0;
  if (e.shares && e.shares[pid] != null) return e.shares[pid];
  return e.amt / e.participants.length;
}
function spentBase() { return S.expenses.reduce((a, e) => a + e.amt, 0); }
function spentByCategory() {
  const out = {};
  Object.keys(S.budget.categories).forEach(c => out[c] = 0);
  S.expenses.forEach(e => { out[e.category] = (out[e.category] || 0) + e.amt; });
  return out;
}
// Committed but not yet paid: accommodation balance, future plans that need or have a booking but no expense, leading option of open food decisions
function committedBase() {
  let c = 0;
  S.bookings.forEach(b => { if (b.costAmt && b.paidAmt != null) c += b.costAmt - b.paidAmt; });
  S.itinerary.forEach(i => {
    if (i.day <= TODAY_DAY || !i.costAmt || ['cancelled', 'voting', 'idea', 'proposed'].includes(i.status)) return;
    if (i.booking === 'none') return;
    const paid = S.expenses.some(e => e.itemId === i.id || (i.bookingId && e.bookingId === i.bookingId));
    if (!paid) c += i.costAmt;
  });
  S.decisions.forEach(d => {
    if (d.status !== 'confirmed' && d.category === 'Food') { const lead = leadingOption(d); if (lead) c += lead.estPP * S.people.length; }
  });
  return c;
}
function forecastBase() { return spentBase() + committedBase(); }

function balances() {
  const net = {}; S.people.forEach(p => net[p.id] = 0);
  S.expenses.forEach(e => { net[e.payer] += e.amt; e.participants.forEach(p => net[p] -= shareOf(e, p)); });
  S.settlements.forEach(s => { net[s.from] += s.amt; net[s.to] -= s.amt; });
  return net;
}
// Minimum-payment settlement (greedy)
function settlementPlan() {
  const net = balances();
  const debtors = [], creditors = [];
  Object.entries(net).forEach(([id, v]) => { if (v < -0.5) debtors.push({ id, v: -v }); else if (v > 0.5) creditors.push({ id, v }); });
  debtors.sort((a, b) => b.v - a.v); creditors.sort((a, b) => b.v - a.v);
  const plan = []; let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].v, creditors[j].v);
    plan.push({ from: debtors[i].id, to: creditors[j].id, amt });
    debtors[i].v -= amt; creditors[j].v -= amt;
    if (debtors[i].v < 0.01) i++; if (creditors[j].v < 0.01) j++;
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
  if (n >= S.people.length - 1) return { label: 'Almost decided', tone: 'warn' };
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
function placePhoto(i) { if (!i) return null; if (i.photo) return i.photo; const p = i.placeId ? PL(i.placeId) : null; return p && p.photo ? p.photo : null; }

function healthChecks() {
  const out = [];
  const flight = S.bookings.find(b => b.type === 'flight');
  out.push(flight && flight.status === 'confirmed' ? { tone: 'good', text: 'Flights confirmed', go: ['booking', 'b_flight'] } : { tone: 'bad', text: 'Flights not confirmed', go: ['bookings'] });
  const car = BK('b_car');
  out.push(car && car.status === 'confirmed' ? { tone: 'good', text: 'Car hire confirmed · e-tag active', go: ['booking', 'b_car'] } : { tone: 'bad', text: 'Car hire not confirmed', go: ['bookings'] });
  const hotel = S.bookings.find(b => b.type === 'hotel');
  out.push(hotel && hotel.status === 'confirmed' ? { tone: 'good', text: 'Sydney apartment confirmed', go: ['booking', 'b_hotel'] } : { tone: 'bad', text: 'Sydney accommodation not confirmed', go: ['bookings'] });
  const major = S.itinerary.filter(i => i.category === 'activity' && i.costAmt && i.day > 2);
  if (major.filter(i => i.booking === 'needed').length === 0) out.push({ tone: 'good', text: 'Major activities booked', go: ['bookings'] });
  S.decisions.filter(d => d.status !== 'confirmed').forEach(d => {
    out.push({ tone: 'warn', text: d.title + ' needs a decision', sub: votersOf(d).size + ' of ' + S.people.length + ' voted · closes ' + new Date(d.deadline + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short' }), go: ['decision', d.id], resolve: 'decision', id: d.id });
  });
  S.itinerary.filter(i => i.booking === 'needed' && i.status !== 'cancelled').forEach(i => {
    const tone = i.category === 'stay' ? 'bad' : 'warn';
    out.push({ tone, text: i.title + (i.category === 'stay' ? ' — no booking' : ' not booked'), sub: dayLabel(i.day) + ' · ' + fmtTime(i.start), go: ['item', i.id], resolve: 'booking', id: i.id });
  });
  const over = forecastBase() - budgetBase();
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
function logActivity(text, who) { S.activity.unshift({ id: uid('a'), who: who || S.me, when: DAY_DATES[TODAY_DAY - 1] + 'T' + String(NOW.getHours()).padStart(2, '0') + ':' + String(NOW.getMinutes()).padStart(2, '0'), text }); }
function notify(icon, text, go) { S.notifications.unshift({ id: uid('n'), icon, text, when: 'Just now', unread: true, go }); }
