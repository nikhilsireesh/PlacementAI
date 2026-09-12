import Image from "next/image";
import { cn } from "@/lib/utils";

/** Full-bleed campus backdrop for the auth screens, with a wash so the
 * centered form card stays sharply legible over it. */
export function AuthBackground({
  children,
  maxWidthClassName = "max-w-sm",
}: {
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <Image
        src="/campus-courtyard.jpg"
        alt="College campus courtyard"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1030]/80 via-[#0d1030]/60 to-[#0d1030]/80" />
      <div className={cn("relative w-full", maxWidthClassName)}>{children}</div>
    </div>
  );
}
