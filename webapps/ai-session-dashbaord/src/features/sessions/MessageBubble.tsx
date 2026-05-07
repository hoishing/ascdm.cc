import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { SystemMessage } from "./SystemMessage";
import { SummaryMessage } from "./SummaryMessage";
import { isDisplayableMessage } from "../../lib/parsers";
import type { Message } from "../../lib/types";

export function MessageBubble({ msg }: { msg: Message }) {
  if (!isDisplayableMessage(msg)) return null;

  switch (msg.type) {
    case "user": return <UserMessage msg={msg} />;
    case "assistant": return <AssistantMessage msg={msg} />;
    case "system": return <SystemMessage msg={msg} />;
    case "summary": return <SummaryMessage msg={msg} />;
    default: return null;
  }
}
