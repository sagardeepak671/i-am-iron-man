"use client";

import { useEffect } from "react";
import { useCompareSelection } from "./compare-store";

/** On /compare the URL wins: mirror its ids into the cross-page selection. */
export function CompareUrlSync({ ids }: { ids: string[] }) {
  const { replace } = useCompareSelection();
  const key = ids.join(",");
  useEffect(() => {
    replace(key ? key.split(",") : []);
  }, [key, replace]);
  return null;
}
