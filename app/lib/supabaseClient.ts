import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^['\"]|['\"]$/g, "") ||
  "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(
    /^['\"]|['\"]$/g,
    "",
  ) || "";

function getAnonKeyPreview(value: string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 12);
}

if (process.env.NODE_ENV === "development") {
  console.log("Supabase final URL:", supabaseUrl || "<missing>");
  console.log("Supabase URL loaded:", Boolean(supabaseUrl));
  console.log("Supabase anon key exists:", Boolean(supabaseAnonKey));
  console.log("Supabase anon key preview:", getAnonKeyPreview(supabaseAnonKey));
}

let supabaseConfigError = "";

if (!supabaseUrl) {
  supabaseConfigError = "Missing env.NEXT_PUBLIC_SUPABASE_URL";
} else if (!supabaseAnonKey) {
  supabaseConfigError = "Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY";
} else {
  try {
    const parsed = new URL(supabaseUrl);
    if (!/^https?:$/.test(parsed.protocol)) {
      supabaseConfigError = "Invalid NEXT_PUBLIC_SUPABASE_URL protocol.";
    }
  } catch {
    supabaseConfigError =
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Expected a full URL.";
  }
}

export { supabaseConfigError };

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);
