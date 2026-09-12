/* Fixed ids for the seeded demo trip (see supabase/seed.sql). */
export const DEMO_TRIP_ID = "e7e3d9aa-c06b-5205-a23a-8a9b382ecbf7";
export const DEMO_USERS = {
  "jennie": {
    "id": "2ebd5e74-6f79-5ea1-b8a0-3f28051311ca",
    "email": "jennie@onetrip.demo"
  },
  "john": {
    "id": "05e4171b-299e-5ad3-8bfd-ef9b0edd42cc",
    "email": "john@onetrip.demo"
  },
  "mary": {
    "id": "14a701e0-996b-5f0b-8cde-d1914aec7a67",
    "email": "mary@onetrip.demo"
  },
  "tom": {
    "id": "7e49bd3b-9097-5d1d-805e-25326190b666",
    "email": "tom@onetrip.demo"
  }
} as const;
export const DEMO_PASSWORD = 'onetrip-demo';
