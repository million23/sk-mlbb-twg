import { defineChart } from "@tanstack/charts";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { tooltip as baseTooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";

export type DonutChartDatum = {
  label: string;
  value: number;
};

export function DonutChart({
  data,
  ariaLabel,
  colors = ["var(--primary)", "var(--success)", "var(--warning)"],
}: {
  data: DonutChartDatum[];
  ariaLabel: string;
  colors?: string[];
}) {
  const slices = pie(data, { value: "value" });
  const definition = defineChart({
    marks: [
      polar({
        marks: [
          radialArc(slices, {
            startAngle: "startAngle",
            endAngle: "endAngle",
            innerRadius: 48,
            outerRadius: 88,
            fill: (datum: { index: number }) =>
              colors[datum.index % colors.length] ?? "var(--primary)",
            key: "label",
          }),
        ],
        angle: { scale: () => scaleLinear() },
        radius: { scale: () => scaleLinear() },
      }),
    ],
    tooltip: {
      use: baseTooltip,
      items: [
        { field: "label", label: "Category" },
        { field: "value", label: "Count" },
      ],
    },
  });

  return (
    <Chart
      definition={definition}
      ariaLabel={ariaLabel}
      height={220}
      className="w-full"
    />
  );
}
