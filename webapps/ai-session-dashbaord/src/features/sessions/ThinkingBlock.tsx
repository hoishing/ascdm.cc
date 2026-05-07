import { Brain } from "lucide-react";
import { Collapsible } from "./Collapsible";
import { esc, truncateText } from "../../lib/formatters";

interface ThinkingBlockProps {
  thinking: string;
}

export function ThinkingBlock({ thinking }: ThinkingBlockProps) {
  return (
    <div className="opacity-60">
      <Collapsible
        header={
          <span className="inline-flex items-center gap-1.5 italic">
            <Brain className="h-3 w-3" />
            Thinking
          </span>
        }
      >
        <div
          className="whitespace-pre-wrap opacity-70 italic text-sm"
          dangerouslySetInnerHTML={{ __html: esc(truncateText(thinking, 3000)) }}
        />
      </Collapsible>
    </div>
  );
}
