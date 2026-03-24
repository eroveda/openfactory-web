import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Quick search" },
  { keys: ["⌘", "Enter"], description: "Add pin (in Define stage)" },
  { keys: ["⌘", "S"], description: "Save changes" },
  { keys: ["⌘", "Shift", "S"], description: "Share workspace" },
  { keys: ["→"], description: "Next box (in Shape stage)" },
  { keys: ["←"], description: "Previous box (in Shape stage)" },
  { keys: ["Escape"], description: "Close dialog" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <Badge key={j} variant="outline" className="font-mono">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
