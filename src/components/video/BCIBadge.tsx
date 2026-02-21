import { memo } from "react";
import { getBCILabel } from "@/lib/bci";
import { BCI_LABEL_THRESHOLDS } from "@/lib/constants";
import clsx from "clsx";

interface BCIBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export const BCIBadge = memo(function BCIBadge({ score, size = "sm" }: BCIBadgeProps) {
  const { label, className } = getBCILabel(score);

  if (!label) return null;

  return (
    <span
      className={clsx(
        className,
        size === "md" && "text-sm px-3 py-1"
      )}
    >
      {label}
    </span>
  );
});

/** Numeric score badge used in admin tables */
export const BCIScoreBadge = memo(function BCIScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={clsx(
        "text-xs font-bold px-2 py-0.5 rounded-full",
        score >= BCI_LABEL_THRESHOLDS.EXCELLENT
          ? "bg-green-100 text-green-800"
          : score >= BCI_LABEL_THRESHOLDS.GOOD
          ? "bg-blue-100 text-blue-800"
          : "bg-slate-100 text-slate-600"
      )}
    >
      {score}
    </span>
  );
});
