import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Camera, Save, User, Mail, Phone, Building2, Calendar, FileText, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import API from "@/api/api";

const MyProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    profilePicture: "",
    phoneNumber: "",
    email: "",
    department: "",
    year: "",
    bio: "",
  });

  const idNumber = localStorage.getItem("userIdNumber") || "";

  useEffect(() => {
    if (!idNumber) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [idNumber]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/user/profile/${encodeURIComponent(idNumber)}`);
      setProfile(res.data.profile);
      setFormData({
        profilePicture: res.data.profile.profilePicture || "",
        phoneNumber: res.data.profile.phoneNumber || "",
        email: res.data.profile.email || "",
        department: res.data.profile.department || "",
        year: res.data.profile.year || "",
        bio: res.data.profile.bio || "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, profilePicture: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await API.put(`/api/user/profile/${encodeURIComponent(idNumber)}`, formData);
      toast.success("Profile updated successfully!");
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      profilePicture: profile?.profilePicture || "",
      phoneNumber: profile?.phoneNumber || "",
      email: profile?.email || "",
      department: profile?.department || "",
      year: profile?.year || "",
      bio: profile?.bio || "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-2xl mx-auto glass-card p-10 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-2xl mx-auto glass-card p-10 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">Manage your personal information</p>
            </div>

            {/* Profile Card */}
            <Card className="glass-card border-none shadow-xl">
              <CardHeader className="text-center pb-4">
                {/* Profile Picture */}
                <div className="relative mx-auto w-32 h-32 mb-4">
                  <Avatar className="w-32 h-32 border-4 border-primary/20">
                    <AvatarImage src={formData.profilePicture || profile.profilePicture} />
                    <AvatarFallback className="text-3xl bg-primary/10">
                      {profile.fullName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {editing && (
                    <label
                      htmlFor="profile-upload"
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-all shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>

                <CardTitle className="text-2xl">{profile.fullName}</CardTitle>
                <p className="text-muted-foreground font-mono">{profile.idNumber}</p>
                <Badge
                  variant={profile.status === "APPROVED" ? "default" : "secondary"}
                  className="mt-2"
                >
                  {profile.status}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Organisation (Read-only) */}
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="w-4 h-4" />
                    Organisation
                  </Label>
                  <Input value={profile.organisation} disabled className="bg-muted/50" />
                </div>

                {/* Department */}
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building2 className="w-4 h-4" />
                    Department
                  </Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., Computer Science"
                    className={!editing ? "bg-muted/50" : ""}
                  />
                </div>

                {/* Year */}
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    Year
                  </Label>
                  <Input
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., 2nd Year, Final Year"
                    className={!editing ? "bg-muted/50" : ""}
                  />
                </div>

                {/* Email */}
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                    placeholder="your.email@example.com"
                    className={!editing ? "bg-muted/50" : ""}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={!editing}
                    placeholder="+91 XXXXX XXXXX"
                    className={!editing ? "bg-muted/50" : ""}
                  />
                </div>

                {/* Bio */}
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                    <FileText className="w-4 h-4" />
                    Bio
                  </Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!editing}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className={!editing ? "bg-muted/50" : ""}
                  />
                </div>

                {/* Validity Info (Read-only) */}
                {profile.status === "APPROVED" && (
                  <div className="bg-muted/40 p-4 rounded-xl">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valid From</p>
                        <p className="font-medium">
                          {new Date(profile.validFrom).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valid Until</p>
                        <p className="font-medium">
                          {new Date(profile.validUntil).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {!editing ? (
                    <>
                      <Button onClick={() => setEditing(true)} className="flex-1 btn-gradient">
                        <User className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/user/dashboard?id=" + idNumber)}
                        className="flex-1"
                      >
                        View Dashboard
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 btn-gradient"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="flex-1">
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Info Note */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Your profile information is private and only visible to you and administrators.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
