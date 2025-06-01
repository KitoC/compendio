import React from "react";
import { useRealtimeAiAgent } from "../../RealtimAiAgentContext";

const ErrorMessage = () => {
  const { error, dismissError } = useRealtimeAiAgent();

  const errorSnippets = [
    { label: "Event Id", value: error?.event_id },
    { label: "Code", value: error?.error?.code },
    { label: "Message", value: error?.error?.message },
    { label: "Failed Param", value: error?.error?.param },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-red-600">Error!</h3>
        <button
          type="button"
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          onClick={dismissError}
        >
          Dismiss
        </button>
      </div>

      <p className="text-sm text-gray-700">
        This feature is still in beta and errors can happen. We have noted this
        error and will endeavour to fix it.
      </p>

      <p className="text-sm text-gray-700">
        You can try again by waking up the agent or contact support if issue
        persists.
      </p>

      {process.env.NODE_ENV !== "production" && (
        <div className="flex flex-col gap-2">
          {errorSnippets.map((err) => (
            <div className="flex flex-col" key={err.label}>
              <span className="text-xs font-bold text-gray-600">
                {err.label}
              </span>
              <span className="text-xs text-gray-500">{err.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;
