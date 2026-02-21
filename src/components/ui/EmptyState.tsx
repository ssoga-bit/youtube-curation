import { memo } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  message: string;
  description?: string;
}

export const EmptyState = memo(function EmptyState({
  icon: Icon = Inbox,
  message,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-12 h-12 text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium">{message}</p>
      {description && (
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      )}
    </div>
  );
});
