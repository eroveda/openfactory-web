import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Box, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useAuthStore } from "../../store/authStore";
import { useMe } from "../../hooks/useWorkpacks";
import { userApi } from "../../lib/api";
import { toast } from "sonner";

function userInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function Profile() {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useMe();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await userApi.update({ name: name.trim() });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.name ?? user?.user_metadata?.full_name ?? user?.email ?? "User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" /> Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Box className="size-5 text-blue-600" />
              <span className="font-semibold">openFactory</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Profile</h1>
          <p className="text-slate-600">Manage your account details</p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your display name</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    {avatarUrl && <AvatarImage src={avatarUrl} />}
                    <AvatarFallback className="bg-blue-600 text-white text-xl">
                      {userInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{displayName}</p>
                    <p className="text-sm text-slate-500">{profile?.email ?? user?.email}</p>
                  </div>
                </div>

                <div className="grid gap-2 max-w-sm">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                    placeholder="Your name"
                  />
                </div>

                <div className="grid gap-2 max-w-sm">
                  <Label>Email</Label>
                  <Input value={profile?.email ?? user?.email ?? ""} disabled />
                  <p className="text-xs text-slate-500">Email is managed by your OAuth provider</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan</CardTitle>
                <CardDescription>Your current subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Free Plan</p>
                    <p className="text-sm text-slate-600">Unlimited workspaces during beta</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Link to="/dashboard">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
