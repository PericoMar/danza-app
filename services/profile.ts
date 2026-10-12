// services/profile.ts
import { supabase } from "@/services/supabase";
import { TABLES } from "@/constants/tables";

/**
 * The slice of a `users` row the /profile screen edits. Every field is a plain
 * string so form inputs can bind to it directly; empty optional fields are
 * stored as NULL and come back as "".
 */
export type ProfileFields = {
  name: string;
  last_name: string;
  bio: string;
  instagram_url: string;
  linkedin_url: string;
};

export const PROFILE_FIELD_KEYS = [
  "name",
  "last_name",
  "bio",
  "instagram_url",
  "linkedin_url",
] as const satisfies readonly (keyof ProfileFields)[];

export const EMPTY_PROFILE: ProfileFields = {
  name: "",
  last_name: "",
  bio: "",
  instagram_url: "",
  linkedin_url: "",
};

const PROFILE_COLUMNS = PROFILE_FIELD_KEYS.join(", ");

export function isSameProfile(a: ProfileFields, b: ProfileFields): boolean {
  return PROFILE_FIELD_KEYS.every((key) => a[key] === b[key]);
}

type ProfileRow = { [K in keyof ProfileFields]: string | null };

function toProfileFields(row: Partial<ProfileRow> | null): ProfileFields {
  return {
    name: row?.name ?? "",
    last_name: row?.last_name ?? "",
    bio: row?.bio ?? "",
    instagram_url: row?.instagram_url ?? "",
    linkedin_url: row?.linkedin_url ?? "",
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function fetchProfile(userId: string): Promise<ProfileFields> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return toProfileFields(data as Partial<ProfileRow> | null);
}

/**
 * Upserts only the profile columns, so role / avatar / legacy fields on the row
 * are left as they are. Returns what the database stored (trimmed, NULLs back
 * to ""), which is what callers should cache.
 */
export async function saveProfile(
  userId: string,
  fields: ProfileFields
): Promise<ProfileFields> {
  const { data, error } = await supabase
    .from(TABLES.USERS)
    .upsert(
      {
        user_id: userId,
        name: fields.name.trim(),
        last_name: emptyToNull(fields.last_name),
        bio: emptyToNull(fields.bio),
        instagram_url: emptyToNull(fields.instagram_url),
        linkedin_url: emptyToNull(fields.linkedin_url),
      },
      { onConflict: "user_id" }
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return toProfileFields(data as Partial<ProfileRow>);
}
