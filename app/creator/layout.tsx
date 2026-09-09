import { CreatorSessionGuard } from "../components/CreatorSessionGuard";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CreatorSessionGuard />
      {children}
    </>
  );
}