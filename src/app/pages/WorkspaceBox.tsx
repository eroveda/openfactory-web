import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import {
  Box as BoxIcon,
  ArrowLeft,
  Download,
  CheckCircle2,
  Package,
  FileText,
  Zap,
  Settings,
  AlertCircle,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useWorkpack, useBoxes, useBrief, useHandoff, useUpdateHandoff, useRequestApproval } from "../../hooks/useWorkpacks";
import { downloadWorkpackZip } from "../../lib/api";
import { InboxBell } from "../components/InboxBell";
import { InfoTooltip } from "../components/InfoTooltip";

export function WorkspaceBox() {
  const { id } = useParams<{ id: string }>();

  const { data: workpack } = useWorkpack(id!);
  const { data: boxes = [] } = useBoxes(id!);
  const { data: brief } = useBrief(id!);
  const { data: handoff } = useHandoff(id!);
  const updateHandoff = useUpdateHandoff(id!);
  const requestApproval = useRequestApproval(id!);

  const [handoffNotes, setHandoffNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Sync handoff notes from API once loaded
  useEffect(() => {
    if (handoff?.handoffNotes && !notesDirty) {
      setHandoffNotes(handoff.handoffNotes);
    }
  }, [handoff?.handoffNotes]);

  const saveNotes = async () => {
    try {
      await updateHandoff.mutateAsync({ handoffNotes });
      setNotesDirty(false);
      toast.success("Handoff notes saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save notes");
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadWorkpackZip(id!);
      toast.success("Package downloaded");
    } catch (e: any) {
      toast.error(e.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const readinessSignals = [
    { label: "Brief included",           status: brief ? "complete" : "incomplete" },
    { label: "Boxes packaged",           status: boxes.length > 0 ? "complete" : "incomplete" },
    { label: "Package is portable",      status: "complete" },
    { label: "Handoff notes present",    status: handoffNotes.trim() ? "complete" : "warning" },
  ];

  const completedSignals = readinessSignals.filter(s => s.status === "complete").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/workspace/${id}/shape`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" /> Back to Shape
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2">
                <BoxIcon className="size-5 text-blue-600" />
                <span className="font-semibold">{workpack?.title ?? "Workspace"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="size-3 text-green-600" /> Raw / Define
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="size-3 text-green-600" /> Shape
              </Badge>
              <Badge variant="outline" className="gap-1 bg-blue-100">
                <div className="size-2 rounded-full bg-blue-600" /> Box
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <InboxBell />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Center Column */}
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
              <div className="mt-4">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">Ready</Badge>
              </div>
            </div>

            {/* Package Card */}
            <div className="bg-white border rounded-lg mb-6">
              <div className="border-b p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">{workpack?.title ?? "—"}</h2>
                  <Badge variant="outline">{boxes.length} boxes · ready for handoff</Badge>
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
                    <p className="text-xs text-amber-700">{boxes.length} execution units</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="size-5 text-blue-700" />
                      <span className="font-medium text-sm">plan.json</span>
                    </div>
                    <p className="text-xs text-blue-700">Run order · dependencies</p>
                  </div>
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
                    <p className="font-medium">{workpack?.title ?? "—"}</p>
                  </div>

                  {brief && (
                    <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileText className="size-4" />
                        <span>Main idea</span>
                      </div>
                      <p>{brief.mainIdea}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BoxIcon className="size-4" />
                      <span>Boxes</span>
                    </div>
                    <p>{boxes.length}</p>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                    <div className="flex items-start gap-2 text-slate-600 pt-1">
                      <Settings className="size-4" />
                      <span>Handoff notes</span>
                    </div>
                    <div>
                      <Textarea
                        placeholder="Add context for the executor..."
                        value={handoffNotes}
                        onChange={(e) => { setHandoffNotes(e.target.value); setNotesDirty(true); }}
                        className="min-h-[100px] mb-2"
                      />
                      {notesDirty && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={saveNotes}
                          disabled={updateHandoff.isPending}
                        >
                          {updateHandoff.isPending && <Loader2 className="size-3 mr-1 animate-spin" />}
                          Save notes
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleDownload} disabled={downloading} className="gap-2 flex-1">
                {downloading
                  ? <Loader2 className="size-4 animate-spin" />
                  : <Download className="size-4" />
                }
                Export package
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                disabled={requestApproval.isPending}
                onClick={async () => {
                  try {
                    await requestApproval.mutateAsync();
                    toast.success("Approval requested — collaborators have been notified");
                  } catch (e: any) {
                    toast.error(e.message ?? "Failed to request approval");
                  }
                }}
              >
                {requestApproval.isPending && <Loader2 className="size-4 animate-spin" />}
                Request approval
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Readiness */}
        <div className="w-80 bg-white border-l p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold">Readiness</h2>
              <InfoTooltip
                title="What's inside a package?"
                body={["A package bundles: a brief, a set of boxes, a work sequence, and optional handoff notes.", "This is what gets handed to another person, agent or external runtime."]}
                footer="This is what gets handed to another person, agent or external runtime."
              />
            </div>

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

          <div className="pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              Export Format
              <InfoTooltip
                title="What is in the package?"
                body="brief.md · boxes/ · plan.json · README.md — everything the executor needs to start without asking questions."
              />
            </h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-2">BoxPackage includes:</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Markdown brief</li>
                <li>• Box definitions (.md)</li>
                <li>• JSON execution plan</li>
                <li>• README summary</li>
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
