import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { CommandPalette, useCommandPalette } from "../components/CommandPalette";
import { motion } from "motion/react";
import {
  Box,
  Plus,
  Search,
  Settings,
  LogOut,
  Lightbulb,
  Zap,
  Package,
  Users,
  Clock,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

interface Workspace {
  id: string;
  name: string;
  stage: "define" | "shape" | "box";
  lastActivity: string;
  isShared?: boolean;
  collaborators?: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [workspaces] = useState<Workspace[]>([
    {
      id: "1",
      name: "Research study on remote work impact",
      stage: "define",
      lastActivity: "2 hours ago",
      collaborators: 3,
    },
    {
      id: "2",
      name: "E-commerce platform redesign",
      stage: "shape",
      lastActivity: "1 day ago",
      collaborators: 2,
    },
    {
      id: "3",
      name: "Marketing automation workflow",
      stage: "box",
      lastActivity: "3 days ago",
      collaborators: 1,
    },
  ]);

  const [sharedWorkspaces] = useState<Workspace[]>([
    {
      id: "4",
      name: "Product roadmap Q2 2026",
      stage: "shape",
      lastActivity: "5 hours ago",
      isShared: true,
      collaborators: 5,
    },
  ]);

  const createNewWorkspace = () => {
    const newId = Date.now().toString();
    navigate(`/workspace/${newId}/define`);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "define":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "shape":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "box":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStagePath = (id: string, stage: string) => {
    return `/workspace/${id}/${stage}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Box className="size-6 text-blue-600" />
            <span className="font-semibold text-lg">openFactory</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <Button 
            variant="default" 
            className="w-full justify-start gap-2 mb-4"
            onClick={createNewWorkspace}
          >
            <Plus className="size-4" />
            New workspace
          </Button>

          <div className="space-y-1">
            <Link to="/dashboard">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Box className="size-4" />
                My workspaces
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Settings className="size-4" />
                Profile
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-blue-600 text-white">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">John Doe</p>
              <p className="text-xs text-slate-500">Free plan</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-slate-600">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-semibold">Your workspaces</h1>
              <button
                onClick={() => setCommandOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-sm text-slate-600"
              >
                <Search className="size-4" />
                <span>Search</span>
                <kbd className="ml-2 px-2 py-0.5 text-xs bg-slate-100 rounded border">⌘K</kbd>
              </button>
            </div>
            <p className="text-slate-600">Manage and collaborate on your work packages</p>
          </div>

          {/* My Workspaces */}
          <div className="mb-12">
            <h2 className="font-semibold mb-4">My workspaces</h2>
            <div className="grid gap-4">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  to={getStagePath(workspace.id, workspace.stage)}
                  className="block"
                >
                  <div className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg flex-1">{workspace.name}</h3>
                      <Badge className={getStageColor(workspace.stage)}>
                        {workspace.stage === "define" && "Raw / Define"}
                        {workspace.stage === "shape" && "Shape"}
                        {workspace.stage === "box" && "Box"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-slate-600">
                        <span>Updated {workspace.lastActivity}</span>
                        {workspace.collaborators && (
                          <div className="flex items-center gap-1">
                            <Users className="size-4" />
                            <span>{workspace.collaborators}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Shared with Me */}
          {sharedWorkspaces.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4">Shared with me</h2>
              <div className="grid gap-4">
                {sharedWorkspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    to={getStagePath(workspace.id, workspace.stage)}
                    className="block"
                  >
                    <div className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2 flex-1">
                          <Users className="size-5 text-blue-600 mt-0.5" />
                          <h3 className="font-semibold text-lg">{workspace.name}</h3>
                        </div>
                        <Badge className={getStageColor(workspace.stage)}>
                          {workspace.stage === "define" && "Raw / Define"}
                          {workspace.stage === "shape" && "Shape"}
                          {workspace.stage === "box" && "Box"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm ml-7">
                        <div className="flex items-center gap-4 text-slate-600">
                          <span>Updated {workspace.lastActivity}</span>
                          {workspace.collaborators && (
                            <div className="flex items-center gap-1">
                              <Users className="size-4" />
                              <span>{workspace.collaborators}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}