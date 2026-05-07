import { Info } from "lucide-react";
import { truncate } from "../../lib/formatters";
import type { Message } from "../../lib/types";

export function SystemMessage({ msg }: { msg: Message }) {
  const text = msg.content || msg.subtype || "System message";
  return (
    <div className="text-center my-3">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 italic">
        <Info className="h-3 w-3" />
        {truncate(text, 200)}
      </span>
    </div>
  );
}
