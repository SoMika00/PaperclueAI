"use client";
/* Class component required — React error boundaries can't be hooks.
   Catches render- and commit-phase errors (including effect crashes) below
   it, so one broken panel doesn't take down the whole app with Next's
   generic "Application error" page. componentDidCatch logs the real
   component stack, which is the one place a crash actually names the
   component at fault instead of pointing into minified React internals. */
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (retry: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] caught:", error, "\ncomponent stack:", info.componentStack);
  }

  render() {
    if (this.state.error) {
      const retry = () => this.setState({ error: null });
      if (this.props.fallback) return this.props.fallback(retry);
      return (
        <div className="flex items-center gap-3 p-6 text-sm text-danger">
          <span>Something went wrong loading this view.</span>
          <button onClick={retry} className="btn btn-outline px-2.5 py-1">
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
