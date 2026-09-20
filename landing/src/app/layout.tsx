import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Vinylflix — YouTube Video Discovery & Creator Growth Network',
  description:
    'Promote your YouTube videos to thousands of verified, highly engaged human viewers. Boost authentic watch time, channel discoverability, and audience retention with Vinylflix.',
  keywords: [
    'youtube promotion',
    'creator growth network',
    'video discovery platform',
    'youtube views campaign',
    'video advertising',
    'channel marketing',
    'vinylflix',
    'youtube audience growth',
    'content promotion platform',
  ],
  authors: [{ name: 'Vinylflix' }],
  creator: 'Vinylflix',
  metadataBase: new URL('https://vinylflix.com'),
  openGraph: {
    title: 'Vinylflix — YouTube Video Discovery & Creator Growth Network',
    description:
      'Supercharge your YouTube reach with verified viewer attention. Launch targeted campaigns and gain authentic audience engagement.',
    url: 'https://vinylflix.com',
    siteName: 'Vinylflix',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vinylflix - YouTube Video Discovery & Creator Growth',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vinylflix — YouTube Video Discovery & Creator Growth Network',
    description:
      'Launch targeted video campaigns and grow your YouTube channel with authentic, high-retention viewer attention.',
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
  verification: {
    google: 'google3667ef5849c4957a',
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
