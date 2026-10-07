import React from 'react';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { Navbar } from '../components/Navbar';

export const metadata = {
  title: 'CivicPulse – Smart Community Issue Reporting & Resolution',
  description: 'Report local problems, track progress, upvote issues, and empower smart community resolution.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/apple-icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
            <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-300">CivicPulse</span>
                  <span>– Report. Track. Resolve.</span>
                </div>
                <p>© 2026 CivicPulse Platform. Smart Community Infrastructure Management.</p>
              </div>
            </footer>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
