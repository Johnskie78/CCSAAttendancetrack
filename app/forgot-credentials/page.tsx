"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, KeyRound, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ForgotCredentialsPage() {
  const router = useRouter()
  const { findUserByAdminId, resetPasswordByAdminId, resetUsernameByAdminId } = useAuth()

  // Password reset states
  const [adminIdForPassword, setAdminIdForPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isPasswordResetting, setIsPasswordResetting] = useState(false)

  // Username reset states
  const [adminIdForUsername, setAdminIdForUsername] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null)
  const [isUsernameResetting, setIsUsernameResetting] = useState(false)

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    setIsPasswordResetting(true)

    try {
      // Validate inputs
      if (!adminIdForPassword.trim()) {
        throw new Error("Admin ID is required")
      }

      if (!newPassword.trim()) {
        throw new Error("New password is required")
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      // Check if admin ID exists
      const user = findUserByAdminId(adminIdForPassword)
      if (!user) {
        throw new Error("No user found with this Admin ID")
      }

      // Reset password
      await resetPasswordByAdminId(adminIdForPassword, newPassword)

      // Show success message
      setPasswordSuccess("Password has been reset successfully. You can now login with your new password.")

      // Clear form
      setAdminIdForPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      setPasswordError(error.message || "An error occurred while resetting password")
    } finally {
      setIsPasswordResetting(false)
    }
  }

  const handleUsernameReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameError(null)
    setUsernameSuccess(null)
    setIsUsernameResetting(true)

    try {
      // Validate inputs
      if (!adminIdForUsername.trim()) {
        throw new Error("Admin ID is required")
      }

      if (!newUsername.trim()) {
        throw new Error("New username is required")
      }

      if (newUsername.length < 3) {
        throw new Error("Username must be at least 3 characters long")
      }

      // Check if admin ID exists
      const user = findUserByAdminId(adminIdForUsername)
      if (!user) {
        throw new Error("No user found with this Admin ID")
      }

      // Reset username
      await resetUsernameByAdminId(adminIdForUsername, newUsername)

      // Show success message
      setUsernameSuccess("Username has been reset successfully. You can now login with your new username.")

      // Clear form
      setAdminIdForUsername("")
      setNewUsername("")
    } catch (error: any) {
      setUsernameError(error.message || "An error occurred while resetting username")
    } finally {
      setIsUsernameResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1">
          <Link href="/login" className="flex items-center text-primary hover:underline mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
          </Link>
          <CardTitle className="text-2xl font-bold text-center">Reset Credentials</CardTitle>
          <CardDescription className="text-center text-base">
            Use your Admin ID to reset your password or username
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="password">Reset Password</TabsTrigger>
              <TabsTrigger value="username">Reset Username</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              {passwordError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-base">{passwordError}</AlertDescription>
                </Alert>
              )}

              {passwordSuccess && (
                <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-base">{passwordSuccess}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminIdForPassword" className="text-base font-medium">
                    Admin ID
                  </Label>
                  <Input
                    id="adminIdForPassword"
                    type="text"
                    placeholder="Enter your Admin ID"
                    value={adminIdForPassword}
                    onChange={(e) => setAdminIdForPassword(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-base font-medium">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 mt-2 text-base font-medium" disabled={isPasswordResetting}>
                  {isPasswordResetting ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="username">
              {usernameError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-base">{usernameError}</AlertDescription>
                </Alert>
              )}

              {usernameSuccess && (
                <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-base">{usernameSuccess}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUsernameReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminIdForUsername" className="text-base font-medium">
                    Admin ID
                  </Label>
                  <Input
                    id="adminIdForUsername"
                    type="text"
                    placeholder="Enter your Admin ID"
                    value={adminIdForUsername}
                    onChange={(e) => setAdminIdForUsername(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUsername" className="text-base font-medium">
                    New Username
                  </Label>
                  <Input
                    id="newUsername"
                    type="text"
                    placeholder="Enter new username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 mt-2 text-base font-medium" disabled={isUsernameResetting}>
                  {isUsernameResetting ? "Resetting..." : "Reset Username"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <KeyRound className="h-4 w-4 mr-1" />
            <span>Your Admin ID was provided by your system administrator</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

