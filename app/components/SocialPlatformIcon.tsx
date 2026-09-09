export default function SocialPlatformIcon({
  platform,
  className = "h-6 w-6",
}: {
  platform: string;
  className?: string;
}) {
  const p = platform.toLowerCase();

  if (p === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (p === "youtube") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
      </svg>
    );
  }

  if (p === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.6-1.6h1.7V3.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H7.7v3h2.7v8h3.1z" />
      </svg>
    );
  }

  if (p === "x" || p === "twitter") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-6.2L6.7 22H3.6l7.3-8.4L3 2h6.3l4.4 5.7L18.9 2zm-1.1 17.3h1.7L8.3 4.6H6.5l11.3 14.7z" />
      </svg>
    );
  }

  if (p === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M5.2 8.4H2V22h3.2V8.4zM3.6 2C2.6 2 2 2.7 2 3.6s.6 1.6 1.6 1.6 1.6-.7 1.6-1.6S4.5 2 3.6 2zM22 14.2c0-4.1-2.2-6-5.2-6-2.4 0-3.5 1.3-4.1 2.2V8.4H9.5V22h3.2v-7.4c0-2 .4-3.9 2.8-3.9 2.3 0 2.4 2.2 2.4 4V22H21v-7.8c0-.1 0-.1 0 0z" />
      </svg>
    );
  }

  if (p === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M15.5 3c.4 2.3 1.7 3.7 4 4v3.1c-1.5-.1-2.8-.5-4-1.3v6.1c0 4-2.7 6.1-6 6.1-3.1 0-5.5-2.1-5.5-5.1 0-3.4 2.8-5.6 6.4-5.1v3.2c-1.9-.4-3.2.4-3.2 1.9 0 1.1.9 1.9 2.1 1.9 1.4 0 2.2-.9 2.2-2.7V3h4z" />
      </svg>
    );
  }

  if (p === "threads") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path d="M12 21c5.2 0 8-3.2 8-8.1 0-5.1-2.9-8.9-8.2-8.9-4.2 0-7 2.5-7 6.2 0 3.6 2.8 5.7 6.3 5.7 3.4 0 5.5-1.8 5.5-4.4 0-2.8-2.2-4.6-5.3-4.6-2.4 0-4 1.2-4 3.1 0 1.8 1.4 2.8 3.1 2.8 2.1 0 3.5-1.2 3.5-3.4 0-4-2.4-5.9-5.8-5.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (p === "website") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3z" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M10.5 13.5l3-3M8 16l-1.5 1.5a3.2 3.2 0 104.5 4.5l3-3a3.2 3.2 0 000-4.5M16 8l1.5-1.5A3.2 3.2 0 1013 2l-3 3a3.2 3.2 0 000 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
