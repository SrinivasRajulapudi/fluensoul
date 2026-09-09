import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/server";
import LogoutButton from "../../components/LogoutButton";
import FluenSoulLogo from "../../components/FluenSoulLogo";

type PageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

type CollaborationRequest = {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  collaboration_type: string | null;
  campaign_title: string | null;
  campaign_details: string;
  budget: string | null;
  preferred_date: string | null;
  status: string;
  created_at: string;
};

const allowedStatuses = [
  "new",
  "reviewing",
  "accepted",
  "rejected",
  "completed",
] as const;

function getStatusClass(status: string) {
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

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(date: string | null) {
  if (!date) {
    return "Not specified";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CreatorCollaborationsPage({
  searchParams,
}: PageProps) {
  const { saved, error: queryError } = await searchParams;

  const supabase = await createClient();

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================================
  // CHECK CREATOR ROLE
  // =========================================================

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleData?.role !== "creator") {
    redirect("/");
  }

  // =========================================================
  // LOAD CREATOR PROFILE
  // =========================================================

  const { data: influencer, error: influencerError } =
    await supabase
      .from("influencers")
      .select("id, name, username")
      .eq("user_id", user.id)
      .maybeSingle();

  if (influencerError || !influencer) {
    return (
      <main className="min-h-screen bg-[#f4f5f7] p-6 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mb-7 flex justify-center">
              <FluenSoulLogo
                width={220}
                className="max-w-[220px]"
              />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
              FluenSoul Creator Studio
            </p>

            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Complete Your Profile First
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-gray-500">
              Create your creator profile before managing
              collaboration requests.
            </p>

            <Link
              href="/creator/profile"
              className="mt-7 inline-flex rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              Go to Profile →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // LOAD REQUESTS
  // =========================================================

  const {
    data: requests,
    error: requestsError,
  } = await supabase
    .from("collaboration_requests")
    .select(`
      id,
      company_name,
      contact_person,
      email,
      phone,
      collaboration_type,
      campaign_title,
      campaign_details,
      budget,
      preferred_date,
      status,
      created_at
    `)
    .eq("influencer_id", influencer.id)
    .order("created_at", {
      ascending: false,
    });

  const collaborationRequests: CollaborationRequest[] =
    requests ?? [];

  // =========================================================
  // UPDATE REQUEST STATUS
  // =========================================================

  async function updateRequestStatus(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // ---------------------------------------------------------
    // VERIFY CREATOR ROLE
    // ---------------------------------------------------------

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "creator") {
      redirect("/");
    }

    // ---------------------------------------------------------
    // FIND CREATOR PROFILE
    // ---------------------------------------------------------

    const { data: creator } = await supabase
      .from("influencers")
      .select("id, username")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!creator) {
      redirect("/creator/profile");
    }

    // ---------------------------------------------------------
    // READ FORM DATA
    // ---------------------------------------------------------

    const requestId = String(
      formData.get("request_id") ?? ""
    ).trim();

    const status = String(
      formData.get("status") ?? ""
    ).trim();

    if (!requestId || !allowedStatuses.includes(status as any)) {
      redirect("/creator/collaborations?error=status");
    }

    // ---------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------

    const { error } = await supabase
      .from("collaboration_requests")
      .update({
        status,
      })
      .eq("id", requestId)
      .eq("influencer_id", creator.id);

    if (error) {
      console.error(
        "Collaboration status update failed:",
        error
      );

      redirect("/creator/collaborations?error=update");
    }

    revalidatePath("/creator/collaborations");
    revalidatePath("/creator");

    redirect("/creator/collaborations?saved=status");
  }

  // =========================================================
  // COUNTS
  // =========================================================

  const newCount = collaborationRequests.filter(
    (request) => request.status === "new"
  ).length;

  const reviewingCount = collaborationRequests.filter(
    (request) => request.status === "reviewing"
  ).length;

  const acceptedCount = collaborationRequests.filter(
    (request) => request.status === "accepted"
  ).length;

  // =========================================================
  // ERROR MESSAGE
  // =========================================================

  function getErrorMessage() {
    if (queryError === "status") {
      return "Please select a valid collaboration status.";
    }

    if (queryError === "update") {
      return "The collaboration status could not be updated.";
    }

    return null;
  }

  const errorMessage = getErrorMessage();

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-10">
<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-7">
                <FluenSoulLogo
                  width={220}
                  className="max-w-[220px]"
                />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
                FluenSoul Creator Studio
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Collaboration Requests
              </h1>

              <p className="mt-3 max-w-xl text-gray-500">
                Review and manage brands interested in working
                with you.
              </p>
            </div>
<div className="flex flex-wrap gap-3">
            <Link
              href="/creator"
              className="w-fit rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ← Dashboard
            </Link>
<LogoutButton />
</div>
          </div>
        </header>

        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {saved === "status" && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="font-semibold text-green-700">
              Collaboration status updated successfully.
            </p>

            <p className="mt-1 text-sm text-green-600">
              Your response has been saved.
            </p>
          </div>
        )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {(errorMessage || requestsError) && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-700">
              {errorMessage ??
                "Unable to load collaboration requests."}
            </p>
          </div>
        )}

        {/* =====================================================
            QUICK STATS
        ====================================================== */}

        <section className="mb-10 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              New Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-pink-500">
              {newCount}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Waiting for your review
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Reviewing
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {reviewingCount}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Currently being considered
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Accepted
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {acceptedCount}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Collaboration opportunities
            </p>
          </div>

        </section>

        {/* =====================================================
            REQUEST LIST
        ====================================================== */}

        <section>

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-500">
              Your Inbox
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Incoming Opportunities
            </h2>
          </div>

          {collaborationRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                ✦
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                No collaboration requests yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                When a brand submits a collaboration request
                through your public profile, it will appear here.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {collaborationRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"
                >

                  {/* TOP */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                        Collaboration Request
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-gray-900">
                        {request.company_name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {request.contact_person}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {formatStatus(request.status)}
                    </span>

                  </div>

                  {/* INFORMATION */}

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Campaign
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {request.campaign_title ||
                          "Campaign inquiry"}
                      </p>

                      {request.collaboration_type && (
                        <p className="mt-1 text-sm text-gray-500">
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
                        Preferred Date
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(request.preferred_date)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Received
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(request.created_at)}
                      </p>
                    </div>

                  </div>

                  {/* DETAILS */}

                  <div className="mt-6 border-t border-gray-100 pt-6">

                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Campaign Details
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                      {request.campaign_details}
                    </p>

                  </div>

                  {/* CONTACT */}

                  <div className="mt-6 border-t border-gray-100 pt-6">

                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Contact
                    </p>

                    <div className="mt-3 flex flex-col gap-1 text-sm text-gray-600">
                      <a
                        href={`mailto:${request.email}`}
                        className="font-medium text-gray-900 hover:text-pink-500"
                      >
                        {request.email}
                      </a>

                      {request.phone && (
                        <a
                          href={`tel:${request.phone}`}
                          className="hover:text-pink-500"
                        >
                          {request.phone}
                        </a>
                      )}
                    </div>

                  </div>

                  {/* STATUS CONTROL */}

                  <div className="mt-6 border-t border-gray-100 pt-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Update Request Status
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Keep your collaboration inbox organized.
                        </p>
                      </div>

                      <form
                        action={updateRequestStatus}
                        className="flex flex-col gap-3 sm:flex-row"
                      >

                        <input
                          type="hidden"
                          name="request_id"
                          value={request.id}
                        />

                        <select
                          name="status"
                          defaultValue={request.status}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        >
                          <option value="new">
                            New
                          </option>

                          <option value="reviewing">
                            Reviewing
                          </option>

                          <option value="accepted">
                            Accepted
                          </option>

                          <option value="rejected">
                            Rejected
                          </option>

                          <option value="completed">
                            Completed
                          </option>
                        </select>

                        <button
                          type="submit"
                          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
                        >
                          Save Status
                        </button>

                      </form>

                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="py-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
            {influencer.name} · FluenSoul Creator
          </p>
        </footer>

      </div>
    </main>
  );
}