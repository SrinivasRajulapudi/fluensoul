"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import FluenSoulLogo from "../components/FluenSoulLogo";
import { createClient } from "../../lib/supabase";

const influencerTypes = [
  "Nano (1K-10K followers)",
  "Micro (10K-100K followers)",
  "Macro Influencers (100K-1M followers)",
  "Celebrity Influencers (1M+ followers)",
  "Other",
];

const budgetRanges = [
  "₹5,000 – ₹10,000",
  "₹10,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1 Lakh",
  "₹1 Lakh+",
  "Not decided yet",
];

type FormData = {
  brand_name: string;
  contact_person: string;
  phone: string;
  email: string;
  industry: string;
  campaign_details: string;
  location: string;
  campaign_timeline: string;
  preferred_influencer_type: string;
  budget_range: string;
};

const initialForm: FormData = {
  brand_name: "",
  contact_person: "",
  phone: "",
  email: "",
  industry: "",
  campaign_details: "",
  location: "",
  campaign_timeline: "",
  preferred_influencer_type: "",
  budget_range: "",
};

export default function ForBrandsPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof FormData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const supabase = createClient();

      const { error: submitError } = await supabase
        .from("brand_enquiries")
        .insert({
          brand_name: form.brand_name.trim(),
          contact_person: form.contact_person.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          industry: form.industry.trim(),
          campaign_details: form.campaign_details.trim(),
          location: form.location.trim(),
          campaign_timeline: form.campaign_timeline.trim(),
          preferred_influencer_type:
            form.preferred_influencer_type,
          budget_range: form.budget_range,
        });

      if (submitError) {
        console.error(
          "Brand enquiry submission failed:",
          JSON.stringify(submitError, null, 2)
        );

        setError(
          "We couldn't submit your requirement. Please try again."
        );

        return;
      }

      setForm(initialForm);
      setSubmitted(true);
    } catch (err) {
      console.error(
        "Unexpected submission error:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );
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
          HERO / INTRO
      ====================================================== */}

      <section className="border-b border-black/5 bg-[#f1ebe3]">

        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">
            For Brands
          </p>

          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
            Tell us about your
            <br />
            <span className="italic">
              campaign.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-black/60 sm:text-lg">
            Share your campaign requirements with us. Our team will
            review your needs, search our creator family and connect
            you with suitable influencers.
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
               SUCCESS STATE
            ================================================== */

            <div className="rounded-[2rem] border border-black/10 bg-white px-6 py-14 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:px-12 sm:py-20">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#171717] text-2xl text-white">
                ✓
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                Requirement Received
              </p>

              <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
                Thank you.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-black/55 sm:text-base">
                Your campaign requirement has been received.
                Our team will review the details and get in
                touch with you.
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
                  Submit Another Requirement
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
                  01 · Contact Details
                </p>

                <h2 className="mt-3 font-serif text-3xl">
                  Tell us about your brand
                </h2>

              </div>


              <div className="mt-8 grid gap-6 sm:grid-cols-2">

                <Field
                  label="Brand / Company Name"
                  required
                  value={form.brand_name}
                  onChange={(value) =>
                    updateField("brand_name", value)
                  }
                  placeholder="Your brand or company"
                />

                <Field
                  label="Contact Person"
                  required
                  value={form.contact_person}
                  onChange={(value) =>
                    updateField("contact_person", value)
                  }
                  placeholder="Your name"
                />

                <Field
                  label="Phone Number"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(value) =>
                    updateField("phone", value)
                  }
                  placeholder="+91 XXXXX XXXXX"
                />

                <Field
                  label="Email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateField("email", value)
                  }
                  placeholder="you@company.com"
                />

                <Field
                  label="Business / Industry"
                  required
                  value={form.industry}
                  onChange={(value) =>
                    updateField("industry", value)
                  }
                  placeholder="Fashion, Food, Travel, etc."
                />

                <Field
                  label="Location"
                  required
                  value={form.location}
                  onChange={(value) =>
                    updateField("location", value)
                  }
                  placeholder="City / State"
                />

              </div>


              {/* =================================================
                  SECTION 02
              ================================================== */}

              <div className="mt-14 border-t border-black/10 pt-10">

                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/35">
                  02 · Campaign
                </p>

                <h2 className="mt-3 font-serif text-3xl">
                  Tell us what you need
                </h2>

              </div>


              <div className="mt-8 space-y-6">

                {/* CAMPAIGN DETAILS */}

                <div>

                  <label className="text-sm font-semibold">
                    Campaign / Product Details
                    <span className="ml-1 text-black/40">
                      *
                    </span>
                  </label>

                  <textarea
                    required
                    value={form.campaign_details}
                    onChange={(event) =>
                      updateField(
                        "campaign_details",
                        event.target.value
                      )
                    }
                    rows={6}
                    placeholder="Tell us about your product, campaign, content requirements and anything else we should know."
                    className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
                  />

                </div>


                <div className="grid gap-6 sm:grid-cols-2">

                  {/* CAMPAIGN TIMELINE */}

                  <div>

                    <label className="text-sm font-semibold">
                      Campaign Timeline
                      <span className="ml-1 text-black/40">
                        *
                      </span>
                    </label>

                    <input
                      required
                      type="text"
                      value={form.campaign_timeline}
                      onChange={(event) =>
                        updateField(
                          "campaign_timeline",
                          event.target.value
                        )
                      }
                      placeholder="Example: October 2026"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30 focus:bg-white"
                    />

                  </div>


                  {/* INFLUENCER TYPE */}

                  <div>

                    <label className="text-sm font-semibold">
                      Preferred Influencer Type
                      <span className="ml-1 text-black/40">
                        *
                      </span>
                    </label>

                    <select
                      required
                      value={form.preferred_influencer_type}
                      onChange={(event) =>
                        updateField(
                          "preferred_influencer_type",
                          event.target.value
                        )
                      }
                      className="mt-2 w-full appearance-none rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition focus:border-black/30 focus:bg-white"
                    >

                      <option value="">
                        Select influencer type
                      </option>

                      {influencerTypes.map((type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      ))}

                    </select>

                  </div>

                </div>


                {/* BUDGET */}

                <div>

                  <label className="text-sm font-semibold">
                    Approximate Budget / Budget Range
                    <span className="ml-1 text-black/40">
                      *
                    </span>
                  </label>

                  <select
                    required
                    value={form.budget_range}
                    onChange={(event) =>
                      updateField(
                        "budget_range",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full appearance-none rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition focus:border-black/30 focus:bg-white"
                  >

                    <option value="">
                      Select budget range
                    </option>

                    {budgetRanges.map((budget) => (
                      <option
                        key={budget}
                        value={budget}
                      >
                        {budget}
                      </option>
                    ))}

                  </select>

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
                    : "Submit Requirement →"}
                </button>

                <p className="mt-4 max-w-2xl text-xs leading-5 text-black/40">
                  By submitting this form, you are sharing your
                  campaign requirements with FluenSoul so we can
                  contact you regarding suitable creator
                  collaborations.
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