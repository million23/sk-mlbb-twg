import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { ChartCard } from "@/components/charts/chart-card";
import {
  participantsByPhase,
  participantsByRegistrationStatus,
  participantsByTeamIntent,
} from "@/lib/analytics/tournament-analytics";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";

export function TournamentAnalyticsCharts({
  participants,
  isLoading = false,
}: {
  participants: ParticipantsRecord[];
  isLoading?: boolean;
}) {
  const phaseData = participantsByPhase(participants);
  const statusData = participantsByRegistrationStatus(participants);
  const intentData = participantsByTeamIntent(participants);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.22em]">
          Tournament analytics
        </h2>
        <p className="text-muted-foreground text-xs">Aggregated roster data</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard
          title="Participants by phase"
          description="Residency distribution across eligible phases"
          isLoading={isLoading}
          isEmpty={phaseData.every((point) => point.value === 0)}
          emptyMessage="Approved or pending participants will appear here."
        >
          <BarChart
            data={phaseData}
            ariaLabel="Participants grouped by barangay phase"
            color="var(--primary)"
          />
        </ChartCard>
        <ChartCard
          title="Registration status"
          description="Current review state of registrants"
          isLoading={isLoading}
          isEmpty={statusData.every((point) => point.value === 0)}
          emptyMessage="Registration records will appear here."
        >
          <DonutChart
            data={statusData}
            ariaLabel="Participants grouped by registration status"
            colors={["var(--warning)", "var(--success)", "var(--destructive)"]}
          />
        </ChartCard>
        <ChartCard
          title="Team intent"
          description="How registrants want to form or join teams"
          isLoading={isLoading}
          isEmpty={intentData.every((point) => point.value === 0)}
          emptyMessage="Team intent data will appear here."
          className="lg:col-span-2"
        >
          <BarChart
            data={intentData}
            ariaLabel="Participants grouped by team intent"
            color="var(--warning)"
            orientation="horizontal"
          />
        </ChartCard>
      </div>
    </section>
  );
}
