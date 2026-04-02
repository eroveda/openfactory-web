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
    if (box) setForm({
      title:              box.title,
      purpose:            box.purpose,
      instructions:       box.instructions,
      constraints:        box.constraints,
      acceptanceCriteria: box.acceptanceCriteria,
      expectedOutput:     box.expectedOutput,
      inputContext:       box.inputContext,
      executionContext:   box.executionContext ?? "",
    });
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{box.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">

          {/* Core identity */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="purpose">Propósito</Label>
              <Textarea
                id="purpose"
                value={form.purpose ?? ""}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="¿Por qué existe este bloque? ¿Qué valor entrega?"
                rows={2}
              />
            </div>
          </div>

          {/* Definición del trabajo */}
          <div className="border-t pt-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Definición del trabajo</p>

            <div className="grid gap-2">
              <Label htmlFor="instructions">Instrucciones</Label>
              <Textarea
                id="instructions"
                value={form.instructions ?? ""}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Pasos clave o enfoque — ¿qué hay que hacer?"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="constraints">Restricciones</Label>
              <Textarea
                id="constraints"
                value={form.constraints ?? ""}
                onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                placeholder="Limitaciones específicas de este bloque — tecnología, alcance, tiempo, presupuesto"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="acceptanceCriteria">Criterios de aceptación</Label>
              <Textarea
                id="acceptanceCriteria"
                value={form.acceptanceCriteria ?? ""}
                onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
                placeholder="¿Cómo sabemos que este bloque está completo?"
                rows={2}
              />
            </div>
          </div>

          {/* E/S */}
          <div className="border-t pt-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Entrada / Salida</p>

            <div className="grid gap-2">
              <Label htmlFor="inputContext">Contexto de entrada</Label>
              <Textarea
                id="inputContext"
                value={form.inputContext ?? ""}
                onChange={(e) => setForm({ ...form, inputContext: e.target.value })}
                placeholder="¿Qué recibe o de qué depende este bloque?"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expectedOutput">Resultado esperado</Label>
              <Textarea
                id="expectedOutput"
                value={form.expectedOutput ?? ""}
                onChange={(e) => setForm({ ...form, expectedOutput: e.target.value })}
                placeholder="¿Qué artefacto o resultado concreto produce este bloque?"
                rows={2}
              />
            </div>
          </div>

          {/* Contexto de ejecución */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contexto de ejecución</p>
              <span className="text-[10px] text-slate-300">opcional — completado por IA durante el refinamiento</span>
            </div>
            <Textarea
              id="executionContext"
              value={form.executionContext ?? ""}
              onChange={(e) => setForm({ ...form, executionContext: e.target.value })}
              placeholder={`Stack tecnológico, herramientas, integraciones, equipo o entorno que condiciona cómo se construye este bloque.\n\nEjemplos: "React + TypeScript, Supabase auth, desplegado en Vercel" o "Pipeline de datos en Python, corre por cron cada noche, salida a S3"`}
              rows={4}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
