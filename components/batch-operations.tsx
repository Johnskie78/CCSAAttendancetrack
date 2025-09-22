"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { AlertCircle, RefreshCw, Trash2, Calendar, GraduationCap, School } from "lucide-react"
import {
  updateAllStudentSemesters,
  deleteAllTimeRecords,
  deleteTimeRecordsByDateRange,
  updateTimeRecordsWithSchool,
} from "@/lib/db"
import type { DateRange } from "react-day-picker"

export default function BatchOperations() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<"higher" | "basic">("higher")

  // State for semester update
  const [fromSemester, setFromSemester] = useState<string>("")
  const [toSemester, setToSemester] = useState<string>("")
  const [isSemesterDialogOpen, setSemesterDialogOpen] = useState(false)
  const [isSemesterUpdating, setSemesterUpdating] = useState(false)
  const [semesterUpdateResult, setSemesterUpdateResult] = useState<{ success: boolean; message: string } | null>(null)

  // State for record deletion
  const [isDeleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [isDeleteRangeDialogOpen, setDeleteRangeDialogOpen] = useState(false)
  const [isDeleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })

  // State for data migration
  const [isMigrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null)

  // Handle semester update
  const handleSemesterUpdate = async () => {
    if (!fromSemester || !toSemester) {
      setSemesterUpdateResult({
        success: false,
        message: "Please select both source and target semesters",
      })
      return
    }

    setSemesterUpdating(true)
    setSemesterUpdateResult(null)

    try {
      const school = activeTab === "higher" ? "Higher Education" : "Basic Education"
      const updatedCount = await updateAllStudentSemesters(fromSemester, toSemester, school)

      setSemesterUpdateResult({
        success: true,
        message: `Successfully updated ${updatedCount} ${school} students from "${fromSemester}" to "${toSemester}"`,
      })
    } catch (error) {
      console.error("Error updating semesters:", error)
      setSemesterUpdateResult({
        success: false,
        message: "An error occurred while updating semesters",
      })
    } finally {
      setSemesterUpdating(false)
    }
  }

  // Handle delete all records
  const handleDeleteAllRecords = async () => {
    setDeleting(true)
    setDeleteResult(null)

    try {
      const school = activeTab === "higher" ? "Higher Education" : "Basic Education"
      await deleteAllTimeRecords(school)

      setDeleteResult({
        success: true,
        message: `Successfully deleted all ${school} time records`,
      })
      setDeleteAllDialogOpen(false)
    } catch (error) {
      console.error("Error deleting records:", error)
      setDeleteResult({
        success: false,
        message: "An error occurred while deleting records",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Handle delete records by date range
  const handleDeleteRecordsByRange = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setDeleteResult({
        success: false,
        message: "Please select a valid date range",
      })
      return
    }

    setDeleting(true)
    setDeleteResult(null)

    try {
      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      const school = activeTab === "higher" ? "Higher Education" : "Basic Education"

      const deletedCount = await deleteTimeRecordsByDateRange(startDate, endDate, school)

      setDeleteResult({
        success: true,
        message: `Successfully deleted ${deletedCount} ${school} time records between ${startDate} and ${endDate}`,
      })
      setDeleteRangeDialogOpen(false)
    } catch (error) {
      console.error("Error deleting records by range:", error)
      setDeleteResult({
        success: false,
        message: "An error occurred while deleting records",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Handle data migration for time records
  const handleMigrateTimeRecords = async () => {
    setMigrating(true)
    setMigrationResult(null)

    try {
      const updatedCount = await updateTimeRecordsWithSchool()

      setMigrationResult({
        success: true,
        message: `Successfully updated ${updatedCount} time records with school information`,
      })
    } catch (error) {
      console.error("Error migrating time records:", error)
      setMigrationResult({
        success: false,
        message: "An error occurred while migrating time records",
      })
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Batch Operations</h2>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "higher" | "basic")}>
        <TabsList className="grid grid-cols-2 w-[400px] mb-6">
          <TabsTrigger value="higher" className="flex items-center">
            <GraduationCap className="mr-2 h-4 w-4" />
            Higher Education
          </TabsTrigger>
          <TabsTrigger value="basic" className="flex items-center">
            <School className="mr-2 h-4 w-4" />
            Basic Education
          </TabsTrigger>
        </TabsList>

        <TabsContent value="higher" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Semester Update Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="mr-2 h-5 w-5 text-primary" />
                  Update Student Semesters
                </CardTitle>
                <CardDescription>Update all Higher Education students from one semester to another</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-semester-higher" className="text-base font-medium">
                        From Semester
                      </Label>
                      <Select value={fromSemester} onValueChange={setFromSemester}>
                        <SelectTrigger id="from-semester-higher" className="text-base h-10">
                          <SelectValue placeholder="Select source semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Semester" className="text-base">
                            1st Semester
                          </SelectItem>
                          <SelectItem value="2nd Semester" className="text-base">
                            2nd Semester
                          </SelectItem>
                          <SelectItem value="Summer" className="text-base">
                            Summer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to-semester-higher" className="text-base font-medium">
                        To Semester
                      </Label>
                      <Select value={toSemester} onValueChange={setToSemester}>
                        <SelectTrigger id="to-semester-higher" className="text-base h-10">
                          <SelectValue placeholder="Select target semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Semester" className="text-base">
                            1st Semester
                          </SelectItem>
                          <SelectItem value="2nd Semester" className="text-base">
                            2nd Semester
                          </SelectItem>
                          <SelectItem value="Summer" className="text-base">
                            Summer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSemesterDialogOpen(true)}
                    className="w-full text-base"
                    disabled={!fromSemester || !toSemester || fromSemester === toSemester}
                  >
                    Update Semesters
                  </Button>

                  {semesterUpdateResult && activeTab === "higher" && (
                    <Alert variant={semesterUpdateResult.success ? "default" : "destructive"} className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-base">{semesterUpdateResult.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Record Deletion Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="mr-2 h-5 w-5 text-destructive" />
                  Delete Time Records
                </CardTitle>
                <CardDescription>Delete Higher Education time records in bulk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" onClick={() => setDeleteRangeDialogOpen(true)} className="w-full text-base">
                    <Calendar className="mr-2 h-4 w-4" />
                    Delete Records by Date Range
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => setDeleteAllDialogOpen(true)}
                    className="w-full text-base"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Higher Education Records
                  </Button>

                  {deleteResult && activeTab === "higher" && (
                    <Alert variant={deleteResult.success ? "default" : "destructive"} className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-base">{deleteResult.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Record Deletion Card for Basic Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trash2 className="mr-2 h-5 w-5 text-destructive" />
                  Delete Time Records
                </CardTitle>
                <CardDescription>Delete Basic Education time records in bulk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" onClick={() => setDeleteRangeDialogOpen(true)} className="w-full text-base">
                    <Calendar className="mr-2 h-4 w-4" />
                    Delete Records by Date Range
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => setDeleteAllDialogOpen(true)}
                    className="w-full text-base"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Basic Education Records
                  </Button>

                  {deleteResult && activeTab === "basic" && (
                    <Alert variant={deleteResult.success ? "default" : "destructive"} className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-base">{deleteResult.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Migration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="mr-2 h-5 w-5 text-primary" />
            Data Migration
          </CardTitle>
          <CardDescription>Update existing time records with school information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-base text-gray-700">
              This operation will update all existing time records to include school information based on the student's
              school. This is useful if you've just upgraded the system to separate higher education and basic education
              records.
            </p>
            <Button onClick={handleMigrateTimeRecords} className="w-full text-base" disabled={isMigrating}>
              {isMigrating ? "Migrating..." : "Migrate Time Records"}
            </Button>

            {migrationResult && (
              <Alert variant={migrationResult.success ? "default" : "destructive"} className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-base">{migrationResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Semester Update Confirmation Dialog */}
      <Dialog open={isSemesterDialogOpen} onOpenChange={setSemesterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Semester Update</DialogTitle>
            <DialogDescription className="text-base pt-2">
              This will update <strong>all Higher Education students</strong> currently enrolled in{" "}
              <strong>{fromSemester}</strong> to <strong>{toSemester}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-base">
                Warning: This will affect all Higher Education students in {fromSemester}. Make sure you have a backup
                before proceeding.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSemesterDialogOpen(false)}
              disabled={isSemesterUpdating}
              className="text-base"
            >
              Cancel
            </Button>
            <Button onClick={handleSemesterUpdate} disabled={isSemesterUpdating} className="text-base">
              {isSemesterUpdating ? "Updating..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Records Confirmation Dialog */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Delete All Records</DialogTitle>
            <DialogDescription className="text-base pt-2">
              This will permanently delete{" "}
              <strong>all {activeTab === "higher" ? "Higher Education" : "Basic Education"} time records</strong> from
              the system. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-base">
                Warning: All {activeTab === "higher" ? "Higher Education" : "Basic Education"} check-in and check-out
                records will be permanently deleted. Make sure you have exported any data you need before proceeding.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAllDialogOpen(false)}
              disabled={isDeleting}
              className="text-base"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllRecords} disabled={isDeleting} className="text-base">
              {isDeleting ? "Deleting..." : "Delete All Records"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Records by Date Range Dialog */}
      <Dialog open={isDeleteRangeDialogOpen} onOpenChange={setDeleteRangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Records by Date Range</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Select a date range to delete {activeTab === "higher" ? "Higher Education" : "Basic Education"} time
              records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-range" className="text-base font-medium">
                Date Range
              </Label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-base">
                Warning: All {activeTab === "higher" ? "Higher Education" : "Basic Education"} records within the
                selected date range will be permanently deleted.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRangeDialogOpen(false)}
              disabled={isDeleting}
              className="text-base"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRecordsByRange}
              disabled={isDeleting || !dateRange?.from || !dateRange?.to}
              className="text-base"
            >
              {isDeleting ? "Deleting..." : "Delete Records"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
