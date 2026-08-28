import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { fullName, initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AVATARS_BUCKET } from "@/services/storage-service";
import type { Profile } from "@/types/domain";

const presenceRing: Record<string, string> = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-muted-foreground",
};

export function UserAvatar({
  profile,
  className,
  showPresence = false,
}: {
  profile?: Profile | null;
  className?: string;
  showPresence?: boolean;
}) {
  const { data: signedUrl } = useSignedUrl(profile?.avatar_url, AVATARS_BUCKET);

  return (
    <span className="relative inline-flex shrink-0">
      <Avatar className={cn("h-9 w-9 border border-border-strong", className)}>
        {signedUrl ? <AvatarImage src={signedUrl} alt={fullName(profile?.first_name, profile?.last_name)} /> : null}
        <AvatarFallback className="bg-primary-soft text-[0.7rem] font-bold text-primary">
          {initialsOf(profile?.first_name, profile?.last_name)}
        </AvatarFallback>
      </Avatar>
      {showPresence ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
            presenceRing[profile?.presence ?? "offline"],
          )}
        />
      ) : null}
    </span>
  );
}
