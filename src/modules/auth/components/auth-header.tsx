import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isFirebaseConfigured, missingFirebaseVariables } from "@/config/public-env";

export function AuthHeader({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-6 grid gap-1.5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {!isFirebaseConfigured ? (
        <Alert variant="destructive" className="mt-3">
          <CircleAlert />
          <AlertTitle>Authentication is not configured</AlertTitle>
          <AlertDescription>
            <p>
              Missing: <code className="break-all">{missingFirebaseVariables.join(", ")}</code>
            </p>
            <p>
              Locally, add them to <code>.env.local</code> in the project root (next to{" "}
              <code>package.json</code>) and restart <code>npm run dev</code>. On Vercel, add them
              under Settings, Environment Variables and redeploy.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
