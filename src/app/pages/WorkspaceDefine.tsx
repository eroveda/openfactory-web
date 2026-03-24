import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { PinCard } from "../components/PinCard";
import { motion, AnimatePresence } from "motion/react";
import { 
  Box, 
  Plus, 
  X, 
  FileText, 
  Link as LinkIcon, 
  Mic, 
  Image as ImageIcon,
  Users,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Bell,
  Edit2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

interface Pin {
  id: string;
  text: string;
  type: string;
  color: "yellow" | "green" | "blue" | "purple";
  author: string;
}

const COLORS = {
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-900",
  green: "bg-green-100 border-green-300 text-green-900",
  blue: "bg-blue-100 border-blue-300 text-blue-900",
  purple: "bg-purple-100 border-purple-300 text-purple-900",
};

export function WorkspaceDefine() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [pins, setPins] = useState<Pin[]>([
    {
      id: "1",
      text: "I want want to conduct a research study on the impact of remote work",
      type: "#01",
      color: "yellow",
      author: "JD",
    },
    {
      id: "2",
      text: "interviews with 200 participants",
      type: "#02",
      color: "green",
      author: "JD",
    },
    {
      id: "3",
      text: "job diario con reportes",
      type: "#03",
      color: "blue",
      author: "SM",
    },
  ]);

  const [newPinText, setNewPinText] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const addPin = () => {
    if (!newPinText.trim()) return;
    
    const colors: ("yellow" | "green" | "blue" | "purple")[] = ["yellow", "green", "blue", "purple"];
    const newPin: Pin = {
      id: Date.now().toString(),
      text: newPinText,
      type: `#0${pins.length + 1}`,
      color: colors[pins.length % colors.length],
      author: "JD",
    };
    
    setPins([...pins, newPin]);
    setNewPinText("");
  };

  const removePin = (id: string) => {
    setPins(pins.filter(p => p.id !== id));
  };

  const mainIdea = pins[0]?.text || "No ideas yet";
  const pickedUp = pins.slice(0, 3).map(p => p.text);
  const stillUnclear = [
    "What's the success criteria?",
    "Are there constraints?",
  ];

  const readinessSignals = [
    { label: "Main intent", status: pins.length >= 1 ? "complete" : "incomplete" },
    { label: "Actor defined", status: pins.length >= 2 ? "complete" : "incomplete" },
    { label: "Out of scope", status: "incomplete" },
    { label: "Constraints", status: "incomplete" },
    { label: "Success criteria", status: "incomplete" },
  ];

  const completeCount = readinessSignals.filter(s => s.status === "complete").length;
  const isReady = completeCount >= 3;

  const handleDefineWork = () => {
    navigate(`/workspace/${id}/shape`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2">
                <Box className="size-5 text-blue-600" />
                <span className="font-semibold">openFactory</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <div className="size-2 rounded-full bg-amber-500" />
                Raw / Define
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="size-2 rounded-full bg-gray-300" />
                Shape
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="size-2 rounded-full bg-gray-300" />
                Box
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Users className="size-4" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share this workspace</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Invite by email</label>
                      <div className="flex gap-2">
                        <Input placeholder="colleague@example.com" />
                        <Button>Invite</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Share link</label>
                      <div className="flex gap-2">
                        <Input 
                          value={`https://openfactory.app/workspace/${id}/define`} 
                          readOnly 
                        />
                        <Button variant="outline">Copy</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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
        {/* Left Column - Pin Board */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-2">Raw / Define</h1>
              <p className="text-slate-600">Pin your ideas to the board — anything goes.</p>
            </div>

            {/* Pins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {pins.map((pin) => (
                <div
                  key={pin.id}
                  className={`relative rounded-lg border-2 p-4 ${COLORS[pin.color]}`}
                >
                  <button
                    onClick={() => removePin(pin.id)}
                    className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="size-4" />
                  </button>
                  <p className="italic mb-3 min-h-[80px]">{pin.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60">{pin.type}</span>
                    <Avatar className="size-6">
                      <AvatarFallback className="text-xs bg-white/50">
                        {pin.author}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ))}

              {/* Add New Pin */}
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 flex items-center justify-center min-h-[160px]">
                <button
                  onClick={() => {
                    const textarea = document.getElementById("new-pin-input") as HTMLTextAreaElement;
                    textarea?.focus();
                  }}
                  className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600"
                >
                  <Plus className="size-8" />
                  <span className="text-sm">Add another...</span>
                </button>
              </div>
            </div>

            {/* New Pin Input */}
            <div className="bg-white rounded-lg border p-4 mb-4">
              <Textarea
                id="new-pin-input"
                placeholder="Type your idea here..."
                value={newPinText}
                onChange={(e) => setNewPinText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    addPin();
                  }
                }}
                className="mb-3 min-h-[80px]"
              />
              <Button onClick={addPin} className="w-full">
                Add Pin
              </Button>
            </div>

            {/* Attachment Options */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="size-4" />
                File
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <LinkIcon className="size-4" />
                Link
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Mic className="size-4" />
                Audio
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <ImageIcon className="size-4" />
                Image
              </Button>
              <div className="ml-auto text-slate-500">
                {pins.length} ideas pinned
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Live Brief */}
        <div className="w-96 bg-white border-l p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-blue-600">LIVE BRIEF</span>
              <span className="text-xs text-slate-500">· updating</span>
            </div>

            {pins.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Start adding pins to see the live brief</p>
              </div>
            ) : (
              <>
                {/* Main Idea */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    Main Idea
                  </h3>
                  <p className="text-lg font-semibold leading-snug">{mainIdea}</p>
                  <p className="text-sm text-slate-500 mt-2">{pins.length} signals · live</p>
                </div>

                {/* What We Picked Up */}
                {pickedUp.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                      What we picked up
                    </h3>
                    <ul className="space-y-2">
                      {pickedUp.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Still Unclear */}
                {stillUnclear.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
                      <AlertCircle className="size-4 text-amber-500" />
                      Still unclear
                    </h3>
                    <ul className="space-y-2">
                      {stillUnclear.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                          <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Readiness */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                    Readiness
                  </h3>
                  <div className="space-y-2">
                    {readinessSignals.map((signal, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {signal.status === "complete" ? (
                          <Check className="size-4 text-green-600" />
                        ) : (
                          <AlertCircle className="size-4 text-slate-300" />
                        )}
                        <span className={signal.status === "complete" ? "text-green-900" : "text-slate-500"}>
                          {signal.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    {completeCount} of {readinessSignals.length}
                  </p>
                </div>

                {/* CTA */}
                <Button
                  onClick={handleDefineWork}
                  disabled={!isReady}
                  className="w-full gap-2"
                  size="lg"
                >
                  Define this work
                  <ArrowRight className="size-4" />
                </Button>
                <p className="text-xs text-center text-slate-500 mt-3">
                  You can keep adding ideas after
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}