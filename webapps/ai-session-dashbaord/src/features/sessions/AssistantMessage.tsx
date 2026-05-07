import { Bot } from "lucide-react";
import { formatDateTime } from "../../lib/formatters";
import { formatMessageText } from "../../lib/markdown";
import { ToolUseBlock } from "./ToolUseBlock";
import { ToolResultBlock } from "./ToolResultBlock";
import { ThinkingBlock } from "./ThinkingBlock";
import { Badge } from "../../components/ui/badge";
import type { Message, ContentBlock } from "../../lib/types";

export function AssistantMessage({ msg }: { msg: Message }) {
  const blocks = (msg.message?.content || []) as ContentBlock[];

  return (
    <div className="chat chat-start mb-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Bot className="h-3 w-3" />
        <span>Assistant</span>
        {msg.timestamp && <time className="text-muted-foreground/60">{formatDateTime(msg.timestamp)}</time>}
      </div>
      <div className="rounded-xl bg-muted/70 border border-border/50 px-4 py-2.5">
        {blocks.map((block, i) => {
          switch (block.type) {
            case "text":
              return <div key={i} className="md-content" dangerouslySetInnerHTML={{ __html: formatMessageText(block.text || "") }} />;
            case "tool_use":
              return <ToolUseBlock key={i} name={block.name || "tool"} input={block.input} />;
            case "thinking":
              return <ThinkingBlock key={i} thinking={block.thinking || ""} />;
            case "tool_result":
              return <ToolResultBlock key={i} content={block.content} isError={block.is_error} />;
            default:
              return null;
          }
        })}
      </div>
      {msg.message?.model && (
        <div className="mt-1">
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground/60 h-4 px-1.5">{msg.message.model}</Badge>
        </div>
      )}
    </div>
  );
}
