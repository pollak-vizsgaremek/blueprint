"use client";

import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const ConfirmEmailContent = () => {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const confirm = async () => {
      setError("");
      setSuccess("");

      if (!token) {
        setError("A művelet sikertelen.");
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/users/email-confirmation/confirm`,
          { token },
          { withCredentials: true },
        );
        setSuccess(data?.message || "Email sikeresen megerősítve.");
      } catch (err) {
        setError("A művelet sikertelen.");
      } finally {
        setIsLoading(false);
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Email megerősítése
          </h1>
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-gray-600">Ellenőrzés...</div>
        ) : null}

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

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-accent hover:text-accent/80">
            Tovább a bejelentkezéshez
          </Link>
        </p>
      </div>
    </div>
  );
};

const ConfirmEmailPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ConfirmEmailContent />
    </Suspense>
  );
};

export default ConfirmEmailPage;
