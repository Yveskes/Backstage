"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/session";
import { getSiteUrl, isAdminEmail } from "@/lib/env";
import {
  createInviteToken,
  hashInviteToken,
  inviteExpiryDates,
  isStrongPassword,
  parseInviteKind,
  verifyInviteToken,
} from "@/lib/invite-token";
import { joinName } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AuthState = {
  error?: string;
  success?: string;
  inviteUrl?: string;
  emailSent?: boolean;
};

function genericLoginError(): AuthState {
  return { error: "E-mail of wachtwoord is onjuist." };
}

export async function login(_prev: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return genericLoginError();
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return genericLoginError();
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (email) {
    const supabase = await createSessionClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/wachtwoord-reset`,
    });
  }

  return {
    success: "Als dit e-mailadres bekend is, sturen we een herstellink.",
  };
}

export async function updatePassword(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    return { error: "Wachtwoorden komen niet overeen." };
  }

  if (!isStrongPassword(password)) {
    return {
      error: "Wachtwoord moet minstens 10 tekens, een letter en een cijfer bevatten.",
    };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Wachtwoord bijwerken is mislukt. Vraag een nieuwe link aan." };
  }

  redirect("/");
}

export async function createInvite(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const kind = parseInviteKind(formData.get("kind"));

  if (!firstName || !lastName || !email) {
    return { error: "Vul voornaam, naam en e-mail in." };
  }

  const fullName = joinName(firstName, lastName);

  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  if (!user) {
    return { error: "Je moet ingelogd zijn om uit te nodigen." };
  }

  if (kind === "team" && !isAdminEmail(user.email ?? "")) {
    return { error: "Alleen admin kan iemand als team uitnodigen." };
  }

  const token = createInviteToken(email, firstName, lastName, kind);
  const inviteUrl = `${getSiteUrl()}/uitnodiging?token=${encodeURIComponent(token)}`;
  const dates = inviteExpiryDates();
  const admin = createAdminClient();
  const userMetadata = {
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    user_kind: kind,
  };

  if (admin) {
    await admin.from("invites").insert({
      email,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      user_kind: kind,
      token_hash: hashInviteToken(token),
      invited_by: user.id,
      expires_at: dates.expiresAt,
      purge_at: dates.purgeAt,
      status: "pending",
    });

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: userMetadata,
      redirectTo: `${getSiteUrl()}/auth/callback?next=/wachtwoord-instellen`,
    });

    if (error && !error.message.toLowerCase().includes("already")) {
      return {
        success: "Uitnodiging is klaargezet. De e-mail kon niet verstuurd worden; deel de link.",
        inviteUrl,
        emailSent: false,
      };
    }

    return {
      success: "Uitnodiging verstuurd. De link is 7 dagen geldig.",
      inviteUrl,
      emailSent: true,
    };
  }

  return {
    success:
      "Uitnodigingslink aangemaakt (7 dagen geldig). Zet SUPABASE_SERVICE_ROLE_KEY om automatisch e-mail te sturen.",
    inviteUrl,
    emailSent: false,
  };
}

export async function acceptInvite(
  _prev: AuthState | null,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const verified = verifyInviteToken(token);
  if (!verified.ok) {
    return {
      error:
        verified.reason === "expired"
          ? "Deze uitnodiging is verlopen. Vraag een nieuwe aan."
          : "Deze uitnodigingslink is ongeldig.",
    };
  }

  if (password !== confirm) {
    return { error: "Wachtwoorden komen niet overeen." };
  }

  if (!isStrongPassword(password)) {
    return {
      error: "Wachtwoord moet minstens 10 tekens, een letter en een cijfer bevatten.",
    };
  }

  const admin = createAdminClient();
  const { email, firstName, lastName, kind } = verified.payload;
  const fullName = joinName(firstName, lastName);
  const userKind = isAdminEmail(email) ? "admin" : kind;
  const userMetadata = {
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    user_kind: userKind === "admin" ? "staff" : userKind,
  };

  if (admin) {
    const existingId = await findUserIdByEmail(admin, email);

    if (existingId) {
      const { error } = await admin.auth.admin.updateUserById(existingId, {
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (error) {
        return { error: "Account bijwerken is mislukt. Probeer later opnieuw." };
      }
      await admin
        .from("profiles")
        .update({
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          user_kind: userKind,
        })
        .eq("id", existingId);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (error || !data.user) {
        return { error: "Account aanmaken is mislukt. Probeer later opnieuw." };
      }
      await admin
        .from("profiles")
        .update({
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          user_kind: userKind,
        })
        .eq("id", data.user.id);
    }

    await admin
      .from("invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("token_hash", hashInviteToken(token));
  } else {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      return {
        error:
          "Account aanmaken is mislukt. Zet SUPABASE_SERVICE_ROLE_KEY of laat publieke signup tijdelijk toe in Supabase.",
      };
    }

    return {
      success: "Bevestig je e-mail via de mail van Supabase. Daarna kun je inloggen.",
    };
  }

  const supabase = await createSessionClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      success: "Account is klaar. Log in met je e-mail en wachtwoord.",
    };
  }

  revalidatePath("/");
  redirect("/");
}

async function findUserIdByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
) {
  const { data } = await admin.auth.admin.listUsers();
  return data?.users.find((user) => user.email?.toLowerCase() === email)?.id ?? "";
}

export async function getSessionUser() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
