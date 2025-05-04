"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { ScanIcon as Scanner } from "lucide-react"

// Dynamically import QRScanner with SSR disabled to avoid hydration issues
const PublicQRScanner = dynamic(() => import("@/components/public-qr-scanner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center border rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
})

export default function ScannerContainer() {
  const [mounted, setMounted] = useState(false)

  // Use useEffect to ensure we're on the client side
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return (
    <>
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-center">
          <Scanner className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-blue-800 text-lg">External Scanner Support</h3>
            <p className="text-blue-700 text-base">
              Connect a barcode/QR scanner device to use with this system. Select the "Scanner" tab after loading the
              scanner below.
            </p>
          </div>
        </CardContent>
      </Card>

      {mounted && <PublicQRScanner />}
    </>
  )
}

