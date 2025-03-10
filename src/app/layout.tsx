import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "SyncFriends - Легкое согласование встреч",
  description: "Удобный сервис для планирования встреч и поиска оптимального времени для группы людей",
  authors: [{ name: "SyncFriends Team" }],
  keywords: ["планирование", "встречи", "расписание", "командная работа", "синхронизация"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}
      >
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
            <Link href="/" className="font-bold text-xl text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              SyncFriends
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/create" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Создать
              </Link>
              <Link href="/join" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Присоединиться
              </Link>
            </nav>
          </div>
        </header>
        
        <div className="flex-grow">
          {children}
        </div>
        
        <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 py-8 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-3">SyncFriends</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Удобный сервис для планирования встреч и поиска оптимального времени
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} SyncFriends
                </p>
              </div>
              
              <div>
                <h3 className="font-bold mb-3">Ссылки</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 text-sm">
                      Главная
                    </Link>
                  </li>
                  <li>
                    <Link href="/create" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 text-sm">
                      Создать событие
                    </Link>
                  </li>
                  <li>
                    <Link href="/join" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 text-sm">
                      Присоединиться к событию
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-3">Контакты</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  У вас есть вопросы или предложения? Свяжитесь с нами!
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
