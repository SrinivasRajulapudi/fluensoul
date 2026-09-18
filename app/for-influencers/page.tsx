"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import FluenSoulLogo from "../components/FluenSoulLogo";
import { createClient } from "../../lib/supabase";

type FormData = {
  name: string;
  phone: string;
  email: string;
  instagram: string;
  youtube: string;
  other_social_links: string;
  category: string;
  location: string;
  followers: string;
  portfolio_links: string;
  additional_information: string;
};

const initialForm: FormData = {
  name: "",
  phone: "",
  email: "",
  instagram: "",
  youtube: "",
  other_social_links: "",
  category: "",
  location: "",
  followers: "",
  portfolio_links: "",
  additional_information: "",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ForInfluencersPage() {
  const [form, setForm] = useState<FormData>(initialForm);

  const [profilePhoto, setProfilePhoto] =
    useState<File | null>(null);

  const [photoPreview, setPhotoPreview] =
    useState<string>("");

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState("");

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    /* ---------------------------------------------
       CHECK FILE TYPE
    --------------------------------------------- */

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(
        "Please upload a JPG, PNG or WEBP image."
      );

      event.target.value = "";
      return;
    }

    /* ---------------------------------------------
       CHECK FILE SIZE
    --------------------------------------------- */

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Profile photo must be smaller than 2 MB."
      );

      event.target.value = "";
      return;
    }

    /* ---------------------------------------------
       SET FILE
    --------------------------------------------- */

    setProfilePhoto(file);

    /* ---------------------------------------------
       CREATE PREVIEW
    --------------------------------------------- */

    const previewUrl =
      URL.createObjectURL(file);

    setPhotoPreview(previewUrl);
  }

  function removePhoto() {
    setProfilePhoto(null);

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoPreview("");
  }

  async function uploadProfilePhoto(
    supabase: ReturnType<typeof createClient>
  ) {
    if (!profilePhoto) {
      return null;
    }

    /* ---------------------------------------------
       CREATE UNIQUE FILE NAME
    --------------------------------------------- */

    const fileExtension =
      profilePhoto.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const safeExtension =
      fileExtension === "jpeg"
        ? "jpg"
        : fileExtension;

    const uniqueFileName =
      `applications/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    /* ---------------------------------------------
       UPLOAD TO SUPABASE STORAGE
    --------------------------------------------- */

    const { error: uploadError } =
      await supabase.storage
        .from("influencer-images")
        .upload(
          uniqueFileName,
          profilePhoto,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: profilePhoto.type,
          }
        );

    if (uploadError) {
      console.error(
        "Profile photo upload failed:",
        JSON.stringify(
          uploadError,
          null,
          2
        )
      );

      throw new Error(
        "We couldn't upload your profile photo."
      );
    }

    /* ---------------------------------------------
       GET PUBLIC URL
    --------------------------------------------- */

    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from("influencer-images")
        .getPublicUrl(uniqueFileName);

    if (!publicUrlData?.publicUrl) {
      throw new Error(
        "Profile photo URL could not be created."
      );
    }

    return publicUrlData.publicUrl;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const supabase = createClient();

      /* ---------------------------------------------
         UPLOAD PHOTO FIRST
      --------------------------------------------- */

      const profilePhotoUrl =
        await uploadProfilePhoto(
          supabase
        );

      /* ---------------------------------------------
         INSERT APPLICATION
      --------------------------------------------- */

      const { error: submitError } =
        await supabase
          .from("influencer_applications")
          .insert({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),

            instagram:
              form.instagram.trim() ||
              null,

            youtube:
              form.youtube.trim() ||
              null,

            other_social_links:
              form.other_social_links.trim() ||
              null,

            category:
              form.category.trim(),

            location:
              form.location.trim(),

            followers:
              form.followers.trim(),

            portfolio_links:
              form.portfolio_links.trim(),

            profile_photo_url:
              profilePhotoUrl,

            additional_information:
              form.additional_information.trim() ||
              null,
          });

      if (submitError) {
        console.error(
          "Influencer application submission failed:",
          JSON.stringify(
            submitError,
            null,
            2
          )
        );

        setError(
          "We couldn't submit your application. Please try again."
        );

        return;
      }

      /* ---------------------------------------------
         SUCCESS
      --------------------------------------------- */

      setForm(initialForm);

      removePhoto();

      setSubmitted(true);

    } catch (err) {
      console.error(
        "Unexpected influencer application error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#171717]">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf9f6]/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <Link
            href="/"
            className="shrink-0"
          >
            <FluenSoulLogo
              width={180}
              className="max-w-[180px]"
            />
          </Link>

          <Link
            href="/login"
            className="rounded-full bg-[#171717] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Login
          </Link>

        </div>

      </header>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="border-b border-black/5 bg-[#171717] text-white">

        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
            For Influencers
          </p>

          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight tracking-tight sm:text-6xl">

            Become part of the

            <br />

            <span className="italic text-[#d8c5b1]">
              FluenSoul family.
            </span>

          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">

            Tell us about yourself, your content and your work.
            If your profile is a good fit for our network, we'll
            connect with you when suitable collaboration
            opportunities come up.

          </p>

        </div>

      </section>


      {/* =====================================================
          FORM AREA
      ====================================================== */}

      <section className="px-5 py-12 sm:px-8 sm:py-20">

        <div className="mx-auto max-w-4xl">

          {submitted ? (

            /* =================================================
               SUCCESS
            ================================================== */

            <div className="rounded-[2rem] border border-black/10 bg-white px-6 py-14 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:px-12 sm:py-20">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#171717] text-2xl text-white">
                ✓
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                Application Received
              </p>

              <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
                Welcome to the journey.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-black/55 sm:text-base">
                We've received your details. Our team will review
                your profile and reach out if there is a suitable
                opportunity for you.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

                <Link
                  href="/"
                  className="rounded-2xl bg-[#171717] px-7 py-4 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Back to FluenSoul
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setError("");
                  }}
                  className="rounded-2xl border border-black/15 bg-white px-7 py-4 text-sm font-semibold text-black transition hover:bg-[#faf9f6]"
                >
                  Submit Another Application
                </button>

              </div>

            </div>

          ) : (

            /* =================================================
               FORM
            ================================================== */

            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:p-10"
            >

              {/* =================================================
                  SECTION 01
              ================================================== */}

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/35">
                  01 · About You
                </p>

                <h2 className="mt-3 font-serif text-3xl">
                  Tell us about yourself
                </h2>

              </div>


              <div className="mt-8 grid gap-6 sm:grid-cols-2">

                <Field
                  label="Name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value
                    )
                  }
                  placeholder="Your full name"
                />

                <Field
                  label="Phone Number"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value
                    )
                  }
                  placeholder="+91 XXXXX XXXXX"
                />

                <Field
                  label="Email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateField(
                      "email",
                      value
                    )
                  }
                  placeholder="you@email.com"
                />

                <Field
                  label="Location"
                  required
                  value={form.location}
                  onChange={(value) =>
                    updateField(
                      "location",
                      value
                    )
                  }
                  placeholder="City / State"
                />

                <Field
                  label="Category / Niche"
                  required
                  value={form.category}
                  onChange={(value) =>
                    updateField(
                      "category",
                      value
                    )
                  }
                  placeholder="Fashion, Food, Travel, etc."
                />

                <Field
                  label="Followers"
                  required
                  value={form.followers}
                  onChange={(value) =>
                    updateField(
                      "followers",
                      value
                    )
                  }
                  placeholder="Example: 85K"
                />

              </div>


              {/* =================================================
                  PROFILE PHOTO
              ================================================== */}

              <div className="mt-10 border-t border-black/10 pt-10">

                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/35">
                  Profile Photo
                </p>

                <h3 className="mt-3 font-serif text-2xl">
                  Add a photo of yourself
                </h3>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  Choose a clear photo that represents you.
                </p>


                <div className="mt-6">

                  {photoPreview ? (

                    /* =========================================
                       PHOTO PREVIEW
                    ========================================== */

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                      <div className="h-32 w-32 overflow-hidden rounded-3xl border border-black/10 bg-[#faf9f6]">

                        <img
                          src={photoPreview}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />

                      </div>


                      <div>

                        <p className="text-sm font-semibold">
                          {profilePhoto?.name}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {profilePhoto
                            ? `${(
                                profilePhoto.size /
                                1024 /
                                1024
                              ).toFixed(2)} MB`
                            : ""}
                        </p>


                        <div className="mt-4 flex flex-wrap gap-3">

                          <label
                            htmlFor="profile-photo"
                            className="cursor-pointer rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-[#faf9f6]"
                          >
                            Change Photo
                          </label>

                          <button
                            type="button"
                            onClick={removePhoto}
                            className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-semibold text-black/50 transition hover:bg-[#faf9f6] hover:text-black"
                          >
                            Remove
                          </button>

                        </div>

                      </div>

                    </div>

                  ) : (

                    /* =========================================
                       UPLOAD AREA
                    ========================================== */

                    <label
                      htmlFor="profile-photo"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-black/20 bg-[#faf9f6] px-6 py-10 text-center transition hover:border-black/35 hover:bg-white"
                    >

                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#171717] text-xl text-white">
                        +
                      </div>

                      <p className="mt-4 text-sm font-semibold">
                        Upload Profile Photo
                      </p>

                      <p className="mt-2 text-xs text-black/40">
                        JPG, PNG or WEBP · Maximum 2 MB
                      </p>

                    </label>

                  )}

                  <input
                    id="profile-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                </div>

              </div>


              {/* =================================================
                  SECTION 02 — SOCIAL MEDIA
              ================================================== */}

              <div className="mt-14 border-t border-black/10 pt-10">

                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/35">
                  02 · Social Media
                </p>

                <h2 className="mt-3 font-serif text-3xl">
                  Where can we find you?
                </h2>

              </div>


              <div className="mt-8 grid gap-6 sm:grid-cols-2">

                <Field
                  label="Instagram"
                  value={form.instagram}
                  onChange={(value) =>
                    updateField(
                      "instagram",
                      value
                    )
                  }
                  placeholder="Instagram profile link"
                />

                <Field
                  label="YouTube"
                  value={form.youtube}
                  onChange={(value) =>
                    updateField(
                      "youtube",
                      value
                    )
                  }
                  placeholder="YouTube channel link"
                />

              </div>


              <div className="mt-6">

                <label className="text-sm font-semibold">
                  Other Social Links
                </label>

                <textarea
                  value={form.other_social_links}
                  onChange={(event) =>
                    updateField(
                      "other_social_links",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Facebook, LinkedIn, X, Snapchat, etc."
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
                />

              </div>


              {/* =================================================
                  SECTION 03 — YOUR WORK
              ================================================== */}

              <div className="mt-14 border-t border-black/10 pt-10">

                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/35">
                  03 · Your Work
                </p>

                <h2 className="mt-3 font-serif text-3xl">
                  Show us what you create
                </h2>

              </div>


              <div className="mt-8 space-y-6">

                {/* PORTFOLIO */}

                <div>

                  <label className="text-sm font-semibold">

                    Portfolio / Reel Links

                    <span className="ml-1 text-black/40">
                      *
                    </span>

                  </label>

                  <textarea
                    required
                    value={form.portfolio_links}
                    onChange={(event) =>
                      updateField(
                        "portfolio_links",
                        event.target.value
                      )
                    }
                    rows={5}
                    placeholder="Paste your best reels, campaign videos, portfolio or other work links."
                    className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
                  />

                  <p className="mt-2 text-xs text-black/35">
                    Add multiple links separated by commas
                    or on separate lines.
                  </p>

                </div>


                {/* ADDITIONAL INFORMATION */}

                <div>

                  <label className="text-sm font-semibold">
                    Additional Information
                  </label>

                  <textarea
                    value={form.additional_information}
                    onChange={(event) =>
                      updateField(
                        "additional_information",
                        event.target.value
                      )
                    }
                    rows={5}
                    placeholder="Anything else you'd like us to know about you, your audience or the kind of collaborations you're interested in?"
                    className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
                  />

                </div>

              </div>


              {/* =================================================
                  ERROR
              ================================================== */}

              {error && (

                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">
                  {error}
                </div>

              )}


              {/* =================================================
                  SUBMIT
              ================================================== */}

              <div className="mt-10 border-t border-black/10 pt-8">

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-[#171717] px-7 py-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {submitting
                    ? "Submitting..."
                    : "Join FluenSoul →"}
                </button>

                <p className="mt-4 max-w-2xl text-xs leading-5 text-black/40">
                  By submitting this application, you are sharing
                  your details with FluenSoul for consideration as
                  part of our creator network.
                </p>

              </div>

            </form>

          )}

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-black/5 bg-[#faf9f6] px-5 py-10 sm:px-8">

        <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <Link href="/">
            <FluenSoulLogo
              width={150}
              className="max-w-[150px]"
            />
          </Link>

          <Link
            href="/"
            className="text-sm text-black/50 transition hover:text-black"
          >
            ← Back to FluenSoul
          </Link>

        </div>

      </footer>

    </main>
  );
}


/* ============================================================
   REUSABLE TEXT FIELD
============================================================ */

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: FieldProps) {
  return (
    <div>

      <label className="text-sm font-semibold">

        {label}

        {required && (
          <span className="ml-1 text-black/40">
            *
          </span>
        )}

      </label>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
      />

    </div>
  );
}