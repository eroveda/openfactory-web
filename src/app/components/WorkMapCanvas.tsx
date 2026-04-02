import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { BoxNode, type BoxNodeData } from "./BoxNode";

function countBoxFields(box: Box | undefined): { ready: number; total: number } {
  if (!box) return { ready: 0, total: 4 };
  const checks = [
    !!box.purpose,
    box.instructions !== "[]" && !!box.instructions,
    box.constraints !== "[]" && !!box.constraints,
    box.acceptanceCriteria !== "[]" && !!box.acceptanceCriteria,
  ];
  return { ready: checks.filter(Boolean).length, total: 4 };
}
import { FileText, GitBranch } from "lucide-react";
import { Button } from "./ui/button";
import type { Box } from "../../lib/api";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface ExecutionStep {
  stepId: string;
  boxId: string;
  boxTitle: string;
  order: number;
  dependsOn: string[];
  parallel: boolean;
  requiresApproval: boolean;
  checkpoint: boolean;
}

interface WorkMapCanvasProps {
  boxes: Box[];
  planSteps: string | null;
  onBoxClick: (box: Box) => void;
  projectTitle?: string;
}

// -----------------------------------------------------------------------
// Auto-layout with dagre
// -----------------------------------------------------------------------

const NODE_W = 280;
const NODE_H = 130;

function layoutGraph(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 50 });
  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
  });
}

// -----------------------------------------------------------------------
// Root node component
// -----------------------------------------------------------------------

function RootNode({ data }: { data: { label: string } }) {
  return (
    <div className="bg-slate-800 text-white rounded-2xl px-6 py-4 shadow-lg border-2 border-slate-700 min-w-[220px] text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Project</p>
      <p className="font-bold text-base leading-tight">{data.label}</p>
    </div>
  );
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

const nodeTypes = { box: BoxNode, root: RootNode };

export function WorkMapCanvas({ boxes, planSteps, onBoxClick, projectTitle }: WorkMapCanvasProps) {
  const steps: ExecutionStep[] = useMemo(() => {
    if (!planSteps) return [];
    try { return JSON.parse(planSteps) as ExecutionStep[]; }
    catch { return []; }
  }, [planSteps]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const boxMap = new Map(boxes.map(b => [b.id, b]));

    const source = steps.length > 0
      ? steps
      : boxes.map((b, i) => ({ boxId: b.id, order: i, dependsOn: [] as string[], parallel: false, stepId: b.id, boxTitle: b.title, requiresApproval: false, checkpoint: false }));

    const ROOT_ID = "__root__";

    const rootNode: Node = {
      id: ROOT_ID,
      type: "root",
      position: { x: 0, y: 0 },
      data: { label: projectTitle ?? "Project" },
      selectable: false,
    };

    const rawNodes: Node[] = [rootNode, ...source.map(s => {
      const box = boxMap.get(s.boxId);
      const outCount = source.filter(x => x.dependsOn?.includes(s.boxId)).length;
      const { ready: fieldsReady, total: fieldsTotal } = countBoxFields(box);
      const data: BoxNodeData = {
        label:               box?.title ?? s.boxTitle,
        description:         box?.purpose ?? "",
        inputCount:          s.dependsOn?.length ?? 0,
        outputCount:         outCount,
        status:              box?.status === "READY" ? "ready" : fieldsReady > 0 ? "refining" : "draft",
        refinementProgress:  box?.status === "READY" ? 100 : Math.round((fieldsReady / fieldsTotal) * 100),
        fieldsReady,
        fieldsTotal,
      };
      return { id: s.boxId, type: "box", position: { x: 0, y: 0 }, data, className: "group" };
    })];

    const rawEdges: Edge[] = [];
    const allBoxIds = new Set(source.map(s => s.boxId));
    const hasParent = new Set<string>();

    source.forEach(s => {
      s.dependsOn?.forEach(depId => {
        if (allBoxIds.has(depId)) {
          rawEdges.push({
            id: `${depId}->${s.boxId}`,
            source: depId,
            target: s.boxId,
            animated: false,
            style: { stroke: "#94a3b8", strokeWidth: 1.5 },
          });
          hasParent.add(s.boxId);
        }
      });
    });

    // Connect root to all top-level boxes (no parent)
    source.forEach(s => {
      if (!hasParent.has(s.boxId)) {
        rawEdges.push({
          id: `${ROOT_ID}->${s.boxId}`,
          source: ROOT_ID,
          target: s.boxId,
          animated: false,
          style: { stroke: "#475569", strokeWidth: 2 },
        });
      }
    });

    return { initialNodes: layoutGraph(rawNodes, rawEdges), initialEdges: rawEdges };
  }, [steps, boxes]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: "#94a3b8", strokeDasharray: "5,4", strokeWidth: 1.5 } }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const box = boxes.find(b => b.id === node.id);
    if (box) onBoxClick(box);
  }, [boxes, onBoxClick]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
      <Controls className="!rounded-xl !border !border-slate-200 !shadow-sm" />

      <MiniMap
        nodeColor={n => {
          const s = (n.data as BoxNodeData).status;
          return s === "ready" ? "#22c55e" : s === "refining" ? "#f59e0b" : "#94a3b8";
        }}
        maskColor="rgba(255,255,255,0.7)"
        className="!rounded-xl !border !border-slate-200"
      />

      {/* Floating toolbar */}
      <Panel position="top-left" className="m-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 flex items-center gap-1">
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-7">
            <FileText className="size-3.5" /> View All Contexts
          </Button>
          <div className="w-px h-4 bg-slate-200" />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <GitBranch className="size-3.5" />
          </Button>
        </div>
      </Panel>

      {/* Info panel */}
      <Panel position="top-right" className="m-3">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 shadow-sm p-3 max-w-[240px]">
          <p className="text-xs font-semibold text-slate-700 mb-1">Visual Work Breakdown</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click any box to refine it. Drag from the bottom of one box to the top of another to create dependencies.
          </p>
        </div>
      </Panel>
    </ReactFlow>
  );
}
