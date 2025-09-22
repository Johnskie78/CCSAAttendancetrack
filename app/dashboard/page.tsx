import Nav from "@/components/nav"
import Header from "@/components/header"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AdminScannerContainer from "@/components/admin-scanner-container"
import DashboardStats from "@/components/dashboard-stats"

export default function DashboardPage() {
  return (
    <ProtectedRoute adminOnly={false}>
      <main className="min-h-screen flex flex-col">
        <Header />
        <Nav />

        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

            <div className="mb-8">
              <DashboardStats />
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">QR Scanner</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminScannerContainer />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Quick Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg mb-4">Welcome to the Student Time Tracking System.</p>
                  <p className="text-base text-gray-700">
                    Use the navigation above to access different sections of the application. The public scanner is
                    available to all users without login.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-base">
                    <li className="flex items-center">
                      <span className="w-32 font-medium">Scanner:</span>
                      <span>Public access</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-32 font-medium">Students:</span>
                      <span>Admin only</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-32 font-medium">Records:</span>
                      <span>Admin only</span>
                    </li>
                    <li className="flex items-center">
                      <span className="w-32 font-medium">Reports:</span>
                      <span>Admin only</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
