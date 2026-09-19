import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/server";
import LogoutButton from "../components/LogoutButton";

const BRAND_STATUSES = [
  "New",
  "Contacted",
  "In Discussion",
  "Campaign Started",
  "Completed",
  "Closed",
];

const INFLUENCER_STATUSES = [
  "New",
  "Reviewed",
  "Approved",
  "Added to FluenSoul",
  "Rejected",
];

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: roleRecord } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleRecord?.role !== "admin") {
    if (roleRecord?.role === "creator") {
      redirect("/creator");
    }

    redirect("/login?error=invalid_role");
  }

  return supabase;
}

function normalizeUrl(value: string | null | undefined) {
  const url = value?.trim();

  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function createUsernameBase(name: string) {
  const username = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return username || "creator";
}

async function getUniqueUsername(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string
) {
  const base = createUsernameBase(name);

  const { data: exactMatch } = await supabase
    .from("influencers")
    .select("id")
    .eq("username", base)
    .maybeSingle();

  if (!exactMatch) {
    return base;
  }

  for (let number = 2; number <= 100; number++) {
    const candidate = `${base}-${number}`;

    const { data: existing } = await supabase
      .from("influencers")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

// ---------------------------------------------------------
// ADD INFLUENCER APPLICATION TO FLUENSOUL
// ---------------------------------------------------------

async function addApplicationToFluenSoul(formData: FormData) {
  "use server";

  const supabase = await requireAdmin();

  const applicationId = String(
    formData.get("application_id") ?? ""
  );

  if (!applicationId) {
    redirect("/admin?error=missing_application");
  }

  // Load the application
  const { data: application, error: applicationError } =
    await supabase
      .from("influencer_applications")
      .select(
        `
          id,
          name,
          phone,
          email,
          instagram,
          youtube,
          other_social_links,
          category,
          location,
          followers,
          portfolio_links,
          profile_photo_url,
          additional_information,
          status,
          influencer_id
        `
      )
      .eq("id", applicationId)
      .maybeSingle();

  if (applicationError || !application) {
    redirect("/admin?error=application_not_found");
  }

  // Already converted
  if (application.influencer_id) {
    redirect("/admin?message=already_added");
  }

  // Only approved/reviewed/new applications can be converted.
  // We intentionally allow New so the admin can directly add
  // an application after reviewing it.
  if (
    !["New", "Reviewed", "Approved"].includes(
      application.status
    )
  ) {
    redirect("/admin?error=invalid_application_status");
  }

  const username = await getUniqueUsername(
    supabase,
    application.name
  );

  // ---------------------------------------------------------
  // CREATE CREATOR PROFILE
  // ---------------------------------------------------------

  const { data: influencer, error: influencerError } =
    await supabase
      .from("influencers")
      .insert({
        name: application.name,
        username,
        tagline: application.category
          ? `${application.category} Creator`
          : null,
        bio: application.additional_information || null,
        hero_image_url:
          application.profile_photo_url || null,
        followers: application.followers || null,
        total_likes: null,
        collaboration_count: null,
        contact_email: application.email || null,
        is_active: true,
      })
      .select("id")
      .single();

  if (influencerError || !influencer) {
    console.error(
      "Failed to create influencer:",
      influencerError
    );

    redirect("/admin?error=creator_creation_failed");
  }

  // ---------------------------------------------------------
  // CREATE SOCIAL LINKS
  // ---------------------------------------------------------

  const socialLinks: Array<{
    influencer_id: string;
    platform: string;
    platform_name: string;
    url: string;
    display_order: number;
    is_active: boolean;
  }> = [];

  const instagramUrl = normalizeUrl(
    application.instagram
  );

  if (instagramUrl) {
    socialLinks.push({
      influencer_id: influencer.id,
      platform: "instagram",
      platform_name: "Instagram",
      url: instagramUrl,
      display_order: 1,
      is_active: true,
    });
  }

  const youtubeUrl = normalizeUrl(application.youtube);

  if (youtubeUrl) {
    socialLinks.push({
      influencer_id: influencer.id,
      platform: "youtube",
      platform_name: "YouTube",
      url: youtubeUrl,
      display_order: socialLinks.length + 1,
      is_active: true,
    });
  }

  /*
   * Other social links can contain multiple links.
   *
   * We accept one URL per line or comma-separated URLs.
   */
  const otherSocialLinks =
    application.other_social_links
      ?.split(/[\n,]+/)
      .map((value: string) => value.trim())
      .filter(Boolean) ?? [];

  for (const otherLink of otherSocialLinks) {
    const normalized = normalizeUrl(otherLink);

    if (!normalized) {
      continue;
    }

    socialLinks.push({
      influencer_id: influencer.id,
      platform: "other",
      platform_name: "Other",
      url: normalized,
      display_order: socialLinks.length + 1,
      is_active: true,
    });
  }

  if (socialLinks.length > 0) {
    const { error: socialError } = await supabase
      .from("influencer_social_links")
      .insert(socialLinks);

    if (socialError) {
      console.error(
        "Failed to create social links:",
        socialError
      );

      // Remove the creator we just created so that a failed
      // conversion does not leave a half-created profile.
      await supabase
        .from("influencers")
        .delete()
        .eq("id", influencer.id);

      redirect("/admin?error=social_links_failed");
    }
  }

  // ---------------------------------------------------------
  // CONNECT APPLICATION TO CREATOR
  // ---------------------------------------------------------

  const { error: updateError } = await supabase
    .from("influencer_applications")
    .update({
      influencer_id: influencer.id,
      status: "Added to FluenSoul",
    })
    .eq("id", application.id)
    .is("influencer_id", null);

  if (updateError) {
    console.error(
      "Failed to connect application:",
      updateError
    );

    // Clean up the newly-created creator because the application
    // could not be connected to it.
    await supabase
      .from("influencer_social_links")
      .delete()
      .eq("influencer_id", influencer.id);

    await supabase
      .from("influencers")
      .delete()
      .eq("id", influencer.id);

    redirect("/admin?error=application_update_failed");
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/profile/${username}`);

  redirect("/admin?message=creator_added");
}

// ---------------------------------------------------------
// UPDATE INFLUENCER APPLICATION STATUS
// ---------------------------------------------------------

async function updateInfluencerApplicationStatus(
  formData: FormData
) {
  "use server";

  const supabase = await requireAdmin();

  const applicationId = String(
    formData.get("application_id") ?? ""
  );

  const status = String(
    formData.get("status") ?? ""
  );

  if (!applicationId) {
    redirect("/admin?error=missing_application");
  }

  if (!INFLUENCER_STATUSES.includes(status)) {
    redirect("/admin?error=invalid_status");
  }

  const { error } = await supabase
    .from("influencer_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    console.error(
      "Failed to update influencer application:",
      error
    );

    redirect("/admin?error=status_update_failed");
  }

  revalidatePath("/admin");

  redirect("/admin?message=status_updated");
}

// ---------------------------------------------------------
// UPDATE BRAND ENQUIRY STATUS
// ---------------------------------------------------------

async function updateBrandEnquiryStatus(
  formData: FormData
) {
  "use server";

  const supabase = await requireAdmin();

  const enquiryId = String(
    formData.get("enquiry_id") ?? ""
  );

  const status = String(
    formData.get("status") ?? ""
  );

  if (!enquiryId) {
    redirect("/admin?error=missing_enquiry");
  }

  if (!BRAND_STATUSES.includes(status)) {
    redirect("/admin?error=invalid_status");
  }

  const { error } = await supabase
    .from("brand_enquiries")
    .update({ status })
    .eq("id", enquiryId);

  if (error) {
    console.error(
      "Failed to update brand enquiry:",
      error
    );

    redirect("/admin?error=brand_status_update_failed");
  }

  revalidatePath("/admin");

  redirect("/admin?message=brand_status_updated");
}

// ---------------------------------------------------------
// PAGE
// ---------------------------------------------------------

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{
    message?: string;
    error?: string;
  }>;
}) {
  const supabase = await requireAdmin();

  const params = searchParams
    ? await searchParams
    : {};

  // ---------------------------------------------------------
  // LOAD INFLUENCERS
  // ---------------------------------------------------------

  const {
    data: influencers,
    error: influencersError,
  } = await supabase
    .from("influencers")
    .select(
      "id, username, name, is_active"
    )
    .order("name", {
      ascending: true,
    });

  // ---------------------------------------------------------
  // LOAD COLLABORATION REQUESTS
  // ---------------------------------------------------------

  const {
    data: requests,
    error: requestsError,
  } = await supabase
    .from("collaboration_requests")
    .select(
      `
        id,
        influencer_id,
        company_name,
        contact_person,
        email,
        phone,
        collaboration_type,
        campaign_title,
        budget,
        preferred_date,
        status,
        created_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  // ---------------------------------------------------------
  // LOAD BRAND ENQUIRIES
  // ---------------------------------------------------------

  const {
    data: brandEnquiries,
    error: brandEnquiriesError,
  } = await supabase
    .from("brand_enquiries")
    .select(
      `
        id,
        brand_name,
        contact_person,
        phone,
        email,
        industry,
        campaign_details,
        location,
        campaign_timeline,
        preferred_influencer_type,
        budget_range,
        status,
        created_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  // ---------------------------------------------------------
  // LOAD INFLUENCER APPLICATIONS
  // ---------------------------------------------------------

  const {
    data: influencerApplications,
    error: influencerApplicationsError,
  } = await supabase
    .from("influencer_applications")
    .select(
      `
        id,
        name,
        phone,
        email,
        instagram,
        youtube,
        other_social_links,
        category,
        location,
        followers,
        portfolio_links,
        profile_photo_url,
        additional_information,
        status,
        influencer_id,
        created_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  function getInfluencer(
    influencerId: string
  ) {
    return (
      influencers?.find(
        (influencer) =>
          influencer.id === influencerId
      ) ?? null
    );
  }

  function getCollaborationStatusClass(
    status: string
  ) {
    switch (status) {
      case "new":
        return "bg-pink-100 text-pink-600";

      case "reviewing":
        return "bg-yellow-100 text-yellow-700";

      case "accepted":
        return "bg-green-100 text-green-700";

      case "completed":
        return "bg-blue-100 text-blue-700";

      case "rejected":
        return "bg-red-100 text-red-600";

      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  function getApplicationStatusClass(
    status: string
  ) {
    switch (status) {
      case "New":
        return "bg-pink-100 text-pink-600";

      case "Reviewed":
        return "bg-yellow-100 text-yellow-700";

      case "Approved":
        return "bg-green-100 text-green-700";

      case "Added to FluenSoul":
        return "bg-blue-100 text-blue-700";

      case "Rejected":
        return "bg-red-100 text-red-600";

      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  function getBrandStatusClass(
    status: string
  ) {
    switch (status) {
      case "New":
        return "bg-pink-100 text-pink-600";

      case "Contacted":
        return "bg-yellow-100 text-yellow-700";

      case "In Discussion":
        return "bg-purple-100 text-purple-700";

      case "Campaign Started":
        return "bg-blue-100 text-blue-700";

      case "Completed":
        return "bg-green-100 text-green-700";

      case "Closed":
        return "bg-gray-100 text-gray-500";

      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  const newRequests =
    requests?.filter(
      (request) =>
        request.status === "new"
    ) ?? [];

  const newBrandEnquiries =
    brandEnquiries?.filter(
      (enquiry) =>
        enquiry.status === "New"
    ) ?? [];

  const newInfluencerApplications =
    influencerApplications?.filter(
      (application) =>
        application.status === "New"
    ) ?? [];

  const availableForAdding =
    influencerApplications?.filter(
      (application) =>
        !application.influencer_id &&
        ["New", "Reviewed", "Approved"].includes(
          application.status
        )
    ) ?? [];

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
                FluenSoul
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Admin Dashboard
              </h1>

              <p className="mt-3 max-w-xl text-gray-500">
                Manage creators, brand enquiries,
                influencer applications and
                collaboration opportunities from one
                place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/influencers/new"
                className="inline-flex w-fit items-center justify-center rounded-xl bg-gray-900 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-700"
              >
                + Add Creator
              </Link>

              <LogoutButton />

            </div>

          </div>
        </header>

        {/* QUICK STATS */}

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Creators
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {influencers?.length ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Collaboration Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {requests?.length ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-pink-600">
              New Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-pink-700">
              {newRequests.length}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-purple-600">
              Brand Enquiries
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-700">
              {newBrandEnquiries.length}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-blue-600">
              Creator Applications
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {newInfluencerApplications.length}
            </p>
          </div>

        </section>

        {/* ------------------------------------------------- */}
        {/* BRAND ENQUIRIES */}
        {/* ------------------------------------------------- */}

        <section className="mb-14">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-500">
                For Brands
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Brand Enquiries
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                New business enquiries submitted through
                FluenSoul.
              </p>
            </div>

            <div className="flex gap-2">

              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                {brandEnquiries?.length ?? 0} total
              </span>

              <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                {newBrandEnquiries.length} new
              </span>

            </div>

          </div>

          {brandEnquiriesError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
              <h3 className="font-semibold text-red-700">
                Unable to load brand enquiries
              </h3>

              <pre className="mt-4 overflow-auto rounded-xl bg-white/70 p-4 text-xs text-red-600">
                {JSON.stringify(
                  brandEnquiriesError,
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {!brandEnquiriesError &&
            (!brandEnquiries ||
              brandEnquiries.length === 0) && (
              <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <div className="text-3xl">
                  🏢
                </div>

                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  No brand enquiries yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Brand submissions from the public
                  website will appear here.
                </p>
              </div>
            )}

          {!brandEnquiriesError &&
            brandEnquiries &&
            brandEnquiries.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-2">

                {brandEnquiries.map((enquiry) => (

                  <article
                    key={enquiry.id}
                    className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                          Brand Enquiry
                        </p>

                        <h3 className="mt-2 truncate text-xl font-bold text-gray-900">
                          {enquiry.brand_name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {enquiry.contact_person}
                        </p>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${getBrandStatusClass(
                          enquiry.status
                        )}`}
                      >
                        {enquiry.status}
                      </span>

                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Industry
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {enquiry.industry ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Location
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {enquiry.location ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Influencer Type
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {enquiry.preferred_influencer_type ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Budget
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {enquiry.budget_range ||
                            "Not specified"}
                        </p>
                      </div>

                    </div>

                    <details className="mt-5 rounded-2xl bg-gray-50 p-4">

                      <summary className="cursor-pointer font-semibold text-gray-800">
                        View full enquiry
                      </summary>

                      <div className="mt-4 space-y-4 text-sm">

                        <div>
                          <p className="font-semibold text-gray-700">
                            Campaign Details
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-gray-600">
                            {enquiry.campaign_details ||
                              "Not provided"}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-700">
                            Campaign Timeline
                          </p>

                          <p className="mt-1 text-gray-600">
                            {enquiry.campaign_timeline ||
                              "Not provided"}
                          </p>
                        </div>

                        <div className="border-t border-gray-200 pt-4">

                          <p className="text-gray-600">
                            {enquiry.email}
                          </p>

                          <p className="mt-1 text-gray-600">
                            {enquiry.phone}
                          </p>

                        </div>

                      </div>

                    </details>

                    <div className="mt-5 border-t border-gray-100 pt-5">

                      <form
                        action={updateBrandEnquiryStatus}
                        className="flex flex-col gap-3 sm:flex-row"
                      >

                        <input
                          type="hidden"
                          name="enquiry_id"
                          value={enquiry.id}
                        />

                        <select
                          name="status"
                          defaultValue={enquiry.status}
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-gray-900"
                        >
                          {BRAND_STATUSES.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>

                        <button
                          type="submit"
                          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
                        >
                          Update Status
                        </button>

                      </form>

                    </div>

                  </article>

                ))}

              </div>
            )}

        </section>

        {/* ------------------------------------------------- */}
        {/* INFLUENCER APPLICATIONS */}
        {/* ------------------------------------------------- */}

        <section className="mb-14">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500">
                For Influencers
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Influencer Applications
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review creators who want to join
                FluenSoul.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                {influencerApplications?.length ?? 0} total
              </span>

              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {newInfluencerApplications.length} new
              </span>

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                {availableForAdding.length} ready
              </span>

            </div>

          </div>

          {influencerApplicationsError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">

              <h3 className="font-semibold text-red-700">
                Unable to load influencer applications
              </h3>

              <pre className="mt-4 overflow-auto rounded-xl bg-white/70 p-4 text-xs text-red-600">
                {JSON.stringify(
                  influencerApplicationsError,
                  null,
                  2
                )}
              </pre>

            </div>
          )}

          {!influencerApplicationsError &&
            (!influencerApplications ||
              influencerApplications.length === 0) && (
              <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

                <div className="text-3xl">
                  ✨
                </div>

                <h3 className="mt-4 text-xl font-bold text-gray-900">
                  No influencer applications yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Applications submitted through the
                  public website will appear here.
                </p>

              </div>
            )}

          {!influencerApplicationsError &&
            influencerApplications &&
            influencerApplications.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-2">

                {influencerApplications.map(
                  (application) => {

                    const alreadyAdded =
                      Boolean(
                        application.influencer_id
                      );

                    return (
                      <article
                        key={application.id}
                        className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
                      >

                        <div className="flex items-start gap-4">

                          {application.profile_photo_url ? (
                            <img
                              src={
                                application.profile_photo_url
                              }
                              alt={application.name}
                              className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                              👤
                            </div>
                          )}

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                              <div className="min-w-0">

                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                  Creator Application
                                </p>

                                <h3 className="mt-1 truncate text-xl font-bold text-gray-900">
                                  {application.name}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                  {application.category ||
                                    "Creator"}
                                </p>

                              </div>

                              <span
                                className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${getApplicationStatusClass(
                                  application.status
                                )}`}
                              >
                                {application.status}
                              </span>

                            </div>

                          </div>

                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">

                          <div className="rounded-2xl bg-gray-50 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Followers
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                              {application.followers ||
                                "Not specified"}
                            </p>

                          </div>

                          <div className="rounded-2xl bg-gray-50 p-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Location
                            </p>

                            <p className="mt-1 font-semibold text-gray-900">
                              {application.location ||
                                "Not specified"}
                            </p>

                          </div>

                        </div>

                        <div className="mt-5 space-y-1 text-sm text-gray-500">

                          <p>
                            {application.email}
                          </p>

                          <p>
                            {application.phone}
                          </p>

                        </div>

                        <details className="mt-5 rounded-2xl bg-gray-50 p-4">

                          <summary className="cursor-pointer font-semibold text-gray-800">
                            View full application
                          </summary>

                          <div className="mt-4 space-y-4 text-sm">

                            <div>
                              <p className="font-semibold text-gray-700">
                                Instagram
                              </p>

                              <p className="mt-1 break-all text-gray-600">
                                {application.instagram ||
                                  "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-gray-700">
                                YouTube
                              </p>

                              <p className="mt-1 break-all text-gray-600">
                                {application.youtube ||
                                  "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-gray-700">
                                Other Social Links
                              </p>

                              <p className="mt-1 whitespace-pre-wrap break-all text-gray-600">
                                {application.other_social_links ||
                                  "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-gray-700">
                                Portfolio / Reel Links
                              </p>

                              <p className="mt-1 whitespace-pre-wrap break-all text-gray-600">
                                {application.portfolio_links ||
                                  "Not provided"}
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-gray-700">
                                Additional Information
                              </p>

                              <p className="mt-1 whitespace-pre-wrap text-gray-600">
                                {application.additional_information ||
                                  "Not provided"}
                              </p>
                            </div>

                          </div>

                        </details>

                        <div className="mt-5 border-t border-gray-100 pt-5">

                          {alreadyAdded ? (

                            <div className="space-y-3">

                              <div className="rounded-2xl bg-green-50 p-4">

                                <p className="font-semibold text-green-700">
                                  ✓ Added to FluenSoul
                                </p>

                                <p className="mt-1 text-sm text-green-600">
                                  This application has already
                                  been converted into a creator
                                  profile.
                                </p>

                              </div>

                              <Link
                                href={`/influencers/${application.influencer_id}`}
                                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
                              >
                                Manage Creator Profile →
                              </Link>

                            </div>

                          ) : (

                            <div className="space-y-3">

                              {[
                                "New",
                                "Reviewed",
                                "Approved",
                              ].includes(
                                application.status
                              ) ? (

                                <form
                                  action={
                                    addApplicationToFluenSoul
                                  }
                                >

                                  <input
                                    type="hidden"
                                    name="application_id"
                                    value={
                                      application.id
                                    }
                                  />

                                  <button
                                    type="submit"
                                    className="w-full rounded-xl bg-gray-900 px-4 py-3.5 font-semibold text-white transition hover:bg-gray-700"
                                  >
                                    + Add to FluenSoul
                                  </button>

                                </form>

                              ) : (

                                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                                  Mark this application as
                                  Reviewed or Approved before
                                  adding it to FluenSoul.
                                </div>

                              )}

                              <form
                                action={
                                  updateInfluencerApplicationStatus
                                }
                                className="flex flex-col gap-3 sm:flex-row"
                              >

                                <input
                                  type="hidden"
                                  name="application_id"
                                  value={
                                    application.id
                                  }
                                />

                                <select
                                  name="status"
                                  defaultValue={
                                    application.status
                                  }
                                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-gray-900"
                                >
                                  {INFLUENCER_STATUSES.map(
                                    (status) => (
                                      <option
                                        key={status}
                                        value={status}
                                      >
                                        {status}
                                      </option>
                                    )
                                  )}
                                </select>

                                <button
                                  type="submit"
                                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                  Update Status
                                </button>

                              </form>

                            </div>

                          )}

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </section>

        {/* ------------------------------------------------- */}
        {/* COLLABORATION REQUESTS */}
        {/* ------------------------------------------------- */}

        <section className="mb-14">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-500">
                Collaboration Inbox
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Collaboration Requests
              </h2>
            </div>

            <div className="flex gap-2">

              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                {requests?.length ?? 0} total
              </span>

              <span className="rounded-full bg-pink-100 px-4 py-2 text-sm font-semibold text-pink-600">
                {newRequests.length} new
              </span>

            </div>

          </div>

          {requestsError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">

              <h3 className="font-semibold text-red-700">
                Unable to load collaboration requests
              </h3>

              <p className="mt-2 text-sm text-red-600">
                Please check your Supabase permissions.
              </p>

              <pre className="mt-4 overflow-auto rounded-xl bg-white/70 p-4 text-xs text-red-600">
                {JSON.stringify(
                  requestsError,
                  null,
                  2
                )}
              </pre>

            </div>
          )}

          {!requestsError &&
            (!requests ||
              requests.length === 0) && (
              <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  📥
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  No collaboration requests yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  When a company submits a collaboration
                  request through a creator's public
                  profile, it will appear here.
                </p>

              </div>
            )}

          {!requestsError &&
            requests &&
            requests.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-2">

                {requests.map((request) => {

                  const influencer =
                    getInfluencer(
                      request.influencer_id
                    );

                  return (
                    <article
                      key={request.id}
                      className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                            Collaboration Request
                          </p>

                          <h3 className="mt-2 truncate text-xl font-bold text-gray-900">
                            {request.company_name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {request.contact_person}
                          </p>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${getCollaborationStatusClass(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>

                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">

                        <div className="rounded-2xl bg-gray-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Creator
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            {influencer?.name ??
                              "Unknown creator"}
                          </p>

                          {influencer?.username && (
                            <p className="mt-0.5 text-sm text-gray-500">
                              @{influencer.username}
                            </p>
                          )}

                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Campaign
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            {request.campaign_title ||
                              "Campaign inquiry"}
                          </p>

                          {request.collaboration_type && (
                            <p className="mt-0.5 text-sm text-gray-500">
                              {request.collaboration_type}
                            </p>
                          )}

                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Budget
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            {request.budget ||
                              "Not specified"}
                          </p>

                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Received
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            {new Date(
                              request.created_at
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>

                        </div>

                      </div>

                      <div className="mt-5 border-t border-gray-100 pt-5">

                        <p className="truncate text-sm text-gray-500">
                          {request.email}
                        </p>

                        {request.phone && (
                          <p className="mt-1 text-sm text-gray-500">
                            {request.phone}
                          </p>
                        )}

                      </div>

                      <div className="mt-6">

                        <Link
                          href={`/collaboration-requests/${request.id}`}
                          className="block w-full rounded-xl bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-700"
                        >
                          View Full Request →
                        </Link>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

        </section>

        {/* ------------------------------------------------- */}
        {/* CREATOR PROFILES */}
        {/* ------------------------------------------------- */}

        <section>

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-500">
                Creators
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Creator Profiles
              </h2>
            </div>

            <p className="text-sm text-gray-500">
              {influencers?.length ?? 0} profile
              {(influencers?.length ?? 0) === 1
                ? ""
                : "s"}
            </p>

          </div>

          {influencersError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">

              <h2 className="text-xl font-semibold text-red-600">
                Unable to load creators
              </h2>

              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-sm">
                {JSON.stringify(
                  influencersError,
                  null,
                  2
                )}
              </pre>

            </div>
          )}

          {!influencersError &&
            influencers &&
            influencers.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {influencers.map(
                  (influencer) => (

                    <article
                      key={influencer.id}
                      className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <h3 className="truncate text-xl font-bold text-gray-900">
                            {influencer.name}
                          </h3>

                          <p className="mt-1 truncate text-gray-500">
                            @{influencer.username}
                          </p>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                            influencer.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {influencer.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                      <div className="mt-6 grid gap-2">

                        <Link
                          href={`/influencers/${influencer.id}`}
                          className="block w-full rounded-xl bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-700"
                        >
                          Manage Profile
                        </Link>

                        <Link
                          href={`/profile/${influencer.username}`}
                          target="_blank"
                          className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          View Public Profile ↗
                        </Link>

                      </div>

                    </article>

                  )
                )}

              </div>
            )}

          {!influencersError &&
            (!influencers ||
              influencers.length === 0) && (
              <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

                <p className="text-gray-500">
                  No creator profiles found.
                </p>

                <Link
                  href="/influencers/new"
                  className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700"
                >
                  + Add Your First Creator
                </Link>

              </div>
            )}

        </section>

        {/* FOOTER */}

        <footer className="py-12 text-center">

          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
            FluenSoul • Admin
          </p>

        </footer>

      </div>
    </main>
  );
}