import StudentManagement from "@/components/student-management"
import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"

export default function StudentsPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <main className="min-h-screen flex flex-col">
        <Header />
        <Nav />

        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <StudentManagement />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

