"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChatThread = {
  id: string;
  subject: string;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender?: { firstName?: string; lastName?: string } | null;
};

export function ChatConsole() {
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const threadsQuery = useQuery({
    queryKey: ["chat-threads"],
    queryFn: async () =>
      apiFetch<ApiListResponse<ChatThread>>("/api/resources/chat-threads?take=100"),
  });

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", selectedThread],
    enabled: Boolean(selectedThread),
    queryFn: async () => apiFetch<ApiListResponse<ChatMessage>>(`/api/chat/threads/${selectedThread}/messages`),
  });

  const sendMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/chat/threads/${selectedThread}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedThread] });
    },
  });

  function onSend(event: FormEvent) {
    event.preventDefault();
    if (!selectedThread || !body.trim()) {
      return;
    }
    sendMutation.mutate();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Threads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(threadsQuery.data?.data ?? []).map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread.id)}
              className={`w-full rounded-lg border p-2 text-left text-sm ${
                selectedThread === thread.id ? "border-tf-electric bg-sky-50" : "border-slate-200 bg-white"
              }`}
            >
              {thread.subject}
            </button>
          ))}
          {threadsQuery.data?.data?.length === 0 ? <p className="text-sm text-slate-500">No threads yet.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
            {(messagesQuery.data?.data ?? []).map((message) => (
              <div key={message.id} className="rounded-lg bg-white p-2 text-sm">
                <p className="font-medium">
                  {message.sender?.firstName
                    ? `${message.sender.firstName} ${message.sender.lastName ?? ""}`
                    : "System"}
                </p>
                <p className="mt-1 text-slate-700">{message.body}</p>
              </div>
            ))}
            {!selectedThread ? <p className="text-sm text-slate-500">Choose a thread to start messaging.</p> : null}
          </div>
          <form className="flex gap-2" onSubmit={onSend}>
            <Input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Type message"
              disabled={!selectedThread}
            />
            <Button type="submit" disabled={!selectedThread || sendMutation.isPending}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
