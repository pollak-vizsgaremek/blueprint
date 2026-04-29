import Link from "next/link";
import { LucideIcon } from "lucide-react";

type DataStateTone = "empty" | "error";

type DataStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: DataStateTone;
  compact?: boolean;
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const toneClasses: Record<DataStateTone, string> = {
  empty: "border-faded/20 bg-secondary/30 text-faded",
  error: "border-red-200 bg-red-50 text-red-700",
};

export const DataState = ({
  icon: Icon,
  title,
  description,
  tone = "empty",
  compact = false,
  href,
  actionLabel,
  onAction,
}: DataStateProps) => {
  const sizeClass = compact ? "min-h-36" : "min-h-56";
  const iconSize = compact ? 30 : 40;

  return (
    <div
      className={`w-full rounded-xl border ${toneClasses[tone]} ${sizeClass} flex items-center justify-center px-4 py-6 text-center`}
    >
      <div className="flex max-w-md flex-col items-center gap-2">
        <Icon size={iconSize} className="opacity-80" />
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-sm opacity-90">{description}</p>
        ) : null}
        {href && actionLabel ? (
          <Link
            href={href}
            className="mt-2 rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out"
          >
            {actionLabel}
          </Link>
        ) : null}
        {!href && onAction && actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 rounded-lg border border-faded/30 px-3 py-1.5 text-sm hover:bg-faded/10 transition ease-in-out cursor-pointer"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};
