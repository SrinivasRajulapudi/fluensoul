import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/server";
import LogoutButton from "../components/LogoutButton";
import FluenSoulLogo from "../components/FluenSoulLogo";

export default async function CreatorDashboard() {
  const supabase = await createClient();

  // ---------------------------------------------------------
  // AUTHENTICATION
  // ---------------------------------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ---------------------------------------------------------
  // CHECK USER ROLE
  // ---------------------------------------------------------

  const { data: roleRecord } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!roleRecord) {
    redirect("/login?error=no_role");
  }

  if (roleRecord.role === "admin") {
    redirect("/");
  }

  if (roleRecord.role !== "creator") {
    redirect("/login?error=invalid_role");
  }

  // ---------------------------------------------------------
  // LOAD CREATOR PROFILE
  // ---------------------------------------------------------

  const { data: influencer, error } = await supabase
    .from("influencers")
    .select(`
      id,
      username,
      name,
      tagline,
      bio,
      hero_image_url,
      followers,
      total_likes,
      collaboration_count,
      plan,
      template,
      is_active
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Creator profile loading failed:",
      error
    );
  }

  // ---------------------------------------------------------
  // NO PROFILE YET
  // ---------------------------------------------------------

  if (!influencer) {
    return (
      <main className="min-h-screen bg-[#f4f5f7] p-6 sm:p-8">
        <div className="mx-auto max-w-5xl">

          <header className="mb-10">
            <div className="mb-8">
              <FluenSoulLogo
                width={220}
                className="max-w-[220px]"
              />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-500">
              Creator Platform
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
              Creator Dashboard
            </h1>

            <p className="mt-3 text-gray-500">
              Welcome to FluenSoul. Let's create your profile.
            </p>
          </header>

          <section className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
            <div className="max-w-2xl">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
                Get Started
              </p>

              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                Create your creator profile
              </h2>

              <p className="mt-3 leading-7 text-gray-500">
                Your public FluenSoul profile will contain your
                bio, social links, portfolio and collaboration
                information.
              </p>

              <Link
                href="/creator/profile"
                className="mt-7 inline-flex rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
              >
                Create Profile
              </Link>

            </div>
          </section>

        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // LOAD PORTFOLIO COUNT
  // ---------------------------------------------------------

  const { count: portfolioCount } = await supabase
    .from("influencer_portfolio")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("influencer_id", influencer.id)
    .eq("is_active", true);

  // ---------------------------------------------------------
  // LOAD SOCIAL LINK COUNT
  // ---------------------------------------------------------

  const { count: socialCount } = await supabase
    .from("influencer_social_links")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("influencer_id", influencer.id);

  // ---------------------------------------------------------
  // LOAD TOTAL COLLABORATION REQUEST COUNT
  // ---------------------------------------------------------

  const { count: collaborationCount } = await supabase
    .from("collaboration_requests")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("influencer_id", influencer.id);

  // ---------------------------------------------------------
  // LOAD NEW COLLABORATION REQUEST COUNT
  // ---------------------------------------------------------

  const { count: newCollaborationCount } = await supabase
    .from("collaboration_requests")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("influencer_id", influencer.id)
    .eq("status", "new");

  const publicProfileUrl = `/profile/${encodeURIComponent(
    influencer.username
  )}`;

  // ---------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f4f5f7] p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-10">
          <div className="flex flex-col gap-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <FluenSoulLogo
                  width={220}
                  className="max-w-[220px]"
                />

                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-pink-500">
                  Creator Platform
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Creator Dashboard
                </h1>

                <p className="mt-3 text-gray-500">
                  Welcome back, {influencer.name}.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={publicProfileUrl}
                  target="_blank"
                  className="w-fit rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
                >
                  View Public Profile ↗
                </Link>

                <LogoutButton />
              </div>

            </div>

          </div>
        </header>

        {/* =====================================================
            PROFILE OVERVIEW
        ====================================================== */}

        <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">

              {influencer.hero_image_url ? (
                <img
                  src={influencer.hero_image_url}
                  alt={influencer.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-400">
                  {influencer.name.charAt(0)}
                </span>
              )}

            </div>

            <div className="flex-1">

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-2xl font-bold text-gray-900">
                  {influencer.name}
                </h2>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {influencer.plan}
                </span>

              </div>

              <p className="mt-1 text-gray-500">
                @{influencer.username}
              </p>

              {influencer.tagline && (
                <p className="mt-3 text-gray-700">
                  {influencer.tagline}
                </p>
              )}

            </div>

            <Link
              href="/creator/profile"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Edit Profile
            </Link>

          </div>

        </section>

        {/* =====================================================
            STATS
        ====================================================== */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* PORTFOLIO */}

          <Link
            href="/creator/portfolio"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              Portfolio
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {portfolioCount ?? 0}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Published works
            </p>
          </Link>

          {/* SOCIAL */}

          <Link
            href="/creator/profile"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              Social Links
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {socialCount ?? 0}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Connected platforms
            </p>
          </Link>

          {/* COLLABORATIONS */}

          <Link
            href="/creator/collaborations"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              Collaborations
            </p>

            <div className="mt-2 flex items-center gap-3">
              <p className="text-3xl font-bold text-gray-900">
                {collaborationCount ?? 0}
              </p>

              {(newCollaborationCount ?? 0) > 0 && (
                <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-600">
                  {newCollaborationCount} new
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-400">
              Requests received
            </p>
          </Link>

          {/* PROFILE STATUS */}

          <Link
            href="/creator/profile"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">
              Profile Status
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {influencer.is_active
                ? "Live"
                : "Hidden"}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Public visibility
            </p>
          </Link>

        </section>

        {/* =====================================================
            CREATOR TOOLS
        ====================================================== */}

        <section>

          <div className="mb-5">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-500">
              Manage
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Your Creator Tools
            </h2>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* PROFILE */}

            <Link
              href="/creator/profile"
              className="group rounded-3xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-pink-500">
                PROFILE
              </p>

              <h3 className="mt-3 text-xl font-bold text-gray-900">
                Edit Profile
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Update your name, bio, tagline, image and
                profile details.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-gray-900">
                Manage →
              </span>
            </Link>

            {/* PORTFOLIO */}

            <Link
              href="/creator/portfolio"
              className="group rounded-3xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-pink-500">
                PORTFOLIO
              </p>

              <h3 className="mt-3 text-xl font-bold text-gray-900">
                Your Work
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Add campaigns, brand work, images and
                featured projects.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-gray-900">
                Manage →
              </span>
            </Link>

            {/* COLLABORATIONS */}

            <Link
              href="/creator/collaborations"
              className="group rounded-3xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">

                <p className="text-sm font-semibold text-pink-500">
                  COLLABORATIONS
                </p>

                {(newCollaborationCount ?? 0) > 0 && (
                  <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-600">
                    {newCollaborationCount} new
                  </span>
                )}

              </div>

              <h3 className="mt-3 text-xl font-bold text-gray-900">
                Collaboration Requests
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Review brand opportunities and manage
                incoming collaboration requests.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-gray-900">
                View Requests →
              </span>
            </Link>

            {/* PUBLIC PROFILE */}

            <Link
              href={publicProfileUrl}
              target="_blank"
              className="group rounded-3xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-pink-500">
                PUBLIC PROFILE
              </p>

              <h3 className="mt-3 text-xl font-bold text-gray-900">
                Preview Profile
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                See exactly how brands and visitors see
                your profile.
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-gray-900">
                Open Profile →
              </span>
            </Link>

          </div>

        </section>

        {/* =====================================================
            PLAN
        ====================================================== */}

        <section className="mt-8 rounded-3xl bg-gray-900 p-7 text-white sm:p-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-300">
                Current Plan
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {influencer.plan === "premium"
                  ? "Premium Creator"
                  : "Basic Creator"}
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-300">
                Your FluenSoul profile is currently on the{" "}
                <strong>
                  {influencer.plan === "premium"
                    ? "Premium Plan"
                    : "Basic Plan"}
                </strong>
                .
              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm">

              <p className="text-gray-400">
                Plan
              </p>

              <p className="mt-1 font-semibold">
                {influencer.plan === "premium"
                  ? "Premium Plan"
                  : "Basic Plan"}
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}