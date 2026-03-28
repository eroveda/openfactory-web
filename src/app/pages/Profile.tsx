import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Box, ArrowLeft, Loader2, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useAuthStore } from "../../store/authStore";
import { useMe } from "../../hooks/useWorkpacks";
import { userApi } from "../../lib/api";
import { supabase } from "../../lib/supabase";
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Only PNG, JPEG, or WebP images are supported");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `avatars/${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl },
      });
      if (updateError) throw new Error(updateError.message);
      toast.success("Avatar updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
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
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Avatar className="size-16">
                      {avatarUrl && <AvatarImage src={avatarUrl} />}
                      <AvatarFallback className="bg-blue-600 text-white text-xl">
                        {userInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingAvatar
                        ? <Loader2 className="size-5 text-white animate-spin" />
                        : <Camera className="size-5 text-white" />
                      }
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{displayName}</p>
                    <p className="text-sm text-slate-500">{profile?.email ?? user?.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click avatar to change photo</p>
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
