import Link from "next/link"
import { Button } from "@/components/ui/button"
import ScannerContainer from "@/components/scanner-container"

export default function PublicScannerPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">Student Time Tracking</div>
          <Link href="/login">
            <Button variant="outline" className="text-base">
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">QR Code Scanner</h2>
          <p className="text-gray-700 mb-6 text-center text-lg">Scan a student's QR code to check them in or out</p>

          <ScannerContainer />
        </div>
      </div>

      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="text-base">© {new Date().getFullYear()} Student Time Tracking System</p>
        </div>
      </footer>
    </main>
  )
}

