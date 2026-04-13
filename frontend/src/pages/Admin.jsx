import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const API = "http://localhost:5000/api";
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const ROLES = ["Admin", "Operator", "Viewer"];
const roleBadge = {
  Admin:    "bg-red-500/20 text-red-400 border-red-500/30",
  Operator: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Viewer:   "bg-slate-500/20 text-slate-400 border-slate-500/30",
};
const EMPTY_FORM = { name: "", email: "", password: "", role: "Viewer" };

export default function Admin() {
  const [users, setUsers]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [successMsg, setSuccessMsg]       = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [showModal, setShowModal]         = useState(false);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [formError, setFormError]         = useState("");
  const [formLoading, setFormLoading]     = useState(false);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const fetchUsers = async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API}/users`, getAuthHeaders());
      setUsers(res.data?.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch users.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    setFormError("");
    if (!form.name.trim())        return setFormError("Name is required");
    if (!form.email.trim())       return setFormError("Email is required");
    if (form.password.length < 6) return setFormError("Password must be at least 6 characters");
    setFormLoading(true);
    try {
      await axios.post(`${API}/auth/register`, form, getAuthHeaders());
      setShowModal(false); setForm(EMPTY_FORM);
      showSuccess("User created successfully."); fetchUsers();
    } catch (err) { setFormError(err?.response?.data?.message || "Failed to create user."); }
    finally { setFormLoading(false); }
  };

  const handleRoleChange = async (id, newRole) => {
    setActionLoading((p) => ({ ...p, [id + "_role"]: true }));
    try {
      await axios.put(`${API}/users/${id}`, { role: newRole }, getAuthHeaders());
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: newRole } : u));
      showSuccess("Role updated.");
    } catch (err) { setError(err?.response?.data?.message || "Failed to update role."); }
    finally { setActionLoading((p) => ({ ...p, [id + "_role"]: false })); }
  };

  const handleDeactivate = async (id) => {
    setActionLoading((p) => ({ ...p, [id + "_deactivate"]: true }));
    try {
      await axios.put(`${API}/users/deactivate/${id}`, {}, getAuthHeaders());
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, active: false } : u));
      showSuccess("User deactivated.");
    } catch (err) { setError(err?.response?.data?.message || "Failed to deactivate."); }
    finally { setActionLoading((p) => ({ ...p, [id + "_deactivate"]: false })); }
  };

  return (
    <div className="flex min-h-screen bg-[#060b18]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="User Management" />
        <main className="flex-1 p-6 space-y-4">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              {successMsg}
            </div>
          )}

          <div className="bg-[#0d1530]/80 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-base">All Users</h2>
                <p className="text-slate-500 text-xs mt-0.5">{users.length} total accounts</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchUsers} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all border border-white/10">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
                <button onClick={() => { setShowModal(true); setFormError(""); setForm(EMPTY_FORM); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create User
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <svg className="animate-spin w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-slate-600 text-sm">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["User","Email","Role","Status","Actions"].map(h => (
                        <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-widest px-6 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white text-sm font-medium">{user?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{user?.email || "—"}</td>
                        <td className="px-6 py-4">
                          <select
                            value={user?.role || "Viewer"}
                            disabled={actionLoading[user._id + "_role"] || !user?.active}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className={`text-xs font-semibold border px-2 py-1 rounded-lg bg-transparent cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${roleBadge[user?.role] || roleBadge.Viewer}`}
                          >
                            {ROLES.map((r) => <option key={r} value={r} className="bg-[#0d1530] text-white">{r}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {user?.active !== false ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-500/10 border border-slate-500/20 px-2 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user?.active !== false ? (
                            <button disabled={actionLoading[user._id + "_deactivate"]} onClick={() => handleDeactivate(user._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                              {actionLoading[user._id + "_deactivate"] ? (
                                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                              )}
                              Deactivate
                            </button>
                          ) : (
                            <span className="text-slate-600 text-xs">Deactivated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#0d1530] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">Create New User</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {formError && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-xl">{formError}</div>}
            <div className="space-y-4">
              {[
                { label: "Full Name",     key: "name",     type: "text",     placeholder: "John Doe"         },
                { label: "Email Address", key: "email",    type: "email",    placeholder: "john@example.com" },
                { label: "Password",      key: "password", type: "password", placeholder: "Min. 6 characters"},
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1.5">{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                </div>
              ))}
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all">
                  {ROLES.map((r) => <option key={r} value={r} className="bg-[#0d1530]">{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={formLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-500/20">
                {formLoading ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap');`}</style>
    </div>
  );
}