import { User } from "lucide-react";
import { formatDateTime } from "../../lib/formatters";
import { formatMessageText } from "../../lib/markdown";
import { ToolResultBlock } from "./ToolResultBlock";
import type { Message, ContentBlock } from "../../lib/types";

export function UserMessage({ msg }: { msg: Message }) {
  const content = msg.message?.content;
  let bubbleContent = "";

  if (typeof content === "string") {
    bubbleContent = formatMessageText(content);
  } else if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const block of content as ContentBlock[]) {
      if (block.type === "text" && block.text) {
        parts.push(formatMessageText(block.text));
      }
    }
    if (parts.length === 0) return null;
    bubbleContent = parts.join("");
  }

  const hasToolResults = Array.isArray(content) && (content as ContentBlock[]).some((b) => b.type === "tool_result");

  return (
    <div className="chat chat-end mb-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 justify-end">
        <User className="h-3 w-3" />
        <span>You</span>
        {msg.timestamp && <time className="text-muted-foreground/60">{formatDateTime(msg.timestamp)}</time>}
      </div>
      <div className="rounded-xl bg-primary/10 border border-primary/15 px-4 py-2.5">
        <div className="md-content" dangerouslySetInnerHTML={{ __html: bubbleContent }} />
        {hasToolResults &&
          (content as ContentBlock[])
            .filter((b) => b.type === "tool_result")
            .map((block, i) => (
              <ToolResultBlock key={i} content={block.content} isError={block.is_error} />
            ))}
      </div>
    </div>
  );
}
