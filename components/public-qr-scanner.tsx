"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Camera,
  Keyboard,
  ScanIcon as Scanner,
  CheckCircle,
  XCircle,
  Clock,
  School,
  GraduationCap,
  BookOpen,
} from "lucide-react"
import { formatEducationInfo } from "@/lib/education-programs"

export default function PublicQRScanner() {
  // Component state and logic remains the same
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
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanCooldownRef = useRef<boolean>(false)
  const manualInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("camera")

  // Fix the external scanner buffer handling
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

      // Add to recent scans (still track them internally even if not displayed)
      setRecentScans((prev) => {
        const newScans = [{ student, type: recordType, time: new Date() }, ...prev].slice(0, 10)
        return newScans
      })

      // Show success animation
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 2000)

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

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-center">Student Check-In/Out</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <Tabs defaultValue="camera" value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="camera" className="text-base font-medium">
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="manual" className="text-base font-medium">
                <Keyboard className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="external" className="text-base font-medium">
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
              className={`relative w-full rounded-lg overflow-hidden transition-all duration-300 ${showSuccessAnimation ? "scale-105" : ""}`}
            >
              <div
                className={`p-5 ${scanType === "in" ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"} border-2 rounded-lg`}
              >
                <div className="flex items-start space-x-4">
                  <Avatar className="h-20 w-20 border-2 border-white shadow-md">
                    <AvatarImage
                      src={scannedStudent.photoUrl}
                      alt={`${scannedStudent.firstName} ${scannedStudent.lastName}`}
                    />
                    <AvatarFallback className="text-xl font-bold">
                      {getInitials(scannedStudent.firstName, scannedStudent.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1">{`${scannedStudent.lastName}, ${scannedStudent.firstName} ${scannedStudent.middleName ? scannedStudent.middleName.charAt(0) + "." : ""}`}</h3>
                    <div className="grid grid-cols-1 gap-1 mb-2">
                      <div className="flex items-center text-gray-700">
                        <GraduationCap className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-base font-medium">{scannedStudent.studentId}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <School className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-base">{scannedStudent.school}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <BookOpen className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-base">{formatEducationInfo(scannedStudent)}</span>
                      </div>
                    </div>
                    <div
                      className={`flex items-center ${scanType === "in" ? "text-green-700" : "text-red-700"} bg-white bg-opacity-50 p-2 rounded-md`}
                    >
                      {scanType === "in" ? (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 mr-2" />
                      )}
                      <span className="font-bold text-lg">{scanType === "in" ? "Checked In" : "Checked Out"}</span>
                      <div className="flex items-center ml-auto">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="font-medium">{formatTime(lastScanTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {showSuccessAnimation && (
                  <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center">
                    <div className={`text-4xl ${scanType === "in" ? "text-green-600" : "text-red-600"}`}>
                      {scanType === "in" ? <CheckCircle className="h-16 w-16" /> : <XCircle className="h-16 w-16" />}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {message && (
            <div
              className={`p-4 rounded-md w-full text-base font-medium ${messageType === "success" ? "bg-green-100 text-green-800 border border-green-300" : messageType === "error" ? "bg-red-100 text-red-800 border border-red-300" : "bg-gray-100 text-gray-800 border border-gray-300"}`}
            >
              {message}
            </div>
          )}

          {/* Recent scans section removed as requested */}
        </div>
      </CardContent>
    </Card>
  )
}
