import Link from "next/link";
import { createClient } from "../lib/server";

export default async function Home() {
  const supabase = await createClient();

  // ---------------------------------------------------------
  // LOAD INFLUENCERS
  // ---------------------------------------------------------

  const {
    data: influencers,
    error: influencersError,
  } = await supabase
    .from("influencers")
    .select("id, username, name, is_active")
    .order("name", { ascending: true });

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
    .order("created_at", { ascending: false });

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  function getInfluencer(influencerId: string) {
    return (
      influencers?.find(
        (influencer) => influencer.id === influencerId
      ) ?? null
    );
  }

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

  const newRequests =
    requests?.filter(
      (request) => request.status === "new"
    ) ?? [];

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-10">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
                Influencer Platform
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Admin Dashboard
              </h1>

              <p className="mt-3 max-w-xl text-gray-500">
                Manage influencer profiles and incoming
                collaboration opportunities from one place.
              </p>

            </div>

            <Link
              href="/influencers/new"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-gray-900 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-700"
            >
              + Add Influencer
            </Link>

          </div>

        </header>


        {/* =====================================================
            QUICK STATS
        ====================================================== */}

        <section className="mb-10 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Total Influencers
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {influencers?.length ?? 0}
            </p>

          </div>


          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Total Requests
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

        </section>


        {/* =====================================================
            COLLABORATION REQUESTS
        ====================================================== */}

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


          {/* REQUEST ERROR */}

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


          {/* NO REQUESTS */}

          {!requestsError &&
            (!requests || requests.length === 0) && (
              <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  📥
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  No collaboration requests yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  When a company submits a collaboration request
                  through an influencer's public profile, it will
                  appear here.
                </p>

              </div>
            )}


          {/* REQUEST LIST */}

          {!requestsError &&
            requests &&
            requests.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-2">

                {requests.map((request) => {

                  const influencer = getInfluencer(
                    request.influencer_id
                  );

                  return (
                    <article
                      key={request.id}
                      className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >

                      {/* HEADER */}

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
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${getStatusClass(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>

                      </div>


                      {/* INFORMATION GRID */}

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">

                        <div className="rounded-2xl bg-gray-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Influencer
                          </p>

                          <p className="mt-1 font-semibold text-gray-900">
                            {influencer?.name ??
                              "Unknown influencer"}
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


                      {/* CONTACT */}

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


                      {/* ACTION */}

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


        {/* =====================================================
            INFLUENCERS
        ====================================================== */}

        <section>

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-500">
                Creators
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Influencers
              </h2>

            </div>

            <p className="text-sm text-gray-500">
              {influencers?.length ?? 0} profile
              {(influencers?.length ?? 0) === 1
                ? ""
                : "s"}
            </p>

          </div>


          {/* INFLUENCER ERROR */}

          {influencersError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">

              <h2 className="text-xl font-semibold text-red-600">
                Unable to load influencers
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


          {/* INFLUENCER LIST */}

          {!influencersError &&
            influencers &&
            influencers.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {influencers.map((influencer) => (

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

                ))}

              </div>
            )}


          {/* NO INFLUENCERS */}

          {!influencersError &&
            (!influencers ||
              influencers.length === 0) && (
              <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

                <p className="text-gray-500">
                  No influencers found.
                </p>

                <Link
                  href="/influencers/new"
                  className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700"
                >
                  + Add Your First Influencer
                </Link>

              </div>
            )}

        </section>


        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="py-12 text-center">

          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
            Influencer Platform • Admin
          </p>

        </footer>

      </div>
    </main>
  );
}