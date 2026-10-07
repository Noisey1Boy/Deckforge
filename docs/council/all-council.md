=========== p1 ===========
## Ranked Design Decisions

1. **Adopt 6 new themes from decksmith/design-skill (max 8 total)**: Prioritize "guizang-ppt" (e-ink magazine), "ib-pitch-book" (finance), "zhangzara" (8-bit-orbit), "biennale-yellow" (art), "grove" (nature), and "pin-and-paper" (handcrafted). Each with distinct palettes/fonts/mood - e.g., guizang: charcoal paper + serif, biennale: primary yellow + black. Rationale: Visual diversity > quantity, existing themes cover corporate/modern, these add editorial/artistic/niche.

2. **TemplateGallery upgrade with search/filters/categories**: Add tone/description/bestFor metadata to templates, implement search + category chips + lazy previews. Rationale: Critical UX for template discovery, aligns with decksmith's strength, minimal effort.

3. **Enforce BANS/FLOORS/MOTION rules**: Implement content-level bans (no identical grids, no eyebrow overuse), quality floors (contrast ≥4.5:1, 65-75ch line length), and motion rules (ease-out-expo, stagger reveals). Rationale: Elevates output quality, prevents generic AI artifacts, consistent with "designed not generated."

4. **Adopt strategies/copywriting formulas**: Integrate 10 strategies (YC, Kawasaki, etc.) and 5 copywriting formulas (PAS, AIDA) with slide types. Rationale: Structural improvement over current generic copy, aligns with narrative design.

5. **Per-slide regenerate/status UX**: Add pending/loading/done/error states to outline + inline editing. Rationale: Critical UX for AI workflow, matches decksmith strength.

6. **Do NOT adopt template-locked philosophy**: Reconcile by enforcing BANS/FLOORS/MOTION + human-editable tokens. Rationale: "Designed not generated" = guardrails + editable tokens, not templates.

7. **Landing page changes**: Minor tweaks only - current "billposter" style is strong. Rationale: Existing design is impeccable, focus on core features.

8. **Do NOT adopt HTML export upgrade**: Runtime.js too heavy, HTML exports already functional. Rationale: Scope discipline (ponytail), no user pain point.

9. **Do NOT adopt decksmith's 57 templates**: Too many, inconsistent quality. Rationale: Quality > quantity, existing 8 + 6 new sufficient.

10. **PPTX pixel-perfect snapshot**: Low priority, existing native charts are stronger. Rationale: "Native editable charts" already superior.
=========== p2 ===========
=========== p3 ===========
# Council Ruling: DeckForge + decksmith Integration

## 1. Adoption Priority (Ranked)
1. **Strategies + Copywriting Formulas** (src/lib/presentation/prompts/) - Immediate content quality lift.
2. **Tone/Verbosity enums** (src/lib/store/deck-store.ts) - Fixes audience parameter drop.
3. **Per-slide regenerate/status** (src/lib/generate/slide-status.ts) - Critical UX improvement.
4. **Template gallery filters** (src/components/TemplateGallery.tsx) - Low effort, high value.
5. **Theme expansion** (src/lib/design/themes.ts) - Use decksmith/design-skill palettes only.
6. **PPTX snapshot export** (src/lib/export/pptx-snapshot.ts) - Bun add html-to-image, scale 2 render.

## 2. Philosophy Reconciliation
DeckForge is "designed, not generated" because:
- Structured data (JSON) not freeform HTML
- Prisma data integrity vs localStorage
- Editable AI output, not black-box generation
- Theme system (8→16) not template sprawl (57)

## 3. What NOT to Adopt (Ponytail)
- **decksmith HTML codegen mode** - Violates structured architecture, introduces runtime bloat.
- **57 templates** - Scope explosion, contradicts design system.
- **localStorage** - Already superseded by Prisma/SQLite.
- **Vendored runtimes** (9.4MB) - Heavy, no WCAG guarantee.

## 4. Task Breakdown (Parallel Agents)
1. **Prompts & Settings** (Agent A): 
   - `src/lib/presentation/` + `src/lib/store/deck-store.ts`
   - Port strategies, copywriting, tone/verbosity enums
   - Risk: API contract changes (owns `/api/generate/*`)

2. **Slide Status UX** (Agent B):
   - `src/components/GeneratingView.tsx` + `src/lib/generate/slide-status.ts`
   - Per-slide status + regenerate buttons
   - Risk: UI state complexity (owns editor view)

3. **Theme Expansion** (Agent C):
   - `src/lib/design/themes.ts` + palette tokenization script
   - Port 8 design-skill themes → ThemeManifest
   - Risk: CSS token conflicts (owns design tokens)

4. **Export Enhancement** (Agent D):
   - `src/lib/export/pptx-snapshot.ts` + bun add html-to-image
   - Scale 2 render for PPTX snapshots
   - Risk: Memory usage (owns export pipeline)

5. **Gallery Filters** (Agent E):
   - `src/components/TemplateGallery.tsx`
   - Add chips/search + tone/bestFor metadata
   - Risk: Data migration (owns gallery state)
=========== p4 ===========
=========== p2 ===========
1. **Strategies**: Auto-detect + explicit picker. Auto-detect for convenience, explicit picker for control. Integrate with slideCount/audience via presets (e.g., "10 slides for investors"). *Rationale: Balances automation with user agency.*  

2. **Tone/Verbosity**: Adopt enums. Fix audience-forwarding bug. *Rationale: Standardization improves consistency; bug fix prevents downstream errors.*  

3. **Per-slide UX**: Regen + status in OutlineView. Show "regenerated" badge, pending state. *Rationale: Granular control + transparency = trust.*  

4. **Copywriting formulas**: Inject into prompts. Auto-suggest based on strategy (e.g., "PAS for problem/solution slides"). *Rationale: Elevates output quality without user effort.*  

5. **Win vs Gamma/Presenton**: "DeckForge: AI that thinks like your strategist, not just a formatter." *Rationale: Positions us as smarter, not just faster.*
=========== p4 ===========
(a) Missing capability ranking:  
1. Pixel-perfect PPTX - Critical for professional presentations that must look polished when projected.  
2. Better speaker notes - Essential for delivering coherent, non-verbatim guidance.  
3. Per-slide regenerate in outline - Enables rapid iteration without rebuilding entire decks.  
4. Strategies - Ensures content aligns with core objectives.  
5. Gallery search - Improves asset reuse efficiency.  
6. More themes - Expands visual variety.  
7. Tone/verbosity - Least critical as adjustable via prompts.  

(b) Generic deck fixes:  
1. Brand-specific prompts - Include company name, values, and voice guidelines.  
2. Audience context - Specify role, seniority, and knowledge level explicitly.  
3. Strategic framing - Add "purpose" and "key takeaways" sections before content generation.  

(c) Speaker notes upgrade:  
Reject verbatim scripts. Adopt concise (50-100 char) talking points + delivery cues instead. Enables natural delivery while maintaining structure.  

(d) Export priorities:  
1. PPTX with preserved formatting - Non-negotiable for client/professional use.  
2. PDF with speaker notes - Backup for projection scenarios.  
3. Outline + notes export - For prep and sharing.
