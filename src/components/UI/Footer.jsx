import React from "react";
import { Zap } from "lucide-react";
import { timeAgo } from "../../utils/format";

export default function Footer({ lastUpdated, error, onRefetch }) {
  return (
    <footer className="border-t border-card-border mt-10 py-6 px-6">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-accent" />
          <span className="font-semibold text-text-secondary">TokenPulse</span>
          <span>· Powered by CoinGecko API</span>
        </div>

        <div className="flex items-center gap-4">
          {error && (
            <span className="text-negative flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-negative" />
              {error}
            </span>
          )}
          {lastUpdated && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-positive pulse-dot" />
              Updated {timeAgo(lastUpdated)}
            </span>
          )}
          <button
            onClick={onRefetch}
            className="px-3 py-1 rounded-lg border border-card-border text-text-secondary hover:border-accent/50 hover:text-white transition-all"
          >
            Refresh
          </button>
        </div>
      </div>
    </footer>
  );
}
