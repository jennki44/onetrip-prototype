/* Hand-written row types matching supabase/migrations/0001_init.sql.
   Regenerate with `npx supabase gen types typescript --local > src/lib/supabase/generated.ts` once the DB runs. */

export type MemberRole = "owner" | "admin" | "traveller" | "viewer";
export type ItemStatus = "idea" | "proposed" | "voting" | "confirmed" | "cancelled" | "completed";
export type BookingState = "none" | "needed" | "booked";
export type DecisionStatus = "open" | "almost" | "confirmed";
export type Reaction = "love" | "good" | "maybe" | "no";
export type SplitKind = "equal" | "amounts" | "percent" | "shares" | "itemised";
export type PlaceType = "hotel" | "restaurant" | "activity" | "transport" | "shopping" | "saved";

export interface Profile { id: string; name: string; initials: string; color: string; locale: string; reporting_currency: string | null; created_at: string }
export interface Trip { id: string; name: string; destination: string; emoji: string; start_date: string; end_date: string; base_currency: string; home_currency: string; budget_minor: number | null; budget_categories: Record<string, number>; styles: string[]; invite_code: string; cover_url: string | null; status: string; created_by: string; created_at: string }
export interface TripMember { trip_id: string; user_id: string; role: MemberRole; joined_at: string }
export interface TripDay { trip_id: string; day: number; theme: string | null; stay: string | null; drive: string | null; banner_url: string | null; caption: string | null; rule: string | null; theme_zh?: string | null; stay_zh?: string | null; drive_zh?: string | null; rule_zh?: string | null; caption_zh?: string | null }
export interface Place { id: string; trip_id: string; name: string; type: PlaceType; area: string | null; address: string | null; lat: number | null; lng: number | null; map_x: number | null; map_y: number | null; rating: number | null; price_level: string | null; est_pp_minor: number | null; hours: string | null; emoji: string; photo_url: string | null; from_hotel_min: number | null; saved: boolean; created_by: string | null; created_at: string; name_zh?: string | null }
export interface Document { id: string; trip_id: string; name: string; category: string; storage_path: string | null; size_bytes: number | null; linked_type: string | null; linked_id: string | null; added_by: string | null; created_at: string }
export interface Booking { id: string; trip_id: string; type: string; title: string; reference: string | null; provider: string | null; date: string | null; status: string; cost_minor: number | null; paid_minor: number | null; cost_home_minor: number | null; details: Record<string, string>; document_id: string | null; note: string | null; created_by: string | null; created_at: string }
export interface Decision { id: string; trip_id: string; title: string; question: string | null; status: DecisionStatus; deadline: string | null; day: number | null; slot: string | null; category: string; confirmed_option_id: string | null; created_by: string | null; created_at: string; title_zh?: string | null; question_zh?: string | null }
export interface DecisionOption { id: string; decision_id: string; trip_id: string; place_id: string | null; label: string | null; sub: string | null; est_pp_minor: number; sort: number; label_zh?: string | null; sub_zh?: string | null }
export interface Vote { option_id: string; decision_id: string; trip_id: string; user_id: string; reaction: Reaction; created_at: string }
export interface ItineraryItem { id: string; trip_id: string; day: number; start_time: string; end_time: string | null; title: string; place_id: string | null; emoji: string; category: string; status: ItemStatus; booking: BookingState; booking_id: string | null; decision_id: string | null; cost_minor: number | null; travel_min: number | null; address: string | null; note: string | null; flag: string | null; photo_url: string | null; participant_ids: string[]; created_by: string | null; created_at: string; updated_at: string; title_zh?: string | null; note_zh?: string | null; flag_zh?: string | null }
export interface Receipt { id: string; trip_id: string; merchant: string | null; date: string | null; subtotal_minor: number | null; tax_minor: number; gst_included_minor: number | null; total_minor: number | null; currency: string; image_path: string | null; created_by: string | null; created_at: string }
export interface ReceiptItem { id: string; receipt_id: string; trip_id: string; name: string; amount_minor: number; user_ids: string[]; sort: number }
export interface Expense { id: string; trip_id: string; merchant: string; place_id: string | null; item_id: string | null; booking_id: string | null; receipt_id: string | null; document_id: string | null; category: string; amount_minor: number; currency: string; base_minor: number; rate: number; date: string; time: string | null; payer_id: string; split: SplitKind; note: string | null; emoji: string | null; created_by: string | null; created_at: string }
export interface ExpenseShare { expense_id: string; trip_id: string; user_id: string; share_minor: number }
export interface Settlement { id: string; trip_id: string; from_user: string; to_user: string; amount_minor: number; date: string; note: string | null; status: string; created_by: string | null; created_at: string }
export interface ActivityLog { id: string; trip_id: string; user_id: string | null; text: string; created_at: string }
export interface Notification { id: string; trip_id: string; icon: string | null; text: string; link: Record<string, unknown> | null; read_by: string[]; created_at: string }
export interface Note { id: string; trip_id: string; user_id: string | null; item_id: string | null; text: string; created_at: string }

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>; trips: Table<Trip>; trip_members: Table<TripMember>; trip_days: Table<TripDay>; places: Table<Place>; documents: Table<Document>;
      bookings: Table<Booking>; decisions: Table<Decision>; decision_options: Table<DecisionOption>; votes: Table<Vote>; itinerary_items: Table<ItineraryItem>;
      receipts: Table<Receipt>; receipt_items: Table<ReceiptItem>; expenses: Table<Expense>; expense_shares: Table<ExpenseShare>; settlements: Table<Settlement>;
      activity_log: Table<ActivityLog>; notifications: Table<Notification>; notes: Table<Note>;
    };
    Views: Record<string, never>;
    Functions: {
      create_trip: { Args: { p_name: string; p_destination: string; p_emoji: string; p_start: string; p_end: string; p_base: string; p_home: string; p_budget_minor: number | null; p_styles: string[] }; Returns: string };
      join_trip: { Args: { p_code: string }; Returns: string };
      preview_trip: { Args: { p_code: string }; Returns: { id: string; name: string; destination: string; emoji: string; start_date: string; end_date: string; members: number; plans: number }[] };
      is_trip_member: { Args: { t: string }; Returns: boolean };
      trip_role: { Args: { t: string }; Returns: MemberRole };
    };
    Enums: { member_role: MemberRole; item_status: ItemStatus; booking_state: BookingState; decision_status: DecisionStatus; reaction: Reaction; split_type: SplitKind; place_type: PlaceType };
    CompositeTypes: Record<string, never>;
  };
}
