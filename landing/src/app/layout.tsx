import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Vinylflix — Stream African Cinema, Blockbusters & Exclusive Premieres',
  description:
    'Experience the best in Nollywood, Pan-African cinema, global blockbusters, and bingeable reels. Stream in 4K Ultra HD on your phone, tablet, and Smart TV with Vinylflix.',
  keywords: [
    'vinylflix',
    'african cinema',
    'nollywood movies',
    'stream african movies',
    'nollywood streaming platform',
    'watch nigerian movies online',
    'african web series',
    'ott streaming service',
    'vip cinema pass',
    'mobile movie app',
    '4k ultra hd streaming',
  ],
  authors: [{ name: 'Vinylflix Studios' }],
  creator: 'Vinylflix',
  metadataBase: new URL('https://vinylflix.com'),
  openGraph: {
    title: 'Vinylflix — Stream African Cinema, Blockbusters & Exclusive Premieres',
    description:
      'Unlimited streaming of Nollywood hits, award-winning African cinema, and global entertainment. Ultra HD, zero ads on VIP, and offline downloads.',
    url: 'https://vinylflix.com',
    siteName: 'Vinylflix',
    images: [
      {
        url: 'https://image.tmdb.org/t/p/original/dvBCdCohwWbsP5qAaglOXagDMtk.jpg',
        width: 1200,
        height: 630,
        alt: 'Vinylflix - Premium Cinema & OTT Streaming',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vinylflix — Stream African Cinema & Global Blockbusters',
    description:
      'Stream Nollywood hits, African cinema, and global releases in 4K HDR. Join Vinylflix on Web, Android, and TV.',
    images: ['https://image.tmdb.org/t/p/original/dvBCdCohwWbsP5qAaglOXagDMtk.jpg'],
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
              operatingSystem: 'Web, Android, iOS, Smart TV',
              offers: {
                '@type': 'Offer',
                price: '0.00',
                priceCurrency: 'NGN',
              },
              description:
                'The premier African cinema & next-generation OTT streaming platform connecting audiences with Nollywood blockbusters, web series, and exclusive premieres.',
              url: 'https://vinylflix.com',
            }),
          }}
        />
      </head>
      <body className="bg-[#0a0017] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-[#FF0091] selection:text-white">
        <Navbar />
        <main className="flex-1 pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
