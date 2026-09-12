import Image from "next/image";
import { cn } from "@/lib/utils";

/** The college's own crest, used as the platform's brand mark throughout
 * the app (nav bars, auth screens) instead of a generic icon. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/college-logo.jpeg"
      alt="College logo"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full ring-1 ring-black/5", className)}
      priority
    />
  );
}
