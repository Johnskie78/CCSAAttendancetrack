"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getStudentsBySchool,
  countStudentsBySchool,
  addStudent,
  updateStudent,
  deleteStudent,
  countStudents,
  type Student,
  getStudentByStudentId,
} from "@/lib/db"
import { readFileAsDataURL } from "@/lib/qr-utils"
import {
  Pencil,
  Trash2,
  Plus,
  UserCheck,
  UserX,
  QrCode,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  School,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import QRCodeGenerator from "./qr-code-generator"
import { Card, CardContent } from "@/components/ui/card"
import {
  BASIC_EDUCATION_LEVELS,
  HIGHER_EDUCATION_PROGRAMS,
  getMajorsForProgram,
  formatEducationInfo,
} from "@/lib/education-programs"

export default function StudentManagement() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<"higher" | "basic">("higher")

  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [totalStudentCount, setTotalStudentCount] = useState(0)
  const [higherEdCount, setHigherEdCount] = useState(0)
  const [basicEdCount, setBasicEdCount] = useState(0)
  const studentsPerPage = 20 // Increased for better performance with large datasets

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    studentId: "",
    yearLevel: "",
    course: "",
    school: "Higher Education" as "Higher Education" | "Basic Education",
    program: "",
    major: "",
    semester: "",
    gradeLevel: "",
    status: "active",
    photoUrl: "",
  })

  // Add error state for form validation
  const [formError, setFormError] = useState<string | null>(null)

  // Get available majors based on selected program
  const availableMajors = useMemo(() => {
    if (formData.school !== "Higher Education" || !formData.program) return []
    return getMajorsForProgram(formData.program)
  }, [formData.school, formData.program])

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadStudentCounts()
    setCurrentPage(1) // Reset to first page when tab changes
  }, [activeTab])

  useEffect(() => {
    loadStudents()
  }, [currentPage, activeTab])

  useEffect(() => {
    if (searchQuery || statusFilter !== "all") {
      // If filters are applied, load all students and filter in memory
      loadAllStudentsAndFilter()
    } else {
      // Otherwise, use pagination
      loadStudents()
    }
  }, [searchQuery, statusFilter, activeTab])

  // Reset dependent fields when school changes
  useEffect(() => {
    if (formData.school === "Higher Education") {
      setFormData((prev) => ({
        ...prev,
        gradeLevel: "",
        program: prev.program || "",
        major: prev.major || "",
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        program: "",
        major: "",
        semester: "",
        gradeLevel: prev.gradeLevel || "",
      }))
    }
  }, [formData.school])

  // Reset major when program changes
  useEffect(() => {
    if (formData.program) {
      const program = HIGHER_EDUCATION_PROGRAMS.find((p) => p.code === formData.program)
      if (!program?.hasMajors) {
        setFormData((prev) => ({
          ...prev,
          major: "",
        }))
      }
    }
  }, [formData.program])

  // Set initial form data school based on active tab
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      school: activeTab === "higher" ? "Higher Education" : "Basic Education",
    }))
  }, [activeTab])

  const loadStudentCounts = async () => {
    try {
      const totalCount = await countStudents()
      const higherCount = await countStudentsBySchool("Higher Education")
      const basicCount = await countStudentsBySchool("Basic Education")

      setTotalStudentCount(totalCount)
      setHigherEdCount(higherCount)
      setBasicEdCount(basicCount)
    } catch (error) {
      console.error("Error loading student counts:", error)
    }
  }

  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const school = activeTab === "higher" ? "Higher Education" : "Basic Education"
      const studentList = await getStudentsBySchool(school, currentPage, studentsPerPage)
      setStudents(studentList)
      setFilteredStudents(studentList)
    } catch (error) {
      console.error("Error loading students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllStudentsAndFilter = async () => {
    setIsLoading(true)
    try {
      const school = activeTab === "higher" ? "Higher Education" : "Basic Education"
      const allStudents = await getStudentsBySchool(school)
      setStudents(allStudents)
      filterStudents(allStudents)
    } catch (error) {
      console.error("Error loading all students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterStudents = (studentList = students) => {
    let result = [...studentList]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (student) =>
          student.firstName.toLowerCase().includes(query) ||
          student.lastName.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query) ||
          student.course?.toLowerCase().includes(query) ||
          student.program?.toLowerCase().includes(query) ||
          student.major?.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((student) => student.status === statusFilter)
    }

    setFilteredStudents(result)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Calculate pagination
  const totalPages = useMemo(() => {
    const relevantCount = activeTab === "higher" ? higherEdCount : basicEdCount

    if (searchQuery || statusFilter !== "all") {
      return Math.ceil(filteredStudents.length / studentsPerPage)
    } else {
      return Math.ceil(relevantCount / studentsPerPage)
    }
  }, [filteredStudents.length, studentsPerPage, searchQuery, statusFilter, higherEdCount, basicEdCount, activeTab])

  const paginatedStudents = useMemo(() => {
    if (searchQuery || statusFilter !== "all") {
      // If filtering, paginate the filtered results in memory
      const startIndex = (currentPage - 1) * studentsPerPage
      return filteredStudents.slice(startIndex, startIndex + studentsPerPage)
    }
    // Otherwise, we're already getting paginated results from the database
    return filteredStudents
  }, [filteredStudents, currentPage, studentsPerPage, searchQuery, statusFilter])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Check file size (limit to 2MB)
        if (file.size > 2 * 1024 * 1024) {
          alert("Image size should be less than 2MB")
          return
        }

        const dataUrl = await readFileAsDataURL(file)
        setFormData({
          ...formData,
          photoUrl: dataUrl,
        })
      } catch (error) {
        console.error("Error reading file:", error)
      }
    }
  }

  // Update the handleAddStudent function to check for existing student IDs
  const handleAddStudent = async () => {
    try {
      setFormError(null)

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.studentId) {
        setFormError("First name, last name, and student ID are required")
        return
      }

      // Check if student ID already exists
      const existingStudent = await getStudentByStudentId(formData.studentId)
      if (existingStudent) {
        setFormError(`A student with ID ${formData.studentId} already exists`)
        return
      }

      const newStudent: Student = {
        id: uuidv4(),
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        studentId: formData.studentId,
        yearLevel: formData.yearLevel,
        course: formData.course,
        school: formData.school,
        program: formData.program,
        major: formData.major,
        semester: formData.semester,
        gradeLevel: formData.gradeLevel,
        status: formData.status as "active" | "inactive",
        photoUrl: formData.photoUrl || "/placeholder.svg?height=100&width=100",
      }

      await addStudent(newStudent)
      setIsAddDialogOpen(false)
      resetForm()
      loadStudentCounts()
      loadStudents()
    } catch (error) {
      console.error("Error adding student:", error)
      setFormError("An error occurred while adding the student")
    }
  }

  // Update the handleUpdateStudent function to check for existing student IDs
  const handleUpdateStudent = async () => {
    if (!currentStudent) return

    try {
      setFormError(null)

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.studentId) {
        setFormError("First name, last name, and student ID are required")
        return
      }

      // Check if student ID already exists and belongs to a different student
      if (formData.studentId !== currentStudent.studentId) {
        const existingStudent = await getStudentByStudentId(formData.studentId)
        if (existingStudent && existingStudent.id !== currentStudent.id) {
          setFormError(`A student with ID ${formData.studentId} already exists`)
          return
        }
      }

      const updatedStudent: Student = {
        ...currentStudent,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        studentId: formData.studentId,
        yearLevel: formData.yearLevel,
        course: formData.course,
        school: formData.school,
        program: formData.program,
        major: formData.major,
        semester: formData.semester,
        gradeLevel: formData.gradeLevel,
        status: formData.status as "active" | "inactive",
        photoUrl: formData.photoUrl || currentStudent.photoUrl,
      }

      await updateStudent(updatedStudent)
      setIsEditDialogOpen(false)
      setCurrentStudent(null)
      resetForm()

      // Reload the current page of students
      if (searchQuery || statusFilter !== "all") {
        loadAllStudentsAndFilter()
      } else {
        loadStudents()
      }
    } catch (error) {
      console.error("Error updating student:", error)
      setFormError("An error occurred while updating the student")
    }
  }

  // Add resetForm function to also clear form errors
  const resetForm = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      studentId: "",
      yearLevel: "",
      course: "",
      school: activeTab === "higher" ? "Higher Education" : "Basic Education",
      program: "",
      major: "",
      semester: "",
      gradeLevel: "",
      status: "active",
      photoUrl: "",
    })
    setFormError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent(id)
        loadStudentCounts()

        // Reload the current page of students
        if (searchQuery || statusFilter !== "all") {
          loadAllStudentsAndFilter()
        } else {
          loadStudents()
        }
      } catch (error) {
        console.error("Error deleting student:", error)
      }
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleQRCodeClick = (student: Student) => {
    setCurrentStudent(student)
    setIsQRDialogOpen(true)
  }

  const handleEditClick = (student: Student) => {
    setCurrentStudent(student)
    setFormData({
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      studentId: student.studentId,
      yearLevel: student.yearLevel,
      course: student.course,
      school: student.school,
      program: student.program,
      major: student.major,
      semester: student.semester,
      gradeLevel: student.gradeLevel,
      status: student.status,
      photoUrl: student.photoUrl,
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="text-base font-medium">
              <Plus className="mr-2 h-5 w-5" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Student</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{formError}</div>
              )}
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={formData.photoUrl || "/placeholder.svg?height=100&width=100"}
                      alt="Student photo"
                    />
                    <AvatarFallback className="text-lg">
                      {formData.firstName && formData.lastName
                        ? getInitials(formData.firstName, formData.lastName)
                        : "ST"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-base font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="text-base h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-base font-medium">
                    Middle Name
                  </Label>
                  <Input
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="text-base h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-base font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="text-base h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-base font-medium">
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className="text-base h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school" className="text-base font-medium">
                  School
                </Label>
                <Select value={formData.school} onValueChange={(value) => handleSelectChange("school", value)}>
                  <SelectTrigger className="text-base h-11">
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Higher Education" className="text-base">
                      Higher Education
                    </SelectItem>
                    <SelectItem value="Basic Education" className="text-base">
                      Basic Education
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.school === "Higher Education" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="program" className="text-base font-medium">
                      Program
                    </Label>
                    <Select value={formData.program} onValueChange={(value) => handleSelectChange("program", value)}>
                      <SelectTrigger className="text-base h-11">
                        <SelectValue placeholder="Select Program" />
                      </SelectTrigger>
                      <SelectContent>
                        {HIGHER_EDUCATION_PROGRAMS.map((program) => (
                          <SelectItem key={program.code} value={program.code} className="text-base">
                            {program.name} ({program.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.program && availableMajors.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="major" className="text-base font-medium">
                        Major
                      </Label>
                      <Select value={formData.major} onValueChange={(value) => handleSelectChange("major", value)}>
                        <SelectTrigger className="text-base h-11">
                          <SelectValue placeholder="Select Major" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMajors.map((major) => (
                            <SelectItem key={major} value={major} className="text-base">
                              {major}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="yearLevel" className="text-base font-medium">
                      Year Level
                    </Label>
                    <Select
                      value={formData.yearLevel}
                      onValueChange={(value) => handleSelectChange("yearLevel", value)}
                    >
                      <SelectTrigger className="text-base h-11">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st" className="text-base">
                          1st Year
                        </SelectItem>
                        <SelectItem value="2nd" className="text-base">
                          2nd Year
                        </SelectItem>
                        <SelectItem value="3rd" className="text-base">
                          3rd Year
                        </SelectItem>
                        <SelectItem value="4th" className="text-base">
                          4th Year
                        </SelectItem>
                        <SelectItem value="5th" className="text-base">
                          5th Year
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester" className="text-base font-medium">
                      Semester
                    </Label>
                    <Select value={formData.semester} onValueChange={(value) => handleSelectChange("semester", value)}>
                      <SelectTrigger className="text-base h-11">
                        <SelectValue placeholder="Select Semester" />
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
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel" className="text-base font-medium">
                    Grade Level
                  </Label>
                  <Select
                    value={formData.gradeLevel}
                    onValueChange={(value) => handleSelectChange("gradeLevel", value)}
                  >
                    <SelectTrigger className="text-base h-11">
                      <SelectValue placeholder="Select Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {BASIC_EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level} className="text-base">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status" className="text-base font-medium">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger className="text-base h-11">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-base">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="text-base">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formError && <div className="text-red-500 text-sm">{formError}</div>}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsAddDialogOpen(false)
                }}
                className="text-base"
              >
                Cancel
              </Button>
              <Button onClick={handleAddStudent} className="text-base">
                Add Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "higher" | "basic")}>
        <TabsList className="grid grid-cols-2 w-[400px] mb-6">
          <TabsTrigger value="higher" className="flex items-center">
            <GraduationCap className="mr-2 h-4 w-4" />
            Higher Education ({higherEdCount})
          </TabsTrigger>
          <TabsTrigger value="basic" className="flex items-center">
            <School className="mr-2 h-4 w-4" />
            Basic Education ({basicEdCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="higher" className="space-y-6">
          {renderStudentTable("Higher Education")}
        </TabsContent>

        <TabsContent value="basic" className="space-y-6">
          {renderStudentTable("Basic Education")}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Student</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{formError}</div>
            )}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.photoUrl || "/placeholder.svg?height=100&width=100"} alt="Student photo" />
                  <AvatarFallback className="text-lg">
                    {formData.firstName && formData.lastName
                      ? getInitials(formData.firstName, formData.lastName)
                      : "ST"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName" className="text-base font-medium">
                  First Name
                </Label>
                <Input
                  id="edit-firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="text-base h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-middleName" className="text-base font-medium">
                  Middle Name
                </Label>
                <Input
                  id="edit-middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="text-base h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName" className="text-base font-medium">
                Last Name
              </Label>
              <Input
                id="edit-lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-studentId" className="text-base font-medium">
                Student ID
              </Label>
              <Input
                id="edit-studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-school" className="text-base font-medium">
                School
              </Label>
              <Select value={formData.school} onValueChange={(value) => handleSelectChange("school", value)}>
                <SelectTrigger className="text-base h-11">
                  <SelectValue placeholder="Select School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Higher Education" className="text-base">
                    Higher Education
                  </SelectItem>
                  <SelectItem value="Basic Education" className="text-base">
                    Basic Education
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.school === "Higher Education" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-program" className="text-base font-medium">
                    Program
                  </Label>
                  <Select value={formData.program} onValueChange={(value) => handleSelectChange("program", value)}>
                    <SelectTrigger className="text-base h-11">
                      <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent>
                      {HIGHER_EDUCATION_PROGRAMS.map((program) => (
                        <SelectItem key={program.code} value={program.code} className="text-base">
                          {program.name} ({program.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.program && availableMajors.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-major" className="text-base font-medium">
                      Major
                    </Label>
                    <Select value={formData.major} onValueChange={(value) => handleSelectChange("major", value)}>
                      <SelectTrigger className="text-base h-11">
                        <SelectValue placeholder="Select Major" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMajors.map((major) => (
                          <SelectItem key={major} value={major} className="text-base">
                            {major}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-yearLevel" className="text-base font-medium">
                    Year Level
                  </Label>
                  <Select value={formData.yearLevel} onValueChange={(value) => handleSelectChange("yearLevel", value)}>
                    <SelectTrigger className="text-base h-11">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st" className="text-base">
                        1st Year
                      </SelectItem>
                      <SelectItem value="2nd" className="text-base">
                        2nd Year
                      </SelectItem>
                      <SelectItem value="3rd" className="text-base">
                        3rd Year
                      </SelectItem>
                      <SelectItem value="4th" className="text-base">
                        4th Year
                      </SelectItem>
                      <SelectItem value="5th" className="text-base">
                        5th Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-semester" className="text-base font-medium">
                    Semester
                  </Label>
                  <Select value={formData.semester} onValueChange={(value) => handleSelectChange("semester", value)}>
                    <SelectTrigger className="text-base h-11">
                      <SelectValue placeholder="Select Semester" />
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
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-gradeLevel" className="text-base font-medium">
                  Grade Level
                </Label>
                <Select value={formData.gradeLevel} onValueChange={(value) => handleSelectChange("gradeLevel", value)}>
                  <SelectTrigger className="text-base h-11">
                    <SelectValue placeholder="Select Grade Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASIC_EDUCATION_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} className="text-base">
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-base font-medium">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger className="text-base h-11">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-base">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="text-base">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && <div className="text-red-500 text-sm">{formError}</div>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setIsEditDialogOpen(false)
              }}
              className="text-base"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStudent} className="text-base">
              Update Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Student QR Code</DialogTitle>
          </DialogHeader>
          {currentStudent && (
            <div className="py-4 flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-3 border-2 border-gray-200">
                <AvatarImage
                  src={currentStudent.photoUrl}
                  alt={`${currentStudent.firstName} ${currentStudent.lastName}`}
                />
                <AvatarFallback className="text-lg font-bold">
                  {getInitials(currentStudent.firstName, currentStudent.lastName)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-medium text-xl mb-1">{`${currentStudent.lastName}, ${currentStudent.firstName} ${currentStudent.middleName ? currentStudent.middleName.charAt(0) + "." : ""}`}</h3>
              <p className="text-gray-600 mb-1">{currentStudent.studentId}</p>
              <p className="text-gray-600 mb-4">{formatEducationInfo(currentStudent)}</p>
              <QRCodeGenerator
                value={currentStudent.studentId}
                label={`${currentStudent.firstName} ${currentStudent.lastName}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderStudentTable(schoolType: "Higher Education" | "Basic Education") {
    return (
      <>
        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${schoolType} students...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-base h-10"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter" className="whitespace-nowrap text-base font-medium">
                  Status:
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
                >
                  <SelectTrigger id="status-filter" className="text-base h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-base">
                      All
                    </SelectItem>
                    <SelectItem value="active" className="text-base">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="text-base">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-lg overflow-hidden shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base font-semibold">Photo</TableHead>
                <TableHead className="text-base font-semibold">Name</TableHead>
                <TableHead className="text-base font-semibold">ID</TableHead>
                <TableHead className="text-base font-semibold">Education</TableHead>
                <TableHead className="text-base font-semibold">Status</TableHead>
                <TableHead className="text-right text-base font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                    <p className="mt-2 text-base text-gray-600">Loading students...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-base">
                    {filteredStudents.length === 0 && students.length > 0 ? (
                      <div>
                        <p className="text-gray-600">No students match your search criteria.</p>
                        <Button
                          variant="link"
                          onClick={() => {
                            setSearchQuery("")
                            setStatusFilter("all")
                          }}
                          className="mt-2"
                        >
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-600">No {schoolType} students found. Add a student to get started.</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Avatar className="h-14 w-14 border-2 border-gray-200">
                        <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                        <AvatarFallback className="text-lg font-bold">
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-base">{`${student.lastName}, ${student.firstName} ${student.middleName ? student.middleName.charAt(0) + "." : ""}`}</div>
                    </TableCell>
                    <TableCell className="text-base font-medium">{student.studentId}</TableCell>
                    <TableCell className="text-base">{formatEducationInfo(student)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {student.status === "active" ? (
                          <>
                            <UserCheck className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-green-600 text-base font-medium">Active</span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-red-600 text-base font-medium">Inactive</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQRCodeClick(student)}
                        title="Generate QR Code"
                        className="mr-2 text-base"
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        QR Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(student)}
                        title="Edit Student"
                        className="mr-2 text-base"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        title="Delete Student"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-base"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {filteredStudents.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * studentsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(
                  currentPage * studentsPerPage,
                  searchQuery || statusFilter !== "all"
                    ? filteredStudents.length
                    : schoolType === "Higher Education"
                      ? higherEdCount
                      : basicEdCount,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {searchQuery || statusFilter !== "all"
                  ? filteredStudents.length
                  : schoolType === "Higher Education"
                    ? higherEdCount
                    : basicEdCount}
              </span>{" "}
              students
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Previous</span>
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <span className="mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }
}
