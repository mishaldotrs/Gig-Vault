import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, truncateHash, explorerTxUrl } from "@/lib/utils";
import type { TxStatus } from "@/types/events";

export function TxStatusBadge({ status }: { status: TxStatus }) {
  if (status === "pending") {
    return (
      <Badge variant="muted" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Pending
      </Badge>
    );
  }
  if (status === "success") {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
}

export function TxHashLink({ hash, className }: { hash: string | null; className?: string }) {
  if (!hash) return <span className={cn("text-muted-foreground", className)}>—</span>;
  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary",
        className
      )}
    >
      {truncateHash(hash)}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
