import Image from "next/image";

type FluenSoulLogoProps = {
  width?: number;
  className?: string;
};

export default function FluenSoulLogo({
  width = 190,
  className = "",
}: FluenSoulLogoProps) {
  const height = Math.round(width * 0.333);

  return (
    <Image
      src="/fluensoul-logo.png"
      alt="FluenSoul — Create, Connect, Grow"
      width={width}
      height={height}
      priority
      className={`h-auto w-auto object-contain ${className}`}
    />
  );
}