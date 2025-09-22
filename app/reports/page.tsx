"use client"

import { useState, useEffect } from "react"
import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getTimeRecords, getStudents, type Student, type TimeRecord } from "@/lib/db"
import { timeRecordsToCSV, downloadAsFile, formatDateForFilename } from "@/lib/export-utils"
import { ChartContainer } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { FileDown, Calendar, Users, Clock } from "lucide-react"
import { addDays, format, subDays } from "date-fns"

export default function ReportsPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <ReportsContent />
    </ProtectedRoute>
  )
}

function ReportsContent() {
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [reportData, setReportData] = useState<any[]>([])
  const [studentsMap, setStudentsMap] = useState<{ [key: string]: Student }>({})
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 6),
    to: new Date(),
  })

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      const studentsList = await getStudents()
      setStudents(studentsList)

      // Create a map of students for easier lookup
      const studentsMapObj = studentsList.reduce(
        (acc, student) => {
          acc[student.studentId] = student
          return acc
        },
        {} as { [key: string]: Student },
      )

      setStudentsMap(studentsMapObj)

      const timeRecordsList = await getTimeRecords()
      setRecords(timeRecordsList)

      // Process data for reports
      processReportData(studentsList, timeRecordsList)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const processReportData = (studentsList: Student[], timeRecordsList: TimeRecord[]) => {
    // Get dates in the selected range
    const dates = []
    let currentDate = new Date(dateRange.from)
    while (currentDate <= dateRange.to) {
      dates.push(format(currentDate, "yyyy-MM-dd"))
      currentDate = addDays(currentDate, 1)
    }

    // Count unique students with check-ins per day
    const dailyCounts = dates.map((date) => {
      // Get all records for this date
      const dateRecords = timeRecordsList.filter((record) => record.date === date)

      // Count unique students who checked in on this date
      const uniqueStudents = new Set(
        dateRecords.filter((record) => record.type === "in").map((record) => record.studentId),
      )

      return {
        date: date,
        count: uniqueStudents.size,
      }
    })

    // Format date labels for display
    const formattedData = dailyCounts.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: item.count,
    }))

    setReportData(formattedData)
  }

  const getTotalStudents = () => {
    return students.length
  }

  const getTotalCheckIns = () => {
    return records.filter((r) => r.type === "in").length
  }

  const getActiveToday = () => {
    const today = new Date().toISOString().split("T")[0]
    // Count unique students who checked in today
    const uniqueStudents = new Set(
      records.filter((record) => record.date === today && record.type === "in").map((record) => record.studentId),
    )
    return uniqueStudents.size
  }

  // Export data as CSV
  const exportToCSV = () => {
    // Filter records by date range
    const fromDate = format(dateRange.from, "yyyy-MM-dd")
    const toDate = format(dateRange.to, "yyyy-MM-dd")

    const filteredRecords = records.filter((record) => {
      return record.date >= fromDate && record.date <= toDate
    })

    const csvData = timeRecordsToCSV(filteredRecords, studentsMap)
    const filename = `time-records-${formatDateForFilename(dateRange.from)}-to-${formatDateForFilename(dateRange.to)}.csv`
    downloadAsFile(csvData, filename, "text/csv;charset=utf-8;")
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <Nav />

      <div className="flex-1 p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold">Reports & Analytics</h2>

            <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center">
              <FileDown className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <div className="text-3xl font-bold">{getTotalStudents()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Check-ins</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                <div className="text-3xl font-bold">{getTotalCheckIns()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Today</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <div className="text-3xl font-bold">{getActiveToday()}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Student Attendance</CardTitle>
              <CardDescription>Number of unique students who checked in each day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer
                  config={{
                    count: {
                      label: "Students",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
