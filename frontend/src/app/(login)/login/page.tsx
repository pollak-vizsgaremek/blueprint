"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the login function from auth context
      await login(email, password);

      router.push("/app");
    } catch (err: unknown) {
      const authError = err as Error & { code?: string };
      if (authError.code === "email_not_verified") {
        setShowResendVerification(true);
      } else {
        setShowResendVerification(false);
      }

      setError(
        authError instanceof Error
          ? authError.message
          : "A bejelentkezés sikertelen"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = email.trim();

    if (!targetEmail) {
      setResendError("A kérés sikertelen.");
      setResendMessage("");
      return;
    }

    setIsResendLoading(true);
    setResendError("");
    setResendMessage("");

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/email-confirmation/request`,
        {
          email: targetEmail,
        },
        {
          withCredentials: true,
        },
      );

      setResendMessage(
        data?.message ||
          "Ha létezik a fiók, elküldtük a megerősítő emailt.",
      );
    } catch (err) {
      setResendError("A kérés sikertelen.");
    } finally {
      setIsResendLoading(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    const targetEmail = (resetEmail || email).trim();

    if (!targetEmail) {
      setResetError("A kérés sikertelen.");
      setResetMessage("");
      return;
    }

    setIsResetLoading(true);
    setResetError("");
    setResetMessage("");

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

      setResetMessage(
        data?.message ||
          "Ha létezik a fiók, elküldtük a jelszó-visszaállító emailt.",
      );
    } catch (err) {
      setResetError("A kérés sikertelen.");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Bejelentkezés
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vagy{" "}
            <Link
              href="/register"
              className="font-medium text-accent hover:text-accent/80"
            >
              új fiók létrehozása
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email cím
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                placeholder="Írja be az email címét"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Jelszó
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                placeholder="Írja be a jelszavát"
              />
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetOpen((prev) => !prev);
                    setResetEmail(email);
                    setResetError("");
                    setResetMessage("");
                  }}
                  className="text-sm text-accent hover:text-accent/80 cursor-pointer"
                >
                  Elfelejtett jelszó?
                </button>
              </div>
            </div>
          </div>

          {isResetOpen ? (
            <div className="rounded-md border border-faded/30 bg-secondary/30 p-4 space-y-3">
              <p className="text-sm text-gray-700">
                Add meg az email címed, és küldünk jelszó-visszaállító linket.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                  placeholder="email@pelda.hu"
                  required
                />

                {resetError ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                    {resetError}
                  </div>
                ) : null}

                {resetMessage ? (
                  <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-2 rounded text-sm">
                    {resetMessage}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handlePasswordResetRequest}
                  disabled={isResetLoading}
                  className="w-full py-2 px-4 text-sm rounded-md text-white bg-accent hover:bg-accent/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetLoading
                    ? "Küldés..."
                    : "Jelszó-visszaállító link küldése"}
                </button>
              </div>
            </div>
          ) : null}

          {showResendVerification ? (
            <div className="rounded-md border border-faded/30 bg-secondary/30 p-4 space-y-3">
              <p className="text-sm text-gray-700">
                Még nem erősítetted meg az email címed.
              </p>

              {resendError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {resendError}
                </div>
              ) : null}

              {resendMessage ? (
                <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-2 rounded text-sm">
                  {resendMessage}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResendLoading}
                className="w-full py-2 px-4 text-sm rounded-md text-white bg-accent hover:bg-accent/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResendLoading
                  ? "Küldés..."
                  : "Megerősítő email újraküldése"}
              </button>
            </div>
          ) : null}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 text-sm rounded-md text-white bg-accent hover:bg-accent/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Bejelentkezés..." : "Bejelentkezés"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
