import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Loader2 } from "lucide-react";
import type { Box } from "../../lib/api";

interface BoxEditDialogProps {
  box: Box | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Box>) => Promise<void>;
}

export function BoxEditDialog({ box, open, onOpenChange, onSave }: BoxEditDialogProps) {
  const [form, setForm] = useState<Partial<Box>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (box) setForm({ title: box.title, purpose: box.purpose, inputContext: box.inputContext, expectedOutput: box.expectedOutput, acceptanceCriteria: box.acceptanceCriteria });
  }, [box]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!box) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {box.nodeId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title ?? ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={form.purpose ?? ""}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="What is this box meant to do?"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="inputContext">Input Context</Label>
            <Textarea
              id="inputContext"
              value={form.inputContext ?? ""}
              onChange={(e) => setForm({ ...form, inputContext: e.target.value })}
              placeholder="What does this box receive?"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expectedOutput">Expected Output</Label>
            <Textarea
              id="expectedOutput"
              value={form.expectedOutput ?? ""}
              onChange={(e) => setForm({ ...form, expectedOutput: e.target.value })}
              placeholder="What should this box produce?"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
            <Textarea
              id="acceptanceCriteria"
              value={form.acceptanceCriteria ?? ""}
              onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
              placeholder="How do you know this box succeeded?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
