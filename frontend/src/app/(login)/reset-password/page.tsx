"use client";

import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("A művelet sikertelen.");
      return;
    }

    if (password.trim().length < 8) {
      setError("A jelszónak legalább 8 karakter hosszúnak kell lennie.");
      return;
    }

    if (password !== confirmPassword) {
      setError("A két jelszó nem egyezik.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/password-reset/confirm`,
        {
          token,
          password,
        },
      );

      setSuccess(data?.message || "Jelszó sikeresen visszaállítva.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("A művelet sikertelen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Jelszó visszaállítás
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Adj meg egy új jelszót a fiókodhoz.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700"
            >
              Új jelszó
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
              placeholder="Legalább 8 karakter"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="block text-sm font-medium text-gray-700"
            >
              Új jelszó újra
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
              placeholder="Ismételd meg az új jelszót"
            />
          </div>

          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-3 rounded text-sm">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 text-sm rounded-md text-white bg-accent hover:bg-accent/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Mentés..." : "Új jelszó mentése"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-accent hover:text-accent/80">
            Vissza a bejelentkezéshez
          </Link>
        </p>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;
