import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ErrorProvider } from '../components/ErrorProvider'
import { ToastProvider } from '../components/ToastNotification'
import { ConfirmationProvider } from '../components/ConfirmationDialog'
import { GlobalLoadingIndicator } from '../components/GlobalLoadingIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '3D House Design',
  description: '3D house design application with React Three Fiber',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ErrorProvider
            maxErrors={5}
            showNotifications={true}
            notificationPosition="top-right"
          >
            <ToastProvider
              maxToasts={5}
              defaultDuration={5000}
              position="bottom-right"
            >
              <ConfirmationProvider>
                {children}
                <GlobalLoadingIndicator />
              </ConfirmationProvider>
            </ToastProvider>
          </ErrorProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}