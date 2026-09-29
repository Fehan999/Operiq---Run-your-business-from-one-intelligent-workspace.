import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isFirebaseConfigured } from "@/config/public-env";

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
            Add the NEXT_PUBLIC_FIREBASE_* variables to your environment to enable sign-in.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
