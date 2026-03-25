import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { ExportDialog } from "../components/ExportDialog";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Box as BoxIcon,
  ArrowLeft,
  Download,
  CheckCircle2,
  Package,
  FileJson,
  Send,
  Copy,
  Share2,
  Sparkles,
  Users,
  Clock,
  Lightbulb,
  FileText,
  Zap,
  Settings,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

export function WorkspaceBox() {
  const { id } = useParams();
  const [handoffNotes, setHandoffNotes] = useState("");
  const [packageStatus, setPackageStatus] = useState<"assembling" | "ready">("ready");
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | null>(null);

  const readinessSignals = [
    { label: "Brief included", status: "complete" },
    { label: "Boxes packaged", status: "complete" },
    { label: "Work sequence attached", status: "complete" },
    { label: "Package is portable", status: "complete" },
    { label: "Handoff notes present", status: handoffNotes ? "complete" : "warning" },
  ];

  const completedSignals = readinessSignals.filter(s => s.status === "complete").length;

  const handleExport = () => {
    toast.success("Package exported successfully!", {
      description: "Your BoxPackage has been downloaded."
    });
  };

  const handleRequestApproval = () => {
    setApprovalStatus("pending");
    toast.info("Approval request sent", {
      description: "Sarah Miller will be notified to review the package."
    });
  };

  const mockApprove = () => {
    setApprovalStatus("approved");
    toast.success("Package approved!", {
      description: "Sarah Miller has approved this package."
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/workspace/${id}/shape`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" />
                  Back to Shape
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
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="size-3 text-green-600" />
                Shape
              </Badge>
              <Badge variant="outline" className="gap-1 bg-blue-100">
                <div className="size-2 rounded-full bg-blue-600" />
                Box
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                <Avatar className="size-8 border-2 border-white">
                  <AvatarFallback className="bg-blue-600 text-white text-xs">JD</AvatarFallback>
                </Avatar>
                <Avatar className="size-8 border-2 border-white">
                  <AvatarFallback className="bg-green-600 text-white text-xs">SM</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Center Column - Package Details */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Package className="size-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-semibold">Box</h1>
                  <p className="text-slate-600">Your production folder — ready to hand off.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  {packageStatus === "assembling" ? "Assembling..." : "Ready"}
                </Badge>
                {approvalStatus === "pending" && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    Pending approval from SM
                  </Badge>
                )}
                {approvalStatus === "approved" && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle2 className="size-3 mr-1" />
                    Approved by SM · March 24
                  </Badge>
                )}
              </div>
            </div>

            {/* Production Package Card */}
            <div className="bg-white border rounded-lg mb-6">
              <div className="border-b p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">Sistema de órdenes</h2>
                  <Badge variant="outline">5 artifacts · ready for handoff</Badge>
                </div>
              </div>

              {/* Included Files */}
              <div className="p-6 border-b">
                <h3 className="font-semibold mb-4">Included</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="size-5 text-green-700" />
                      <span className="font-medium text-sm">brief.md</span>
                    </div>
                    <p className="text-xs text-green-700">Idea · scope · constraints</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BoxIcon className="size-5 text-amber-700" />
                      <span className="font-medium text-sm">boxes/</span>
                    </div>
                    <p className="text-xs text-amber-700">5 execution units</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="size-5 text-blue-700" />
                      <span className="font-medium text-sm">execution-plan.yaml</span>
                    </div>
                    <p className="text-xs text-blue-700">Run order · dependencies</p>
                  </div>
                </div>

                <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="size-5 text-purple-700" />
                    <span className="font-medium text-sm">manifest.md</span>
                  </div>
                  <p className="text-xs text-purple-700">Human-readable summary</p>
                </div>

                <div className="mt-3 flex justify-center">
                  <Button variant="link" size="sm" className="text-blue-600">
                    + Add handoff notes
                  </Button>
                </div>
              </div>

              {/* Handoff Summary */}
              <div className="p-6">
                <h3 className="font-semibold mb-4">Handoff Summary</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Lightbulb className="size-4" />
                      <span>Project</span>
                    </div>
                    <p className="font-medium">Sistema de órdenes</p>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="size-4" />
                      <span>Main idea</span>
                    </div>
                    <p>Order management system for an API client, excluding payments</p>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BoxIcon className="size-4" />
                      <span>Boxes</span>
                    </div>
                    <p>5</p>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Zap className="size-4" />
                      <span>Run order</span>
                    </div>
                    <p className="font-mono text-xs">Sequential + 1 parallel stage</p>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Settings className="size-4" />
                      <span>Handoff notes</span>
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add context for the executor..."
                        value={handoffNotes}
                        onChange={(e) => setHandoffNotes(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {approvalStatus === null && (
                <>
                  <Button onClick={handleExport} className="gap-2 flex-1">
                    <Download className="size-4" />
                    Export package
                  </Button>
                  <Button onClick={handleRequestApproval} variant="outline" className="flex-1">
                    Request approval
                  </Button>
                </>
              )}
              
              {approvalStatus === "pending" && (
                <>
                  <Button onClick={mockApprove} variant="outline" className="gap-2 flex-1">
                    <CheckCircle2 className="size-4" />
                    Approve (simulate)
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Request changes
                  </Button>
                </>
              )}

              {approvalStatus === "approved" && (
                <Button onClick={handleExport} className="gap-2 flex-1">
                  <Download className="size-4" />
                  Export approved package
                </Button>
              )}
            </div>
          </div>
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
                {completedSignals} of {readinessSignals.length} complete
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${(completedSignals / readinessSignals.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Export Info */}
          <div className="pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3">Export Format</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-2">
                BoxPackage will include:
              </p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Markdown brief</li>
                <li>• JSON box definitions</li>
                <li>• YAML execution plan</li>
                <li>• Manifest summary</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t mt-6">
            <h3 className="text-sm font-semibold mb-3">Portability</h3>
            <p className="text-xs text-slate-600">
              This package can be shared without requiring the recipient to have an openFactory account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}