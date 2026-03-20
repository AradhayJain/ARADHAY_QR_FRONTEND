import { useEffect, useState } from "react";
import API from "@/api/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, Coffee, LogIn, LogOut, ArrowRightCircle, Activity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Attendance {
  requestId: string;
  fullName: string;
  idNumber: string;
  organisation: string;
  firstIn: string | null;
  lastOut: string | null;
  breaks: number;
  isFlagged: boolean;
  flagReason: string | null;
}

interface ScanLog {
  _id: string;
  passType: "IN" | "OUT";
  gateId: string;
  result: "ALLOW" | "DENY";
  reason: string | null;
  createdAt: string;
}

const AttendanceTable = () => {
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUser, setDetailUser] = useState<Attendance | null>(null);
  const [detailLogs, setDetailLogs] = useState<ScanLog[]>([]);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/admin/attendance");
      setData(res.data || []);
    } catch (err) {
      toast.error("Failed to load attendance logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const normalized = (value: string) => value.toLowerCase().trim();

  const filteredData = searchInput
    ? data.filter((row) => {
        const query = normalized(searchInput);
        return (
          normalized(row.fullName).includes(query) ||
          normalized(row.idNumber).includes(query) ||
          normalized(row.organisation).includes(query)
        );
      })
    : data;

  const openDetails = async (row: Attendance) => {
    setDetailOpen(true);
    setDetailUser(row);
    setDetailLogs([]);
    try {
      setDetailLoading(true);
      const res = await API.get(`/api/admin/scanlogs/${row.requestId}`);
      setDetailLogs(res.data?.logs || []);
      if (res.data?.user) {
        setDetailUser({
          ...row,
          fullName: res.data.user.fullName || row.fullName,
          idNumber: res.data.user.idNumber || row.idNumber,
          organisation: res.data.user.organisation || row.organisation,
        });
      }
    } catch (err) {
      toast.error("Failed to load scan logs");
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="glass-card overflow-hidden bg-white/90 border-none shadow-xl">
      <div className="p-6 border-b bg-gradient-to-r from-blue-50/50 to-transparent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><History className="w-5 h-5 text-blue-600" /></div>
              <div>
                  <h2 className="text-xl font-bold text-slate-800">Attendance Tracker</h2>
                  <p className="text-sm text-slate-500">Real-time presence and movement analytics</p>
              </div>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, ID, or organisation"
              className="bg-white"
            />
            <Button type="button" size="sm" className="shrink-0" aria-label="Search">
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-12 font-bold">#</TableHead>
            <TableHead className="font-bold">Member</TableHead>
            <TableHead className="font-bold text-center"><div className="flex items-center justify-center gap-1"><LogIn className="w-3 h-3"/> First IN</div></TableHead>
            <TableHead className="font-bold text-center"><div className="flex items-center justify-center gap-1"><LogOut className="w-3 h-3"/> Last OUT</div></TableHead>
            <TableHead className="font-bold text-center">Break Sessions</TableHead>
            <TableHead className="text-right font-bold">Analytics</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
{filteredData.map((a, index) => (
            <TableRow 
              key={a.requestId} 
              className={`transition-all group ${
                a.isFlagged 
                  ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' 
                  : 'hover:bg-blue-50/30'
              }`}
            >
              <TableCell className="w-12 font-mono text-sm font-bold text-slate-700">{index + 1}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${a.isFlagged ? 'text-red-700' : 'text-slate-700'}`}>
                      {a.fullName}
                    </span>
                    {a.isFlagged && (
                      <Badge variant="destructive" className="text-xs">
                        FLAGGED
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded w-fit">{a.idNumber}</span>
                  {a.isFlagged && a.flagReason && (
                    <span className="text-[10px] text-red-600 mt-1 italic">{a.flagReason}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className={`text-center font-semibold ${a.isFlagged ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatDateTime(a.firstIn)}
              </TableCell>
              <TableCell className={`text-center font-semibold ${a.isFlagged ? 'text-red-600' : 'text-rose-500'}`}>
                {formatDateTime(a.lastOut)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className={a.isFlagged ? 'bg-red-100 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-100'}>
                  <Coffee className="w-3 h-3 mr-1" /> {a.breaks}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" className="hover:text-primary transition-colors" onClick={() => openDetails(a)}>
                  <ArrowRightCircle className="w-5 h-5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredData.length === 0 && data.length > 0 && (
        <div className="p-8 text-center text-slate-500">No results found for "{searchInput}"</div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 border-none shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-indigo-950 p-6 text-white flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-bold">{detailUser?.fullName}</h3>
                    <p className="text-indigo-300 text-sm font-mono">{detailUser?.idNumber} • {detailUser?.organisation}</p>
                </div>
                <Badge className="bg-indigo-500 text-white border-none px-4 py-1">Session Summary</Badge>
            </div>

            <div className="p-6 bg-slate-50">
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <LogIn className="w-6 h-6 text-emerald-500 mb-2" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Started</span>
                        <span className="text-lg font-bold text-slate-700">{formatDateTime(detailUser?.firstIn || null)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <LogOut className="w-6 h-6 text-rose-500 mb-2" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Movement</span>
                        <span className="text-lg font-bold text-slate-700">{formatDateTime(detailUser?.lastOut || null)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <Coffee className="w-6 h-6 text-amber-500 mb-2" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Break Cycles</span>
                        <span className="text-lg font-bold text-slate-700">{detailUser?.breaks} Sessions</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b font-bold text-slate-700 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Detailed Movement Log
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="text-[11px] font-bold uppercase">Time</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase">Type</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase">Location</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-right">Verification</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detailLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-200" /></TableCell></TableRow>
                                ) : (
                                    detailLogs.map((log) => (
                                        <TableRow key={log._id} className="hover:bg-slate-50/50">
                                            <TableCell className="text-xs font-medium text-slate-600">{new Date(log.createdAt).toLocaleTimeString("en-IN")}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={log.passType === "IN" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-rose-200 text-rose-700 bg-rose-50"}>
                                                    {log.passType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-bold uppercase text-slate-500">{log.gateId}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge className={log.result === "ALLOW" ? "bg-emerald-500" : "bg-rose-500"}>
                                                    {log.result}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceTable;
