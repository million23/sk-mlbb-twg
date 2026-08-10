import { barX, barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts-scales/band";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { tooltip as baseTooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";

export type BarChartDatum = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartDatum[];
  ariaLabel: string;
  color?: string;
  orientation?: "vertical" | "horizontal";
};

export function BarChart({
  data,
  ariaLabel,
  color = "var(--primary)",
  orientation = "vertical",
}: BarChartProps) {
  if (orientation === "horizontal") {
    const definition = defineChart({
      marks: [
        barX(data, {
          y: "label",
          x: "value",
          key: "label",
          fill: color,
        }),
      ],
      x: { scale: () => scaleLinear() },
      y: { scale: () => scaleBand() },
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

  const definition = defineChart({
    marks: [
      barY(data, {
        x: "label",
        y: "value",
        key: "label",
        fill: color,
      }),
    ],
    x: { scale: () => scaleBand() },
    y: { scale: () => scaleLinear() },
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
