import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { ThumbsUp, ThumbsDown, Send, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/app/feedback")({
  head: () => ({ meta: [{ title: "Feedback — OCP AI Monitor" }] }),
  component: FeedbackPage,
});

interface FeedbackEntry {
  id: string;
  recId: string;
  decision: "applied" | "rejected";
  user: string;
  comment: string;
  ts: string;
}

const INITIAL: FeedbackEntry[] = [
  { id: "F-104", recId: "REC-512", decision: "applied", user: "Yassine O.", comment: "Setpoint reduction worked, temperature back to normal in 6 min.", ts: "14:42" },
  { id: "F-103", recId: "REC-509", decision: "rejected", user: "Sara E.", comment: "Recommendation came too late, we already triggered manual cooling.", ts: "13:10" },
  { id: "F-102", recId: "REC-508", decision: "applied", user: "Mohammed T.", comment: "Maintenance scheduled as suggested.", ts: "11:25" },
];

function FeedbackPage() {
  const [items, setItems] = useState<FeedbackEntry[]>(INITIAL);
  const [decision, setDecision] = useState<"applied" | "rejected">("applied");
  const [comment, setComment] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setItems([
      {
        id: `F-${105 + items.length - 2}`,
        recId: "REC-512",
        decision,
        user: "You",
        comment,
        ts: new Date().toLocaleTimeString().slice(0, 5),
      },
      ...items,
    ]);
    setComment("");
  };

  return (
    <div>
      <PageHeader
        title="Feedback & continuous improvement"
        subtitle="Your decisions train the next model iteration"
      />

      <div className="grid lg:grid-cols-5 gap-4">
        <form onSubmit={submit} className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)] h-fit">
          <h3 className="text-sm font-semibold mb-1">Share feedback on REC-512</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Reduce reactor R-204 setpoint by 4 °C
          </p>

          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Your decision
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setDecision("applied")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm transition ${
                decision === "applied"
                  ? "bg-success text-success-foreground border-success"
                  : "border-border hover:bg-muted"
              }`}
            >
              <ThumbsUp className="w-4 h-4" /> Applied
            </button>
            <button
              type="button"
              onClick={() => setDecision("rejected")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm transition ${
                decision === "rejected"
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "border-border hover:bg-muted"
              }`}
            >
              <ThumbsDown className="w-4 h-4" /> Rejected
            </button>
          </div>

          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Comment for the model team
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="What worked, what didn't? Any context the model should learn?"
            className="mt-1.5 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            type="submit"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:opacity-95"
          >
            Submit feedback <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Team feedback log</h3>
          </div>
          <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {items.map((f) => (
              <li key={f.id} className="p-4 flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${
                    f.decision === "applied"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {f.decision === "applied" ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{f.user}</span>
                    <span>·</span>
                    <span className="font-mono">{f.recId}</span>
                    <span>·</span>
                    <span>{f.ts}</span>
                  </div>
                  <p className="text-sm mt-1">{f.comment}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
