"use client";

import { useUsers } from "@/components/users-provider";
import { kindLabel } from "@/lib/permissions";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

export function ProfileForm() {
  const { currentUser, updateUser } = useUsers();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone ?? "");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(currentUser.firstName);
    setLastName(currentUser.lastName);
    setEmail(currentUser.email);
    setPhone(currentUser.phone ?? "");
    setPhotoPreview(null);
    setMessage(null);
  }, [currentUser.id, currentUser.firstName, currentUser.lastName, currentUser.email, currentUser.phone]);

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
    updateUser(currentUser.id, { firstName, lastName, email, phone, initials });
    setMessage("Profiel opgeslagen op dit toestel. Koppeling met login volgt later.");
  }

  function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Wachtwoord wijzigen wordt gekoppeld zodra login actief is.");
  }

  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={onSaveProfile}
        className="rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-zinc-900">Profiel</h2>
        <p className="mt-1 text-sm text-zinc-500">Naam, contactgegevens en foto.</p>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-lg font-semibold text-white">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              initials || "?"
            )}
          </div>
          <div>
            <label className="inline-flex cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
              Foto kiezen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPhotoChange}
              />
            </label>
            <p className="mt-2 text-xs text-zinc-500">JPG of PNG, bij voorkeur vierkant.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Voornaam</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Naam</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Telefoon</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
          <div className="block text-sm">
            <span className="font-medium text-zinc-700">Rol</span>
            <p className="mt-1 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-zinc-600">
              {kindLabel[currentUser.kind]}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Profiel opslaan
          </button>
        </div>
      </form>

      <form
        onSubmit={onChangePassword}
        className="rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-zinc-900">Wachtwoord</h2>
        <p className="mt-1 text-sm text-zinc-500">Wijzig het wachtwoord van dit account.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700">Huidig wachtwoord</span>
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Nieuw wachtwoord</span>
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Bevestig nieuw wachtwoord</span>
            <input
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Wachtwoord wijzigen
          </button>
        </div>
      </form>
    </div>
  );
}
