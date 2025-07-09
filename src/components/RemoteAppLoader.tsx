import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

interface RemoteAppLoaderProps {
  appName: string;
  moduleName: string;
  fallback?: React.ComponentType;
}

interface RemoteModule {
  default: React.ComponentType;
}

// Dynamic import function for remote modules
const loadRemoteModule = (appName: string, moduleName: string) => {
  return lazy(() => {
    // @ts-ignore - Module federation will handle this at runtime
    return (window as any)[appName]
      ? (window as any)[appName].get(moduleName).then((factory: () => RemoteModule) => {
          const Module = factory();
          return { default: Module.default };
        })
      : Promise.reject(new Error(`Remote app "${appName}" not available`));
  });
};

const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm text-muted-foreground">Loading remote app...</p>
    </div>
  </div>
);

const ErrorFallback = ({ error }: { error: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-destructive mb-2">
        Failed to load remote app
      </h3>
      <p className="text-sm text-muted-foreground">{error}</p>
    </div>
  </div>
);

export function RemoteAppLoader({ 
  appName, 
  moduleName, 
  fallback: CustomFallback 
}: RemoteAppLoaderProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [RemoteComponent, setRemoteComponent] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        setError(null);
        const Component = loadRemoteModule(appName, moduleName);
        if (mounted) {
          setRemoteComponent(() => Component);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [appName, moduleName]);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  if (!RemoteComponent) {
    return CustomFallback ? <CustomFallback /> : <DefaultFallback />;
  }

  return (
    <Suspense fallback={CustomFallback ? <CustomFallback /> : <DefaultFallback />}>
      <RemoteComponent />
    </Suspense>
  );
}

export default RemoteAppLoader;