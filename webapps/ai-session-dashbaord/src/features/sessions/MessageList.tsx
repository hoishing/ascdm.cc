import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "../../lib/types";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [messages]);

  return (
    <div ref={containerRef}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} msg={msg} />
      ))}
    </div>
  );
}
