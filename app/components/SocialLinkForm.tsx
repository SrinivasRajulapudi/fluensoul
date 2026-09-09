"use client";

import { useState } from "react";
import SocialPlatformIcon from "./SocialPlatformIcon";

export default function SocialLinkForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [platform, setPlatform] = useState("");
  const isOther = platform === "other";

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
        <select
          name="platform"
          required
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="" disabled className="bg-black">
            Platform
          </option>
          <option value="instagram" className="bg-black">Instagram</option>
          <option value="youtube" className="bg-black">YouTube</option>
          <option value="facebook" className="bg-black">Facebook</option>
          <option value="x" className="bg-black">X</option>
          <option value="tiktok" className="bg-black">TikTok</option>
          <option value="linkedin" className="bg-black">LinkedIn</option>
          <option value="threads" className="bg-black">Threads</option>
          <option value="website" className="bg-black">Website</option>
          <option value="other" className="bg-black">Other</option>
        </select>

        <input
          name="url"
          type="url"
          required
          placeholder="https://..."
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
        />

        <button
          type="submit"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Add
        </button>
      </div>

      {isOther && (
        <div className="rounded-2xl border border-pink-400/20 bg-pink-500/[0.04] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <SocialPlatformIcon platform="other" className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Custom platform</p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                Enter the platform name and upload its logo. The logo will be shown on your public profile.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
                Platform Name
              </label>
              <input
                name="platform_name"
                required
                placeholder="e.g. Moj, Snapchat, Josh"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
                Platform Logo
              </label>
              <input
                name="logo"
                type="file"
                required
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"
              />
              <p className="mt-2 text-[11px] text-white/30">
                PNG, JPG, WEBP or SVG · Max 2 MB
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
