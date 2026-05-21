import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";
import BrandLogo from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Reframe — browser video editor for social formats",
  description: "Reframe is a client-side video editor for resizing, reframing, trimming, and exporting content for Instagram, Reels, Shorts, and more.",
   keywords: [
    "video editor",
    "browser video editor",
    "open source video editor",
    "resize videos",
    "trim videos",
    "rotate videos",
    "online video editor",
  ],

  authors: [{ name: "Reframe" }],

  openGraph: {
    title: "Reframe",
    description:
      "Client-side browser video editor for reframing, trimming, and exporting social-ready videos.",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Reframe",
    description:
      "Client-side browser video editor for reframing, trimming, and exporting social-ready videos.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = stored === 'dark' || (!stored && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  if (stored === 'high-contrast') {
                    document.documentElement.setAttribute(
                      'data-theme',
                      'high-contrast'
                    );
                  } else {
                    document.documentElement.removeAttribute('data-theme');
                  }  
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        
      <a href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <ErrorBoundary>

            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <ScrollToTop />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}