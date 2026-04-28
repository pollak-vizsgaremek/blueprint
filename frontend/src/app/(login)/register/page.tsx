"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/DatePicker";
import Link from "next/link";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (password !== confirmPassword) {
      setError("A jelszavak nem egyeznek");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie");
      setLoading(false);
      return;
    }

    // Validate date of birth
    if (!dateOfBirth) {
      setError("Kérjük, válasszon születési dátumot");
      setLoading(false);
      return;
    }

    try {
      // Convert to YYYY-MM-DD format in local timezone to avoid UTC conversion issues
      const year = dateOfBirth.getFullYear();
      const month = String(dateOfBirth.getMonth() + 1).padStart(2, "0");
      const day = String(dateOfBirth.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // Use the register function from auth context
      await register(name, email, password, dateString);

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "A regisztráció sikertelen",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Regisztráció
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vagy{" "}
            <Link
              href="/login"
              className="font-medium text-accent hover:text-accent/80"
            >
              bejelentkezés meglévő fiókkal
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
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Név *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                placeholder="Írja be a nevét"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email cím *
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
                Jelszó *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                placeholder="Legalább 6 karakter"
                minLength={6}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Jelszó megerősítése *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                placeholder="Írja be újra a jelszót"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Születési dátum *
              </label>
              <DatePicker
                selected={dateOfBirth}
                onSelect={setDateOfBirth}
                placeholder="Válasszon születési dátumot"
                disabled={(date) => {
                  // Disable future dates and dates more than 120 years ago
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const minDate = new Date();
                  minDate.setFullYear(today.getFullYear() - 120);
                  return date > today || date < minDate;
                }}
                fromYear={new Date().getFullYear() - 120}
                toYear={new Date().getFullYear()}
                required
                className="border-gray-300 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 text-sm rounded-md text-white bg-accent hover:bg-accent/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Regisztráció..." : "Regisztráció"}
            </button>
          </div>

          <div className="text-xs text-gray-600 text-center">
            A regisztráció gombra kattintva elfogadja az
            <Link
              href="/terms"
              className="font-medium text-accent hover:text-accent/80"
            >
              {" "}
              általános szerződési feltételeket
            </Link>{" "}
            és{" "}
            <Link
              href="/privacy"
              className="font-medium text-accent hover:text-accent/80"
            >
              adatvédelmi szabályzatot
            </Link>
            .
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
