import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useChat } from "../../hooks/useChat";
import type { Box } from "../../lib/api";

interface ShapeChatPanelProps {
  workpackId: string;
  box: Box;
  onClose: () => void;
  onEditManually?: () => void;
}

function ChatBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 mr-2 mt-0.5">
          <Sparkles className="size-3" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-slate-800 text-white rounded-br-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}

export function ShapeChatPanel({ workpackId, box, onClose, onEditManually }: ShapeChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, send, reset, isPending } = useChat(workpackId, {
    id: box.id,
    title: box.title,
    purpose: box.purpose,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isPending]);

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    send(input.trim());
    setInput("");
    textareaRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-[380px] bg-white border-l border-slate-200 shadow-xl flex flex-col z-20"
    >
      {/* Panel header */}
      <div className="px-4 py-3 border-b bg-white flex items-start justify-between gap-2 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="size-3.5 text-blue-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">AI Copilot</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">{box.title}</p>
          {box.purpose && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{box.purpose}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex-shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages
            .filter((m) => m.role !== "system")
            .map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}
        </AnimatePresence>

        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
              <Sparkles className="size-3 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1">
              <span className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Refiná este box…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="resize-none min-h-[40px] max-h-[120px] text-sm"
            rows={1}
            disabled={isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            size="icon"
            className="size-9 flex-shrink-0"
          >
            {isPending
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Send className="size-3.5" />
            }
          </Button>
        </div>
        <div className="flex justify-between mt-1.5">
          {onEditManually && (
            <button
              onClick={onEditManually}
              className="text-xs text-slate-300 hover:text-slate-500 transition-colors"
            >
              Edit manually
            </button>
          )}
          <button
            onClick={reset}
            className="text-xs text-slate-300 hover:text-slate-500 flex items-center gap-1 transition-colors ml-auto"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
}
