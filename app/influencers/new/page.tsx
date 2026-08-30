import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/server";

export default async function NewInfluencerPage() {
  async function createInfluencer(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const username = String(
      formData.get("username") ?? ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    const tagline = String(
      formData.get("tagline") ?? ""
    ).trim();

    const bio = String(
      formData.get("bio") ?? ""
    ).trim();

    const heroImageUrl = String(
      formData.get("hero_image_url") ?? ""
    ).trim();

    const followers = String(
      formData.get("followers") ?? ""
    ).trim();

    const totalLikes = String(
      formData.get("total_likes") ?? ""
    ).trim();

    const collaborationCount = String(
      formData.get("collaboration_count") ?? ""
    ).trim();

    const contactEmail = String(
      formData.get("contact_email") ?? ""
    ).trim();

    const isActive =
      formData.get("is_active") === "on";

    if (!name || !username) {
      redirect(
        "/influencers/new?error=required"
      );
    }

    // ---------------------------------------------------------
    // CHECK USERNAME
    // ---------------------------------------------------------

    const { data: existingInfluencer } =
      await supabase
        .from("influencers")
        .select("id")
        .eq("username", username)
        .maybeSingle();

    if (existingInfluencer) {
      redirect(
        "/influencers/new?error=username"
      );
    }

    // ---------------------------------------------------------
    // CREATE INFLUENCER
    // ---------------------------------------------------------

    const { data: influencer, error } =
      await supabase
        .from("influencers")
        .insert({
          name,
          username,
          tagline: tagline || null,
          bio: bio || null,
          hero_image_url:
            heroImageUrl || null,
          followers: followers || null,
          total_likes:
            totalLikes || null,
          collaboration_count:
            collaborationCount || null,
          contact_email:
            contactEmail || null,
          is_active: isActive,
        })
        .select("id")
        .single();

    if (error || !influencer) {
      console.error(
        "Influencer creation failed:",
        error
      );

      redirect(
        "/influencers/new?error=create"
      );
    }

    redirect(
      `/influencers/${influencer.id}?saved=created`
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-6 py-8 sm:px-10">
      <div className="mx-auto max-w-4xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-500">
              Influencer Platform
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
              Add Influencer
            </h1>

            <p className="mt-2 text-gray-500">
              Create a new influencer profile.
            </p>
          </div>

          <Link
            href="/"
            className="w-fit rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            ← Dashboard
          </Link>

        </div>


        {/* =====================================================
            FORM
        ====================================================== */}

        <form
          action={createInfluencer}
          className="rounded-3xl bg-white p-7 shadow-sm sm:p-10"
        >

          {/* ===================================================
              BASIC INFORMATION
          ==================================================== */}

          <div className="border-b border-gray-100 pb-7">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
              01 — Basic Information
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Profile Identity
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These details identify the creator on the platform.
            </p>

          </div>


          <div className="mt-8 grid gap-6 sm:grid-cols-2">

            {/* Name */}

            <div>

              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Full Name *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Srinivas Rajulapudi"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* Username */}

            <div>

              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Username *
              </label>

              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="srinivas"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

              <p className="mt-2 text-xs text-gray-400">
                Public profile: /profile/username
              </p>

            </div>


            {/* Tagline */}

            <div className="sm:col-span-2">

              <label
                htmlFor="tagline"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Tagline
              </label>

              <input
                id="tagline"
                name="tagline"
                type="text"
                placeholder="Lifestyle & Fashion Creator"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* Bio */}

            <div className="sm:col-span-2">

              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Bio
              </label>

              <textarea
                id="bio"
                name="bio"
                rows={6}
                placeholder="Tell visitors about this creator..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>

          </div>


          {/* ===================================================
              MEDIA
          ==================================================== */}

          <div className="mt-12 border-t border-gray-100 pt-10">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
              02 — Media
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Profile Image
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add the main image displayed on the public profile.
            </p>

          </div>


          <div className="mt-8">

            <label
              htmlFor="hero_image_url"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Hero Image URL
            </label>

            <input
              id="hero_image_url"
              name="hero_image_url"
              type="url"
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />

            <p className="mt-2 text-xs text-gray-400">
              We'll add direct image uploading later.
            </p>

          </div>


          {/* ===================================================
              STATS
          ==================================================== */}

          <div className="mt-12 border-t border-gray-100 pt-10">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
              03 — Audience
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Creator Statistics
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These are displayed publicly on the profile.
            </p>

          </div>


          <div className="mt-8 grid gap-6 sm:grid-cols-3">

            {/* Followers */}

            <div>

              <label
                htmlFor="followers"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Followers
              </label>

              <input
                id="followers"
                name="followers"
                type="text"
                placeholder="125K"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* Likes */}

            <div>

              <label
                htmlFor="total_likes"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Total Likes
              </label>

              <input
                id="total_likes"
                name="total_likes"
                type="text"
                placeholder="2.4M"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* Collaborations */}

            <div>

              <label
                htmlFor="collaboration_count"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Collaborations
              </label>

              <input
                id="collaboration_count"
                name="collaboration_count"
                type="text"
                placeholder="25"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>

          </div>


          {/* ===================================================
              CONTACT
          ==================================================== */}

          <div className="mt-12 border-t border-gray-100 pt-10">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
              04 — Contact
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Business Contact
            </h2>

          </div>


          <div className="mt-8">

            <label
              htmlFor="contact_email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Contact Email
            </label>

            <input
              id="contact_email"
              name="contact_email"
              type="email"
              placeholder="creator@example.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />

          </div>


          {/* ===================================================
              STATUS
          ==================================================== */}

          <div className="mt-12 border-t border-gray-100 pt-10">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
              05 — Publishing
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Profile Status
            </h2>

          </div>


          <div className="mt-8 flex items-center justify-between rounded-2xl bg-gray-50 p-6">

            <div>

              <h3 className="font-semibold text-gray-900">
                Publish profile immediately
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Turn this off if you want to finish editing before making the profile public.
              </p>

            </div>

            <label className="relative inline-flex cursor-pointer items-center">

              <input
                type="checkbox"
                name="is_active"
                defaultChecked
                className="peer sr-only"
              />

              <div className="h-7 w-12 rounded-full bg-gray-300 transition peer-checked:bg-green-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />

            </label>

          </div>


          {/* ===================================================
              ACTIONS
          ==================================================== */}

          <div className="mt-10 flex flex-col-reverse gap-4 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href="/"
              className="text-center text-sm font-semibold text-gray-500 transition hover:text-gray-900 sm:text-left"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-gray-900 px-8 py-3.5 font-semibold text-white transition hover:bg-gray-700"
            >
              Create Influencer
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}