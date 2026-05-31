import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'Furnishing Catalogue QR System',
  description: 'Manage vendors, catalogues and products with QR codes and barcodes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
