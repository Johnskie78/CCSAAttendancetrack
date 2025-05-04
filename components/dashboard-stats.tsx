"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStudentStatistics, type StudentStats } from "@/lib/db"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Loader2 } from "lucide-react"
import { HIGHER_EDUCATION_PROGRAMS } from "@/lib/education-programs"

const COLORS = [
  "#4f46e5", // indigo-600
  "#0891b2", // cyan-600
  "#0d9488", // teal-600
  "#16a34a", // green-600
  "#ca8a04", // yellow-600
  "#ea580c", // orange-600
  "#dc2626", // red-600
  "#c026d3", // fuchsia-600
  "#9333ea", // purple-600
  "#2563eb", // blue-600
  "#059669", // emerald-600
  "#65a30d", // lime-600
  "#d97706", // amber-600
  "#db2777", // pink-600
  "#7c3aed", // violet-600
]

export default function DashboardStats() {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const loadStats = async () => {
      try {
        const studentStats = await getStudentStatistics()
        setStats(studentStats)
      } catch (error) {
        console.error("Error loading student statistics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  // Format data for charts
  const getProgramChartData = () => {
    if (!stats) return []

    return Object.entries(stats.programCounts)
      .map(([program, count], index) => {
        const programInfo = HIGHER_EDUCATION_PROGRAMS.find((p) => p.code === program)
        return {
          name: programInfo ? `${programInfo.name} (${program})` : program,
          students: count,
          fill: COLORS[index % COLORS.length],
        }
      })
      .sort((a, b) => b.students - a.students) // Sort by count descending
  }

  const getYearLevelChartData = () => {
    if (!stats) return []

    const yearLevels = ["1st", "2nd", "3rd", "4th", "5th"]
    return yearLevels.map((year) => ({
      name: `${year} Year`,
      students: stats.yearLevelCounts[year] || 0,
    }))
  }

  const getGradeLevelChartData = () => {
    if (!stats) return []

    return Object.entries(stats.gradeLevelCounts)
      .map(([level, count]) => ({
        name: level,
        students: count,
      }))
      .sort((a, b) => {
        // Custom sort for grade levels
        const aNum = Number.parseInt(a.name.replace(/\D/g, ""))
        const bNum = Number.parseInt(b.name.replace(/\D/g, ""))
        return aNum - bNum
      })
  }

  const getSchoolDistributionData = () => {
    if (!stats) return []

    return [
      { name: "Higher Education", value: stats.higherEducationCount },
      { name: "Basic Education", value: stats.basicEducationCount },
    ]
  }

  const getSemesterDistributionData = () => {
    if (!stats) return []

    return Object.entries(stats.semesterCounts).map(([semester, count]) => ({
      name: semester,
      value: count,
    }))
  }

  const getMajorDistributionData = () => {
    if (!stats) return []

    return Object.entries(stats.majorCounts)
      .map(([major, count]) => ({
        name: major,
        value: count,
      }))
      .sort((a, b) => b.value - a.value) // Sort by count descending
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading statistics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalStudents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-500">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.activeStudents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-500">Higher Education</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.higherEducationCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-500">Basic Education</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.basicEducationCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-base py-3">
            Overview
          </TabsTrigger>
          <TabsTrigger value="programs" className="text-base py-3">
            Programs
          </TabsTrigger>
          <TabsTrigger value="levels" className="text-base py-3">
            Year/Grade Levels
          </TabsTrigger>
          <TabsTrigger value="details" className="text-base py-3">
            Detailed Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getSchoolDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getSchoolDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Distribution by Program</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getProgramChartData()}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
                  <Legend />
                  <Bar dataKey="students" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Higher Education - Year Levels</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getYearLevelChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
                    <Legend />
                    <Bar dataKey="students" name="Students" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Basic Education - Grade Levels</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGradeLevelChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
                    <Legend />
                    <Bar dataKey="students" name="Students" fill="#9333ea" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Semester Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getSemesterDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getSemesterDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Major Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getMajorDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getMajorDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

