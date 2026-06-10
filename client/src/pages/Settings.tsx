import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { Settings as SettingsIcon, User, Bell, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function SettingsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "api">("profile");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </div>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "notifications"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </div>
              </button>
              <button
                onClick={() => setActiveTab("api")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "api"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API & Usage
                </div>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      defaultValue={user?.name || ""}
                      className="border-border/50"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      defaultValue={user?.email || ""}
                      className="border-border/50"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Account Role</Label>
                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {user?.role || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user?.role === "admin"
                          ? "You have administrative access to the platform"
                          : "You have standard user access"}
                      </p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Member Since</Label>
                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm text-foreground">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Unknown"}
                      </p>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90">
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Control how you receive updates about your tasks and account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Task Notifications */}
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Task Updates</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when tasks complete or fail
                      </p>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive email summaries of your activity
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button onClick={handleSaveNotifications} className="bg-primary hover:bg-primary/90">
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* API & Usage Tab */}
            {activeTab === "api" && (
              <div className="space-y-6">
                {/* API Key */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>API Key</CardTitle>
                    <CardDescription>
                      Use this key to access the Elysium API programmatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20 font-mono text-sm break-all">
                      sk_live_1234567890abcdefghijklmnop
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard("sk_live_1234567890abcdefghijklmnop")}
                      >
                        Copy Key
                      </Button>
                      <Button variant="outline" className="text-destructive">
                        Regenerate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Statistics */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Usage Statistics</CardTitle>
                    <CardDescription>
                      Your API and platform usage this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                        <p className="text-sm text-muted-foreground">API Calls</p>
                        <p className="text-2xl font-bold text-foreground mt-2">1,234</p>
                        <p className="text-xs text-muted-foreground mt-1">of 10,000 limit</p>
                      </div>
                      <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                        <p className="text-sm text-muted-foreground">Tasks Executed</p>
                        <p className="text-2xl font-bold text-foreground mt-2">42</p>
                        <p className="text-xs text-muted-foreground mt-1">this month</p>
                      </div>
                      <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                        <p className="text-sm text-muted-foreground">Storage Used</p>
                        <p className="text-2xl font-bold text-foreground mt-2">2.3 GB</p>
                        <p className="text-xs text-muted-foreground mt-1">of 100 GB</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
