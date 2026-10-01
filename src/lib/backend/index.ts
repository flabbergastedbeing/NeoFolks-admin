// The app's single backend. Import `backend` from here, never from ./supabase.
export { supabaseBackend as backend } from "@/lib/backend/supabase";
export * from "./types";
