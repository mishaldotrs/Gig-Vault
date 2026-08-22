import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center gap-4 py-32 text-center">
      <Lock className="h-10 w-10 text-muted-foreground" />
      <h1 className="font-display text-3xl font-semibold">This vault seal is empty</h1>
      <p className="max-w-sm text-muted-foreground">
        The page you're looking for doesn't exist. It may have moved, or the link was mistyped.
      </p>
      <Link href="/">
        <Button variant="vault">Back to home</Button>
      </Link>
    </div>
  );
}
