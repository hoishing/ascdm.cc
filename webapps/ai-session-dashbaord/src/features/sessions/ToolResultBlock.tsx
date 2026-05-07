import { CheckCircle2, XCircle } from "lucide-react";
import { Collapsible } from "./Collapsible";
import { esc, truncateText } from "../../lib/formatters";

interface ToolResultBlockProps {
  content: string | unknown;
  isError?: boolean;
}

export function ToolResultBlock({ content, isError }: ToolResultBlockProps) {
  const text = typeof content === "string"
    ? content
    : content ? JSON.stringify(content, null, 2) : "(no output)";
  const label = isError ? "Tool Error" : "Tool Result";

  return (
    <Collapsible
      header={
        isError ? (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <XCircle className="h-3 w-3" />
            {label}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            {label}
          </span>
        )
      }
    >
      <pre className={isError ? "text-destructive border-destructive/20" : ""} dangerouslySetInnerHTML={{ __html: esc(truncateText(text, 2000)) }} />
    </Collapsible>
  );
}
