// theme/insights.ts
// Layout helpers for the Company Insights page (Claude Design "Company Insights
// v3.html"). Typography and the web font loader are shared with the Companies
// design — this file only adds the narrower ".col" content column.

import { INSIGHTS_CONTENT_MAX_WIDTH } from "@/constants/layout";

export {
  INTER,
  DISPLAY,
  loadCompaniesFonts as loadInsightsFonts,
} from "@/theme/companies";

// Same horizontal page padding as the Companies design — kept under an
// insights-scoped name so callers read consistently.
export { pageHPadding as insightsHPadding } from "@/theme/companies";

/** Max width of the reading column (".col" in the design). */
export function insightsColWidth(width: number): number {
  return Math.min(width, INSIGHTS_CONTENT_MAX_WIDTH);
}
