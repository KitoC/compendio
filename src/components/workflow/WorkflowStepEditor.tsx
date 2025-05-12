import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormBuilder from "@/components/FormBuilder";

interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_index: number;
  type: string;
  config: any;
  description: string;
  connected_service_id?: string;
  function_id?: string;
  created_at: string;
  tenant_id: string;
}

interface ConnectedService {
  id: string;
  name: string;
  service_type: string;
  status: string;
}

interface Function {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface WorkflowStepEditorProps {
  step: WorkflowStep;
  functions: Function[];
  connectedServices: ConnectedService[];
  onSave: (step: WorkflowStep) => void;
  onCancel: () => void;
}

const WorkflowStepEditor = ({
  step,
  functions,
  connectedServices,
  onSave,
  onCancel,
}: WorkflowStepEditorProps) => {
  const [editedStep, setEditedStep] = useState<WorkflowStep>({ ...step });
  const [configTab, setConfigTab] = useState("general");

  // Get default empty configuration based on step type
  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "form":
        return {
          title: "",
          fields: [],
          submitButtonText: "Submit",
        };
      case "service":
        return {
          action: "",
          parameters: {},
        };
      case "function":
        return {
          parameters: {},
        };
      case "conditional":
        return {
          condition: "",
          trueStepIndex: null,
          falseStepIndex: null,
        };
      default:
        return {};
    }
  };

  // Initialize config when step type changes
  useEffect(() => {
    if (!editedStep.config || Object.keys(editedStep.config).length === 0) {
      setEditedStep((prev) => ({
        ...prev,
        config: getDefaultConfig(prev.type),
      }));
    }
  }, [editedStep.type]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditedStep((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: string) => {
    setEditedStep((prev) => ({
      ...prev,
      type,
      config: getDefaultConfig(type),
      function_id: type === "function" ? prev.function_id : undefined,
      connected_service_id:
        type === "service" ? prev.connected_service_id : undefined,
    }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setEditedStep((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const handleFunctionChange = (functionId: string) => {
    setEditedStep((prev) => ({
      ...prev,
      function_id: functionId,
    }));
  };

  const handleServiceChange = (serviceId: string) => {
    setEditedStep((prev) => ({
      ...prev,
      connected_service_id: serviceId,
    }));
  };

  const handleSave = () => {
    onSave(editedStep);
  };

  // Form configuration for the config editor
  const configFormConfig = {
    id: "step-config-form",
    title: "Step Configuration",
    description: "Configure the step parameters",
    sections: [
      {
        id: "config-section",
        fields: Object.keys(editedStep.config || {}).map((key) => ({
          id: key,
          name: key,
          label:
            key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, " $1"),
          type:
            typeof editedStep.config[key] === "boolean"
              ? "checkbox"
              : Array.isArray(editedStep.config[key])
              ? "select"
              : typeof editedStep.config[key] === "number"
              ? "number"
              : "text",
          defaultValue: editedStep.config[key],
        })),
      },
    ],
    submitButtonText: "Update Configuration",
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {step.id ? "Edit Workflow Step" : "Add Workflow Step"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Step Type</Label>
              <Select value={editedStep.type} onValueChange={handleTypeChange}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="form">Form Input</SelectItem>
                  <SelectItem value="service">Service Integration</SelectItem>
                  <SelectItem value="function">Function Execution</SelectItem>
                  <SelectItem value="conditional">Conditional Logic</SelectItem>
                  <SelectItem value="wait">Wait/Delay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={editedStep.description}
                onChange={handleChange}
                placeholder="Describe this step"
              />
            </div>
          </div>

          <Tabs
            value={configTab}
            onValueChange={setConfigTab}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              {editedStep.type === "function" && (
                <TabsTrigger value="function">Function</TabsTrigger>
              )}
              {editedStep.type === "service" && (
                <TabsTrigger value="service">Service</TabsTrigger>
              )}
              {editedStep.type === "form" && (
                <TabsTrigger value="form">Form Fields</TabsTrigger>
              )}
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>General Settings</Label>
                <p className="text-sm text-muted-foreground">
                  Configure basic settings for this workflow step.
                </p>

                {/* Display fields based on step type */}
                {editedStep.type === "wait" && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="delay">Delay (seconds)</Label>
                    <Input
                      id="delay"
                      type="number"
                      value={editedStep.config?.delay || 0}
                      onChange={(e) =>
                        handleConfigChange("delay", parseInt(e.target.value))
                      }
                      min="0"
                    />
                  </div>
                )}

                {editedStep.type === "conditional" && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Textarea
                        id="condition"
                        value={editedStep.config?.condition || ""}
                        onChange={(e) =>
                          handleConfigChange("condition", e.target.value)
                        }
                        placeholder="Enter a condition expression"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use JavaScript expressions that evaluate to true/false.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trueStep">If True, Go To Step</Label>
                        <Input
                          id="trueStep"
                          type="number"
                          value={editedStep.config?.trueStepIndex || ""}
                          onChange={(e) =>
                            handleConfigChange(
                              "trueStepIndex",
                              parseInt(e.target.value)
                            )
                          }
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="falseStep">If False, Go To Step</Label>
                        <Input
                          id="falseStep"
                          type="number"
                          value={editedStep.config?.falseStepIndex || ""}
                          onChange={(e) =>
                            handleConfigChange(
                              "falseStepIndex",
                              parseInt(e.target.value)
                            )
                          }
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {editedStep.type === "function" && (
              <TabsContent value="function" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="function_id">Select Function</Label>
                  <Select
                    value={editedStep.function_id || ""}
                    onValueChange={handleFunctionChange}
                  >
                    <SelectTrigger id="function_id">
                      <SelectValue placeholder="Select a function" />
                    </SelectTrigger>
                    <SelectContent>
                      {functions.map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.name} - {func.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {editedStep.function_id && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/50">
                      <h4 className="font-medium mb-2">Function Details</h4>
                      <p className="text-sm">
                        {functions.find((f) => f.id === editedStep.function_id)
                          ?.description || "No description available"}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <Label>Function Parameters</Label>
                    <Textarea
                      value={JSON.stringify(
                        editedStep.config?.parameters || {},
                        null,
                        2
                      )}
                      onChange={(e) => {
                        try {
                          const params = JSON.parse(e.target.value);
                          handleConfigChange("parameters", params);
                        } catch (error) {
                          // Don't update if JSON is invalid
                        }
                      }}
                      placeholder="{}"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter parameters as JSON object
                    </p>
                  </div>
                </div>
              </TabsContent>
            )}

            {editedStep.type === "service" && (
              <TabsContent value="service" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="connected_service_id">Select Service</Label>
                  <Select
                    value={editedStep.connected_service_id || ""}
                    onValueChange={handleServiceChange}
                  >
                    <SelectTrigger id="connected_service_id">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectedServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {service.service_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {editedStep.connected_service_id && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/50">
                      <h4 className="font-medium mb-2">Service Details</h4>
                      <p className="text-sm">
                        Type:{" "}
                        {connectedServices.find(
                          (s) => s.id === editedStep.connected_service_id
                        )?.service_type || "Unknown"}
                      </p>
                      <p className="text-sm">
                        Status:{" "}
                        {connectedServices.find(
                          (s) => s.id === editedStep.connected_service_id
                        )?.status || "Unknown"}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <Label htmlFor="action">Service Action</Label>
                    <Input
                      id="action"
                      value={editedStep.config?.action || ""}
                      onChange={(e) =>
                        handleConfigChange("action", e.target.value)
                      }
                      placeholder="Enter action name"
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Service Parameters</Label>
                    <Textarea
                      value={JSON.stringify(
                        editedStep.config?.parameters || {},
                        null,
                        2
                      )}
                      onChange={(e) => {
                        try {
                          const params = JSON.parse(e.target.value);
                          handleConfigChange("parameters", params);
                        } catch (error) {
                          // Don't update if JSON is invalid
                        }
                      }}
                      placeholder="{}"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter parameters as JSON object
                    </p>
                  </div>
                </div>
              </TabsContent>
            )}

            {editedStep.type === "form" && (
              <TabsContent value="form" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="formTitle">Form Title</Label>
                    <Input
                      id="formTitle"
                      value={editedStep.config?.title || ""}
                      onChange={(e) =>
                        handleConfigChange("title", e.target.value)
                      }
                      placeholder="Enter form title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="submitButtonText">Submit Button Text</Label>
                    <Input
                      id="submitButtonText"
                      value={editedStep.config?.submitButtonText || "Submit"}
                      onChange={(e) =>
                        handleConfigChange("submitButtonText", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Form Fields</Label>
                    <Textarea
                      value={JSON.stringify(
                        editedStep.config?.fields || [],
                        null,
                        2
                      )}
                      onChange={(e) => {
                        try {
                          const fields = JSON.parse(e.target.value);
                          handleConfigChange("fields", fields);
                        } catch (error) {
                          // Don't update if JSON is invalid
                        }
                      }}
                      placeholder="[]"
                      rows={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Define form fields as JSON array. Each field should have
                      at minimum: id, name, label, and type.
                    </p>
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="advanced" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Raw Configuration</Label>
                <Textarea
                  value={JSON.stringify(editedStep.config || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      setEditedStep((prev) => ({ ...prev, config }));
                    } catch (error) {
                      // Don't update if JSON is invalid
                    }
                  }}
                  placeholder="{}"
                  rows={12}
                />
                <p className="text-xs text-muted-foreground">
                  Edit the raw configuration JSON for this step.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowStepEditor;
