import type { HtmlDeck } from '@prisma/client'

/** Hard cap for stored deck HTML (1.5 MB). */
export const HTML_CAP = 1_572_864

/** Wire shape for an HtmlDeck (bare deck JSON, ISO date strings). */
export function serializeHtmlDeck(d: HtmlDeck) {
  return {
    id: d.id,
    title: d.title,
    subtitle: d.subtitle,
    templateId: d.templateId,
    engine: d.engine,
    html: d.html,
    outlineJson: d.outlineJson,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }
}
