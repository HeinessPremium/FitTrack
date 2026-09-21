import { CoachWithProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/form";
import { formatNaira } from "@/lib/utils";

export function CoachCard({
  coach,
  onBook,
}: {
  coach: CoachWithProfile;
  onBook: (coach: CoachWithProfile) => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-[1.3rem]">
          {coach.profile.avatar_emoji ?? "🏋️"}
        </span>
        <div>
          <p className="text-[0.95rem] font-semibold text-ink">
            {coach.profile.full_name}
          </p>
          <p className="text-[0.8rem] text-ink/50">{coach.specialty}</p>
        </div>
      </div>

      <p className="line-clamp-3 text-[0.85rem] leading-relaxed text-ink/60">
        {coach.bio}
      </p>

      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-[0.95rem] font-semibold text-brand">
            {formatNaira(coach.hourly_rate_kobo)}
          </p>
          <p className="text-[0.74rem] text-ink/45">
            {coach.years_experience}+ yrs experience
          </p>
        </div>
        <Button size="sm" onClick={() => onBook(coach)}>
          Book
        </Button>
      </div>
    </Card>
  );
}
