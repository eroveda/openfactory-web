import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { BoxEditDialog } from "../components/BoxEditDialog";
import { toast } from "sonner";
import { 
  Box as BoxIcon, 
  ArrowLeft,
  ArrowRight,
  Plus,
  Settings,
  Zap,
  CheckCircle2,
  AlertCircle,
  Package,
  Users,
  Shield,
  Bell
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

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

const STATUS_COLORS = {
  "ready": "bg-green-100 text-green-800 border-green-300",
  "draft": "bg-slate-100 text-slate-600 border-slate-300",
  "too-broad": "bg-amber-100 text-amber-800 border-amber-300",
  "needs-review": "bg-blue-100 text-blue-800 border-blue-300",
};

const STATUS_LABELS = {
  "ready": "Ready",
  "draft": "Draft",
  "too-broad": "Too broad",
  "needs-review": "Needs review",
};

export function WorkspaceShape() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [boxes, setBoxes] = useState<WorkBox[]>([
    {
      id: "b01",
      number: "B01",
      title: "Ingest API",
      status: "ready",
      purpose: "Receive HTTP Request and create Order Object",
      inputContext: "HTTP Request",
      expectedOutput: "Order Object",
      acceptanceCriteria: "Valid Order",
      handsOffTo: ["B02"],
    },
    {
      id: "b02",
      number: "B02",
      title: "State machine",
      status: "ready",
      purpose: "Open status → State Enum",
      inputContext: "Order Object from B01",
      expectedOutput: "State Enum",
      handsOffTo: ["B03a"],
    },
    {
      id: "b03a",
      number: "B03a",
      title: "Validate order",
      status: "ready",
      purpose: "Validate order constraints",
      inputContext: "Valid Order",
      expectedOutput: "Validated order",
      dependsOn: ["B02"],
      handsOffTo: ["B03b"],
    },
    {
      id: "b03b",
      number: "B03b",
      title: "Fulfill order",
      status: "ready",
      purpose: "Process and fulfill the order",
      inputContext: "Validated order from B03a",
      expectedOutput: "Fulfilled order",
      dependsOn: ["B03a"],
      handsOffTo: ["B03c"],
    },
    {
      id: "b03c",
      number: "B03c",
      title: "Notify & persist",
      status: "ready",
      purpose: "Send notification and persist to database",
      inputContext: "Fulfilled order",
      expectedOutput: "Response",
      dependsOn: ["B03b"],
    },
    {
      id: "b04",
      number: "B04",
      title: "Error handling",
      status: "draft",
      purpose: "Handle errors throughout the process",
      inputContext: "Error",
      expectedOutput: "Response",
    },
    {
      id: "b05",
      number: "B05",
      title: "API docs",
      status: "draft",
      purpose: "Document API endpoints",
      inputContext: "API Schema",
      expectedOutput: "Documentation",
    },
  ]);

  const [selectedBox, setSelectedBox] = useState<WorkBox | null>(boxes[0]);
  const [reshapeDialogOpen, setReshapeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [boxToEdit, setBoxToEdit] = useState<WorkBox | null>(null);

  const readinessSignals = [
    { label: "Core boxes created", status: "complete" },
    { label: "Dependencies mapped", status: "complete" },
    { label: "Run order coherent", status: "complete" },
    { label: "B03 needs splitting", status: "warning" },
    { label: "Validation step", status: "incomplete" },
  ];

  const completedSignals = readinessSignals.filter(s => s.status === "complete").length;
  const isReady = completedSignals >= 3;

  const handlePackage = () => {
    navigate(`/workspace/${id}/box`);
  };

  const getWorkSequence = () => {
    return "B01 → B02 → [B03a → B03b → B03c] ∥ B04";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/workspace/${id}/define`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" />
                  Back to Define
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2">
                <BoxIcon className="size-5 text-blue-600" />
                <span className="font-semibold">openFactory</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="size-3 text-green-600" />
                Raw / Define
              </Badge>
              <Badge variant="outline" className="gap-1 bg-slate-100">
                <div className="size-2 rounded-full bg-slate-600" />
                Shape
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="size-2 rounded-full bg-gray-300" />
                Box
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="size-4" />
                Send Shape to...
              </Button>
              <div className="flex items-center -space-x-2">
                <Avatar className="size-8 border-2 border-white">
                  <AvatarFallback className="bg-blue-600 text-white text-xs">JD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Column - Work Map */}
        <div className="w-80 bg-white border-r p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Work Map</h2>
              <Dialog open={reshapeDialogOpen} onOpenChange={setReshapeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Settings className="size-4" />
                    Reshape
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reshape work structure</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      The AI can suggest a new structure based on current boxes.
                    </p>
                    <Button className="w-full">Generate new structure</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2 mb-4">
              {boxes.map((box) => (
                <button
                  key={box.id}
                  onClick={() => setSelectedBox(box)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedBox?.id === box.id
                      ? "bg-blue-50 border-blue-300 shadow-sm"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-sm">{box.number}</span>
                    <Badge className={`text-xs ${STATUS_COLORS[box.status]}`}>
                      {STATUS_LABELS[box.status]}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{box.title}</p>
                </button>
              ))}
            </div>

            <Button variant="outline" className="w-full gap-2" size="sm">
              <Plus className="size-4" />
              New box
            </Button>
          </div>

          {/* Work Sequence */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3">Work Sequence</h3>
            <div className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-700">
              {getWorkSequence()}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Sequential + 1 parallel stage
            </p>
          </div>
        </div>

        {/* Center Column - Box Detail */}
        <div className="flex-1 p-8 overflow-auto">
          {selectedBox ? (
            <div className="max-w-3xl">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-500">{selectedBox.number}</span>
                      <Badge className={STATUS_COLORS[selectedBox.status]}>
                        {STATUS_LABELS[selectedBox.status]}
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-semibold">{selectedBox.title}</h1>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setEditDialogOpen(true); setBoxToEdit(selectedBox); }}>Edit</Button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Purpose */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Zap className="size-4 text-amber-500" />
                    Purpose
                  </label>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-slate-900">
                      {selectedBox.purpose || "No purpose defined"}
                    </p>
                  </div>
                </div>

                {/* Input Context */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <ArrowRight className="size-4 text-blue-500" />
                    Input Context
                  </label>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-slate-900">
                      {selectedBox.inputContext || "No input defined"}
                    </p>
                  </div>
                </div>

                {/* Expected Output */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <Package className="size-4 text-green-500" />
                    Expected Output
                  </label>
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-slate-900">
                      {selectedBox.expectedOutput || "No output defined"}
                    </p>
                  </div>
                </div>

                {/* Acceptance Criteria */}
                {selectedBox.acceptanceCriteria && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-500" />
                      Acceptance Criteria
                    </label>
                    <div className="bg-white border rounded-lg p-4">
                      <p className="text-slate-900">{selectedBox.acceptanceCriteria}</p>
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Depends on
                    </label>
                    <div className="bg-white border rounded-lg p-3">
                      {selectedBox.dependsOn && selectedBox.dependsOn.length > 0 ? (
                        <div className="space-y-1">
                          {selectedBox.dependsOn.map((dep) => (
                            <Badge key={dep} variant="outline" className="mr-1">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No dependencies</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Hands off to
                    </label>
                    <div className="bg-white border rounded-lg p-3">
                      {selectedBox.handsOffTo && selectedBox.handsOffTo.length > 0 ? (
                        <div className="space-y-1">
                          {selectedBox.handsOffTo.map((handoff) => (
                            <Badge key={handoff} variant="outline" className="mr-1">
                              {handoff}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">End of sequence</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedBox.status === "too-broad" && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1">This step is too big</h3>
                      <p className="text-sm text-amber-800 mb-3">
                        Want me to break it into these 3 parts?
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default">Accept suggestion</Button>
                        <Button size="sm" variant="outline">Keep as is</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <p>Select a box to see details</p>
            </div>
          )}
        </div>

        {/* Right Column - Readiness */}
        <div className="w-80 bg-white border-l p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="font-semibold mb-4">Readiness</h2>
            
            <div className="space-y-3 mb-6">
              {readinessSignals.map((signal, i) => (
                <div key={i} className="flex items-start gap-3">
                  {signal.status === "complete" ? (
                    <CheckCircle2 className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : signal.status === "warning" ? (
                    <AlertCircle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="size-5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      signal.status === "complete" 
                        ? "text-green-900" 
                        : signal.status === "warning"
                        ? "text-amber-900"
                        : "text-slate-600"
                    }`}>
                      {signal.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="text-sm text-slate-500 mb-2">
                {completedSignals} of {readinessSignals.length} clear
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(completedSignals / readinessSignals.length) * 100}%` }}
                />
              </div>
            </div>

            <Button
              onClick={handlePackage}
              disabled={!isReady}
              className="w-full gap-2"
              size="lg"
            >
              Package
              <ArrowRight className="size-4" />
            </Button>
          </div>

          {/* Collaboration */}
          <div className="pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3">Collaboration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2 className="size-4 text-green-600" />
                <span>3 boxes approved by SM</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <AlertCircle className="size-4 text-amber-500" />
                <span>B04 needs review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <BoxEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        box={boxToEdit}
        onSave={(updatedBox) => {
          setBoxes((prevBoxes) =>
            prevBoxes.map((box) => (box.id === updatedBox.id ? updatedBox : box))
          );
          setSelectedBox(updatedBox);
        }}
      />
    </div>
  );
}