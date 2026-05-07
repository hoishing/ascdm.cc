import { Bot, Code2, Shield, Zap, BarChart3 } from "lucide-react";
import { useClaudeDir } from "../hooks/useClaudeDir";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import type { SessionKind } from "../lib/types";

const sourceOptions: Array<{
  kind: SessionKind;
  label: string;
  folder: string;
  icon: typeof Bot;
}> = [
  { kind: "claude", label: "Claude", folder: "~/.claude", icon: Bot },
  { kind: "codex", label: "Codex", folder: "~/.codex", icon: Code2 },
];

export function ConnectScreen() {
  const { connect, error, mode } = useClaudeDir();
  const hasApi = typeof window !== "undefined" && "showDirectoryPicker" in window;
  const canSelect = mode === "server" || hasApi;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-lg font-bold">A</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          AI Session Dashboard
        </h2>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Browse local AI coding sessions, view plans, and search conversation history.
          All data stays on your machine.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="bg-muted/50">
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-chart-2" />
              <p className="text-xs font-medium">Analytics</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Zap className="h-5 w-5 mx-auto mb-2 text-chart-3" />
              <p className="text-xs font-medium">Fast Search</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Shield className="h-5 w-5 mx-auto mb-2 text-chart-4" />
              <p className="text-xs font-medium">100% Local</p>
            </CardContent>
          </Card>
        </div>

        {canSelect ? (
          <div className="grid grid-cols-2 gap-3">
            {sourceOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.kind}
                  size="lg"
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => { void connect(option.kind); }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{option.label}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">{option.folder}</span>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="text-destructive text-sm bg-destructive/10 rounded-lg p-4">
            File System Access API is not supported in this browser. Please use Chrome or Edge.
          </div>
        )}
        <p className="mt-4 text-muted-foreground text-xs leading-relaxed">
          Select the session source to browse.
        </p>
        {error && (
          <div className="mt-4 text-destructive text-sm bg-destructive/10 rounded-lg p-3">{error}</div>
        )}
      </div>
    </div>
  );
}
