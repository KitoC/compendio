
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

interface ConnectedService {
  id: string;
  service_type: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  auth_type: string;
  config: any;
}

interface ServiceConnectionModalProps {
  service: ConnectedService | null;
  onSave: (service: ConnectedService) => void;
  onCancel: () => void;
}

const SERVICE_TYPES = [
  "gmail",
  "outlook",
  "slack",
  "n8n",
  "zapier",
  "airtable",
  "google_calendar",
  "google_sheets",
  "hubspot",
  "salesforce",
  "custom",
];

const AUTH_TYPES = ["oauth", "api_key", "username_password", "webhook", "none"];

const ServiceConnectionModal = ({
  service,
  onSave,
  onCancel,
}: ServiceConnectionModalProps) => {
  const { tenantId } = useAuth();
  const [formData, setFormData] = useState<ConnectedService>({
    id: "",
    service_type: "custom",
    name: "",
    status: "pending",
    auth_type: "none",
    config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenant_id: tenantId || "",
  });

  const isNew = !service?.id;

  useEffect(() => {
    if (service) {
      setFormData({
        ...service,
        config: service.config || {},
      });
    }
  }, [service]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfigChange = (configJson: string) => {
    try {
      const config = JSON.parse(configJson);
      setFormData((prev) => ({ ...prev, config }));
    } catch (error) {
      // Invalid JSON, don't update
    }
  };

  const handleStatusToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      status: checked ? "active" : "pending",
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add Service Connection" : "Edit Service Connection"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter service name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => handleSelectChange("service_type", value)}
              >
                <SelectTrigger id="service_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auth_type">Authentication Type</Label>
              <Select
                value={formData.auth_type}
                onValueChange={(value) => handleSelectChange("auth_type", value)}
              >
                <SelectTrigger id="auth_type">
                  <SelectValue placeholder="Select auth type" />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="block mb-6">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === "active"}
                  onCheckedChange={handleStatusToggle}
                />
                <Label htmlFor="status" className="cursor-pointer">
                  {formData.status === "active" ? "Active" : "Pending"}
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="config">Configuration</Label>
            <Textarea
              id="config"
              value={JSON.stringify(formData.config, null, 2)}
              onChange={(e) => handleConfigChange(e.target.value)}
              placeholder="{}"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter configuration as a JSON object
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isNew ? "Add Service" : "Update Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceConnectionModal;
