"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type User } from "@/lib/auth-context"
import Header from "@/components/header"
import Nav from "@/components/nav"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pencil, Trash2, Plus, AlertCircle, UserCog } from "lucide-react"

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <AdminManagement />
    </ProtectedRoute>
  )
}

function AdminManagement() {
  const {
    getAdminUsers,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    getCurrentUser,
    resetPasswordByAdminId,
    resetUsernameByAdminId,
  } = useAuth()
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    adminId: "",
    role: "admin" as "admin" | "user",
  })
  const router = useRouter()
  const loggedInUser = getCurrentUser()

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resetType, setResetType] = useState<"password" | "username">("password")
  const [resetAdminId, setResetAdminId] = useState("")
  const [resetValue, setResetValue] = useState("")
  const [resetError, setResetError] = useState<string | null>(null)

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const loadAdminUsers = () => {
    try {
      const users = getAdminUsers()
      setAdminUsers(users)
    } catch (error) {
      console.error("Error loading admin users:", error)
    }
  }

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

  const handleAddUser = async () => {
    try {
      setError(null)

      // Validate form
      if (!formData.username || !formData.password || !formData.name || !formData.email) {
        setError("All fields are required")
        return
      }

      await addAdminUser({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        adminId: formData.adminId,
        role: formData.role,
      })

      setIsAddDialogOpen(false)
      resetForm()
      loadAdminUsers()
    } catch (error: any) {
      setError(error.message || "Error adding user")
    }
  }

  const handleEditClick = (user: User) => {
    setCurrentUser(user)
    setFormData({
      username: user.username,
      password: "", // Don't show the password
      name: user.name,
      email: user.email,
      adminId: user.adminId,
      role: user.role as "admin" | "user",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!currentUser) return

    try {
      setError(null)

      // Validate form
      if (!formData.username || !formData.name || !formData.email) {
        setError("Username, name, and email are required")
        return
      }

      const updatedUser: User = {
        ...currentUser,
        username: formData.username,
        name: formData.name,
        email: formData.email,
        adminId: formData.adminId,
        role: formData.role,
      }

      // Only update password if provided
      if (formData.password) {
        updatedUser.password = formData.password
      }

      await updateAdminUser(updatedUser)
      setIsEditDialogOpen(false)
      resetForm()
      loadAdminUsers()
    } catch (error: any) {
      setError(error.message || "Error updating user")
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      if (confirm("Are you sure you want to delete this user?")) {
        await deleteAdminUser(id)
        loadAdminUsers()
      }
    } catch (error: any) {
      alert(error.message || "Error deleting user")
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      adminId: "",
      role: "admin",
    })
    setError(null)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleResetOpen = (type: "password" | "username") => {
    setResetType(type)
    setResetAdminId("")
    setResetValue("")
    setResetError(null)
    setIsResetDialogOpen(true)
  }

  const handleResetSubmit = async () => {
    try {
      setResetError(null)

      if (!resetAdminId || !resetValue) {
        setResetError("All fields are required")
        return
      }

      if (resetType === "password") {
        await resetPasswordByAdminId(resetAdminId, resetValue)
        alert("Password has been reset successfully")
      } else {
        await resetUsernameByAdminId(resetAdminId, resetValue)
        alert("Username has been reset successfully")
      }

      setIsResetDialogOpen(false)
      loadAdminUsers()
    } catch (error: any) {
      setResetError(error.message || `Error resetting ${resetType}`)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <Nav />

      <div className="flex-1 p-6 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Admin Management</h2>
              <p className="text-gray-700 text-lg">Manage administrator accounts</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleResetOpen("username")}
                variant="outline"
                size="lg"
                className="text-base font-medium"
              >
                Reset Username
              </Button>
              <Button
                onClick={() => handleResetOpen("password")}
                variant="outline"
                size="lg"
                className="text-base font-medium"
              >
                Reset Password
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="text-base font-medium">
                <Plus className="mr-2 h-5 w-5" />
                Add Admin
              </Button>
            </div>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Administrators</CardTitle>
              <CardDescription className="text-base text-gray-700">
                Users with administrative access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base font-semibold">User</TableHead>
                    <TableHead className="text-base font-semibold">Username</TableHead>
                    <TableHead className="text-base font-semibold">Admin ID</TableHead>
                    <TableHead className="text-base font-semibold">Email</TableHead>
                    <TableHead className="text-base font-semibold">Role</TableHead>
                    <TableHead className="text-right text-base font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground text-base">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-base">{user.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-base">{user.username}</TableCell>
                      <TableCell className="text-base">{user.adminId}</TableCell>
                      <TableCell className="text-base">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <UserCog className="h-5 w-5 text-primary mr-2" />
                          <span className="capitalize text-base">{user.role}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          title="Edit User"
                          className="mr-2 text-base"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {user.id !== loggedInUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete User"
                            className="text-red-600 border-red-200 hover:bg-red-50 text-base"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Administrator</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base">{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-medium">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminId" className="text-base font-medium">
                Admin ID
              </Label>
              <Input
                id="adminId"
                name="adminId"
                value={formData.adminId}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-base font-medium">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger className="text-base h-11">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="text-base">
                    Administrator
                  </SelectItem>
                  <SelectItem value="user" className="text-base">
                    User
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Button onClick={handleAddUser} className="text-base">
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Administrator</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base">{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-base font-medium">
                Full Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username" className="text-base font-medium">
                Username
              </Label>
              <Input
                id="edit-username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-adminId" className="text-base font-medium">
                Admin ID
              </Label>
              <Input
                id="edit-adminId"
                name="adminId"
                value={formData.adminId}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-base font-medium">
                Email
              </Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password" className="text-base font-medium">
                Password (leave blank to keep current)
              </Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-base font-medium">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger className="text-base h-11">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="text-base">
                    Administrator
                  </SelectItem>
                  <SelectItem value="user" className="text-base">
                    User
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Button onClick={handleUpdateUser} className="text-base">
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Reset {resetType === "password" ? "Password" : "Username"}</DialogTitle>
          </DialogHeader>
          {resetError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base">{resetError}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-adminId" className="text-base font-medium">
                Admin ID
              </Label>
              <Input
                id="reset-adminId"
                value={resetAdminId}
                onChange={(e) => setResetAdminId(e.target.value)}
                className="text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-value" className="text-base font-medium">
                New {resetType === "password" ? "Password" : "Username"}
              </Label>
              <Input
                id="reset-value"
                type={resetType === "password" ? "password" : "text"}
                value={resetValue}
                onChange={(e) => setResetValue(e.target.value)}
                className="text-base h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} className="text-base">
              Cancel
            </Button>
            <Button onClick={handleResetSubmit} className="text-base">
              Reset {resetType === "password" ? "Password" : "Username"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

