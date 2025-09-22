import type { TimeRecord, Student } from "@/lib/db"

// Convert time records to CSV format
export function timeRecordsToCSV(
  records: TimeRecord[],
  students: { [key: string]: Student },
  includeHeaders = true,
): string {
  // Define CSV headers
  const headers = [
    "Date",
    "Time",
    "Type",
    "Student ID",
    "Last Name",
    "First Name",
    "Middle Name",
    "Year Level",
    "Course",
    "School",
  ].join(",")

  // Convert each record to CSV row
  const rows = records.map((record) => {
    const student = students[record.studentId] || {
      studentId: record.studentId,
      lastName: "Unknown",
      firstName: "Unknown",
      middleName: "",
      yearLevel: "",
      course: "",
      id: "",
      status: "inactive" as const,
      photoUrl: "",
      school: "",
    }

    const date = new Date(record.timestamp).toLocaleDateString()
    const time = new Date(record.timestamp).toLocaleTimeString()

    return [
      date,
      time,
      record.type === "in" ? "Check In" : "Check Out",
      student.studentId,
      `"${student.lastName}"`,
      `"${student.firstName}"`,
      `"${student.middleName}"`,
      student.yearLevel,
      `"${student.course}"`,
      student.school,
    ].join(",")
  })

  // Combine headers and rows
  return includeHeaders ? `${headers}\n${rows.join("\n")}` : rows.join("\n")
}

// Download data as a file
export function downloadAsFile(data: string, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

// Format date for filenames
export function formatDateForFilename(date: Date): string {
  return date.toISOString().split("T")[0]
}
