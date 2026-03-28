import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Zap,
  BoxSelect,
  GitBranch,
  Package,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const STORAGE_KEY = "openfactory_onboarding_seen";

const STEPS = [
  {
    icon: FileText,
    color: "text-amber-500",
    bg: "bg-amber-50",
    title: "Define your idea",
    body: "Answer five focused questions: intent, actor, out-of-scope, constraints, and domain context. Each answer becomes a precision signal for the AI — no perfect prompt required.",
  },
  {
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-50",
    title: "Get a live brief",
    body: "Your answers are evaluated to produce a brief with readiness signals. openFactory tells you what is clear, what is missing, and whether the idea is ready to shape.",
  },
  {
    icon: BoxSelect,
    color: "text-green-500",
    bg: "bg-green-50",
    title: "Shape into boxes",
    body: "The AI splits the work into boxes — smaller, clearer units each with a purpose, input context, and expected output. You can review, edit, and reshape until the structure feels right.",
  },
  {
    icon: GitBranch,
    color: "text-purple-500",
    bg: "bg-purple-50",
    title: "See the execution plan",
    body: "Boxes are arranged into an execution plan that surfaces dependencies, parallel steps, and blocked work — before a single task is assigned.",
  },
  {
    icon: Package,
    color: "text-rose-500",
    bg: "bg-rose-50",
    title: "Simulate and package",
    body: "Run a preflight simulation to catch gaps before handoff. Then export a portable package — brief, boxes, plan, and notes — ready for any team or agent to execute.",
  },
] as const;

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all ${
                  i <= step ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              <div className={`size-14 rounded-2xl ${current.bg} flex items-center justify-center mb-5`}>
                <Icon className={`size-7 ${current.color}`} />
              </div>

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                {current.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => step > 0 ? setStep(s => s - 1) : handleClose()}
              className="text-slate-400"
            >
              {step > 0 ? <><ArrowLeft className="size-4 mr-1" /> Back</> : "Skip"}
            </Button>

            <Button
              size="sm"
              onClick={() => isLast ? handleClose() : setStep(s => s + 1)}
              className="gap-1"
            >
              {isLast ? "Got it" : <>Next <ArrowRight className="size-4" /></>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para controlar visibilidad
export function useOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  return {
    open,
    show: () => setOpen(true),
    hide: () => {
      localStorage.setItem(STORAGE_KEY, "1");
      setOpen(false);
    },
  };
}
