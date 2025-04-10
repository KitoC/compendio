import { BadgeProps } from "@/components/ui/badge";
import {
  MailCheck,
  MailPlus,
  MailQuestion,
  MailWarning,
  MailX,
} from "lucide-react";

export interface IPriority {
  label: string;
  variant: BadgeProps["variant"];
}

export const PRIORITIES: {
  [key: number]: IPriority;
} = {
  0: { label: "Low", variant: "muted" },
  1: { label: "Routine", variant: "info" },
  2: { label: "Important", variant: "success" },
  3: { label: "High", variant: "warning" },
  4: { label: "Urgent", variant: "error" },
};

export const PRIORITY_FILTER_KEY = "metadata.priority";

export const EMAIL_STATUSES = {
  ignored: {
    label: "Ignored",
    color: "bg-gray-500",
    value: "ignored",
    Icon: MailX,
  },
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
    Icon: MailWarning,
  },
};

export const EMAIL_STATUS_FILTER_KEY = "metadata.status";
