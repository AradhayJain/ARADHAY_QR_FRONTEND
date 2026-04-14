import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Settings, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import API from "@/api/api";

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restrictionDuration, setRestrictionDuration] = useState<number>(10);
  const [originalDuration, setOriginalDuration] = useState<number>(10);
  const [flaggingWindow, setFlaggingWindow] = useState<number>(2);
  const [originalWindow, setOriginalWindow] = useState<number>(2);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/admin/settings/restriction");
      const duration = res.data.restrictionDurationMinutes;
      const window = res.data.flaggingWindowMinutes;
      
      setRestrictionDuration(duration);
      setOriginalDuration(duration);
      setFlaggingWindow(window);
      setOriginalWindow(window);
    } catch (err: any) {
      toast.error("Failed to load settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (flaggingWindow < 1 || flaggingWindow > 60) {
      toast.error("Flagging window must be between 1 and 60 minutes");
      return;
    }

    if (restrictionDuration === originalDuration && flaggingWindow === originalWindow) {
      toast.info("No changes to save");
      return;
    }

    try {
      setSaving(true);
      await API.put("/api/admin/settings/restriction", {
        durationMinutes: restrictionDuration,
        flaggingWindowMinutes: flaggingWindow,
      });

      setOriginalDuration(restrictionDuration);
      setOriginalWindow(flaggingWindow);
      toast.success("System settings updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update settings");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRestrictionDuration(originalDuration);
    setFlaggingWindow(originalWindow);
  };

  const hasChanges = restrictionDuration !== originalDuration || flaggingWindow !== originalWindow;

  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground mt-4">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">System Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure system-wide behavior and restrictions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Abuse Restriction</CardTitle>
          <CardDescription>
            Configure the temporary restriction duration applied when users perform rapid scans
            (IN and OUT within 1 minute)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              When a user scans IN and OUT within 1 minute, they will be temporarily restricted
              from scanning for the duration specified below.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Restriction Duration (minutes)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={120}
                  value={restrictionDuration}
                  onChange={(e) => setRestrictionDuration(parseInt(e.target.value) || 1)}
                  className="max-w-[200px]"
                  disabled={saving}
                />
                <span className="text-sm text-muted-foreground">
                  How long users are blocked after abuse (1-120 min)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="window">Abuse Detection Window (minutes)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="window"
                  type="number"
                  min={1}
                  max={60}
                  value={flaggingWindow}
                  onChange={(e) => setFlaggingWindow(parseInt(e.target.value) || 1)}
                  className="max-w-[200px]"
                  disabled={saving}
                />
                <span className="text-sm text-muted-foreground">
                  Time gap between OUT and IN scans (1-60 min)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: {flaggingWindow} minute{flaggingWindow !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="min-w-[120px]"
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

              {hasChanges && (
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>User scans OUT at gate</li>
              <li>User scans IN within {flaggingWindow} minute{flaggingWindow !== 1 ? "s" : ""}</li>
              <li>System flags as proxy attendance abuse</li>
              <li>User is automatically restricted for {restrictionDuration} minute{restrictionDuration !== 1 ? "s" : ""}</li>
              <li>Activity appears in "Flagged Activities" page</li>
              <li>Attendance log shows red highlight</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
