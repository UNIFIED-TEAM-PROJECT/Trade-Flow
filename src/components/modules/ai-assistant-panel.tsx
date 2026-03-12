"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type AiOutput = {
  category: string;
  urgency: string;
  summary: string;
  followUpQuestions: string[];
  suggestedMaterials: string[];
  estimateNotes: string;
};

export function AiAssistantPanel() {
  const [text, setText] = useState(
    "Boiler pressure keeps dropping and radiators upstairs are cold, can someone come today?",
  );
  const [result, setResult] = useState<AiOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      apiFetch<{ data: AiOutput }>("/api/ai/triage", {
        method: "POST",
        body: JSON.stringify({ text, isSubscriber: true }),
      }),
    onSuccess: (response) => {
      setResult(response.data);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI Intake Triage (Internal Rules Engine)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            <Textarea value={text} onChange={(event) => setText(event.target.value)} />
            <Button type="submit">Generate triage</Button>
          </form>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Assistant Output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {result ? (
            <>
              <p>
                <strong>Category:</strong> {result.category}
              </p>
              <p>
                <strong>Urgency:</strong> {result.urgency}
              </p>
              <p>{result.summary}</p>
              <div>
                <p className="font-medium">Follow-up questions</p>
                <ul className="list-disc pl-5">
                  {result.followUpQuestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Suggested materials</p>
                <ul className="list-disc pl-5">
                  {result.suggestedMaterials.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <p>
                <strong>Estimate notes:</strong> {result.estimateNotes}
              </p>
            </>
          ) : (
            <p className="text-slate-500">Run a triage request to view structured output.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
