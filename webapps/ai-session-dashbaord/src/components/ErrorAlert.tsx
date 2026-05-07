import { AlertCircle } from "lucide-react";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 my-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-destructive">Something went wrong</p>
        <p className="text-sm text-destructive/80 mt-1">{message}</p>
      </div>
    </div>
  );
}
