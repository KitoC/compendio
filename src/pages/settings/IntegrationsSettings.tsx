
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

// Define the validation schema for Gmail credentials
const gmailCredentialsSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  clientId: z.string().min(1, { message: "Client ID is required" }),
  clientSecret: z.string().min(1, { message: "Client Secret is required" }),
});

// Define the validation schema for Outlook credentials
const outlookCredentialsSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  clientId: z.string().min(1, { message: "Client ID is required" }),
  clientSecret: z.string().min(1, { message: "Client Secret is required" }),
});

type GmailCredentials = z.infer<typeof gmailCredentialsSchema>;
type OutlookCredentials = z.infer<typeof outlookCredentialsSchema>;

const IntegrationsSettings = () => {
  const { tenantId } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("gmail");
  const [isSubmittingGmail, setIsSubmittingGmail] = useState(false);
  const [isSubmittingOutlook, setIsSubmittingOutlook] = useState(false);

  // Gmail form
  const gmailForm = useForm<GmailCredentials>({
    resolver: zodResolver(gmailCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
      clientId: "",
      clientSecret: "",
    },
  });

  // Outlook form
  const outlookForm = useForm<OutlookCredentials>({
    resolver: zodResolver(outlookCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
      clientId: "",
      clientSecret: "",
    },
  });

  // Handle Gmail form submission
  const onSubmitGmail = async (data: GmailCredentials) => {
    if (!tenantId) {
      toast.error("Tenant ID is missing");
      return;
    }

    setIsSubmittingGmail(true);

    try {
      // Save credentials to the database
      const { error } = await supabase.from("credentials").insert({
        tenant_id: tenantId,
        provider: "gmail",
        credentials: {
          email: data.email,
          password: data.password,
          client_id: data.clientId,
          client_secret: data.clientSecret,
        },
      });

      if (error) throw error;

      toast.success("Gmail credentials saved successfully");
      gmailForm.reset();
    } catch (error) {
      console.error("Error saving Gmail credentials:", error);
      toast.error("Failed to save Gmail credentials");
    } finally {
      setIsSubmittingGmail(false);
    }
  };

  // Handle Outlook form submission
  const onSubmitOutlook = async (data: OutlookCredentials) => {
    if (!tenantId) {
      toast.error("Tenant ID is missing");
      return;
    }

    setIsSubmittingOutlook(true);

    try {
      // Save credentials to the database
      const { error } = await supabase.from("credentials").insert({
        tenant_id: tenantId,
        provider: "outlook",
        credentials: {
          email: data.email,
          password: data.password,
          client_id: data.clientId,
          client_secret: data.clientSecret,
        },
      });

      if (error) throw error;

      toast.success("Outlook credentials saved successfully");
      outlookForm.reset();
    } catch (error) {
      console.error("Error saving Outlook credentials:", error);
      toast.error("Failed to save Outlook credentials");
    } finally {
      setIsSubmittingOutlook(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your email accounts to enable email-based triggers and actions.
        </p>
      </div>

      <Tabs defaultValue="gmail" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
          <TabsTrigger value="outlook">Outlook</TabsTrigger>
        </TabsList>

        <TabsContent value="gmail" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Gmail Integration
              </CardTitle>
              <CardDescription>
                Connect your Gmail account to set up email triggers and actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...gmailForm}>
                <form onSubmit={gmailForm.handleSubmit(onSubmitGmail)} className="space-y-4">
                  <FormField
                    control={gmailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="your-email@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gmailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••••••••••" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Use an App Password created in your Google Account settings, not your regular account password.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gmailForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OAuth Client ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Client ID from Google Cloud Console" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gmailForm.control}
                    name="clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OAuth Client Secret</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Client Secret from Google Cloud Console"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmittingGmail}>
                    {isSubmittingGmail ? "Saving..." : "Save Gmail Credentials"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outlook" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Outlook Integration
              </CardTitle>
              <CardDescription>
                Connect your Outlook account to set up email triggers and actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...outlookForm}>
                <form onSubmit={outlookForm.handleSubmit(onSubmitOutlook)} className="space-y-4">
                  <FormField
                    control={outlookForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="your-email@outlook.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={outlookForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={outlookForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Registration Client ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Client ID from Azure Portal app registration"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={outlookForm.control}
                    name="clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Registration Client Secret</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Client Secret from Azure Portal app registration"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmittingOutlook}>
                    {isSubmittingOutlook ? "Saving..." : "Save Outlook Credentials"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsSettings;
