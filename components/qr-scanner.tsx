"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getStudentByStudentId,
  addTimeRecord,
  getTimeRecordsByStudentAndDate,
  type Student,
  type TimeRecord,
} from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Keyboard, ScanIcon as Scanner } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [continuousMode, setContinuousMode] = useState(true)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null)
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [scanType, setScanType] = useState<"in" | "out">("in")
  const [recentScans, setRecentScans] = useState<Array<{ student: Student; type: "in" | "out"; time: Date }>>([])
  const [manualInput, setManualInput] = useState("")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanCooldownRef = useRef<boolean>(false)
  const manualInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("camera")
  const { user } = useAuth()

  // Fix the external scanner buffer handling

  // Replace the global variables with useRef
  const externalScanBufferRef = useRef("")
  const externalScanTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Add event listener for external scanner input
    window.addEventListener("keydown", handleExternalScannerInput)

    // Focus on manual input when in manual mode
    if (activeTab === "manual" && manualInputRef.current) {
      manualInputRef.current.focus()
    }

    return () => {
      // Clean up scanner and event listeners
      if (scannerRef.current && scanning) {
        try {
          scannerRef.current.stop().catch((err) => {
            console.error("Error stopping scanner during cleanup:", err)
          })
        } catch (error) {
          console.error("Error during scanner cleanup:", error)
        }
      }
      window.removeEventListener("keydown", handleExternalScannerInput)

      // Clear any pending timers
      if (externalScanTimerRef.current) {
        clearTimeout(externalScanTimerRef.current)
      }
    }
  }, [scanning, activeTab])

  // Handle input from external barcode/QR scanner devices
  // These devices typically send data quickly followed by an Enter key
  //let externalScanBuffer = ""
  //let externalScanTimer: NodeJS.Timeout | null = null

  // Update the handleExternalScannerInput function
  const handleExternalScannerInput = (e: KeyboardEvent) => {
    // Only process if not in an input field (except our manual input)
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" && target !== manualInputRef.current) {
      return
    }

    // If Enter key is pressed, process the buffered data
    if (e.key === "Enter") {
      if (externalScanBufferRef.current.length > 0) {
        // Process the scanned data
        processScannedData(externalScanBufferRef.current)
        externalScanBufferRef.current = ""

        // Prevent default to avoid form submissions
        e.preventDefault()
      }
    } else if (e.key.length === 1) {
      // Only add printable characters to buffer
      // Start or reset the timer
      if (externalScanTimerRef.current) {
        clearTimeout(externalScanTimerRef.current)
      }

      // Add character to buffer
      externalScanBufferRef.current += e.key

      // Set a timeout to clear the buffer if no more input is received
      // External scanners typically send data very quickly
      externalScanTimerRef.current = setTimeout(() => {
        externalScanBufferRef.current = ""
      }, 100)
    }
  }

  const startScanner = () => {
    // If already scanning, don't start again
    if (scanning) return

    try {
      // Check if we already have a scanner instance
      if (scannerRef.current) {
        scannerRef.current.clear()
      }

      const html5QrCode = new Html5Qrcode("reader")
      scannerRef.current = html5QrCode

      html5QrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          onScanSuccess,
          onScanFailure,
        )
        .then(() => {
          setScanning(true)
          setMessage("Scanner started. Ready to scan student IDs.")
          setMessageType("success")
        })
        .catch((err) => {
          console.error("Error starting scanner:", err)
          setMessage("Failed to start scanner. Please check camera permissions.")
          setMessageType("error")
          scannerRef.current = null
        })
    } catch (error) {
      console.error("Error initializing scanner:", error)
      setMessage("Failed to initialize scanner. Please try again.")
      setMessageType("error")
      scannerRef.current = null
    }
  }

  const stopScanner = () => {
    if (scannerRef.current && scanning) {
      scannerRef.current
        .stop()
        .then(() => {
          setScanning(false)
          setMessage("Scanner stopped.")
          setMessageType(null)
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err)
          setScanning(false)
        })
    } else {
      setScanning(false)
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    // Prevent rapid scanning of the same QR code
    if (scanCooldownRef.current) return

    // Process the scanned data
    processScannedData(decodedText)
  }

  const onScanFailure = (error: string) => {
    // We don't need to show errors for each frame that doesn't contain a QR code
    console.debug("No QR code found in this frame:", error)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      processScannedData(manualInput.trim())
      setManualInput("")
    }
  }

  const processScannedData = async (data: string) => {
    // Set cooldown to prevent multiple scans
    scanCooldownRef.current = true
    setTimeout(() => {
      scanCooldownRef.current = false
    }, 2000) // 2 second cooldown

    // Set scan result
    setScanResult(data)
    setLastScanTime(new Date())

    try {
      // Check if QR code corresponds to a student ID
      const student = await getStudentByStudentId(data)

      if (!student) {
        setMessage("Student not found with ID: " + data)
        setMessageType("error")
        return
      }

      // Check if student is inactive
      if (student.status === "inactive") {
        setMessage(`${student.firstName} ${student.lastName} is inactive and cannot check in/out.`)
        setMessageType("error")
        setScannedStudent(student)
        return
      }

      setScannedStudent(student)

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]

      // Get today's records for this student
      const todayRecords = await getTimeRecordsByStudentAndDate(student.studentId, today)

      // Determine if this should be a check-in or check-out
      // If the last record was a check-in, this should be a check-out, and vice versa
      // If no records exist, this should be a check-in
      let recordType: "in" | "out" = "in"

      if (todayRecords.length > 0) {
        // Sort records by timestamp (newest first)
        const sortedRecords = [...todayRecords].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )

        // If the last record was a check-in, this should be a check-out
        recordType = sortedRecords[0].type === "in" ? "out" : "in"
      }

      // Create new time record
      const newRecord: TimeRecord = {
        id: uuidv4(),
        studentId: student.studentId,
        timestamp: new Date(),
        type: recordType,
        date: today,
      }

      await addTimeRecord(newRecord)

      // Update scan type for UI
      setScanType(recordType)

      // Add to recent scans
      setRecentScans((prev) => {
        const newScans = [{ student, type: recordType, time: new Date() }, ...prev].slice(0, 10) // Keep only the 10 most recent scans
        return newScans
      })

      setMessage(`${student.firstName} ${student.lastName} checked ${recordType} successfully!`)
      setMessageType("success")

      // If not in continuous mode and using camera, stop the scanner
      if (!continuousMode && scannerRef.current && scanning && activeTab === "camera") {
        await scannerRef.current.stop()
        setScanning(false)
      }

      // If in manual mode, focus back on the input field
      if (activeTab === "manual" && manualInputRef.current) {
        manualInputRef.current.focus()
      }
    } catch (error) {
      console.error("Error processing scan:", error)
      setMessage("Error processing scan. Please try again.")
      setMessageType("error")
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Stop camera scanner when switching tabs
    if (value !== "camera" && scannerRef.current && scanning) {
      stopScanner()
    }

    // Focus on manual input when switching to manual tab
    if (value === "manual" && manualInputRef.current) {
      setTimeout(() => {
        manualInputRef.current?.focus()
      }, 100)
    }
  }

  const { lastName } = scannedStudent || {}

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <Tabs defaultValue="camera" value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="camera" className="text-base">
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="manual" className="text-base">
                <Keyboard className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="external" className="text-base">
                <Scanner className="h-4 w-4 mr-2" />
                Scanner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="w-full">
              <div id="reader" className="w-full max-w-sm h-64 border rounded-lg overflow-hidden mx-auto"></div>
              <div className="flex items-center justify-between w-full mt-4">
                <div className="flex items-center space-x-2">
                  <Switch id="continuous-mode" checked={continuousMode} onCheckedChange={setContinuousMode} />
                  <Label htmlFor="continuous-mode" className="text-base font-medium">
                    Continuous Scanning
                  </Label>
                </div>

                {!scanning ? (
                  <Button onClick={startScanner} size="lg" className="text-base font-medium">
                    Start Scanner
                  </Button>
                ) : (
                  <Button onClick={stopScanner} variant="destructive" size="lg" className="text-base font-medium">
                    Stop Scanner
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="w-full">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-input" className="text-base font-medium">
                    Enter Student ID
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="manual-input"
                      ref={manualInputRef}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Type or scan student ID"
                      className="text-base h-12"
                      autoComplete="off"
                    />
                    <Button type="submit" size="lg" className="text-base font-medium">
                      Submit
                    </Button>
                  </div>
                </div>
              </form>
              <p className="text-sm text-gray-500 mt-2">Enter the student ID manually or use a handheld scanner</p>
            </TabsContent>

            <TabsContent value="external" className="w-full">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center space-y-4">
                <Scanner className="h-16 w-16 mx-auto text-primary" />
                <h3 className="text-xl font-bold">External Scanner Mode</h3>
                <p className="text-base text-gray-700">Connect your barcode/QR scanner device to scan student IDs.</p>
                <p className="text-base text-gray-700">The system will automatically detect scans from your device.</p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                  <p className="text-sm text-blue-700">
                    Make sure your scanner is configured to send an Enter key after each scan.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {scannedStudent && lastScanTime && (
            <div
              className={`flex items-center space-x-4 p-4 ${scanType === "in" ? "bg-green-100" : "bg-red-100"} rounded-md w-full`}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={scannedStudent.photoUrl}
                  alt={`${scannedStudent.firstName} ${scannedStudent.lastName}`}
                />
                <AvatarFallback>{getInitials(scannedStudent.firstName, lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-xl">{`${scannedStudent.lastName}, ${scannedStudent.firstName} ${scannedStudent.middleName ? scannedStudent.middleName.charAt(0) + "." : ""}`}</h3>
                <p className="text-base text-gray-700">{scannedStudent.studentId}</p>
                <p className="text-base">{`${scannedStudent.yearLevel} - ${scannedStudent.course}`}</p>
                <p className="text-base">{`School: ${scannedStudent.school}`}</p>
                <p className={`font-medium text-lg ${scanType === "in" ? "text-green-700" : "text-red-700"}`}>
                  {scanType === "in" ? "Checked In" : "Checked Out"} at {formatTime(lastScanTime)}
                </p>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`p-4 rounded-md w-full ${messageType === "success" ? "bg-green-100 text-green-800" : messageType === "error" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
            >
              {message}
            </div>
          )}

          {recentScans.length > 0 && (
            <div className="w-full mt-4">
              <h3 className="font-medium text-lg mb-2">Recent Scans</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-2 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentScans.map((scan, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 mr-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={scan.student.photoUrl}
                                  alt={`${scan.student.firstName} ${scan.student.lastName}`}
                                />
                                <AvatarFallback>
                                  {getInitials(scan.student.firstName, scan.student.lastName)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="text-base font-medium text-gray-900">
                              {scan.student.lastName}, {scan.student.firstName}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-base leading-5 font-semibold rounded-full ${scan.type === "in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                          >
                            {scan.type === "in" ? "In" : "Out"}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-base text-gray-700">{formatTime(scan.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
