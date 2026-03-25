import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Box, FileText, Settings, User, Search } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const commands = [
  {
    group: "Workspaces",
    items: [
      { label: "Order Management System", icon: <Box className="size-4" />, path: "/workspace/1/define" },
      { label: "Marketing Campaign Q1", icon: <Box className="size-4" />, path: "/workspace/2/define" },
      { label: "Mobile App Redesign", icon: <Box className="size-4" />, path: "/workspace/3/define" },
    ],
  },
  {
    group: "Actions",
    items: [
      { label: "Create new workspace", icon: <Box className="size-4" />, path: "/dashboard", action: "new" },
      { label: "View profile", icon: <User className="size-4" />, path: "/profile" },
      { label: "Settings", icon: <Settings className="size-4" />, path: "/settings" },
    ],
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search workspaces and commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => {
                  navigate(item.path);
                  onOpenChange(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
