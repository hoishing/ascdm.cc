import { Wrench } from "lucide-react";
import { Collapsible } from "./Collapsible";
import { esc } from "../../lib/formatters";

interface ToolUseBlockProps {
  name: string;
  input: unknown;
}

export function ToolUseBlock({ name, input }: ToolUseBlockProps) {
  return (
    <Collapsible
      header={
        <span className="inline-flex items-center gap-1.5 text-primary font-mono text-sm">
          <Wrench className="h-3 w-3" />
          {name}
        </span>
      }
    >
      <pre dangerouslySetInnerHTML={{ __html: esc(JSON.stringify(input, null, 2)) }} />
    </Collapsible>
  );
}
