import { NavLink, Outlet } from "react-router";
import { RefreshCw, X, MessageSquare, ClipboardList, Search } from "lucide-react";
import { useClaudeDir } from "../hooks/useClaudeDir";
import { ConnectScreen } from "./ConnectScreen";
import { ThemeToggle } from "./ThemeToggle";
import { Spinner } from "./Spinner";
import { Button } from "./ui/button";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "../lib/utils";
import type { SessionKind } from "../lib/types";

const baseTabs = [
  { to: "/sessions", label: "Sessions", icon: MessageSquare },
  { to: "/plans", label: "Plans", icon: ClipboardList },
  { to: "/search", label: "Search", icon: Search },
];

function NavTabs({ size }: { size: "sm" | "xs" }) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-lg bg-muted/80 p-1", size === "xs" && "text-xs")}>
      {baseTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                size === "xs" && "px-2 py-1 text-xs",
              )
            }
            end={tab.to === "/"}
          >
            <Icon className={cn("h-3.5 w-3.5", size === "xs" && "h-3 w-3")} />
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
}

export function Layout() {
  const { mode, kind, isConnected, isLoading, refresh, disconnect, selectKind } = useClaudeDir();
  const showDisconnect = mode === "static";

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Spinner text="Connecting..." />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen">
        {/* Navbar */}
        <div className="flex items-center bg-card/80 glass border-b border-border shrink-0 px-4 min-h-12 z-50">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">C</span>
            </div>
            <span className="font-bold text-sm tracking-tight">
              AI Session Dashboard
            </span>
            {kind && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                {kind}
              </span>
            )}
            {mode === "server" && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                Server
              </span>
            )}
          </div>
          <div className="hidden sm:flex justify-center">
            {isConnected && <NavTabs size="sm" />}
          </div>
          <div className="flex-1 flex items-center justify-end gap-1">
            {isConnected && (
              <>
                <ToggleGroup
                  type="single"
                  value={kind ?? undefined}
                  onValueChange={(value) => {
                    if (value === "claude" || value === "codex") {
                      void selectKind(value as SessionKind);
                    }
                  }}
                  variant="outline"
                  className="h-8 mr-1"
                >
                  <ToggleGroupItem value="claude" className="h-8 px-2 text-xs" aria-label="Use Claude sessions">
                    Claude
                  </ToggleGroupItem>
                  <ToggleGroupItem value="codex" className="h-8 px-2 text-xs" aria-label="Use Codex sessions">
                    Codex
                  </ToggleGroupItem>
                </ToggleGroup>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={refresh}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh data</TooltipContent>
                </Tooltip>
                {showDisconnect && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={disconnect}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Disconnect</TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile nav */}
        {isConnected && (
          <div className="sm:hidden bg-card/50 border-b border-border overflow-x-auto px-2 py-1">
            <NavTabs size="xs" />
          </div>
        )}

        {/* Main content */}
        {isConnected ? (
          <div key={kind} className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <ConnectScreen />
        )}
      </div>
    </TooltipProvider>
  );
}
