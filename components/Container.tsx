import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("container-site", className)} {...props} />;
}
