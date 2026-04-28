"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordResetRequest = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const targetEmail = email.trim();

    if (!targetEmail) {
      setError("A kérés sikertelen.");
      setMessage("");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/password-reset/request`,
        {
          email: targetEmail,
        },
        {
          withCredentials: true,
        },
      );

      setMessage(
        data?.message ||
          "Ha létezik a fiók, elküldtük a jelszó-visszaállító emailt.",
      );
    } catch {
      setError("A kérés sikertelen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-secondary/60 border-faded/20 border-[1px] p-10 rounded-xl space-y-6">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Elfelejtett jelszó
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Add meg az email címed, és küldünk jelszó-visszaállító linket.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handlePasswordResetRequest}>
          <div>
            <label
              htmlFor="forgot-password-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email cím
            </label>
            <input
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
              placeholder="email@pelda.hu"
            />
          </div>

          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-2 rounded text-sm">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 text-sm rounded-md text-white bg-accent hover:bg-accent/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Küldés..." : "Jelszó-visszaállító link küldése"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link
            href="/login"
            className="font-medium text-accent hover:text-accent/80"
          >
            Vissza a bejelentkezéshez
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
