import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Vinylflix — Rewarded Video Streaming & Creator Growth Network',
  description:
    'Watch videos and earn real cash rewards. Promote your YouTube channel, expand your audience, and withdraw earnings directly to your bank account with Vinylflix.',
  keywords: [
    'rewarded video',
    'earn money watching videos',
    'youtube promotion',
    'creator growth',
    'video advertising platform',
    'watch and earn Nigeria',
    'vinylflix',
    'content promotion platform',
  ],
  authors: [{ name: 'Vinylflix' }],
  creator: 'Vinylflix',
  metadataBase: new URL('https://vinylflix.com'),
  openGraph: {
    title: 'Vinylflix — Rewarded Video Streaming & Creator Growth',
    description:
      'Turn video attention into real cash rewards. Promote YouTube channels to verified viewers with instant bank payouts.',
    url: 'https://vinylflix.com',
    siteName: 'Vinylflix',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vinylflix - Watch, Earn, and Promote',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vinylflix — Watch, Earn & Promote Content',
    description:
      'Earn cash rewards for watching engaging videos and grow your YouTube channel with authentic viewer attention.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Vinylflix',
              applicationCategory: 'EntertainmentApplication',
              operatingSystem: 'Web, Android, iOS',
              offers: {
                '@type': 'Offer',
                price: '0.00',
                priceCurrency: 'NGN',
              },
              description:
                'Rewarding video streaming and content promotion ecosystem connecting viewers with creators.',
              url: 'https://vinylflix.com',
            }),
          }}
        />
      </head>
      <body className="bg-[#0a0017] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-[#FF0091] selection:text-white">
        <Navbar />
        <div className="flex-1 pt-20">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
