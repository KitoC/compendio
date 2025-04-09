import { MailCheck, MailPlus, MailQuestion, MailX } from "lucide-react";

export const PRIORITIES = {
  0: { label: "Low", color: "bg-slate-300" },
  1: { label: "Routine", color: "bg-slate-500" },
  2: { label: "Important", color: "bg-green-500" },
  3: { label: "High", color: "bg-amber-500" },
  4: { label: "Urgent", color: "bg-red-500" },
};

export const PRIORITY_FILTER_KEY = "metadata.priority";

export const EMAIL_STATUSES = {
  sent: {
    label: "Sent",
    color: "bg-green-500",
    value: "sent",
    Icon: MailCheck,
  },
  draft: {
    label: "Drafted",
    color: "bg-blue-500",
    value: "draft",
    Icon: MailQuestion,
  },
  received: {
    label: "Received",
    color: "bg-yellow-500",
    value: "received",
    Icon: MailPlus,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500",
    value: "failed",
    Icon: MailX,
  },
};

export const EMAIL_STATUS_FILTER_KEY = "metadata.status";
