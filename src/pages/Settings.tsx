
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useAiAgents } from "@/contexts/AiAgents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { IAiAgent } from "@/types/aiAgents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

// Form schema for agent creation/editing
const agentFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  human_name: z.string().min(2, { message: "Human name must be at least 2 characters." }),
  responsibility: z.string().min(10, { message: "Responsibility must be at least 10 characters." }),
  prompt: z.string().min(20, { message: "Prompt must be at least 20 characters." }),
  model: z.string().min(1, { message: "Please select a model." }),
  avatar_url: z.string().optional(),
  enabled: z.boolean().default(true),
});

// Form schema for appearance settings
const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], { 
    required_error: "Please select a theme." 
  }),
  fontSize: z.enum(["small", "medium", "large"], {
    required_error: "Please select a font size."
  }),
  accentColor: z.enum(["blue", "green", "purple", "orange", "pink"], {
    required_error: "Please select an accent color."
  }),
  borderRadius: z.enum(["none", "small", "medium", "large"], {
    required_error: "Please select a border radius."
  }),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const defaultAgentValues: AgentFormValues = {
  name: "",
  human_name: "",
  responsibility: "",
  prompt: "",
  model: "gpt-4o-mini",
  avatar_url: "",
  enabled: true,
};

const defaultAppearanceValues: AppearanceFormValues = {
  theme: "system",
  fontSize: "medium",
  accentColor: "blue",
  borderRadius: "medium",
};

const Settings = () => {
  const { aiAgents, isLoading, createAiAgent, updateAiAgent, deleteAiAgent } = useAiAgents();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<IAiAgent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("agents");

  const createForm = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: defaultAgentValues,
  });

  const editForm = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: defaultAgentValues,
  });

  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: defaultAppearanceValues,
  });

  const handleCreateSubmit = async (values: AgentFormValues) => {
    if (!user?.tenant_id) return;
    
    // Create the agent with all required fields
    await createAiAgent({
      name: values.name,
      human_name: values.human_name,
      responsibility: values.responsibility,
      prompt: values.prompt,
      model: values.model,
      avatar_url: values.avatar_url,
      enabled: values.enabled,
      tenant_id: user.tenant_id,
    });
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const handleEditSubmit = async (values: AgentFormValues) => {
    if (selectedAgent) {
      await updateAiAgent(selectedAgent.id, values);
      setIsEditDialogOpen(false);
      setSelectedAgent(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedAgent) {
      await deleteAiAgent(selectedAgent.id);
      setIsDeleteDialogOpen(false);
      setSelectedAgent(null);
    }
  };

  const openEditDialog = (agent: IAiAgent) => {
    setSelectedAgent(agent);
    editForm.reset({
      name: agent.name,
      human_name: agent.human_name || "",
      responsibility: agent.responsibility,
      prompt: agent.prompt,
      model: agent.model,
      avatar_url: agent.avatar_url || "",
      enabled: agent.enabled,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (agent: IAiAgent) => {
    setSelectedAgent(agent);
    setIsDeleteDialogOpen(true);
  };

  const handleAppearanceSubmit = (values: AppearanceFormValues) => {
    console.log("Appearance settings:", values);
    // Here you would typically save these settings to localStorage or backend
    // For now, we'll just show a success message
    // TODO: Implement actual appearance settings saving
  };

  // Generate avatar fallback from name
  const getAvatarFallback = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        {/* AI Agents Tab */}
        <TabsContent value="agents" className="space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">AI Agent Settings</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New AI Agent</DialogTitle>
                  <DialogDescription>
                    Configure a new AI agent to assist your team.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agent ID</FormLabel>
                          <FormControl>
                            <Input placeholder="assistant-name" {...field} />
                          </FormControl>
                          <FormDescription>
                            The unique identifier for this agent (no spaces).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="human_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Assistant Name" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name shown to users.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="responsibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsibility</FormLabel>
                          <FormControl>
                            <Input placeholder="Help users with..." {...field} />
                          </FormControl>
                          <FormDescription>
                            What this agent is responsible for.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prompt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="You are an AI assistant that..." 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The system prompt for the agent.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The OpenAI model to use for this agent.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="avatar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/avatar.png" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional URL for the agent's avatar image.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enabled</FormLabel>
                            <FormDescription>
                              Whether this agent is active and available for use.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)} 
                        type="button"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Agent"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading && aiAgents.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {aiAgents.map((agent) => (
                <Card key={agent.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={agent.avatar_url || ""} alt={agent.human_name || agent.name} />
                        <AvatarFallback>{getAvatarFallback(agent.human_name || agent.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{agent.human_name || agent.name}</CardTitle>
                        <CardDescription className="text-xs">ID: {agent.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Responsibility:</span>
                        <p className="text-sm text-muted-foreground">{agent.responsibility}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Model:</span>
                        <p className="text-sm text-muted-foreground">{agent.model}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Status:</span>
                        <p className="text-sm text-muted-foreground">
                          {agent.enabled ? (
                            <span className="text-green-500">Enabled</span>
                          ) : (
                            <span className="text-red-500">Disabled</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(agent)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => openDeleteDialog(agent)}
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Appearance Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Customize Interface</CardTitle>
                <CardDescription>
                  Adjust how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appearanceForm}>
                  <form onSubmit={appearanceForm.handleSubmit(handleAppearanceSubmit)} className="space-y-6">
                    <FormField
                      control={appearanceForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose between light, dark, or system theme.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appearanceForm.control}
                      name="fontSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a font size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Adjust the size of text throughout the application.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appearanceForm.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent Color</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an accent color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                              <SelectItem value="pink">Pink</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the primary color for buttons and interactive elements.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appearanceForm.control}
                      name="borderRadius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Border Radius</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a border radius" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Set how rounded corners appear throughout the interface.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">Save Appearance Settings</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit AI Agent</DialogTitle>
            <DialogDescription>
              Update the configuration for this AI agent.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The unique identifier for this agent (no spaces).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="human_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The name shown to users.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="responsibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsibility</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      What this agent is responsible for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormDescription>
                      The system prompt for the agent.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The OpenAI model to use for this agent.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional URL for the agent's avatar image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enabled</FormLabel>
                      <FormDescription>
                        Whether this agent is active and available for use.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)} 
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAgent?.human_name || selectedAgent?.name}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
