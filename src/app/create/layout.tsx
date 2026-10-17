import type { Metadata } from 'next';

/**
 * Route-level metadata for /create (the page itself is a client component,
 * so metadata lives here in the layout).
 */
export const metadata: Metadata = {
  title: 'Create — the studio',
  description:
    'Turn a prompt, a spreadsheet, a chart screenshot or markdown into a designed deck: outline first, then design, present and export to PPTX, PDF, HTML and more.',
  alternates: { canonical: '/create' },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
