import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface InfoTooltipProps {
  title: string;
  body: string | string[];
  footer?: string;
}

export function InfoTooltip({ title, body, footer }: InfoTooltipProps) {
  const lines = Array.isArray(body) ? body : [body];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center text-slate-400 hover:text-slate-600 transition-colors">
            <HelpCircle className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="max-w-xs p-3 space-y-2"
          sideOffset={6}
        >
          <p className="font-semibold text-xs text-slate-900">{title}</p>
          <div className="space-y-1">
            {lines.map((line, i) => (
              <p key={i} className="text-xs text-slate-600 leading-snug">{line}</p>
            ))}
          </div>
          {footer && (
            <p className="text-xs text-slate-400 italic border-t pt-2">{footer}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
