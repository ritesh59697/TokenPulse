import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="card p-4 border-yellow-500/20 bg-yellow-500/5 flex items-center gap-3 mb-6">
      <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
      <div className="flex-1 text-sm text-yellow-300">{message || "Failed to load market data."}</div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-200 transition-colors font-medium"
      >
        <RefreshCw size={12} />
        Retry
      </button>
    </div>
  );
}
