import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, type ChatMessage } from "../lib/api";

const DEFINE_WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hola! Contame qué querés construir. Puedo ayudarte a clarificar la idea, detectar lo que falta y preparar todo para generar el shape.",
};

function shapeWelcome(boxTitle: string, boxPurpose?: string): ChatMessage {
  const purpose = boxPurpose ? ` — ${boxPurpose}` : "";
  return {
    role: "assistant",
    content: `Vamos a refinar **${boxTitle}**${purpose}. ¿Qué querés mejorar o aclarar de este box?`,
  };
}

export interface BoxContext {
  id: string;
  title: string;
  purpose?: string;
}

export function useChat(workpackId: string, boxContext?: BoxContext) {
  const qc = useQueryClient();

  const welcomeMessage = boxContext
    ? shapeWelcome(boxContext.title, boxContext.purpose)
    : DEFINE_WELCOME;

  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);

  // Reset conversation when the selected box changes
  const prevBoxIdRef = useRef<string | undefined>(boxContext?.id);
  useEffect(() => {
    if (boxContext?.id !== prevBoxIdRef.current) {
      prevBoxIdRef.current = boxContext?.id;
      setMessages([shapeWelcome(boxContext!.title, boxContext!.purpose)]);
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
      }
      if (data.toolsExecuted.includes("save_context")) {
        qc.invalidateQueries({ queryKey: ["pins", workpackId] });
      }
      if (data.toolsExecuted.includes("update_box")) {
        qc.invalidateQueries({ queryKey: ["boxes", workpackId] });
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
    setMessages([welcomeMessage]);
  }, [workpackId, welcomeMessage]);

  return {
    messages,
    send,
    reset,
    isPending: sendMutation.isPending,
  };
}
