import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi, type ChatMessage } from "../lib/api";

const DEFINE_WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hey! Tell me what you want to build. I can help you clarify the idea, spot what's missing, and get everything ready to generate the shape.",
};

function shapeWelcome(boxTitle: string, boxPurpose?: string): ChatMessage {
  const purpose = boxPurpose ? ` — ${boxPurpose}` : "";
  return {
    role: "assistant",
    content: `Let's refine **${boxTitle}**${purpose}. What would you like to improve or clarify?`,
  };
}

export interface BoxContext {
  id: string;
  title: string;
  purpose?: string;
}

export function useChat(
  workpackId: string,
  boxContext?: BoxContext,
  onDefineReady?: () => void,
  options?: { resetOnBoxChange?: boolean }
) {
  const qc = useQueryClient();

  const welcomeMessage = boxContext
    ? shapeWelcome(boxContext.title, boxContext.purpose)
    : DEFINE_WELCOME;

  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [reshapeSuggestion, setReshapeSuggestion] = useState<string | null>(null);
  const [proceedSuggested, setProceedSuggested] = useState(false);
  const hydratedRef = useRef(false);

  // Load persisted history from the server once on mount
  const { data: serverHistory } = useQuery({
    queryKey: ["chat-history", workpackId],
    queryFn: () => chatApi.getHistory(workpackId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (hydratedRef.current) return;
    if (!serverHistory) return;
    hydratedRef.current = true;
    if (serverHistory.length > 0) {
      setMessages(serverHistory.filter((m) => m.role !== "system"));
    }
  }, [serverHistory]);

  // Reset conversation when the selected box changes (opt-out with resetOnBoxChange: false)
  const prevBoxIdRef = useRef<string | undefined>(boxContext?.id);
  useEffect(() => {
    if (boxContext?.id !== prevBoxIdRef.current) {
      prevBoxIdRef.current = boxContext?.id;
      if (options?.resetOnBoxChange !== false) {
        hydratedRef.current = false;
        if (boxContext) {
          setMessages([shapeWelcome(boxContext.title, boxContext.purpose)]);
        } else {
          setMessages([welcomeMessage]);
        }
      }
    }
  }, [boxContext?.id]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => {
      // Prefix message with box context so the model knows which box to focus on
      const payload = boxContext
        ? `[Refining box: ${boxContext.id} — "${boxContext.title}"]\n${message}`
        : message;
      return chatApi.send(workpackId, payload);
    },

    onMutate: (message: string) => {
      setMessages((prev) => [...prev, { role: "user", content: message }]);
    },

    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      if (data.briefUpdated) {
        qc.invalidateQueries({ queryKey: ["brief", workpackId] });
        qc.invalidateQueries({ queryKey: ["workpack", workpackId] });
      }
      if (data.toolsExecuted.includes("save_context")) {
        qc.invalidateQueries({ queryKey: ["pins", workpackId] });
      }
      if (data.toolsExecuted.includes("update_box")) {
        qc.invalidateQueries({ queryKey: ["boxes", workpackId] });
      }
      if (data.toolsExecuted.includes("attach_image_to_box")) {
        qc.invalidateQueries({ queryKey: ["box-attachments", workpackId] });
      }
      if (data.boxesChanged) {
        qc.invalidateQueries({ queryKey: ["boxes", workpackId] });
        qc.invalidateQueries({ queryKey: ["box-scores", workpackId] });
        qc.invalidateQueries({ queryKey: ["plan", workpackId] });
      }
      if (data.reshapeSuggestion) {
        setReshapeSuggestion(data.reshapeSuggestion);
      }
      if (data.proceedSuggested) {
        setProceedSuggested(true);
      }
      if (data.toolsExecuted.includes("mark_define_ready")) {
        qc.invalidateQueries({ queryKey: ["workpack", workpackId] });
        qc.invalidateQueries({ queryKey: ["brief", workpackId] });
        // No auto-navega — el usuario confirma con Yes/No
      }
    },

    onError: (err: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `No pude procesar tu mensaje. Intentá de nuevo. (${err.message})`,
        },
      ]);
    },
  });

  const send = useCallback(
    (message: string) => {
      if (!message.trim() || sendMutation.isPending) return;
      sendMutation.mutate(message.trim());
    },
    [sendMutation]
  );

  const reset = useCallback(() => {
    chatApi.clear(workpackId).catch(() => {});
    qc.removeQueries({ queryKey: ["chat-history", workpackId] });
    hydratedRef.current = false;
    setMessages([welcomeMessage]);
  }, [workpackId, welcomeMessage, qc]);

  return {
    messages,
    send,
    reset,
    isPending: sendMutation.isPending,
    reshapeSuggestion,
    clearReshape: () => setReshapeSuggestion(null),
    proceedSuggested,
    clearProceed: () => setProceedSuggested(false),
  };
}
