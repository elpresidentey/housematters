import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import '../styles/main.css';
import '../styles/interactions.css';
import '../styles/next.css';
import '../styles/nigeria.css';
import '../styles/polish.css';
import '../styles/homy.css';
import '../styles/homy-motion.css';
import '../styles/menu.css';
// Revamp loads last: it normalises every stylesheet above into one system.
import '../styles/revamp.css';
// UI polish: last-loaded overrides that unify buttons, cards, navbar,
// dialogs, toasts, responsive behaviour and reduced-motion handling.
import '../styles/ui-polish.css';
// Unified cards + richer detail modal (single card language everywhere).
import '../styles/cards-modal.css';

export const metadata: Metadata = {
  title: 'House Matters — Find your next home in Nigeria',
  description:
    'Explore homes across Lagos, Abuja, Ibadan and more. Compare annual naira rents and find a place that fits your life with House Matters.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-NG">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
