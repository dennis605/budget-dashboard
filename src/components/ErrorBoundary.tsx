import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("Dashboard render error:", error, info);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="font-semibold">Fehler im Dashboard</div>
            <div className="text-sm text-slate-700 mt-2">
              Bitte kopiere mir die Fehlermeldung aus dem Overlay/der Konsole hier rein.
            </div>
            <pre className="text-xs mt-3 whitespace-pre-wrap">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
