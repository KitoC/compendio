import React, { useState, useCallback, useEffect } from "react";
import ControlButton from "../controls/ControlButton";
import { useRealtimeAiAgent } from "../../RealtimAiAgentContext";
import ResponsiveModal from "@/components/ui/responsive-modal";
import { Bug } from "lucide-react";

const ContextModal = () => {
  const { isListening, realtimeAgent } = useRealtimeAiAgent();
  const [visible, setVisible] = useState(false);
  const [context, setContext] = useState(realtimeAgent?.getFullContext());
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const handleOnButtonClick = useCallback(() => {
    setVisible(true);
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  useEffect(() => {
    return realtimeAgent?.onContextUpdated(({ fullContext }) => {
      setContext(fullContext);
    });
  }, [realtimeAgent]);

  return (
    <div>
      <ControlButton
        onClick={handleOnButtonClick}
        isVisible={isListening && process.env.NODE_ENV === "development"}
        isListening={isListening}
        icon={<Bug />}
        tooltip="Open context debugger"
      />

      <ResponsiveModal
        setIsOpen={setVisible}
        isOpen={visible}
        title="Current AI Context"
      >
        <div className="space-y-6">
          {/* Tools Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection("tools")}
              className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
            >
              <span>Tools</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  expandedSections.tools ? "rotate-180" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {expandedSections.tools && (
              <div className="p-4 border-t border-gray-200">
                <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify(context?.tools, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Context Items Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Context Items
            </h3>
            <div className="space-y-3">
              {context?.contextItems?.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg"
                >
                  <button
                    onClick={() => toggleSection(item.id)}
                    className="w-full px-4 py-3 text-left font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
                  >
                    <span>{item.id}</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        expandedSections[item.id] ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {expandedSections[item.id] && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Prompt
                        </h4>
                        <p className="text-gray-700">{item.instructions}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Raw Data
                        </h4>
                        <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                          {JSON.stringify(item.rawData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
};

export default ContextModal;
