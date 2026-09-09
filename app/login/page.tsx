"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase";
import FluenSoulLogo from "../components/FluenSoulLogo";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    // ---------------------------------------------------------
    // SIGN IN
    // ---------------------------------------------------------

    const {
      data,
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // ---------------------------------------------------------
    // CHECK USER
    // ---------------------------------------------------------

    const user = data.user;

    if (!user) {
      setError(
        "Login succeeded, but no user session was found."
      );
      setLoading(false);
      return;
    }

    // ---------------------------------------------------------
    // CHECK USER ROLE
    // ---------------------------------------------------------

    const {
      data: roleData,
      error: roleError,
    } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError) {
      console.error(
        "Role lookup failed:",
        roleError
      );

      await supabase.auth.signOut();

      setError(
        `Role lookup failed: ${roleError.message}`
      );

      setLoading(false);
      return;
    }

    // ---------------------------------------------------------
    // NO ROLE
    // ---------------------------------------------------------

    if (!roleData?.role) {
      await supabase.auth.signOut();

      setError(
        "Your account does not have a valid FluenSoul role."
      );

      setLoading(false);
      return;
    }

    // ---------------------------------------------------------
    // ROLE-BASED REDIRECT
    // ---------------------------------------------------------

    if (roleData.role === "admin") {
      window.location.href = "/admin";
      return;
    }

    if (roleData.role === "creator") {
      window.location.href = "/creator";
      return;
    }

    // ---------------------------------------------------------
    // UNKNOWN ROLE
    // ---------------------------------------------------------

    await supabase.auth.signOut();

    setError(
      "Your account role is not supported."
    );

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f5f7] p-6">
      <div className="w-full max-w-md">

        {/* HEADER */}

        <div className="mb-8 text-center">

          <div className="mb-6 flex justify-center">
            <FluenSoulLogo
              width={260}
              className="max-w-[260px]"
            />
          </div>

          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-gray-500">
            Sign in to your FluenSoul account.
          </p>

        </div>

        {/* LOGIN CARD */}

        <form
          onSubmit={handleLogin}
          className="rounded-3xl bg-white p-8 shadow-sm"
        >

          {/* EMAIL */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:bg-gray-50"
            />
          </div>

          {/* PASSWORD */}

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:bg-gray-50"
            />
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

      </div>
    </main>
  );
}
