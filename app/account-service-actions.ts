"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabase/server";
import { field, type FormState } from "@/lib/community/validation";
import { isUuid } from "@/lib/portal/validation";
import { adminRole } from "@/lib/portal/server";

export async function activateCoupon(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const id = field(form, "coupon_id");
  if (!isUuid(id))
    return { ok: false, message: "Bitte lade die Gutscheine erneut." };
  try {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.rpc("portal_activate_coupon", {
      coupon_id: id,
    });
    if (error)
      return {
        ok: false,
        message:
          "Der Gutschein konnte nicht aktiviert werden. Bitte melde dich gegebenenfalls erneut an.",
      };
    revalidatePath("/konto/rabattcodes");
    return {
      ok: true,
      message:
        "Aktiviert. Dein Code ist für den späteren Onlineshop gespeichert.",
    };
  } catch {
    return {
      ok: false,
      message:
        "Die Aktivierung ist gerade nicht möglich. Bitte versuche es erneut.",
    };
  }
}

export async function deleteCustomerAccount(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (
    field(form, "confirmation") !== "LÖSCHEN" ||
    field(form, "understood") !== "yes"
  )
    return {
      ok: false,
      message: "Bitte bestätige die Folgen und gib LÖSCHEN ein.",
    };
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Bitte melde dich erneut an." };
  try {
    // Never accept a target account ID from the browser. Admins cannot delete
    // their operational access through the customer self-service form.
    if (await adminRole(user.id))
      return {
        ok: false,
        message: "Administrationskonten können hier nicht gelöscht werden.",
      };
    const { error } = await createSupabaseAdmin().auth.admin.deleteUser(
      user.id,
    );
    if (error)
      return {
        ok: false,
        message:
          "Dein Konto wurde nicht gelöscht. Bitte versuche es erneut oder kontaktiere uns.",
      };
  } catch {
    return {
      ok: false,
      message:
        "Die Löschung konnte nicht abgeschlossen werden. Bitte kontaktiere uns.",
    };
  }
  // Auth deletion cascades profile, consent, points and coupons; retained order
  // records lose their account association through ON DELETE SET NULL.
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* Clear cookies below as well. */
  }
  const cookieStore = await cookies();
  const project = new URL(process.env.SUPABASE_URL!).hostname.split(".")[0];
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith(`sb-${project}-auth-token`))
      cookieStore.delete(cookie.name);
  }
  revalidatePath("/konto", "layout");
  redirect("/konto?deleted=1");
}
