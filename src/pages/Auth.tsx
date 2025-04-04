import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Provider } from "@supabase/supabase-js";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"sign-in" | "sign-up">("sign-in");

  const { handleEmailSignIn, handleOAuthSignIn, handleEmailSignUp } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {view === "sign-in" ? "Sign In" : "Create an Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {view === "sign-in"
              ? "Enter your credentials to access your account"
              : "Enter your details to create an account"}
          </CardDescription>
        </CardHeader>

        <Tabs
          defaultValue={view}
          onValueChange={(v) => setView(v as "sign-in" | "sign-up")}
        >
          <div className="px-6">
            <TabsList className="grid grid-cols-2 w-full py-1">
              <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sign-in">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                handleEmailSignIn({ email, password });
              }}
            >
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to={ROUTES.FORGOT_PASSWORD}
                      className="text-sm text-primary flex items-center"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/30" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleOAuthSignIn("google" as Provider)}
                  >
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleOAuthSignIn("azure" as Provider)}
                  >
                    Azure (outlook)
                  </Button>
                </div>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="sign-up">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                handleEmailSignUp({ email, password });
              }}
            >
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>

                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/30" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or sign up with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleOAuthSignIn("google" as Provider)}
                  >
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleOAuthSignIn("github" as Provider)}
                  >
                    GitHub
                  </Button>
                </div>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
