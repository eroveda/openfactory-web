import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";

interface WorkspaceSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  onSave: (settings: { name: string; description: string }) => void;
}

export function WorkspaceSettings({ 
  open, 
  onOpenChange, 
  workspaceName,
  onSave 
}: WorkspaceSettingsProps) {
  const [name, setName] = useState(workspaceName);
  const [description, setDescription] = useState("Order management system for an API client");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    onSave({ name, description });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My workspace"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="workspace-description">Description</Label>
              <Textarea
                id="workspace-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace about?"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Preferences</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-advance stages</Label>
                <p className="text-sm text-slate-500">
                  Automatically move to next stage when ready
                </p>
              </div>
              <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-sm text-slate-500">
                  Get notified when collaborators make changes
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-red-600">Danger Zone</h3>
            <Button variant="destructive" size="sm" className="w-full">
              Delete Workspace
            </Button>
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
