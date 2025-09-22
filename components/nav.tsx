"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Clock, Users, BarChart, QrCode, UserCog, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function Nav() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("")
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    // Set active tab based on current path
    if (pathname === "/dashboard") {
      setActiveTab("dashboard")
    } else if (pathname === "/students") {
      setActiveTab("students")
    } else if (pathname === "/records") {
      setActiveTab("records")
    } else if (pathname === "/reports") {
      setActiveTab("reports")
    } else if (pathname === "/admin") {
      setActiveTab("admin")
    } else if (pathname === "/scanner") {
      setActiveTab("scanner")
    } else if (pathname === "/batch-operations") {
      setActiveTab("batch-operations")
    }
  }, [pathname])

  return (
    <div className="bg-white border-b shadow-sm overflow-x-auto">
      <div className="container mx-auto flex justify-center">
        <div className="flex space-x-1 p-1">
          <Link href="/scanner" passHref>
            <Button
              variant={activeTab === "scanner" ? "default" : "ghost"}
              className="flex items-center text-base"
              onClick={() => setActiveTab("scanner")}
            >
              <QrCode className="mr-2 h-5 w-5" />
              Scanner
            </Button>
          </Link>

          <Link href="/dashboard" passHref>
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="flex items-center text-base"
              onClick={() => setActiveTab("dashboard")}
            >
              <QrCode className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>

          {isAdmin && (
            <>
              <Link href="/students" passHref>
                <Button
                  variant={activeTab === "students" ? "default" : "ghost"}
                  className="flex items-center text-base"
                  onClick={() => setActiveTab("students")}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Students
                </Button>
              </Link>
              <Link href="/records" passHref>
                <Button
                  variant={activeTab === "records" ? "default" : "ghost"}
                  className="flex items-center text-base"
                  onClick={() => setActiveTab("records")}
                >
                  <Clock className="mr-2 h-5 w-5" />
                  Records
                </Button>
              </Link>
              <Link href="/reports" passHref>
                <Button
                  variant={activeTab === "reports" ? "default" : "ghost"}
                  className="flex items-center text-base"
                  onClick={() => setActiveTab("reports")}
                >
                  <BarChart className="mr-2 h-5 w-5" />
                  Reports
                </Button>
              </Link>
              <Link href="/batch-operations" passHref>
                <Button
                  variant={activeTab === "batch-operations" ? "default" : "ghost"}
                  className="flex items-center text-base"
                  onClick={() => setActiveTab("batch-operations")}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Batch Operations
                </Button>
              </Link>
              <Link href="/admin" passHref>
                <Button
                  variant={activeTab === "admin" ? "default" : "ghost"}
                  className="flex items-center text-base"
                  onClick={() => setActiveTab("admin")}
                >
                  <UserCog className="mr-2 h-5 w-5" />
                  Admin
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
