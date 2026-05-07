import { Spinner as KiboSpinner } from "../components/kibo-ui/spinner";

export function Spinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 gap-3 text-muted-foreground">
      <KiboSpinner variant="ring" size={28} />
      <span className="text-sm">{text}</span>
    </div>
  );
}
