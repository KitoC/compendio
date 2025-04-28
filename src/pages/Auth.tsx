import { useState } from "react";
import { Link } from "react-router-dom";
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
import { SiGoogle, SiMicrosoft } from "react-icons/si";

enum AuthView {
  SIGN_IN = "sign-in",
  SIGN_UP = "sign-up",
}

const AuthForm = ({
  onSubmit,
  view,
}: {
  onSubmit: (payload: { email: string; password: string }) => void;
  view: AuthView;
}) => {
  const { handleOAuthSignIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        onSubmit({ email, password });
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
            {view === AuthView.SIGN_IN && (
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-primary flex items-center"
              >
                Forgot password?
              </Link>
            )}
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
        <Button type="submit" className="w-full">
          {view === AuthView.SIGN_IN ? "Sign In" : "Create Account"}
        </Button>
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/30" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">
              {view === AuthView.SIGN_IN
                ? "Or continue with"
                : "Or sign up with"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn("google" as Provider)}
          >
            <SiGoogle /> Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn("azure" as Provider)}
          >
            <SiMicrosoft /> Azure (outlook)
          </Button>
        </div>{" "}
      </CardFooter>
    </form>
  );
};

const Auth = () => {
  const [view, setView] = useState<AuthView>(AuthView.SIGN_IN);

  const { handleEmailSignIn, handleOAuthSignIn, handleEmailSignUp } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {view === AuthView.SIGN_IN ? "Sign In" : "Create an Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {view === AuthView.SIGN_IN
              ? "Enter your credentials to access your account"
              : "Enter your details to create an account"}
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue={view} onValueChange={(v) => setView(v as AuthView)}>
          <div className="px-6">
            <TabsList className="grid grid-cols-2 w-full py-1">
              <TabsTrigger value={AuthView.SIGN_IN}>Sign In</TabsTrigger>
              <TabsTrigger value={AuthView.SIGN_UP}>Sign Up</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={AuthView.SIGN_IN}>
            <AuthForm onSubmit={handleEmailSignIn} view={view} />
          </TabsContent>

          <TabsContent value={AuthView.SIGN_UP}>
            <AuthForm onSubmit={handleEmailSignUp} view={view} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
