import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, type ChatMessage } from "../lib/api";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hola! Contame qué querés construir. Puedo ayudarte a clarificar la idea, detectar lo que falta y preparar todo para generar el shape.",
};

export function useChat(workpackId: string) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => chatApi.send(workpackId, message),

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
    setMessages([WELCOME]);
  }, [workpackId]);

  return {
    messages,
    send,
    reset,
    isPending: sendMutation.isPending,
  };
}
