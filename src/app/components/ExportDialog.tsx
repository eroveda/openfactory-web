import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Download, FileJson, FileText, Package } from "lucide-react";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
}

export function ExportDialog({ open, onOpenChange, workspaceName }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<"json" | "markdown" | "pdf">("json");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeDependencies, setIncludeDependencies] = useState(true);

  const handleExport = () => {
    // Simulated export functionality
    toast.success(`Exported as ${exportFormat.toUpperCase()}`, {
      description: `${workspaceName} has been exported successfully`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="mb-3 block">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-slate-50">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileJson className="size-5 text-blue-600" />
                    <div>
                      <p className="font-medium">JSON</p>
                      <p className="text-sm text-slate-500">Machine-readable format for APIs</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-slate-50">
                  <RadioGroupItem value="markdown" id="markdown" />
                  <Label htmlFor="markdown" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileText className="size-5 text-slate-600" />
                    <div>
                      <p className="font-medium">Markdown</p>
                      <p className="text-sm text-slate-500">Human-readable documentation</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-slate-50">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Package className="size-5 text-red-600" />
                    <div>
                      <p className="font-medium">PDF</p>
                      <p className="text-sm text-slate-500">Print-ready document</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Include</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                />
                <Label htmlFor="metadata" className="cursor-pointer">
                  Workspace metadata and history
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dependencies"
                  checked={includeDependencies}
                  onCheckedChange={(checked) => setIncludeDependencies(checked as boolean)}
                />
                <Label htmlFor="dependencies" className="cursor-pointer">
                  Box dependencies and relationships
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
