"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase";

type ImageUploadProps = {
  influencerId: string;
  currentImageUrl: string | null;
};

export default function ImageUpload({
  influencerId,
  currentImageUrl,
}: ImageUploadProps) {
  const supabase = createClient();

  const [imageUrl, setImageUrl] = useState(
    currentImageUrl ?? ""
  );

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      setMessage("");

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      // -------------------------------------------------------
      // VALIDATE FILE
      // -------------------------------------------------------

      if (!file.type.startsWith("image/")) {
        setMessage(
          "Please select an image file."
        );

        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage(
          "Image must be smaller than 5MB."
        );

        return;
      }

      setUploading(true);

      // -------------------------------------------------------
      // GET CURRENT USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage(
          "You must be logged in to upload an image."
        );

        setUploading(false);

        return;
      }

      // -------------------------------------------------------
      // CREATE SAFE FILE NAME
      // -------------------------------------------------------

      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExtension}`;

      const filePath =
        `${influencerId}/${fileName}`;

      // -------------------------------------------------------
      // UPLOAD
      // -------------------------------------------------------

      const {
        error: uploadError,
      } = await supabase.storage
        .from("influencer-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error(
          "Image upload failed:",
          uploadError
        );

        setMessage(
          uploadError.message ||
            "Image upload failed."
        );

        setUploading(false);

        return;
      }

      // -------------------------------------------------------
      // GET PUBLIC URL
      // -------------------------------------------------------

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("influencer-images")
        .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData.publicUrl;

      // -------------------------------------------------------
      // UPDATE INFLUENCER
      // -------------------------------------------------------

      const {
        error: updateError,
      } = await supabase
        .from("influencers")
        .update({
          hero_image_url: publicUrl,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", influencerId);

      if (updateError) {
        console.error(
          "Image URL update failed:",
          updateError
        );

        setMessage(
          "Image uploaded, but the profile could not be updated."
        );

        setUploading(false);

        return;
      }

      setImageUrl(publicUrl);

      setMessage(
        "Image uploaded successfully."
      );

    } catch (error) {
      console.error(
        "Unexpected image upload error:",
        error
      );

      setMessage(
        "Something went wrong while uploading the image."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* =====================================================
          IMAGE PREVIEW
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">

        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Influencer profile"
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="flex h-72 items-center justify-center">

            <div className="text-center">

              <div className="text-4xl">
                🖼️
              </div>

              <p className="mt-3 text-sm font-medium text-gray-500">
                No profile image uploaded
              </p>

            </div>

          </div>
        )}

      </div>


      {/* =====================================================
          UPLOAD
      ====================================================== */}

      <div>

        <label
          htmlFor="influencer-image"
          className={`inline-flex cursor-pointer items-center justify-center rounded-xl px-6 py-3 font-semibold text-white transition ${
            uploading
              ? "cursor-not-allowed bg-gray-400"
              : "bg-gray-900 hover:bg-gray-700"
          }`}
        >
          {uploading
            ? "Uploading..."
            : imageUrl
            ? "Replace Image"
            : "Choose Image"}

          <input
            id="influencer-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={handleUpload}
            className="hidden"
          />
        </label>

        <p className="mt-2 text-xs text-gray-400">
          JPG, PNG, WEBP or GIF • Maximum 5MB
        </p>

      </div>


      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.includes("successfully")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </div>
      )}

    </div>
  );
}