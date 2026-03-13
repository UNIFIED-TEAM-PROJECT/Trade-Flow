import { Job, JobUrgency, Van } from "@prisma/client";

type TemplateParts = {
  label: string;
  keywords: string[];
  materials: string[];
  estimatedDurationMinutes: number;
};

export const JOB_PART_TEMPLATES: TemplateParts[] = [
  {
    label: "Leak Repair",
    keywords: ["leak", "pipe", "burst", "drip"],
    materials: ["Copper Elbow 15mm", "PTFE Tape", "Isolation Valve 15mm", "Push-Fit Tee 15mm"],
    estimatedDurationMinutes: 110,
  },
  {
    label: "Boiler Service",
    keywords: ["boiler", "pressure", "heating", "radiator", "gas"],
    materials: ["Boiler Pressure Valve", "Thread Seal Compound", "PTFE Tape", "Gas Detector Battery"],
    estimatedDurationMinutes: 140,
  },
  {
    label: "Radiator Install",
    keywords: ["radiator", "trv", "install", "replace radiator"],
    materials: ["Radiator Valve Pair", "TRV Head", "Pipe Clips Pack", "Flux Paste", "Solder Wire"],
    estimatedDurationMinutes: 180,
  },
  {
    label: "Toilet Replacement",
    keywords: ["toilet", "wc", "flush", "cistern"],
    materials: ["Toilet Fill Valve", "Ballcock Arm", "Flexible Hose 300mm", "Silicone Sealant"],
    estimatedDurationMinutes: 160,
  },
];

export function normalizeMaterialName(input: string) {
  return input.toLowerCase().trim().replace(/\s+/g, " ");
}

export function getLikelyMaterialsForJob(job: Pick<Job, "issueCategory" | "description" | "title">) {
  const haystack = `${job.title} ${job.issueCategory} ${job.description}`.toLowerCase();
  const template =
    JOB_PART_TEMPLATES.find((item) => item.keywords.some((keyword) => haystack.includes(keyword))) ??
    JOB_PART_TEMPLATES[0];
  return {
    templateLabel: template.label,
    materials: template.materials,
    estimatedDurationMinutes: template.estimatedDurationMinutes,
  };
}

export function calculateDistanceMiles(
  from: { latitude?: number | null; longitude?: number | null },
  to: { latitude?: number | null; longitude?: number | null },
) {
  if (!from.latitude || !from.longitude || !to.latitude || !to.longitude) {
    return null;
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

export function estimateTravelMinutes(distanceMiles: number | null, urgency: JobUrgency) {
  if (distanceMiles === null) {
    return urgency === JobUrgency.EMERGENCY ? 25 : 45;
  }
  const averageSpeedMph = urgency === JobUrgency.EMERGENCY ? 32 : 24;
  const baseMinutes = (distanceMiles / averageSpeedMph) * 60;
  return Math.max(8, Math.round(baseMinutes));
}

export type VanReadinessResult = {
  vanId: string;
  vanName: string;
  registration: string;
  availableCount: number;
  missingCount: number;
  readinessScore: number;
  inStock: string[];
  missing: string[];
};

export function calculateVanReadiness(
  vans: Array<
    Pick<Van, "id" | "name" | "registration"> & {
      inventoryItems: Array<{ name: string; quantity: number }>;
    }
  >,
  likelyMaterials: string[],
) {
  const normalizedNeeds = likelyMaterials.map(normalizeMaterialName);

  const results: VanReadinessResult[] = vans.map((van) => {
    const inventorySet = new Set(
      van.inventoryItems.filter((item) => item.quantity > 0).map((item) => normalizeMaterialName(item.name)),
    );

    const inStock = likelyMaterials.filter((material) => inventorySet.has(normalizeMaterialName(material)));
    const missing = likelyMaterials.filter((material) => !inventorySet.has(normalizeMaterialName(material)));
    const availableCount = inStock.length;
    const missingCount = missing.length;
    const readinessScore = normalizedNeeds.length
      ? Math.round((availableCount / normalizedNeeds.length) * 100)
      : 0;

    return {
      vanId: van.id,
      vanName: van.name,
      registration: van.registration,
      availableCount,
      missingCount,
      readinessScore,
      inStock,
      missing,
    };
  });

  return results.sort((a, b) => b.readinessScore - a.readinessScore);
}

export function getSlaUrgencyBadge(
  isSubscriber: boolean,
  urgency: JobUrgency,
  slaTargetAt: Date | null,
) {
  if (!isSubscriber) {
    return { label: "Standard", secondsRemaining: null, severity: "normal" as const };
  }

  if (!slaTargetAt) {
    return { label: "Priority", secondsRemaining: null, severity: "normal" as const };
  }

  const secondsRemaining = Math.floor((slaTargetAt.getTime() - Date.now()) / 1000);
  if (secondsRemaining <= 0) {
    return { label: "SLA Breached", secondsRemaining, severity: "critical" as const };
  }
  if (urgency === JobUrgency.EMERGENCY || secondsRemaining < 2 * 3600) {
    return { label: "Priority Dispatch", secondsRemaining, severity: "high" as const };
  }
  return { label: "Subscriber SLA", secondsRemaining, severity: "normal" as const };
}
