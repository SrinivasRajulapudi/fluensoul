import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/server";
import { revalidatePath } from "next/cache";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function CollaboratePage({
  params,
  searchParams,
}: PageProps) {
  const { username } = await params;
  const { success, error: queryError } = await searchParams;

  const supabase = await createClient();

  // ---------------------------------------------------------
  // LOAD INFLUENCER
  // ---------------------------------------------------------

  const { data: influencer, error } = await supabase
    .from("influencers")
    .select("id, username, name, is_active")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (error || !influencer) {
    notFound();
  
  }
const influencerId: string = influencer.id;
  const influencerUsername: string = influencer.username;
  // ---------------------------------------------------------
  // SUBMIT COLLABORATION REQUEST
  // ---------------------------------------------------------

  async function submitCollaboration(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const companyName = String(
      formData.get("company_name") ?? ""
    ).trim();

    const contactPerson = String(
      formData.get("contact_person") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    ).trim();

    const phone = String(
      formData.get("phone") ?? ""
    ).trim();

    const collaborationType = String(
      formData.get("collaboration_type") ?? ""
    ).trim();

    const campaignTitle = String(
      formData.get("campaign_title") ?? ""
    ).trim();

    const campaignDetails = String(
      formData.get("campaign_details") ?? ""
    ).trim();

    const budget = String(
      formData.get("budget") ?? ""
    ).trim();

    const preferredDate = String(
      formData.get("preferred_date") ?? ""
    ).trim();

    // ---------------------------------------------------------
    // BASIC VALIDATION
    // ---------------------------------------------------------

    if (
      !companyName ||
      !contactPerson ||
      !email ||
      !campaignDetails
    ) {
      redirect(
        `/profile/${influencerUsername}/collaborate?error=required`
      );
    }

    // ---------------------------------------------------------
    // EMAIL VALIDATION
    // ---------------------------------------------------------

    if (
      !email.includes("@") ||
      !email.includes(".")
    ) {
      redirect(
        `/profile/${influencerUsername}/collaborate?error=email`
      );
    }

    // ---------------------------------------------------------
    // INSERT REQUEST
    // ---------------------------------------------------------

    const { error } = await supabase
      .from("collaboration_requests")
      .insert({
influencer_id: influencerId,
        company_name: companyName,
        contact_person: contactPerson,
        email,
        phone: phone || null,
        collaboration_type:
          collaborationType || null,
        campaign_title:
          campaignTitle || null,
        campaign_details:
          campaignDetails,
        budget: budget || null,
        preferred_date:
          preferredDate || null,
        status: "new",
      });

    if (error) {
      console.error(
        "Collaboration request failed:",
        error
      );

      redirect(
        `/profile/${influencerUsername}/collaborate?error=submit`
      );
    }

    revalidatePath(
      `/profile/${influencerUsername}/collaborate`
    );

    redirect(
      `/profile/${influencerUsername}/collaborate/success`
    );
  }

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#111318]">

      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <header className="border-b border-black/10 bg-[#f5f3ef]">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">

          <a
            href={`/profile/${influencer.username}`}
            className="text-sm font-bold uppercase tracking-[0.25em] text-black"
          >
            FluenSoul
          </a>

          <a
            href={`/profile/${influencer.username}`}
            className="text-sm font-semibold text-black/60 transition hover:text-black"
          >
            ← Back to Profile
          </a>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <section className="px-6 py-16 sm:px-10 sm:py-24">

        <div className="mx-auto max-w-5xl">

          {/* =================================================
              INTRO
          ================================================== */}

          <div className="max-w-3xl">

            <p className="text-xs font-bold uppercase tracking-[0.4em] text-pink-500">
              Let's Work Together
            </p>

            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">
              Collaborate with{" "}
              {influencer.name}.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-black/55 sm:text-xl">
              Tell us about your campaign, brand or
              creative project. Your collaboration request
              will be sent directly to the team managing{" "}
              {influencer.name}'s profile.
            </p>

          </div>


          {/* =================================================
              SUCCESS MESSAGE
          ================================================== */}

          {success === "true" && (

            <div className="mt-12 rounded-[2rem] border border-green-200 bg-green-50 p-8 sm:p-10">

              <div className="flex items-start gap-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
                  ✓
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-600">
                    Request Received
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold text-green-950">
                    Thank you. Your collaboration request has been received.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-green-900/70">
                    The team managing{" "}
                    {influencer.name}'s profile will review
                    your proposal and get back to you if
                    there is a fit.
                  </p>

                  <a
                    href={`/profile/${influencer.username}`}
                    className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-pink-500"
                  >
                    Back to Profile →
                  </a>

                </div>

              </div>

            </div>

          )}


          {/* =================================================
              ERROR MESSAGES
          ================================================== */}

          {queryError === "required" && (

            <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
              Please fill in all required fields.
            </div>

          )}

          {queryError === "email" && (

            <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
              Please enter a valid email address.
            </div>

          )}

          {queryError === "submit" && (

            <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
              We couldn't submit your request. Please try again.
            </div>

          )}


          {/* =================================================
              FORM
          ================================================== */}

          {success !== "true" && (

            <form
              action={submitCollaboration}
              className="mt-8 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-10"
            >

              {/* -----------------------------------------------
                  COMPANY INFORMATION
              ------------------------------------------------ */}

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
                  01 — Your Details
                </p>

                <h2 className="mt-3 text-2xl font-semibold">
                  Tell us who you are
                </h2>

              </div>


              <div className="mt-8 grid gap-6 sm:grid-cols-2">

                {/* Company */}

                <div>

                  <label
                    htmlFor="company_name"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Company / Brand Name *
                  </label>

                  <input
                    id="company_name"
                    name="company_name"
                    type="text"
                    required
                    placeholder="Your company name"
                    className="w-full rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />

                </div>


                {/* Contact Person */}

                <div>

                  <label
                    htmlFor="contact_person"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Contact Person *
                  </label>

                  <input
                    id="contact_person"
                    name="contact_person"
                    type="text"
                    required
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />

                </div>


                {/* Email */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Email Address *
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="w-full rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />

                </div>


                {/* Phone */}

                <div>

                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />

                </div>

              </div>


              {/* -----------------------------------------------
                  CAMPAIGN INFORMATION
              ------------------------------------------------ */}

              <div className="mt-14 border-t border-black/10 pt-10">

                <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
                  02 — Campaign
                </p>

                <h2 className="mt-3 text-2xl font-semibold">
                  Tell us about the opportunity
                </h2>

              </div>


              <div className="mt-8 grid gap-6 sm:grid-cols-2">

                {/* Collaboration Type */}

                <div>

                  <label
                    htmlFor="collaboration_type"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Collaboration Type
                  </label>

                  <select
                    id="collaboration_type"
                    name="collaboration_type"
                    defaultValue=""
                    className="w-full rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  >

                    <option value="">
                      Select type
                    </option>

                    <option value="Sponsored Content">
                      Sponsored Content
                    </option>

                    <option value="Brand Campaign">
                      Brand Campaign
                    </option>

                    <option value="Product Promotion">
                      Product Promotion
                    </option>

                    <option value="Event">
                      Event
                    </option>

                    <option value="Long Term Partnership">
                      Long-Term Partnership
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>


                {/* Campaign Title */}

                <div>

                  <label
                    htmlFor="campaign_title"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Campaign / Project Name
                  </label>

                  <input
                    id="campaign_title"
                    name="campaign_title"
                    type="text"
                    placeholder="Campaign name"
                    className="w-full rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />

                </div>


                {/* Budget */}

                <div>

                  <label
                    htmlFor="budget"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Estimated Budget
                  </label>

                  <select
                    id="budget"
                    name="budget"
                    defaultValue=""
                    className="w-full rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  >

                    <option value="">
                      Prefer not to say
                    </option>

                    <option value="Under ₹10,000">
                      Under ₹10,000
                    </option>

                    <option value="₹10,000 – ₹25,000">
                      ₹10,000 – ₹25,000
                    </option>

                    <option value="₹25,000 – ₹50,000">
                      ₹25,000 – ₹50,000
                    </option>

                    <option value="₹50,000 – ₹1,00,000">
                      ₹50,000 – ₹1,00,000
                    </option>

                    <option value="₹1,00,000+">
                      ₹1,00,000+
                    </option>

                  </select>

                </div>


                {/* Preferred Date */}

                <div>

                  <label
                    htmlFor="preferred_date"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Preferred Date
                  </label>

                  <input
                    id="preferred_date"
                    name="preferred_date"
                    type="date"
                    className="w-full rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                  />

                </div>

              </div>


              {/* Campaign Details */}

              <div className="mt-6">

                <label
                  htmlFor="campaign_details"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Campaign Details *
                </label>

                <textarea
                  id="campaign_details"
                  name="campaign_details"
                  required
                  rows={7}
                  placeholder="Tell us what you'd like to collaborate on, what you're looking for, deliverables, location, timeline, or anything else we should know."
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#faf9f7] px-5 py-4 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                />

                <p className="mt-2 text-xs text-black/40">
                  Please provide enough detail for the creator/team to understand your proposal.
                </p>

              </div>


              {/* -----------------------------------------------
                  SUBMIT
              ------------------------------------------------ */}

              <div className="mt-10 border-t border-black/10 pt-8">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <p className="max-w-md text-xs leading-5 text-black/40">
                    By submitting this form, you are sending a
                    collaboration request to the team managing{" "}
                    {influencer.name}'s profile.
                  </p>

                  <button
                    type="submit"
                    className="rounded-full bg-black px-8 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-pink-500"
                  >
                    Send Collaboration Request →
                  </button>

                </div>

              </div>

            </form>

          )}


          {/* =================================================
              FOOTER NOTE
          ================================================== */}

          <div className="mt-8 text-center">

            <p className="text-xs uppercase tracking-[0.25em] text-black/30">
              Collaboration request • {influencer.name}
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}