import { ChevronRight } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export const ExpandAllContext = createContext<boolean | null>(null);

interface CollapsibleProps {
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Collapsible({ header, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const expandAll = useContext(ExpandAllContext);

  useEffect(() => {
    if (expandAll !== null) setOpen(expandAll);
  }, [expandAll]);

  return (
    <div className="my-2 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-1.5 cursor-pointer text-sm font-medium select-none transition-colors"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground", open && "rotate-90")}
        />
        {header}
      </div>
      {open && <div className="px-3 py-3">{children}</div>}
    </div>
  );
}
