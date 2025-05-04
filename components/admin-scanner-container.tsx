"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import QRScanner with SSR disabled to avoid hydration issues
const QRScanner = dynamic(() => import("@/components/qr-scanner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center border rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
})

export default function AdminScannerContainer() {
  const [mounted, setMounted] = useState(false)

  // Use useEffect to ensure we're on the client side
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return mounted ? <QRScanner /> : null
}

