import { useContext } from "react";
import { ClaudeDirContext } from "../contexts/ClaudeDirContext";

export function useClaudeDir() {
  const ctx = useContext(ClaudeDirContext);
  if (!ctx) throw new Error("useClaudeDir must be used within ClaudeDirProvider");
  return ctx;
}
