import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import Sidebar from "../components/Sidebar";
import Topbar  from "../components/Topbar";

const API = "http://localhost:5000/api";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

function StatCard({ label, value, unit, icon, colorClass, sublabel }) {
  return (
    <div className="bg-[#0d1530]/80 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${colorClass}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">{label}</p>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-white text-3xl font-bold" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              {value ?? <span className="text-slate-600 text-xl">—</span>}
            </span>
            {unit && <span className="text-slate-400 text-sm mb-1">{unit}</span>}
          </div>
          {sublabel && <p className="text-slate-600 text-xs mt-1">{sublabel}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1530] border border-white/10 rounded-xl px-4 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value}{p.dataKey === "temperature" ? "°C" : "%"}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [deviceData, setDeviceData]   = useState(null);
  const [history, setHistory]         = useState([]);
  const [relayLoading, setRelayLoading] = useState(false);
  const [relayError, setRelayError]   = useState("");
  const [dataError, setDataError]     = useState("");
  const [activeTab, setActiveTab]     = useState("live"); // "live" | "history"
  const role        = localStorage.getItem("role");
  const intervalRef = useRef(null);

  // ── Fetch live data ──────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/device/data`, getAuthHeaders());
      setDeviceData(res.data?.data);
      setDataError("");
    } catch (err) {
      setDataError(err?.response?.data?.message || "Failed to fetch device data.");
    }
  };

  // ── Fetch historical data ────────────────────────────────────────────────
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/device/history?limit=50`, getAuthHeaders());
      const raw = res.data?.data || [];
      setHistory(
        raw.map((r) => ({
          time:        new Date(r.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          temperature: r.temperature,
          humidity:    r.humidity,
        }))
      );
    } catch (err) {
      console.error("History fetch failed:", err?.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHistory();
    intervalRef.current = setInterval(() => {
      fetchData();
      fetchHistory();
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleRelay = async (state) => {
    setRelayLoading(true); setRelayError("");
    try {
      await axios.post(`${API}/device/relay`, { state }, getAuthHeaders());
    } catch (err) {
      setRelayError(err?.response?.data?.message || "Relay command failed.");
    } finally { setRelayLoading(false); }
  };

  const statusColor = deviceData?.status === "online" ? "bg-emerald-500"
    : deviceData?.status === "offline" ? "bg-red-500" : "bg-amber-500";

  return (
    <div className="flex min-h-screen bg-[#060b18]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Dashboard" />
        <main className="flex-1 p-6 space-y-5">

          {dataError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {dataError}
            </div>
          )}

          {/* ── Stat Cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Temperature" value={deviceData?.temperature} unit="°C"
              sublabel="Live sensor reading" colorClass="bg-orange-500"
              icon={<svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>}
            />
            <StatCard label="Humidity" value={deviceData?.humidity} unit="%"
              sublabel="Relative humidity" colorClass="bg-blue-500"
              icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m14.95-6.95l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>}
            />
            {/* Device Status card */}
            <div className="bg-[#0d1530]/80 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-emerald-500" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Device Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusColor} animate-pulse`} />
                    <span className="text-white text-xl font-bold capitalize">{deviceData?.status ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-600 text-xs">Relay:</span>
                    <span className={`text-xs font-semibold ${deviceData?.relay === "ON" ? "text-emerald-400" : "text-slate-500"}`}>
                      {deviceData?.relay ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 bg-opacity-20">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* ── Chart + Relay ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Chart panel */}
            <div className="lg:col-span-2 bg-[#0d1530]/80 border border-white/10 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-semibold text-base">Sensor Analytics</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Temperature & Humidity over time</p>
                </div>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                  {["live", "history"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${activeTab === tab ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"}`}>
                      {tab === "live" ? "Live" : "Historical"}
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={activeTab === "live" ? history.slice(-10) : history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
                  <Line type="monotone" dataKey="temperature" name="Temperature" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="humidity" name="Humidity" stroke="#818cf8" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Relay Control */}
            <div className="bg-[#0d1530]/80 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="mb-4">
                <h2 className="text-white font-semibold text-base">Relay Control</h2>
                <p className="text-slate-500 text-xs mt-0.5">Toggle device relay state</p>
              </div>

              {role === "Viewer" && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-2 rounded-xl mb-4 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Viewer role — read only
                </div>
              )}
              {relayError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-xl mb-4">{relayError}</div>
              )}

              <div className="flex-1 flex flex-col justify-center gap-3">
                <button disabled={role === "Viewer" || relayLoading} onClick={() => handleRelay("ON")}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 8v4l3 3" /></svg>
                  Turn ON
                </button>
                <button disabled={role === "Viewer" || relayLoading} onClick={() => handleRelay("OFF")}
                  className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Turn OFF
                </button>
              </div>

              {relayLoading && <p className="text-slate-500 text-xs text-center mt-3 animate-pulse">Sending command…</p>}

              {/* Current relay state indicator */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-slate-500 text-xs">Current relay state</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${deviceData?.relay === "ON" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 bg-slate-500/10 border-slate-500/20"}`}>
                  {deviceData?.relay ?? "—"}
                </span>
              </div>
            </div>
          </div>

        </main>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap');`}</style>
    </div>
  );
}