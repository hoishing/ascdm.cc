import { FileText } from "lucide-react";
import { formatMessageText } from "../../lib/markdown";
import type { Message } from "../../lib/types";

export function SummaryMessage({ msg }: { msg: Message }) {
  return (
    <div className="text-center my-3">
      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 uppercase tracking-wide mb-1.5">
        <FileText className="h-3 w-3" />
        Summary
      </div>
      <div
        className="inline-block border border-dashed border-primary/20 bg-primary/5 rounded-xl px-4 py-2.5 text-sm text-muted-foreground max-w-[85%] text-left"
        dangerouslySetInnerHTML={{ __html: formatMessageText(msg.summary || "") }}
      />
    </div>
  );
}
