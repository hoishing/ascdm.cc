import { Search, FileText, ClipboardList } from "lucide-react";
import { shortPath } from "../../lib/formatters";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import type { Project } from "../../lib/types";
import type { SearchType } from "../../hooks/useSearch";

interface SearchFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  projectFilter: string;
  onProjectFilterChange: (p: string) => void;
  dateFrom: string;
  onDateFromChange: (d: string) => void;
  dateTo: string;
  onDateToChange: (d: string) => void;
  onSearch: () => void;
  projects: Project[];
  titleOnly: boolean;
  onTitleOnlyChange: (d: boolean) => void;
  searchType: SearchType;
  onSearchTypeChange: (t: SearchType) => void;
}

export function SearchFilters({
  query, onQueryChange,
  projectFilter, onProjectFilterChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  onSearch,
  projects,
  titleOnly, onTitleOnlyChange,
  searchType, onSearchTypeChange,
}: SearchFiltersProps) {
  const isPlan = searchType === "plan";
  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={isPlan ? "Search plans..." : "Search conversations... (leave empty to browse all)"}
            className="h-10 pl-9"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
        <ToggleGroup
          type="single"
          value={searchType}
          onValueChange={(v) => { if (v) onSearchTypeChange(v as SearchType); }}
          variant="outline"
          className="h-10"
        >
          <ToggleGroupItem value="session" className="h-10 px-3 gap-1.5" aria-label="Search sessions">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Sessions</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="plan" className="h-10 px-3 gap-1.5" aria-label="Search plans">
            <ClipboardList className="h-4 w-4" />
            <span className="text-sm">Plans</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex flex-wrap gap-3">
        <Select
          value={projectFilter || "__all__"}
          onValueChange={(v) => onProjectFilterChange(v === "__all__" ? "" : v)}
          disabled={isPlan}
        >
          <SelectTrigger className="h-10 min-w-[160px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Projects</SelectItem>
            {projects.filter((p) => p.sessions.length > 0).map((p) => (
              <SelectItem key={p.encodedDir} value={p.projectPath}>
                {shortPath(p.projectPath)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="h-10 w-36"
          title="From date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          disabled={isPlan}
        />
        <Input
          type="date"
          className="h-10 w-36"
          title="To date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          disabled={isPlan}
        />
        <div className="flex items-center gap-2">
          <Switch
            id="title-only"
            checked={titleOnly}
            onCheckedChange={onTitleOnlyChange}
            disabled={isPlan}
          />
          <Label htmlFor="title-only" className="text-sm cursor-pointer whitespace-nowrap" title="Only search session titles and summaries (faster)">
            Title only
          </Label>
        </div>
        <Button className="h-10 ml-auto" onClick={onSearch}>
          <Search className="h-4 w-4 mr-1.5" />
          Search
        </Button>
      </div>
    </div>
  );
}
