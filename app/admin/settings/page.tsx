"use client";

import { useState, useEffect, type FormEvent, useRef } from "react";
import { fileToBase64, uploadsUrl } from "@/lib/api";
import { updateMe, changePassword } from "@/lib/api/auth";
import type { ChangePasswordRequest, UpdateProfileRequest } from "@/lib/types";
import { useToast } from "@/components/toast";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Eye, EyeOff, Camera, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UpdateProfileRequest>(() => ({
    fullName: (user?.fullName || "").trim(),
    phone: (user?.phone || "").trim() || null,
    storeName: (user?.storeName || "").trim() || null,
  }));
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize profile and photo when user loads
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: (user.fullName || "").trim(),
        phone: (user.phone || "").trim() || null,
        storeName: (user.storeName || "").trim() || null,
      });
      if (user.photoPath) {
        setPhotoPreview(uploadsUrl(user.photoPath));
      }
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = (user?.fullName || user?.username || "?").slice(0, 2).toUpperCase();
  const avatarSrc = photoPreview ?? undefined;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile.fullName.trim()) {
      toast("Full name is required", "err");
      return;
    }
    setProfileBusy(true);
    try {
      const body: UpdateProfileRequest = {
        fullName: profile.fullName.trim(),
        phone: profile.phone?.trim() || null,
        storeName: profile.storeName?.trim() || null,
        photo: photoFile ? await fileToBase64(photoFile) : null,
      };
      await updateMe(body);
      await refreshUser();
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Photo preview updates automatically via the user effect below.
      toast("Profile saved", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "err");
    } finally {
      setProfileBusy(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function removePhoto() {
    setUploading(true);
    try {
      await updateMe({
        fullName: profile.fullName.trim(),
        phone: profile.phone?.trim() || null,
        storeName: profile.storeName?.trim() || null,
        photo: "",
      } satisfies UpdateProfileRequest);
      await refreshUser();
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast("Photo removed", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    } finally {
      setUploading(false);
    }
  }

  async function changePasswordHandler(e: FormEvent) {
    e.preventDefault();
    if (!pw.current || !pw.next || !pw.confirm) {
      toast("Fill in all password fields", "err");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast("New passwords do not match", "err");
      return;
    }
    if (pw.next.length < 8) {
      toast("New password must be at least 8 characters", "err");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword({
        currentPassword: pw.current,
        newPassword: pw.next,
        confirmPassword: pw.confirm,
      } satisfies ChangePasswordRequest);
      setPw({ current: "", next: "", confirm: "" });
      setShowCurrent(false);
      setShowNext(false);
      setShowConfirm(false);
      toast("Password updated successfully", "ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast(msg, "err");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Profile and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex flex-col items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <Avatar src={avatarSrc} fallback={initials} className="w-20 h-20 text-lg" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="profile-photo-input"
                />
                <div className="flex gap-2 mt-2">
                  <label htmlFor="profile-photo-input">
                    <Button variant="outline" size="sm" type="button" className="gap-1.5">
                      <Camera size={14} /> Change photo
                    </Button>
                  </label>
                  {photoPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={removePhoto}
                      disabled={uploading}
                      className="gap-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 size={14} /> Remove photo
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Full name</label>
                <Input
                  required
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
                <Input
                  value={profile.phone ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Store name</label>
                <Input
                  value={profile.storeName ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, storeName: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={profileBusy} className="w-full">
                {profileBusy ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePasswordHandler} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Current password</label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    value={pw.current}
                    onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">New password</label>
                <div className="relative">
                  <Input
                    type={showNext ? "text" : "password"}
                    autoComplete="new-password"
                    value={pw.next}
                    onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNext((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showNext ? "Hide password" : "Show password"}
                  >
                    {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Confirm new password</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={pw.confirm}
                    onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={pwBusy} className="w-full">
                {pwBusy ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
