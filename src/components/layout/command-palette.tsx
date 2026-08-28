import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { searchWorkspace } from "@/services/search-service";
import type { SearchResultKind } from "@/types/domain";

const KIND_LABEL: Record<SearchResultKind, string> = {
  post: "Feed",
  message: "Messages",
  file: "Files",
  profile: "Team",
  group: "Groups",
  email: "Emails",
  experiment: "Experiments",
  resource: "Resources",
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  useEffect(() => {
    if (!open) setTerm("");
  }, [open]);

  const { data: results = [] } = useQuery({
    queryKey: ["search", term],
    queryFn: () => searchWorkspace(term),
    enabled: open && term.trim().length > 1,
  });

  const grouped = results.reduce<Record<string, typeof results>>((accumulator, result) => {
    const key = KIND_LABEL[result.kind];
    accumulator[key] = [...(accumulator[key] ?? []), result];
    return accumulator;
  }, {});

  const go = (href: string) => {
    onOpenChange(false);
    void navigate({ to: href });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search AgriPen">
      <CommandInput
        value={term}
        onValueChange={setTerm}
        placeholder="Search people, messages, files, experiments…"
      />
      <CommandList className="scroll-thin">
        {term.trim().length > 1 && results.length === 0 ? (
          <CommandEmpty>No matches for "{term}".</CommandEmpty>
        ) : null}

        {term.trim().length < 2 ? (
          <CommandGroup heading="Jump to">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.to} value={item.label} onSelect={() => go(item.to)}>
                <item.icon className="h-4 w-4 text-primary" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {Object.entries(grouped).map(([heading, items]) => (
          <CommandGroup key={heading} heading={heading}>
            {items.map((result) => (
              <CommandItem
                key={`${result.kind}-${result.id}`}
                value={`${result.title} ${result.subtitle} ${result.id}`}
                onSelect={() => go(result.href)}
              >
                <span className="truncate font-medium">{result.title}</span>
                <span className="truncate text-xs text-muted-foreground">{result.subtitle}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
