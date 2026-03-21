import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NetworkProvider =
    | "GLOBE"
    | "TM"
    | "SMART"
    | "TNT"
    | "SUN"
    | "DITO";

// Per-brand prefix mapping
export const MOBILE_PREFIX_MAP: Record<string, NetworkProvider> = {
    // Globe
    "0905": "GLOBE",
    "0906": "GLOBE",
    "0915": "GLOBE",
    "0916": "GLOBE",
    "0917": "GLOBE",
    "0926": "GLOBE",
    "0927": "GLOBE",
    "0935": "GLOBE",
    "0936": "GLOBE",
    "0937": "GLOBE",
    "0945": "GLOBE",
    "0955": "GLOBE",
    "0956": "GLOBE",

    // TM (Touch Mobile - Globe sub-brand)
    "0952": "TM",
    "0965": "TM",
    "0966": "TM",
    "0967": "TM",
    "0975": "TM",
    "0976": "TM",
    "0977": "TM",
    "0985": "TM",
    "0994": "TM",
    "0995": "TM",
    "0996": "TM",
    "0997": "TM",

    // Smart
    "0908": "SMART",
    "0918": "SMART",
    "0919": "SMART",
    "0920": "SMART",
    "0921": "SMART",
    "0928": "SMART",
    "0939": "SMART",
    "0947": "SMART",
    "0948": "SMART",
    "0949": "SMART",
    "0951": "SMART",
    "0961": "SMART",
    "0963": "SMART",
    "0964": "SMART",
    "0968": "SMART",
    "0969": "SMART",
    "0970": "SMART",
    "0981": "SMART",
    "0989": "SMART",
    "0998": "SMART",
    "0999": "SMART",

    // TNT (Talk 'N Text - Smart sub-brand)
    "0907": "TNT",
    "0909": "TNT",
    "0910": "TNT",
    "0911": "TNT",
    "0912": "TNT",
    "0913": "TNT",
    "0914": "TNT",
    "0930": "TNT",
    "0938": "TNT",
    "0946": "TNT",
    "0950": "TNT",
    "0960": "TNT",

    // Sun Cellular (legacy, under Smart)
    "0922": "SUN",
    "0923": "SUN",
    "0924": "SUN",
    "0925": "SUN",
    "0931": "SUN",
    "0932": "SUN",
    "0933": "SUN",
    "0934": "SUN",
    "0942": "SUN",
    "0943": "SUN",
    "0944": "SUN",

    // DITO
    "0990": "DITO",
    "0991": "DITO",
    "0992": "DITO",
    "0993": "DITO",
};

export function getNetworkProvider(phone: string): NetworkProvider | "UNKNOWN" {
    const normalized = phone.replace(/^(\+63|63)/, "0").replace(/\D/g, "");
    const prefix = normalized.slice(0, 4);
    return MOBILE_PREFIX_MAP[prefix] || "UNKNOWN";
}

const PROVIDER_BADGE_LABEL: Record<NetworkProvider | "UNKNOWN", string> = {
    GLOBE: "Globe",
    TM: "TM",
    SMART: "Smart",
    TNT: "TNT",
    SUN: "Sun",
    DITO: "DITO",
    UNKNOWN: "?",
};

export function NetworkProviderBadge({
    phone,
    className,
}: {
    phone: string;
    className?: string;
}) {
    const provider = getNetworkProvider(phone);
    const label = PROVIDER_BADGE_LABEL[provider];
    return (
        <Badge
            variant="outline"
            className={cn(
                "h-5 shrink-0 border-border bg-muted/40 px-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide",
                className,
            )}
            title={
                provider === "UNKNOWN"
                    ? "Unknown mobile network prefix"
                    : `${PROVIDER_BADGE_LABEL[provider]} network`
            }
        >
            {label}
        </Badge>
    );
}
