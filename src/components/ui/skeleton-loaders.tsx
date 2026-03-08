import React, { memo } from "react";

interface SkeletonCardProps {
  lines?: number;
  showHeader?: boolean;
  showChart?: boolean;
}

export const SkeletonCard = memo(({ lines = 3, showHeader = true, showChart = false }: SkeletonCardProps) => (
  <div className="rounded-lg border border-border bg-card p-5 animate-pulse">
    {showHeader && (
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded" />
      </div>
    )}
    {showChart && (
      <div className="h-40 bg-muted rounded-md mb-4" />
    )}
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-muted rounded" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  </div>
));
SkeletonCard.displayName = "SkeletonCard";

export const SkeletonTable = memo(({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
    {/* Header */}
    <div className="bg-muted/50 px-4 py-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-3 bg-muted rounded flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="px-4 py-3 flex gap-4 border-t border-border">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="h-3 bg-muted rounded flex-1" style={{ opacity: 0.4 + Math.random() * 0.4 }} />
        ))}
      </div>
    ))}
  </div>
));
SkeletonTable.displayName = "SkeletonTable";

export const SkeletonDashboard = memo(() => (
  <div className="space-y-6">
    {/* Stats row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} lines={2} showHeader={true} />
      ))}
    </div>
    {/* Chart */}
    <SkeletonCard lines={0} showHeader={true} showChart={true} />
    {/* Table */}
    <SkeletonTable rows={5} cols={5} />
  </div>
));
SkeletonDashboard.displayName = "SkeletonDashboard";

export const SkeletonForm = memo(({ fields = 4 }: { fields?: number }) => (
  <div className="rounded-lg border border-border bg-card p-6 space-y-5 animate-pulse">
    <div className="h-5 w-40 bg-muted rounded mb-6" />
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-10 bg-muted rounded-md" />
      </div>
    ))}
    <div className="h-10 w-32 bg-primary/20 rounded-md mt-4" />
  </div>
));
SkeletonForm.displayName = "SkeletonForm";
