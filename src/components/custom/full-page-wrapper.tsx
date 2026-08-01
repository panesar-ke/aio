import { cn } from "@/lib/utils";

export function FullPageWrapper({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)} {...props}>
      {children}
    </div>
  );
}
