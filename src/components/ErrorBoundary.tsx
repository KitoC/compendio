
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Create a mobile-friendly fallback UI component with Safari-specific fixes
const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error | null; 
  resetErrorBoundary: () => void;
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className={`w-full ${isMobile ? 'max-w-[95%]' : 'max-w-md'} mx-auto mt-8 safari-card-fix`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Something went wrong</CardTitle>
        </div>
        <CardDescription>
          An error occurred while rendering this view
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-md overflow-auto max-h-48 safari-overflow-fix">
          <p className="text-destructive font-mono text-sm break-words">
            {error?.toString()}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          onClick={resetErrorBoundary}
          className="w-full"
          variant="default"
        >
          Try again
        </Button>
        <Button 
          onClick={() => {
            window.location.href = '/';
          }}
          className="w-full"
          variant="outline"
        >
          Go to Home Page
        </Button>
      </CardFooter>
    </Card>
  );
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Safari sometimes throws Object objects, handle them gracefully
    return { 
      hasError: true, 
      error: error instanceof Error ? error : new Error(String(error)), 
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback 
          error={this.state.error} 
          resetErrorBoundary={this.resetErrorBoundary} 
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
