"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Printer } from "lucide-react"
import QRCode from "qrcode"

interface QRCodeGeneratorProps {
  value: string
  size?: number
  label?: string
}

export default function QRCodeGenerator({ value, size = 200, label }: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateQRCode()
  }, [value, size])

  const generateQRCode = async () => {
    try {
      if (!value) {
        setError("No value provided for QR code")
        return
      }

      // Generate QR code on canvas
      if (qrRef.current) {
        await QRCode.toCanvas(qrRef.current, value, {
          width: size,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        })

        // Convert canvas to data URL for download/print
        const dataUrl = qrRef.current.toDataURL("image/png")
        setQrDataUrl(dataUrl)
        setError(null)
      }
    } catch (err) {
      console.error("Error generating QR code:", err)
      setError("Failed to generate QR code")
    }
  }

  const downloadQRCode = () => {
    if (!qrDataUrl) {
      alert("QR code not ready yet. Please try again.")
      return
    }

    // Create a temporary link element
    const link = document.createElement("a")

    // Set the href to the QR code data URL
    link.href = qrDataUrl

    // Set download attribute with a filename
    link.download = `qrcode-${value}.png`

    // Append to the document
    document.body.appendChild(link)

    // Trigger click
    link.click()

    // Clean up
    document.body.removeChild(link)
  }

  const printQRCode = () => {
    if (!qrDataUrl) {
      alert("QR code not ready yet. Please try again.")
      return
    }

    // Create a new window for printing
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      // Write the HTML content to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR Code</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              .container {
                text-align: center;
                max-width: 100%;
              }
              img {
                max-width: 100%;
                height: auto;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 5px;
              }
              h2 {
                margin-top: 20px;
                margin-bottom: 10px;
              }
              p {
                margin-top: 10px;
                margin-bottom: 20px;
              }
              .print-button {
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 4px 2px;
                cursor: pointer;
                border-radius: 4px;
              }
              @media print {
                .print-button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${qrDataUrl}" alt="QR Code" />
              ${label ? `<h2>${label}</h2>` : ""}
              <p>ID: ${value}</p>
              <button class="print-button" onclick="window.print(); setTimeout(function(){ window.close(); }, 500);">Print</button>
            </div>
          </body>
        </html>
      `)

      // Close the document to finish writing
      printWindow.document.close()
    }
  }

  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="mb-4 border rounded-lg p-2 bg-white">
          {error ? (
            <div className="flex items-center justify-center h-[200px] w-[200px] bg-gray-100 text-red-500 text-center p-4">
              {error}
            </div>
          ) : (
            <canvas ref={qrRef} className="rounded-lg" />
          )}
        </div>
        {label && <p className="text-center font-medium text-lg mb-2">{label}</p>}
        <p className="text-center text-base text-gray-700 mb-4">ID: {value}</p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQRCode}
            className="flex items-center text-base"
            disabled={!qrDataUrl || !!error}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={printQRCode}
            className="flex items-center text-base"
            disabled={!qrDataUrl || !!error}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

