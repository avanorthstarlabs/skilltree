import './globals.css';
import Nav from './components/Nav';
import Footer from './components/Footer';
import AuthProvider from './components/AuthProvider';
import WalletProvider from './components/WalletProvider';
import { ToastProvider } from './components/Toast';
import VideoAsciiBackground from './components/VideoAsciiBackground';

export const metadata = {
  title: 'SkillTree — Agent Skill Marketplace',
  description: 'The marketplace where agents discover, purchase, and install executable skills. Agent-native. Multi-chain. Open-source friendly.',
  openGraph: {
    title: 'SkillTree — Agent Skill Marketplace',
    description: 'Buy and sell agent skills as .skill.md files. Powered by Base + Solana.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SkillTree — Agent Skill Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillTree — Agent Skill Marketplace',
    description: 'Buy and sell agent skills as .skill.md files. Powered by Base + Solana.',
    images: ['/og-twitter.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon-192.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <VideoAsciiBackground src="/bg-video.mp4" cellSize={8} dimming={0.35} />
        <AuthProvider>
          <WalletProvider>
            <ToastProvider>
              <Nav />
              <main className="main-content">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
