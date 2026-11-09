import { ARMORS } from "@/data/archive";

/** id → designation map for client components that must not import the data set. */
export const armorLabels = (): Record<string, string> =>
  Object.fromEntries(ARMORS.map((a) => [a.id, a.designation]));
