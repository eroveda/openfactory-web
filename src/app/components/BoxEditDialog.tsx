import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface WorkBox {
  id: string;
  number: string;
  title: string;
  status: "ready" | "draft" | "too-broad" | "needs-review";
  purpose?: string;
  inputContext?: string;
  expectedOutput?: string;
  acceptanceCriteria?: string;
  dependsOn?: string[];
  handsOffTo?: string[];
}

interface BoxEditDialogProps {
  box: WorkBox | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (box: WorkBox) => void;
}

export function BoxEditDialog({ box, open, onOpenChange, onSave }: BoxEditDialogProps) {
  const [editedBox, setEditedBox] = useState<WorkBox | null>(box);

  const handleSave = () => {
    if (editedBox) {
      onSave(editedBox);
      onOpenChange(false);
    }
  };

  if (!box || !editedBox) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Box: {box.number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedBox.title}
              onChange={(e) =>
                setEditedBox({ ...editedBox, title: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={editedBox.status}
              onValueChange={(value: any) =>
                setEditedBox({ ...editedBox, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="too-broad">Too broad</SelectItem>
                <SelectItem value="needs-review">Needs review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={editedBox.purpose || ""}
              onChange={(e) =>
                setEditedBox({ ...editedBox, purpose: e.target.value })
              }
              placeholder="What is this box meant to do?"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="inputContext">Input Context</Label>
            <Textarea
              id="inputContext"
              value={editedBox.inputContext || ""}
              onChange={(e) =>
                setEditedBox({ ...editedBox, inputContext: e.target.value })
              }
              placeholder="What does this box receive?"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expectedOutput">Expected Output</Label>
            <Textarea
              id="expectedOutput"
              value={editedBox.expectedOutput || ""}
              onChange={(e) =>
                setEditedBox({ ...editedBox, expectedOutput: e.target.value })
              }
              placeholder="What should this box produce?"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
            <Textarea
              id="acceptanceCriteria"
              value={editedBox.acceptanceCriteria || ""}
              onChange={(e) =>
                setEditedBox({
                  ...editedBox,
                  acceptanceCriteria: e.target.value,
                })
              }
              placeholder="How do you know this box succeeded?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
