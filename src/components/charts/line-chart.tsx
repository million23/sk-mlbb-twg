import { defineChart, lineY } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts-scales/band";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { tooltip as baseTooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";

export type LineChartDatum = {
  label: string;
  value: number;
};

export function LineChart({
  data,
  ariaLabel,
  color = "var(--primary)",
}: {
  data: LineChartDatum[];
  ariaLabel: string;
  color?: string;
}) {
  const definition = defineChart({
    marks: [
      lineY(data, {
        x: "label",
        y: "value",
        key: "label",
        stroke: color,
        strokeWidth: 3,
        points: true,
      }),
    ],
    x: { scale: () => scaleBand() },
    y: { scale: () => scaleLinear() },
    tooltip: {
      use: baseTooltip,
      items: [
        { field: "label", label: "Category" },
        { field: "value", label: "Value" },
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
