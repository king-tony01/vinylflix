'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VinylflixLogo } from '../components/VinylflixLogo';
import {
  Play,
  PlaySquare,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Film,
  Crown,
  Smartphone,
  Tv,
  Download,
  Star,
  Clock,
  Volume2,
  Share2,
  Monitor,
  Flame,
  X,
  Layers,
  Award,
  Check,
} from 'lucide-react';

interface MovieData {
  id: string;
  tmdbId?: string;
  title: string;
  tagline: string;
  category: 'trending' | 'nollywood' | 'blockbusters' | 'shorts' | 'vip';
  categoryLabel: string;
  poster: string;
  backdrop: string;
  rating: number;
  year: string;
  duration: string;
  quality: '4K UHD' | '1080p HD';
  audio: string;
  genres: string[];
  overview: string;
  cast: string[];
  isSeries?: boolean;
  isOriginal?: boolean;
  isVipOnly?: boolean;
}

// Baseline authentic TMDB catalog items (100% TMDB images & IDs, zero Unsplash)
const TMDB_HEROES_FALLBACK: MovieData[] = [
  {
    id: '1172009',
    tmdbId: '1172009',
    title: 'The Black Book',
    tagline: 'When justice is corrupt, vengeance becomes the only law.',
    category: 'nollywood',
    categoryLabel: 'Nollywood Original',
    poster: 'https://image.tmdb.org/t/p/w500/kn28W24slBLyGr8ZIZnxNE5YZrY.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9WxqnP9c29wXd03sALSpxpTx8fk.jpg',
    rating: 8.9,
    year: '2023',
    duration: '2h 14m',
    quality: '4K UHD',
    audio: 'Dolby Atmos 5.1',
    genres: ['Action', 'Mystery', 'Thriller'],
    overview:
      'After his son is framed for a high-profile kidnapping, a bereaved deacon takes matters into his own hands and fights a corrupt police gang to clear his family name.',
    cast: ['Richard Mofe-Damijo', 'Ade Laoye', 'Sam Dede', 'Shaffy Bello'],
    isOriginal: true,
  },
  {
    id: '693134',
    tmdbId: '693134',
    title: 'Dune: Part Two',
    tagline: 'Long live the fighters. The saga of Arrakis reaches its zenith.',
    category: 'blockbusters',
    categoryLabel: 'Global Blockbuster',
    poster: 'https://image.tmdb.org/t/p/w500/czembW0Rk1Ke7lCJGahbOhdCLZ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/uhUO7vQQKvCTfQWubOt5MAKokbL.jpg',
    rating: 8.6,
    year: '2024',
    duration: '2h 46m',
    quality: '4K UHD',
    audio: 'Dolby Vision • Atmos',
    genres: ['Sci-Fi', 'Adventure', 'Epic Drama'],
    overview:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between the love of his life and the fate of the universe.',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
  },
  {
    id: '1023994',
    tmdbId: '1023994',
    title: 'Aníkúlápó',
    tagline: 'Death is not the end. The ancient mystical empire awakens.',
    category: 'nollywood',
    categoryLabel: 'Epic Yoruba Fantasy',
    poster: 'https://image.tmdb.org/t/p/w500/xb30hkUpBm23stnVgDJGYGsC0R0.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/gCojEROJs4JUVCCMA4fDFGc8OFc.jpg',
    rating: 8.8,
    year: '2022',
    duration: '2h 22m',
    quality: '4K UHD',
    audio: 'Dolby 5.1',
    genres: ['Fantasy', 'Folklore', 'Period Drama'],
    overview:
      'After an affair with a queen leads to his demise, an eager traveler encounters a mythical bird with the power to give him another chance at life.',
    cast: ['Kunle Remi', 'Bimbo Ademoye', 'Sola Sobowale', 'Hakeem Kae-Kazim'],
    isOriginal: true,
  },
  {
    id: '533535',
    tmdbId: '533535',
    title: 'Deadpool & Wolverine',
    tagline: 'Maximum effort meets adamantium claws in the ultimate cinema clash.',
    category: 'blockbusters',
    categoryLabel: 'VIP Premiere',
    poster: 'https://image.tmdb.org/t/p/w500/jbwYaoYWZwxtPP76AZnfYKQjCEB.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/dvBCdCohwWbsP5qAaglOXagDMtk.jpg',
    rating: 7.9,
    year: '2024',
    duration: '2h 08m',
    quality: '4K UHD',
    audio: 'Dolby Atmos',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    overview:
      'A listless Wade Wilson toils away in civilian life with his days as Deadpool behind him. But when an existential threat looms over his reality, he reluctantly teams up with a cynical Wolverine.',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Morena Baccarin'],
    isVipOnly: true,
  },
  {
    id: '1163045',
    tmdbId: '1163045',
    title: 'Jagun Jagun (The Warrior)',
    tagline: 'Honor, blood, and the ruthless conquest of power.',
    category: 'nollywood',
    categoryLabel: 'Nollywood Epic',
    poster: 'https://image.tmdb.org/t/p/w500/uPZtE5DSo9VIX2N3NPtmTayhgP8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4Yon9Qmg3U4onL0OywXAHSkFTUG.jpg',
    rating: 8.7,
    year: '2023',
    duration: '2h 14m',
    quality: '4K UHD',
    audio: 'Dolby 5.1',
    genres: ['Action', 'War', 'Yoruba Drama'],
    overview:
      'A determined young warrior joins an elite military academy ruled by an unforgiving warlord, testing his resolve between loyalty, love, and justice.',
    cast: ['Femi Adebayo', 'Lateef Adedimeji', 'Bimbo Ademoye'],
    isOriginal: true,
  },
  {
    id: '872585',
    tmdbId: '872585',
    title: 'Oppenheimer',
    tagline: 'The world forever changes in the crucible of atomic fire.',
    category: 'blockbusters',
    categoryLabel: 'Academy Award Winner',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/rMvPXy8PUjj1o8o1pzgQbdNCsvj.jpg',
    rating: 8.9,
    year: '2023',
    duration: '3h 00m',
    quality: '4K UHD',
    audio: 'Dolby Vision • Atmos',
    genres: ['Biography', 'Historical Drama', 'Suspense'],
    overview:
      'The pulse-pounding story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project.',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    isVipOnly: true,
  },
  {
    id: '1206988',
    tmdbId: '1206988',
    title: 'A Tribe Called Judah',
    tagline: 'Five brothers. One impossible heist. Unbreakable family bond.',
    category: 'nollywood',
    categoryLabel: '₦1.4B Box Office Record',
    poster: 'https://image.tmdb.org/t/p/w500/9aMG2ftIFqFAN69FdjovKJY0hsd.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/jX7Mb37fa7JhB9c3acL1evERNwW.jpg',
    rating: 8.8,
    year: '2023',
    duration: '2h 14m',
    quality: '4K UHD',
    audio: 'Dolby 5.1',
    genres: ['Comedy', 'Crime', 'Family'],
    overview:
      'To save their ailing mother, five brothers from distinct ethnic origins plot an audacious heist on a luxury mall, encountering unexpected rivals.',
    cast: ['Funke Akindele', 'Jide Kene Achufusi', 'Timini Egbuson', 'Tobi Makinde'],
    isOriginal: true,
  },
  {
    id: '569094',
    tmdbId: '569094',
    title: 'Spider-Man: Across the Spider-Verse',
    tagline: 'It’s how you wear the mask that counts.',
    category: 'blockbusters',
    categoryLabel: 'VIP Animation Masterpiece',
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    rating: 8.7,
    year: '2023',
    duration: '2h 20m',
    quality: '4K UHD',
    audio: 'Dolby Atmos',
    genres: ['Animation', 'Action', 'Sci-Fi'],
    overview:
      'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence, but clashes on how to handle a catastrophic threat.',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
    isVipOnly: true,
  },
  {
    id: '76600',
    tmdbId: '76600',
    title: 'Avatar: The Way of Water',
    tagline: 'Return to Pandora. Family is our fortress.',
    category: 'blockbusters',
    categoryLabel: 'Visual Spectacle',
    poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg',
    rating: 7.8,
    year: '2022',
    duration: '3h 12m',
    quality: '4K UHD',
    audio: 'Dolby Vision • Atmos',
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    overview:
      'Jake Sully and Neytiri have formed a family and are doing everything to stay together. However, they must leave their home and explore the oceanic regions of Pandora when an ancient threat resurfaces.',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Stephen Lang'],
    isVipOnly: true,
  },
  {
    id: '217460',
    tmdbId: '217460',
    title: 'Shanty Town',
    tagline: 'Power, ruthlessness, and rebellion in the Lagos underground.',
    category: 'nollywood',
    categoryLabel: 'Series Premiere',
    poster: 'https://image.tmdb.org/t/p/w500/a7jRDMea7ADCtPphb9nOMp2dkgK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/6qDujYplO8CFrjtgUdqDesidxV.jpg',
    rating: 8.5,
    year: '2023',
    duration: '6 Episodes',
    quality: '4K UHD',
    audio: 'Dolby 5.1',
    genres: ['Crime Drama', 'Thriller'],
    overview:
      'A group of courtesans attempts to escape the clutches of a notorious crime kingpin, but political corruption and blood ties make freedom a lethal battle.',
    cast: ['Chidi Mokeme', 'Ini Edo', 'Richard Mofe-Damijo', 'Nse Ikpe-Etim'],
    isSeries: true,
  },
];

const TMDB_CATALOG_FALLBACK: MovieData[] = [
  ...TMDB_HEROES_FALLBACK,
  {
    id: '131584',
    tmdbId: '131584',
    title: 'King of Boys: The Return of the King',
    tagline: 'Laburu returns to conquer the underworld and political throne.',
    category: 'nollywood',
    categoryLabel: 'Crime Saga',
    poster: 'https://image.tmdb.org/t/p/w500/vWI6qVGOklBCfdcskDdVcm2JXA6.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/i5Y17SwkjwGrTXASnWusx5okITO.jpg',
    rating: 8.9,
    year: '2021',
    duration: '7 Episodes',
    quality: '4K UHD',
    audio: 'Dolby Atmos',
    genres: ['Crime', 'Drama'],
    overview: 'Alhaja Eniola Salami returns from exile to contest for the highest seat of power in Lagos State.',
    cast: ['Sola Sobowale', 'Toni Tones', 'Richard Mofe-Damijo'],
    isSeries: true,
    isOriginal: true,
  },
  {
    id: '144539',
    tmdbId: '144539',
    title: 'The Wedding Party',
    tagline: 'The biggest Nigerian wedding of the decade.',
    category: 'nollywood',
    categoryLabel: 'Romantic Comedy',
    poster: 'https://image.tmdb.org/t/p/w500/iGiycMjca66thVjb9kjQfnsHYdq.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/j5S7ZcxsiLPV4UlQKIHHNmBYiMb.jpg',
    rating: 7.6,
    year: '2016',
    duration: '1h 50m',
    quality: '1080p HD',
    audio: 'Dolby 5.1',
    genres: ['Comedy', 'Romance'],
    overview: 'As a high-society Nigerian wedding approaches, chaotic family tensions and exes threaten to ruin the lavish celebration.',
    cast: ['Banky W.', 'Adesua Etomi-Wellington', 'Sola Sobowale'],
  },
  {
    id: '642803',
    tmdbId: '642803',
    title: 'Òlòtūré',
    tagline: 'Undercover in the human trafficking underworld.',
    category: 'nollywood',
    categoryLabel: 'Gritty Crime Drama',
    poster: 'https://image.tmdb.org/t/p/w500/28bglTF4bqQwyXWoS8pawIY5AOT.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/qlNTSlNn9ISIe48iEtrPxq9OFau.jpg',
    rating: 8.1,
    year: '2020',
    duration: '1h 46m',
    quality: '4K UHD',
    audio: 'Dolby 5.1',
    genres: ['Crime', 'Drama'],
    overview: 'A young naive Nigerian journalist goes undercover as a prostitute to expose the dark world of human trafficking.',
    cast: ['Sharon Ooja', 'Omoni Oboli', 'Blossom Chukwujekwu'],
  },
  {
    id: '1022789',
    tmdbId: '1022789',
    title: 'Inside Out 2',
    tagline: 'Make room for new emotions.',
    category: 'trending',
    categoryLabel: 'Animation Masterpiece',
    poster: 'https://image.tmdb.org/t/p/w500/lWVwWRLqpS1OaNg7KT0ZecSW0PK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
    rating: 7.7,
    year: '2024',
    duration: '1h 36m',
    quality: '1080p HD',
    audio: 'Dolby 5.1',
    genres: ['Animation', 'Family', 'Comedy'],
    overview: 'Riley enters teenage years and encounters brand new emotions led by Anxiety.',
    cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman'],
  },
  {
    id: '945961',
    tmdbId: '945961',
    title: 'Alien: Romulus',
    tagline: 'In space, terror returns to its roots.',
    category: 'blockbusters',
    categoryLabel: 'Sci-Fi Horror',
    poster: 'https://image.tmdb.org/t/p/w500/b33nnPe1OGc5pV8mUQySzwKNCPK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/iYqSQaWDttQIQzsxg9xHyg0bttG.jpg',
    rating: 7.3,
    year: '2024',
    duration: '1h 59m',
    quality: '4K UHD',
    audio: 'Dolby Atmos',
    genres: ['Horror', 'Sci-Fi'],
    overview: 'Young scavengers uncover a derelict space station housing the universe’s most lethal organism.',
    cast: ['Cailee Spaeny', 'David Jonsson', 'Archie Renaux'],
  },
  {
    id: '93405',
    tmdbId: '93405',
    title: 'Squid Game (Season 2)',
    tagline: 'The deadly game restarts with higher stakes.',
    category: 'blockbusters',
    categoryLabel: 'Global Sensation',
    poster: 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/2meX1nMdScFOoV4370rqHWKm5oY.jpg',
    rating: 8.2,
    year: '2024',
    duration: 'Season 2',
    quality: '4K UHD',
    audio: 'Dolby Atmos',
    genres: ['Suspense', 'Survival Drama'],
    overview: 'Gi-hun returns to seek out the organizers behind the cruel survival games and put an end to the madness.',
    cast: ['Lee Jung-jae', 'Lee Byung-hun', 'Wi Ha-jun'],
    isSeries: true,
  },
  {
    id: '94997',
    tmdbId: '94997',
    title: 'House of the Dragon (Season 2)',
    tagline: 'All must choose: Green or Black.',
    category: 'vip',
    categoryLabel: 'VIP Pass Exclusive',
    poster: 'https://image.tmdb.org/t/p/w500/1XDDXPXGiI8id7MrUxK26ke7gkX.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/etj5CuMuamfd0MgEbVGsW0JhRvt.jpg',
    rating: 8.5,
    year: '2024',
    duration: '8 Episodes',
    quality: '4K UHD',
    audio: 'Dolby Atmos',
    genres: ['Fantasy', 'War', 'Drama'],
    overview: 'Westeros plunges into a devastating civil war as the Targaryen dynasty fractures.',
    cast: ['Emma D’Arcy', 'Matt Smith', 'Olivia Cooke'],
    isSeries: true,
    isVipOnly: true,
  },
  {
    id: '573435',
    tmdbId: '573435',
    title: 'Bad Boys: Ride or Die',
    tagline: 'Miami’s finest are on the run.',
    category: 'trending',
    categoryLabel: 'Action Blockbuster',
    poster: 'https://image.tmdb.org/t/p/w500/nP6RliHjxsz4irTKsxe8FRhKZYl.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/ga4OLm4qLxO1lrkcrbvvgf593qM.jpg',
    rating: 7.5,
    year: '2024',
    duration: '1h 55m',
    quality: '4K UHD',
    audio: 'Dolby 5.1',
    genres: ['Action', 'Comedy', 'Crime'],
    overview: 'When their former captain is framed, Miami detectives Mike Lowrey and Marcus Burnett must go on the run to clear his name.',
    cast: ['Will Smith', 'Martin Lawrence', 'Vanessa Hudgens'],
  },
];

export default function LandingPage() {
  const [heroes, setHeroes] = useState<MovieData[]>(TMDB_HEROES_FALLBACK);
  const [catalog, setCatalog] = useState<MovieData[]>(TMDB_CATALOG_FALLBACK);
  const [heroIdx, setHeroIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'trending' | 'nollywood' | 'blockbusters' | 'shorts' | 'vip'
  >('all');
  const [activeModalMovie, setActiveModalMovie] = useState<MovieData | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic live TMDB loader from Vinylflix live cinema API
  useEffect(() => {
    let isMounted = true;
    async function fetchTmdb() {
      try {
        setIsLoading(true);
        const [trendingRes, popularRes] = await Promise.allSettled([
          fetch('https://app.vinylflix.com/api/v1/movies/trending').then((r) => r.json()),
          fetch('https://app.vinylflix.com/api/v1/movies/popular').then((r) => r.json()),
        ]);

        const dynamicHeroes: MovieData[] = [];
        const dynamicCatalog: MovieData[] = [];

        if (trendingRes.status === 'fulfilled' && trendingRes.value?.success && Array.isArray(trendingRes.value?.data)) {
          trendingRes.value.data.forEach((item: any) => {
            if (item.backdropPath && item.posterPath) {
              const movie: MovieData = {
                id: String(item.id || item.tmdbId),
                tmdbId: String(item.id || item.tmdbId),
                title: item.title,
                tagline: item.overview ? item.overview.slice(0, 90) + '...' : 'Streaming now on Vinylflix',
                category: 'trending',
                categoryLabel: item.isSeries ? 'Trending Series' : 'Trending Cinema',
                poster: `https://image.tmdb.org/t/p/w500${item.posterPath}`,
                backdrop: `https://image.tmdb.org/t/p/original${item.backdropPath}`,
                rating: item.rating ? Number(item.rating.toFixed(1)) : 8.0,
                year: item.releaseYear || '2024',
                duration: item.isSeries ? 'Series' : 'Feature Film',
                quality: '4K UHD',
                audio: 'Dolby Atmos',
                genres: item.genres && item.genres.length > 0 ? item.genres : ['Action', 'Cinema'],
                overview: item.overview || 'Available for streaming in ultra high definition on Vinylflix.',
                cast: ['Starring acclaimed cinema cast'],
                isSeries: item.isSeries,
              };
              dynamicCatalog.push(movie);
              if (dynamicHeroes.length < 10) {
                dynamicHeroes.push(movie);
              }
            }
          });
        }

        if (popularRes.status === 'fulfilled' && popularRes.value?.success && Array.isArray(popularRes.value?.data)) {
          popularRes.value.data.forEach((item: any) => {
            if (item.backdropPath && item.posterPath) {
              const movie: MovieData = {
                id: String(item.id || item.tmdbId),
                tmdbId: String(item.id || item.tmdbId),
                title: item.title,
                tagline: item.overview ? item.overview.slice(0, 90) + '...' : 'Streaming now on Vinylflix',
                category: 'blockbusters',
                categoryLabel: 'Global Blockbuster',
                poster: `https://image.tmdb.org/t/p/w500${item.posterPath}`,
                backdrop: `https://image.tmdb.org/t/p/original${item.backdropPath}`,
                rating: item.rating ? Number(item.rating.toFixed(1)) : 8.2,
                year: item.releaseYear || '2024',
                duration: item.isSeries ? 'Series' : 'Feature Film',
                quality: '4K UHD',
                audio: 'Dolby Vision • Atmos',
                genres: item.genres && item.genres.length > 0 ? item.genres : ['Action', 'Thriller'],
                overview: item.overview || 'Available for streaming in ultra high definition on Vinylflix.',
                cast: ['Starring acclaimed cinema cast'],
                isSeries: item.isSeries,
                isVipOnly: true,
              };
              dynamicCatalog.push(movie);
            }
          });
        }

        if (isMounted) {
          if (dynamicHeroes.length >= 5) {
            setHeroes(dynamicHeroes);
          }
          if (dynamicCatalog.length >= 10) {
            // Keep authentic Nollywood TMDB titles so that Nollywood tab is fully covered
            const nollywoodTmdb = TMDB_CATALOG_FALLBACK.filter((m) => m.category === 'nollywood');
            setCatalog([...dynamicCatalog, ...nollywoodTmdb]);
          }
        }
      } catch (err) {
        console.error('Error fetching live TMDB catalog:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchTmdb();
    return () => {
      isMounted = false;
    };
  }, []);

  // Subtle Hero Backdrop switcher every 10 seconds
  useEffect(() => {
    if (heroes.length === 0) return;
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroes.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [heroes.length]);

  const currentHero = heroes[heroIdx] || heroes[0] || TMDB_HEROES_FALLBACK[0];

  const filteredMovies =
    selectedCategory === 'all'
      ? catalog
      : catalog.filter((m) => m.category === selectedCategory);

  const faqs = [
    {
      q: 'What is Vinylflix, and what can I stream?',
      a: 'Vinylflix is the premier African cinema and next-generation OTT streaming platform. You can stream hundreds of acclaimed Nollywood blockbusters, award-winning African cinema, global Hollywood films, bingeable web series, and viral short reels — all in crisp HD or 4K Ultra HD.',
    },
    {
      q: 'Which devices are supported?',
      a: 'Vinylflix works seamlessly across all your screens: Android smartphones & tablets (download our APK or Google Play app), Apple iOS & iPadOS, Smart TVs (Android TV, Google TV, Apple TV, Fire TV), and web browsers on any PC or Mac.',
    },
    {
      q: 'What are the benefits of the VIP OTT Membership?',
      a: 'VIP OTT members enjoy 100% ad-free cinema streaming, exclusive access to red-carpet premieres, 4K Ultra HD video with Dolby Atmos sound, streaming on up to 4 devices simultaneously, and unlimited offline downloads for on-the-go viewing.',
    },
    {
      q: 'Can I download movies to watch offline?',
      a: 'Yes! Both Basic and Premium VIP tiers allow you to download movies and series directly to your Android or iOS device inside the Vinylflix app. Perfect for flights, travel, and low-connectivity areas.',
    },
    {
      q: 'How does the Referral Partner Program work?',
      a: 'When you share your personal Vinylflix referral link, you earn verified cash commissions every time an invited friend upgrades to a Basic or Premium VIP pass. Track your verified referrals in real-time on your dashboard and withdraw your earnings directly to any Nigerian bank account (Opay, PalmPay, GTBank, Access, etc.).',
    },
    {
      q: 'How can filmmakers and YouTube creators distribute on Vinylflix?',
      a: 'Filmmakers and independent video creators can submit films, web series, or import YouTube content through the Creator Studio. Vinylflix gives you direct exposure to thousands of passionate cinema lovers with transparent audience analytics.',
    },
    {
      q: 'Can I cancel my VIP membership at any time?',
      a: 'Yes, absolutely. There are no lock-in contracts or cancellation penalties. You can cancel or change your plan at any time with one click from your account dashboard.',
    },
  ];

  return (
    <div className="space-y-28 md:space-y-36 overflow-hidden">
      {/* ============================================================ */}
      {/* 1. CINEMA HERO BILLBOARD (Clear, Crisp Full-Bleed Image)     */}
      {/* ============================================================ */}
      <section className="relative min-h-[92vh] md:min-h-screen flex flex-col justify-center items-center pb-16 md:pb-24 overflow-hidden">
        {/* Crystal-Clear Background Image - Let the visual do the magic */}
        <div className="absolute inset-0 z-0">
          <img
            key={currentHero.id}
            src={currentHero.backdrop}
            alt={currentHero.title}
            className="w-full h-full object-cover object-center filter brightness-100 contrast-[1.02] transition-all duration-700 animate-in fade-in"
          />
          {/* Subtle balanced overlays for center text readability while keeping artwork vibrant */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#0a0017] via-[#0a0017]/80 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#0a0017]/80 to-transparent" />
        </div>

        {/* Hero Content - Centered Cinema Marquee (NO pills above title, NO owl carousel) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10 flex flex-col items-center text-center">
          <div className="max-w-4xl space-y-5 text-center flex flex-col items-center">
            {/* Title directly at the top - NO PILL BADGES ABOVE IT */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] drop-shadow-2xl">
              {currentHero.title}
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-pink-200 via-pink-100 to-purple-200 bg-clip-text text-transparent italic drop-shadow-lg">
              “{currentHero.tagline}”
            </p>

            {/* Synopsis */}
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed drop-shadow-md line-clamp-3 max-w-2xl mx-auto">
              {currentHero.overview}
            </p>

            {/* Keywords / Highlights / Specs - PLACED BELOW DESCRIPTION, BEFORE CTA BUTTONS */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-pink-300 font-bold border border-pink-500/30">
                {currentHero.categoryLabel}
              </span>
              <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold border border-white/20">
                {currentHero.quality}
              </span>
              <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-purple-200 font-bold border border-purple-500/30 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" /> {currentHero.audio}
              </span>
              <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 font-black border border-amber-500/30 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> {currentHero.rating} IMDb
              </span>
              <span className="text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-pink-400" />
                {currentHero.duration} • {currentHero.year}
              </span>
            </div>

            {/* Cast highlight line */}
            <p className="text-xs text-slate-300 pt-1">
              <span className="text-white font-semibold">Starring:</span> {currentHero.cast.join(', ')}
            </p>

            {/* Primary Call to Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="https://app.vinylflix.com/register"
                className="px-8 py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-2xl shadow-[#FF0091]/40 hover:shadow-[#FF0091]/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
              >
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                <span>Start Streaming Free</span>
              </a>
              <button
                onClick={() => setActiveModalMovie(currentHero)}
                className="px-7 py-4 rounded-2xl text-base font-bold text-white bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/30 hover:border-pink-500/60 transition-all flex items-center gap-2.5 active:scale-95"
              >
                <Film className="w-5 h-5 text-pink-400" />
                <span>Movie Details & Trailer</span>
              </button>
            </div>
          </div>

          {/* Featured Releases Cards (Displayed below the heading as cards with image & just title, spanning freely without scrolling) */}
          <div className="pt-6 space-y-3 w-full">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-300">
                Featured Releases:
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-2.5 w-full">
              {heroes.map((h, i) => (
                <button
                  key={h.id}
                  onClick={() => setHeroIdx(i)}
                  className={`group text-center w-full rounded p-1 transition-all duration-300 flex flex-col ${heroIdx === i
                    ? 'bg-white/20 border-2 border-[#FF0091] shadow-xl shadow-[#FF0091]/30 scale-[1.04]'
                    : 'bg-black/70 hover:bg-black/90 border border-white/15 hover:border-white/30'
                    }`}
                >
                  <div className="relative aspect-[16/10] w-full rounded overflow-hidden bg-slate-950">
                    <img
                      src={h.backdrop}
                      alt={h.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p
                    className={`text-[10px] sm:text-[11px] font-bold truncate mt-1.5 px-0.5 text-center ${heroIdx === i ? 'text-pink-300 font-extrabold' : 'text-slate-200 group-hover:text-white'
                      }`}
                  >
                    {h.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. LIVE TRENDING CINEMA MARQUEE STRIP                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden py-4 border-y border-[#2a0054]/60 bg-[#080014]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-3 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF0091] fill-current" />
            Trending Across Vinylflix Today
          </h2>
          <span className="text-xs text-slate-400">1,200+ Titles Streaming in HD & 4K</span>
        </div>

        {/* Horizontal Scroll Strip */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-4 scroll-smooth">
          {catalog.slice(0, 15).map((movie) => (
            <div
              key={movie.id}
              onClick={() => setActiveModalMovie(movie)}
              className="shrink-0 w-36 sm:w-44 group cursor-pointer relative"
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-[#2a0054] group-hover:border-[#FF0091]/70 transition-all duration-300 shadow-lg">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-black text-amber-400 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" /> {movie.rating}
                </div>
                {movie.isVipOnly && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#FF0091] text-[9px] font-black text-white">
                    VIP
                  </div>
                )}
                <div className="absolute bottom-2 inset-x-2">
                  <p className="text-xs font-black text-white truncate">{movie.title}</p>
                  <p className="text-[10px] text-pink-300 truncate">{movie.categoryLabel}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE CINEMA CATALOG BROWSER                         */}
      {/* ============================================================ */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-3">
            {/* Title directly at the top - NO PILL BADGE ABOVE IT */}
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Explore What&apos;s Streaming
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              From historic Nollywood sagas to record-breaking Hollywood releases, discover content tailored to your screen.
            </p>

            {/* Highlights row placed below description, before category tabs */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-semibold text-pink-400">
              <span>✓ 4K Ultra HD & Dolby Atmos</span>
              <span>✓ New Titles Added Weekly</span>
              <span>✓ Full Mobile & Smart TV Sync</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#120029] border border-[#2a0054]">
            {[
              { id: 'all', label: 'All Titles' },
              { id: 'trending', label: 'Trending' },
              { id: 'nollywood', label: 'Nollywood Hits' },
              { id: 'blockbusters', label: 'Blockbusters' },
              { id: 'shorts', label: 'Shorts & Reels' },
              { id: 'vip', label: 'VIP Exclusives' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === tab.id
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#7928CA] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => setActiveModalMovie(movie)}
              className="group cursor-pointer rounded-2xl bg-[#120029]/70 border border-[#2a0054] hover:border-[#FF0091]/60 transition-all duration-300 overflow-hidden flex flex-col shadow-xl hover:-translate-y-1.5"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#FF0091] text-white flex items-center justify-center shadow-lg shadow-[#FF0091]/50 scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
                {/* Badges on image */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-amber-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" /> {movie.rating}
                  </span>
                  {movie.isOriginal && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FF0091] text-[9px] font-black text-white">
                      ORIGINAL
                    </span>
                  )}
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-bold text-slate-300">
                  {movie.quality}
                </div>
              </div>

              {/* Info block */}
              <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{movie.genres.join(', ')}</p>
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#2a0054]/60">
                  <span>{movie.year}</span>
                  <span className="text-pink-400 font-semibold">{movie.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Catalog CTA Bar */}
        <div className="mt-12 p-6 rounded-3xl bg-gradient-to-r from-[#14002e] via-[#1a003b] to-[#14002e] border border-[#2a0054] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF0091] to-[#7928CA] flex items-center justify-center text-white shrink-0 shadow-lg">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Looking for a specific movie or series?</h4>
              <p className="text-xs text-slate-400">
                Thousands of titles are available. Launch the full Web App catalog to search by actor, genre, or director.
              </p>
            </div>
          </div>
          <a
            href="https://app.vinylflix.com"
            className="shrink-0 px-6 py-3 rounded-xl bg-white text-[#0a0017] font-black text-xs hover:bg-pink-50 transition-all flex items-center gap-2"
          >
            Launch Full Catalog <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. EVERY SCREEN, EVERYWHERE (Device Ecosystem)               */}
      {/* ============================================================ */}
      <section id="devices" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-[#14002e] to-[#0a0017] border border-[#2a0054] p-8 sm:p-14 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Column: Device Information */}
            <div className="lg:col-span-6 space-y-5 text-left">
              {/* Title directly at top - NO PILL BADGE ABOVE IT */}
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Stream on Any Screen, At Home or On The Move
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Enjoy a continuous, high-fidelity cinema experience. Start watching on your Smart TV in the living room, continue seamlessly on your Android or iPhone during your commute, or binge on your laptop.
              </p>

              {/* Highlights below text, before CTA buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#0a0017]/80 border border-[#2a0054] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-[#FF0091]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Mobile Apps</h5>
                    <p className="text-xs text-slate-400">Android & iOS with offline mode</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0a0017]/80 border border-[#2a0054] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Smart TV & Cast</h5>
                    <p className="text-xs text-slate-400">Android TV, Apple TV & Cast</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0a0017]/80 border border-[#2a0054] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-[#FF0091]">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Web Browser</h5>
                    <p className="text-xs text-slate-400">Instant streaming on PC & Mac</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0a0017]/80 border border-[#2a0054] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Offline Mode</h5>
                    <p className="text-xs text-slate-400">Download for flights & travels</p>
                  </div>
                </div>
              </div>

              {/* App download buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <a
                  href="https://app.vinylflix.com"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF0091] to-[#7928CA] text-white font-black text-sm shadow-xl shadow-[#FF0091]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Mobile App (APK)
                </a>
                <a
                  href="https://app.vinylflix.com"
                  className="px-6 py-3.5 rounded-2xl bg-[#0a0017] hover:bg-[#120029] border border-[#2a0054] text-slate-200 font-bold text-sm transition-all flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4 text-purple-400" /> Open Web Player
                </a>
              </div>
            </div>

            {/* Right Column: Visual Device Mockup */}
            <div className="lg:col-span-6 flex items-center justify-center relative">
              <div className="relative w-full max-w-lg aspect-video rounded-2xl border-4 border-[#2a0054] bg-slate-950 shadow-2xl overflow-hidden hidden sm:block">
                <img
                  src="https://image.tmdb.org/t/p/original/dvBCdCohwWbsP5qAaglOXagDMtk.jpg"
                  alt="Smart TV Streaming Mockup"
                  className="w-full h-full object-cover filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                  <h4 className="text-lg font-black text-white">Cinema Grade Ultra HD Playback</h4>
                  <p className="text-xs text-slate-300">Dolby Atmos Surround • Zero Commercials</p>
                </div>
              </div>

              {/* Floating Mobile Phone Mockup Overlay */}
              <div className="sm:absolute sm:-bottom-6 sm:-left-6 w-64 rounded-[36px] p-2 bg-[#0a0017] border-2 border-[#FF0091]/60 shadow-2xl shadow-[#FF0091]/20">
                <div className="rounded-[28px] overflow-hidden bg-[#120029] border border-[#2a0054] aspect-[9/18] relative">
                  <img
                    src="https://image.tmdb.org/t/p/w500/jbwYaoYWZwxtPP76AZnfYKQjCEB.jpg"
                    alt="Mobile Vinylflix App"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] text-white font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-[#FF0091]">VIP OTT</span>
                      <span>Vinylflix Mobile</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Deadpool & Wolverine</p>
                      <p className="text-[10px] text-slate-300">Downloading for offline...</p>
                      <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div className="w-3/4 h-full bg-[#FF0091]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. VIP OTT MEMBERSHIP PLANS                                  */}
      {/* ============================================================ */}
      <section id="vip" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          {/* Title directly at top - NO PILL BADGE ABOVE IT */}
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Unlock Pure Cinema Without Interruption
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Enjoy unlimited cinema streaming, 4K resolution, offline downloads, and zero advertisements.
          </p>

          {/* Highlights placed below description, before pricing cards */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-amber-300 pt-2">
            <span>✓ 100% Ad-Free Cinema</span>
            <span>✓ 4K Ultra HD & Dolby Atmos</span>
            <span>✓ Multi-Screen Playback</span>
            <span>✓ Cancel Anytime</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Plan 1: Free Starter */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-slate-500 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Free Starter</h3>
                <p className="text-xs text-slate-400 mt-1">Explore the Vinylflix catalog</p>
              </div>
              <div className="pt-2">
                <span className="text-4xl font-black text-white">₦0</span>
                <span className="text-xs text-slate-400"> / forever</span>
              </div>
              <div className="pt-4 border-t border-[#2a0054] space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Standard Definition (SD)
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Watch select movies & shorts
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Single active device
                </div>
                <div className="flex items-center gap-2.5 text-slate-500">
                  <X className="w-4 h-4" /> Contains standard sponsor ads
                </div>
                <div className="flex items-center gap-2.5 text-slate-500">
                  <X className="w-4 h-4" /> No offline downloads
                </div>
              </div>
            </div>

            <a
              href="https://app.vinylflix.com/register"
              className="w-full py-3.5 rounded-2xl text-center text-sm font-bold text-slate-200 bg-[#1c0040] hover:bg-[#250057] border border-[#2a0054] transition-all"
            >
              Start Free
            </a>
          </div>

          {/* Plan 2: Basic VIP (Most Popular) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1c0040] to-[#120029] border-2 border-[#FF0091] relative flex flex-col justify-between space-y-6 shadow-2xl shadow-[#FF0091]/20 scale-105 z-10">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-[#FF0091]">
                <Crown className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Basic VIP Pass</h3>
                <p className="text-xs text-pink-300 mt-1">Ad-free HD streaming on phone & web</p>
              </div>
              <div className="pt-2">
                <span className="text-4xl font-black text-white">₦3,000</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <div className="pt-4 border-t border-[#2a0054] space-y-3 text-xs text-slate-200">
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-[#FF0091]" /> 100% Ad-Free Cinema
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-[#FF0091]" /> Full High Definition (1080p HD)
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-[#FF0091]" /> Stream on 2 devices simultaneously
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-[#FF0091]" /> Offline Downloads on Mobile
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-[#FF0091]" /> Full Nollywood & Global Catalog
                </div>
              </div>
            </div>

            <a
              href="https://app.vinylflix.com/memberships"
              className="w-full py-4 rounded-2xl text-center text-sm font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-xl shadow-[#FF0091]/40 hover:scale-105 active:scale-95 transition-all"
            >
              Get Basic VIP Pass
            </a>
          </div>

          {/* Plan 3: Premium VIP (Cinema Deluxe) */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-amber-500/40 hover:border-amber-400 transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Premium VIP</h3>
                <p className="text-xs text-amber-300 mt-1">4K Ultra HD & Dolby Atmos on Smart TV</p>
              </div>
              <div className="pt-2">
                <span className="text-4xl font-black text-white">₦5,000</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <div className="pt-4 border-t border-[#2a0054] space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-amber-400" /> 4K Ultra HD + HDR10 Playback
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-amber-400" /> Dolby Atmos 5.1 Surround Sound
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-amber-400" /> Stream on 4 devices simultaneously
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-amber-400" /> Unlimited Offline Mobile Downloads
                </div>
                <div className="flex items-center gap-2.5 font-semibold text-amber-300">
                  <Check className="w-4 h-4 text-amber-400" /> Early Access to VIP Premieres
                </div>
              </div>
            </div>

            <a
              href="https://app.vinylflix.com/memberships"
              className="w-full py-3.5 rounded-2xl text-center text-sm font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
            >
              Get Premium VIP
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. REFERRAL & AFFILIATE PARTNER PROGRAM                      */}
      {/* ============================================================ */}
      <section id="rewards" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#0d001f] via-[#150033] to-[#0d001f] border border-[#2a0054] p-8 sm:p-14 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              {/* Title directly at top - NO PILL BADGE ABOVE IT */}
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Share African Cinema. Earn Verified Partner Commissions.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Become a Vinylflix community ambassador. Invite your friends, family, and followers using your personal referral link. When they upgrade to a verified VIP pass, you earn real cash rewards withdrawable straight to your bank account.
              </p>

              {/* Highlights below text, before CTA button */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#0a0017] border border-[#2a0054] space-y-1">
                  <span className="text-2xl font-black text-emerald-400">₦10,000</span>
                  <p className="text-xs text-slate-300 font-semibold">10-Referral Milestone</p>
                  <p className="text-[10px] text-slate-400">Unlocked upon verified VIP upgrades</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0a0017] border border-[#2a0054] space-y-1">
                  <span className="text-2xl font-black text-pink-400">₦2,000</span>
                  <p className="text-xs text-slate-300 font-semibold">Min. Withdrawal</p>
                  <p className="text-[10px] text-slate-400">Fast payout straight to bank</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0a0017] border border-[#2a0054] space-y-1">
                  <span className="text-2xl font-black text-purple-400">Live</span>
                  <p className="text-xs text-slate-300 font-semibold">Real-Time Sync</p>
                  <p className="text-[10px] text-slate-400">Track verified vs pending friends</p>
                </div>
              </div>

              <div className="pt-3">
                <a
                  href="https://app.vinylflix.com/referrals"
                  className="px-7 py-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400 transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  Join Partner Network &rarr;
                </a>
              </div>
            </div>

            {/* Right: Referral Flow Card */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#080014] border border-[#2a0054] space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-white">How Partner Rewards Work</h4>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#120029] border border-[#2a0054] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500/20 text-[#FF0091] font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-white">Copy Your Unique Link</span>
                    <p className="text-slate-400">Grab your invite link from your profile dashboard.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#120029] border border-[#2a0054] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-white">Friends Join & Upgrade</span>
                    <p className="text-slate-400">They unlock ad-free cinema with a Basic or Premium VIP pass.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#120029] border border-[#2a0054] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-white">Withdraw Your Earnings</span>
                    <p className="text-slate-400">Transfer verified commissions straight to your bank account.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. CREATOR & FILMMAKER STUDIO                                */}
      {/* ============================================================ */}
      <section id="creators" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-[#14002e] to-[#0a0017] border border-[#2a0054] p-8 sm:p-14 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            {/* Title directly at top - NO PILL BADGE ABOVE IT */}
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Distribute Your Film to an Active Cinema Audience
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Vinylflix gives visionary directors, indie production houses, and digital creators the distribution muscle to reach thousands of passionate viewers worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-[#0a0017] border border-[#2a0054] space-y-4 hover:border-[#FF0091]/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-[#FF0091]">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Premiere Your Movies</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Showcase feature films, web series, and documentaries directly on Vinylflix’s curated cinema catalog with custom artwork, cast credits, and trailers.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0a0017] border border-[#2a0054] space-y-4 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <PlaySquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">YouTube & Shorts Integration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Easily connect your YouTube channel to promote viral Shorts and videos with deep retention signals and direct subscription links.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0a0017] border border-[#2a0054] space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Real-Time Audience Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track live views, watch duration metrics, viewer demographics, and engagement rates directly from your Creator Studio dashboard.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <a
              href="https://app.vinylflix.com/campaigns"
              className="px-8 py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-xl shadow-[#FF0091]/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              Open Creator Studio <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FREQUENTLY ASKED QUESTIONS (Accordion)                    */}
      {/* ============================================================ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          {/* Title directly at top - NO PILL BADGE ABOVE IT */}
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400">Everything you need to know about streaming on Vinylflix.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl bg-[#120029] border border-[#2a0054] overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between text-base font-bold text-white gap-4 hover:text-pink-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-pink-400 shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-[#2a0054]/60 pt-4 animate-in fade-in duration-300">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. GRAND FINALE CALL TO ACTION BANNER                        */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] p-8 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-[#FF0091]/30">
          <div className="max-w-3xl mx-auto space-y-5 relative z-10">
            {/* Title directly at top - NO PILL BADGE ABOVE IT */}
            <h2 className="text-3xl sm:text-6xl font-black tracking-tight leading-tight">
              Ready for the Ultimate African Cinema Experience?
            </h2>
            <p className="text-base sm:text-xl text-pink-100 font-normal max-w-2xl mx-auto">
              Join thousands of film enthusiasts streaming Nollywood blockbusters and global releases on Vinylflix.
            </p>

            {/* Highlights row below text, before CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-pink-200 pt-2">
              <span>✓ Instant Access on Web & Mobile</span>
              <span>✓ 4K Ultra HD & Dolby Atmos</span>
              <span>✓ Cancel Anytime</span>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://app.vinylflix.com/register"
                className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-white text-[#0a0017] font-black text-base shadow-2xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> Stream Free Now
              </a>
              <a
                href="https://app.vinylflix.com/memberships"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/30 text-white font-bold text-base hover:bg-black/50 transition-all flex items-center justify-center gap-2"
              >
                <Crown className="w-5 h-5 text-amber-300" /> Explore VIP Passes
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. MOVIE DETAILS MODAL                                      */}
      {/* ============================================================ */}
      {activeModalMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl rounded-3xl bg-[#0e001f] border border-[#2a0054] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Backdrop Banner */}
            <div className="relative aspect-[16/8] w-full bg-slate-900">
              <img
                src={activeModalMovie.backdrop}
                alt={activeModalMovie.title}
                className="w-full h-full object-cover filter brightness-[0.75]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e001f] via-transparent to-black/40" />
              <button
                onClick={() => setActiveModalMovie(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-[#FF0091] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white mt-2 drop-shadow-md">
                    {activeModalMovie.title}
                  </h3>
                  <p className="text-xs text-pink-300 italic">{activeModalMovie.tagline}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> {activeModalMovie.rating} IMDb
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-slate-200 font-bold">
                  {activeModalMovie.quality}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-purple-900/50 text-purple-200 font-bold">
                  {activeModalMovie.audio}
                </span>
                <span className="text-slate-400">• {activeModalMovie.duration}</span>
                <span className="text-slate-400">• {activeModalMovie.year}</span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{activeModalMovie.overview}</p>

              <div className="space-y-1 text-xs text-slate-400">
                <p>
                  <span className="text-white font-bold">Genres: </span>
                  {activeModalMovie.genres.join(', ')}
                </p>
                <p>
                  <span className="text-white font-bold">Starring: </span>
                  {activeModalMovie.cast.join(', ')}
                </p>
              </div>

              {/* Modal CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#2a0054]">
                <div className="text-xs text-slate-400">
                  Stream on any device with Vinylflix Web, Android APK, or Smart TV.
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href="https://app.vinylflix.com/register"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF0091] to-[#7928CA] text-white font-black text-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" /> Stream Movie Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
