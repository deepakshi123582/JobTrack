import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import "./App.css";

const API_URL = "http://localhost:5000/api";
const APPLICATIONS_URL = `${API_URL}/applications`;

const getEmptyForm = () => ({
  company: "",
  job_title: "",
  location: "",
  job_type: "Full-time",
  application_date: new Date().toISOString().slice(0, 10),
  status: "Applied",
  job_link: "",
  notes: "",
});

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const isValidUrl = (value) => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem("token")));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalApplications: 0, applied: 0, interviews: 0, offers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getEmptyForm);
  const [formMessage, setFormMessage] = useState("");
  const [formMessageType, setFormMessageType] = useState("");
  const [savingApplication, setSavingApplication] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");

  const [interviews, setInterviews] = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [savingInterview, setSavingInterview] = useState(false);
  const [interviewMessage, setInterviewMessage] = useState("");
  const [interviewMessageType, setInterviewMessageType] = useState("");
  const [interviewForm, setInterviewForm] = useState({
    application_id: "", interview_date: "", interview_type: "Technical",
    interviewer: "", notes: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const resetDashboard = () => {
    setDashboardStats({ totalApplications: 0, applied: 0, interviews: 0, offers: 0 });
  };

  const handleAuthError = (error) => {
    if (error.response?.status !== 401) return false;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    setApplications([]);
    setInterviews([]);
    resetDashboard();
    setMessage("Your session expired. Please log in again.");
    setMessageType("error");
    return true;
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const response = await axios.get(APPLICATIONS_URL, getAuthConfig());
      const rows = response.data?.applications ?? response.data;
      setApplications(Array.isArray(rows) ? rows : []);
      setFormMessage("");
      setFormMessageType("");
    } catch (error) {
      if (!handleAuthError(error)) {
        setFormMessage(error.response?.data?.message || "Could not load applications. Please check the backend and try again.");
        setFormMessageType("error");
      }
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get(`${APPLICATIONS_URL}/stats`, getAuthConfig());
      const stats = response.data?.stats ?? response.data ?? {};
      setDashboardStats({
        totalApplications: Number(stats.totalApplications ?? stats.total_applications ?? 0),
        applied: Number(stats.applied ?? 0),
        interviews: Number(stats.interviews ?? 0),
        offers: Number(stats.offers ?? 0),
      });
    } catch (error) {
      if (!handleAuthError(error)) console.error("Could not load dashboard statistics:", error.response?.data?.message || error.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchInterviews = async () => {
    setInterviewsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/interviews`, getAuthConfig());
      const rows = response.data?.interviews ?? response.data;
      setInterviews(Array.isArray(rows) ? rows : []);
    } catch (error) {
      if (!handleAuthError(error)) {
        setInterviewMessage(error.response?.data?.message || "Could not load interviews.");
        setInterviewMessageType("error");
      }
    } finally {
      setInterviewsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchApplications();
      fetchDashboardStats();
      fetchInterviews();
    }
    // These requests intentionally run when the login state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }
    if (!isLogin && name.trim().length < 2) {
      setMessage("Please enter a name with at least 2 characters.");
      setMessageType("error");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const response = await axios.post(`${API_URL}/auth/login`, { email: cleanEmail, password });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        setIsLoggedIn(true);
        setEmail("");
        setPassword("");
      } else {
        await axios.post(`${API_URL}/auth/register`, { name: name.trim(), email: cleanEmail, password });
        setMessage("Registration successful! Please log in.");
        setMessageType("success");
        setIsLogin(true);
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to connect to the server. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    setIsLogin(true);
    setName(""); setEmail(""); setPassword("");
    setApplications([]); setInterviews([]);
    setShowForm(false); setEditingId(null); setForm(getEmptyForm());
    setSearchTerm(""); setStatusFilter("All");
    setMessage(""); setMessageType(""); setFormMessage(""); setFormMessageType("");
    setInterviewMessage(""); setInterviewMessageType("");
    resetDashboard();
  };

  const openApplicationForm = () => {
    setEditingId(null);
    setForm(getEmptyForm());
    setFormMessage("");
    setFormMessageType("");
    setShowForm(true);
  };

  const openEditForm = (application) => {
    setEditingId(application.id);
    setForm({
      company: application.company || "",
      job_title: application.job_title || "",
      location: application.location || "",
      job_type: application.job_type || "Full-time",
      application_date: application.application_date ? String(application.application_date).slice(0, 10) : "",
      status: application.status || "Applied",
      job_link: application.job_link || "",
      notes: application.notes || "",
    });
    setFormMessage("");
    setFormMessageType("");
    setShowForm(true);
    setActivePage("Applications");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeApplicationForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());
    setFormMessage("");
    setFormMessageType("");
  };

  const handleApplicationSubmit = async (event) => {
    event.preventDefault();
    setFormMessage("");
    setFormMessageType("");
    const company = form.company.trim();
    const jobTitle = form.job_title.trim();
    if (!company || !jobTitle) {
      setFormMessage("Company name and job title are required.");
      setFormMessageType("error");
      return;
    }
    if (!isValidUrl(form.job_link)) {
      setFormMessage("Please enter a valid job link starting with http:// or https://.");
      setFormMessageType("error");
      return;
    }

    setSavingApplication(true);
    const payload = {
      ...form, company, job_title: jobTitle,
      location: form.location.trim(), job_link: form.job_link.trim(),
      notes: form.notes.trim(), application_date: form.application_date || null,
    };
    try {
      if (editingId !== null) {
        await axios.put(`${APPLICATIONS_URL}/${editingId}`, payload, getAuthConfig());
        setFormMessage("Application updated successfully!");
      } else {
        await axios.post(APPLICATIONS_URL, payload, getAuthConfig());
        setFormMessage("Application added successfully!");
      }
      setFormMessageType("success");
      setShowForm(false);
      setEditingId(null);
      setForm(getEmptyForm());
      setActivePage("Applications");
      await Promise.all([fetchApplications(), fetchDashboardStats()]);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFormMessage(error.response?.data?.message || "Could not save application. Please try again.");
        setFormMessageType("error");
      }
    } finally {
      setSavingApplication(false);
    }
  };

  const handleDeleteApplication = async (application) => {
    if (!window.confirm(`Are you sure you want to delete the application for ${application.company}?`)) return;
    try {
      await axios.delete(`${APPLICATIONS_URL}/${application.id}`, getAuthConfig());
      setFormMessage("Application deleted successfully!");
      setFormMessageType("success");
      await Promise.all([fetchApplications(), fetchDashboardStats()]);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFormMessage(error.response?.data?.message || "Could not delete application.");
        setFormMessageType("error");
      }
    }
  };

  const handleInterviewSubmit = async (event) => {
    event.preventDefault();
    setInterviewMessage("");
    setInterviewMessageType("");
    if (!interviewForm.application_id || !interviewForm.interview_date) {
      setInterviewMessage("Please select an application and interview date/time.");
      setInterviewMessageType("error");
      return;
    }
    if (Number.isNaN(new Date(interviewForm.interview_date).getTime())) {
      setInterviewMessage("Please enter a valid interview date and time.");
      setInterviewMessageType("error");
      return;
    }
    setSavingInterview(true);
    try {
      await axios.post(`${API_URL}/interviews`, {
        ...interviewForm,
        application_id: Number(interviewForm.application_id),
        interview_date: interviewForm.interview_date.replace("T", " "),
      }, getAuthConfig());
      setInterviewMessage("Interview scheduled successfully!");
      setInterviewMessageType("success");
      setInterviewForm({ application_id: "", interview_date: "", interview_type: "Technical", interviewer: "", notes: "" });
      await Promise.all([fetchInterviews(), fetchDashboardStats()]);
    } catch (error) {
      if (!handleAuthError(error)) {
        setInterviewMessage(error.response?.data?.message || "Could not schedule interview.");
        setInterviewMessageType("error");
      }
    } finally {
      setSavingInterview(false);
    }
  };

  const handleInterviewStatusChange = async (interview, status) => {
    try {
      await axios.put(`${API_URL}/interviews/${interview.id}`, { status }, getAuthConfig());
      setInterviewMessage("Interview status updated successfully!");
      setInterviewMessageType("success");
      await fetchInterviews();
    } catch (error) {
      if (!handleAuthError(error)) {
        setInterviewMessage(error.response?.data?.message || "Could not update interview status.");
        setInterviewMessageType("error");
      }
    }
  };

  const handleEditInterview = async (interview) => {
    const currentDate = interview.interview_date ? String(interview.interview_date).replace("T", " ").slice(0, 16) : "";
    const date = window.prompt("Interview date and time (YYYY-MM-DD HH:mm):", currentDate);
    if (date === null) return;
    if (!date.trim() || Number.isNaN(new Date(date.trim().replace(" ", "T")).getTime())) {
      setInterviewMessage("Please enter a valid date and time, for example 2026-10-20 14:30.");
      setInterviewMessageType("error");
      return;
    }
    const type = window.prompt("Interview type:", interview.interview_type || "Technical");
    if (type === null) return;
    const interviewer = window.prompt("Interviewer / contact:", interview.interviewer || "");
    if (interviewer === null) return;
    const notes = window.prompt("Preparation notes:", interview.notes || "");
    if (notes === null) return;
    try {
      await axios.put(`${API_URL}/interviews/${interview.id}`, {
        interview_date: date.trim().replace("T", " "),
        interview_type: type.trim() || null,
        interviewer: interviewer.trim() || null,
        notes: notes.trim() || null,
      }, getAuthConfig());
      setInterviewMessage("Interview updated successfully!");
      setInterviewMessageType("success");
      await fetchInterviews();
    } catch (error) {
      if (!handleAuthError(error)) {
        setInterviewMessage(error.response?.data?.message || "Could not update interview.");
        setInterviewMessageType("error");
      }
    }
  };

  const handleDeleteInterview = async (interview) => {
    if (!window.confirm(`Delete the interview for ${interview.company} — ${interview.job_title}?`)) return;
    try {
      await axios.delete(`${API_URL}/interviews/${interview.id}`, getAuthConfig());
      setInterviewMessage("Interview deleted successfully!");
      setInterviewMessageType("success");
      await Promise.all([fetchInterviews(), fetchDashboardStats()]);
    } catch (error) {
      if (!handleAuthError(error)) {
        setInterviewMessage(error.response?.data?.message || "Could not delete interview.");
        setInterviewMessageType("error");
      }
    }
  };

  const getStatusClass = (status) => `status-badge status-${String(status || "Applied").toLowerCase().replace(/\s+/g, "-")}`;

  const filteredApplications = applications.filter((application) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query ||
      String(application.company || "").toLowerCase().includes(query) ||
      String(application.job_title || "").toLowerCase().includes(query) ||
      String(application.location || "").toLowerCase().includes(query);
    return matchesSearch && (statusFilter === "All" || application.status === statusFilter);
  });

  const normalizedStatuses = applications.map((application) => String(application.status || "Applied").trim().toLowerCase());
  const chartData = [
    { name: "Applied", value: normalizedStatuses.filter((s) => s === "applied").length, color: "#6366f1" },
    { name: "Interviews", value: normalizedStatuses.filter((s) => s.includes("interview")).length, color: "#f59e0b" },
    { name: "Offers", value: normalizedStatuses.filter((s) => ["offer", "offered", "selected"].includes(s)).length, color: "#10b981" },
    { name: "Rejected", value: normalizedStatuses.filter((s) => s === "rejected").length, color: "#ef4444" },
    { name: "Other", value: normalizedStatuses.filter((s) => s !== "applied" && !s.includes("interview") && !["offer", "offered", "selected", "rejected"].includes(s)).length, color: "#94a3b8" },
  ].filter((item) => item.value > 0);

  const changePage = (page) => {
    setActivePage(page);
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());
    setFormMessage("");
    setFormMessageType("");
  };

  if (isLoggedIn) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <div className="dashboard-brand"><div className="brand-icon">J</div><h2>JobTrack</h2></div>
          <p className="sidebar-label">WORKSPACE</p>
          <nav className="sidebar-nav">
            {["Dashboard", "Applications", "Interviews"].map((page) => (
              <button key={page} type="button" className={`nav-item ${activePage === page ? "active" : ""}`} onClick={() => changePage(page)}>
                <span>{page === "Dashboard" ? "▦" : page === "Applications" ? "▤" : "▣"}</span>{page}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="user-avatar">{(user?.name || "U").charAt(0).toUpperCase()}</div>
            <div className="sidebar-user"><strong>{user?.name || "User"}</strong><span>{user?.email || ""}</span></div>
            <button className="logout-button" onClick={handleLogout} type="button" title="Logout">↪</button>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header">
            <div><p className="eyebrow">YOUR CAREER WORKSPACE</p><h1>{activePage}</h1><p className="dashboard-subtitle">Welcome back, {user?.name || "there"}! Keep your job search organized.</p></div>
            <button className="primary-button" type="button" onClick={openApplicationForm}>+ Add Application</button>
          </header>

          {formMessage && !showForm && <div className={`message ${formMessageType}`} role="status">{formMessage}</div>}

          {showForm && (
            <section className="applications-panel application-form-panel">
              <div className="panel-header"><div><h2>{editingId !== null ? "Edit Job Application" : "Add Job Application"}</h2><p>{editingId !== null ? "Update the details of your application." : "Enter the details of the job you applied for."}</p></div><button className="close-button" type="button" onClick={closeApplicationForm} aria-label="Close form">×</button></div>
              <form className="application-form" onSubmit={handleApplicationSubmit}>
                <div className="form-grid">
                  <div className="form-group"><label htmlFor="company">Company Name *</label><input id="company" name="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Microsoft" required /></div>
                  <div className="form-group"><label htmlFor="job_title">Job Title *</label><input id="job_title" name="job_title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="e.g. Software Engineer" required /></div>
                  <div className="form-group"><label htmlFor="location">Location</label><input id="location" name="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru" /></div>
                  <div className="form-group"><label htmlFor="job_type">Job Type</label><select id="job_type" name="job_type" value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}><option>Full-time</option><option>Internship</option><option>Part-time</option><option>Contract</option></select></div>
                  <div className="form-group"><label htmlFor="application_date">Application Date</label><input id="application_date" name="application_date" type="date" value={form.application_date} onChange={(e) => setForm({ ...form, application_date: e.target.value })} /></div>
                  <div className="form-group"><label htmlFor="status">Application Status</label><select id="status" name="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Applied","Assessment","Interview","Interview Scheduled","Offer","Offered","Selected","Rejected","Withdrawn"].map((s) => <option key={s}>{s}</option>)}</select></div>
                  <div className="form-group full-width"><label htmlFor="job_link">Job Posting Link</label><input id="job_link" name="job_link" type="url" value={form.job_link} onChange={(e) => setForm({ ...form, job_link: e.target.value })} placeholder="https://company.com/careers/job" /></div>
                  <div className="form-group full-width"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add reminders or details..." rows="3" /></div>
                </div>
                {formMessage && <div className={`message ${formMessageType}`} role="status">{formMessage}</div>}
                <div className="form-actions"><button className="secondary-button" type="button" onClick={closeApplicationForm} disabled={savingApplication}>Cancel</button><button className="primary-button" type="submit" disabled={savingApplication}>{savingApplication ? "Saving..." : editingId !== null ? "Update Application" : "Save Application"}</button></div>
              </form>
            </section>
          )}

          {!showForm && activePage === "Dashboard" && <>
            <section className="stats-grid">
              {[["Total Applications", dashboardStats.totalApplications, "▤", "purple", "All tracked job applications"],["Applied",dashboardStats.applied,"↗","blue","Applications submitted"],["Interviews",dashboardStats.interviews,"◷","orange","Interview opportunities"],["Offers",dashboardStats.offers,"✓","green","Offers received"]].map(([label,value,icon,color,desc]) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className={`stat-icon ${color}`}>{icon}</span></div><strong>{statsLoading ? "..." : value}</strong><p>{desc}</p></div>)}
            </section>
            <section className="applications-panel">
              <div className="panel-header"><div><h2>Recent Applications</h2><p>Your latest job application activity.</p></div><button className="text-button" type="button" onClick={() => changePage("Applications")}>View all</button></div>
              {applicationsLoading ? <div className="empty-state">Loading applications...</div> : applications.length === 0 ? <div className="empty-state"><div className="empty-icon">▤</div><h3>No applications yet</h3><p>Add your first job application to start tracking your progress.</p><button className="primary-button" type="button" onClick={openApplicationForm}>+ Add Your First Application</button></div> : <div className="table-wrapper"><table className="applications-table"><thead><tr><th>Company</th><th>Job Title</th><th>Applied On</th><th>Status</th></tr></thead><tbody>{applications.slice(0,5).map((a) => <tr key={a.id}><td className="company-cell">{a.company}</td><td>{a.job_title}</td><td>{a.application_date ? String(a.application_date).slice(0,10) : "—"}</td><td><span className={getStatusClass(a.status)}>{a.status}</span></td></tr>)}</tbody></table></div>}
            </section>
            <section className="applications-panel chart-panel"><div className="panel-header"><div><h2>Application Status</h2><p>See how your job search is progressing.</p></div></div>
              {applicationsLoading ? <div className="empty-state">Loading chart...</div> : chartData.length === 0 ? <div className="empty-state"><h3>No application data yet</h3><p>Add a job application to see your status breakdown.</p></div> : <div className="status-chart-layout"><div className="status-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3}>{chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="status-summary">{chartData.map((entry) => <div className="status-summary-row" key={entry.name}><span><i style={{ background: entry.color }} />{entry.name}</span><strong>{entry.value}</strong></div>)}</div></div>}
            </section>
          </>}

          {!showForm && activePage === "Applications" && <section className="applications-panel">
            <div className="panel-header"><div><h2>All Applications</h2><p>Showing {filteredApplications.length} of {dashboardStats.totalApplications} tracked applications.</p></div><button className="secondary-button" type="button" onClick={() => Promise.all([fetchApplications(),fetchDashboardStats()])} disabled={applicationsLoading || statsLoading}>{applicationsLoading || statsLoading ? "Refreshing..." : "Refresh"}</button></div>
            <div className="application-filters"><div className="form-group search-group"><label htmlFor="application-search">Search applications</label><input id="application-search" type="search" placeholder="Search company, job title or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><div className="form-group filter-group"><label htmlFor="status-filter">Filter by status</label><select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option>{["Applied","Assessment","Interview","Interview Scheduled","Offer","Offered","Selected","Rejected","Withdrawn"].map((s) => <option key={s}>{s}</option>)}</select></div><button className="secondary-button clear-filters-button" type="button" onClick={() => {setSearchTerm("");setStatusFilter("All");}}>Clear filters</button></div>
            {applicationsLoading ? <div className="empty-state">Loading applications...</div> : filteredApplications.length === 0 ? <div className="empty-state"><h3>{applications.length === 0 ? "No applications yet" : "No matching applications"}</h3><p>{applications.length === 0 ? "Your saved applications will appear here." : "Try changing your search or clearing the filters."}</p>{applications.length === 0 && <button className="primary-button" type="button" onClick={openApplicationForm}>+ Add Application</button>}</div> : <div className="table-wrapper"><table className="applications-table"><thead><tr><th>Company</th><th>Job Title</th><th>Location</th><th>Job Type</th><th>Applied On</th><th>Status</th><th>Job Link</th><th>Actions</th></tr></thead><tbody>{filteredApplications.map((a) => <tr key={a.id}><td className="company-cell">{a.company}</td><td>{a.job_title}</td><td>{a.location || "—"}</td><td>{a.job_type || "—"}</td><td>{a.application_date ? String(a.application_date).slice(0,10) : "—"}</td><td><span className={getStatusClass(a.status)}>{a.status}</span></td><td>{a.job_link ? <a className="job-link" href={a.job_link} target="_blank" rel="noreferrer">Open link</a> : "—"}</td><td><div className="application-actions"><button className="edit-button" type="button" onClick={() => openEditForm(a)}>Edit</button><button className="delete-button" type="button" onClick={() => handleDeleteApplication(a)}>Delete</button></div></td></tr>)}</tbody></table></div>}
          </section>}

          {!showForm && activePage === "Interviews" && <>
            <section className="applications-panel"><div className="panel-header"><div><h2>Schedule an Interview</h2><p>Add interview details for one of your tracked applications.</p></div></div>
              {interviewMessage && <div className={`message ${interviewMessageType}`} role="status">{interviewMessage}</div>}
              {applications.length === 0 ? <div className="empty-state"><h3>Add a job application first</h3><p>You need a saved application before scheduling an interview.</p><button className="primary-button" type="button" onClick={openApplicationForm}>+ Add Application</button></div> : <form className="application-form" onSubmit={handleInterviewSubmit}><div className="form-grid">
                <div className="form-group full-width"><label htmlFor="interview-application">Job Application *</label><select id="interview-application" value={interviewForm.application_id} onChange={(e) => setInterviewForm({...interviewForm, application_id:e.target.value})} required><option value="">Select a company and role</option>{applications.map((a) => <option key={a.id} value={a.id}>{a.company} — {a.job_title}</option>)}</select></div>
                <div className="form-group"><label htmlFor="interview-date">Interview Date &amp; Time *</label><input id="interview-date" type="datetime-local" value={interviewForm.interview_date} onChange={(e) => setInterviewForm({...interviewForm, interview_date:e.target.value})} required /></div>
                <div className="form-group"><label htmlFor="interview-type">Interview Type</label><select id="interview-type" value={interviewForm.interview_type} onChange={(e) => setInterviewForm({...interviewForm, interview_type:e.target.value})}>{["Technical","HR","Behavioral","Online Assessment","Phone Screen","Other"].map((s) => <option key={s}>{s}</option>)}</select></div>
                <div className="form-group full-width"><label htmlFor="interviewer">Interviewer / Contact</label><input id="interviewer" value={interviewForm.interviewer} onChange={(e) => setInterviewForm({...interviewForm, interviewer:e.target.value})} placeholder="e.g. Hiring Manager" /></div>
                <div className="form-group full-width"><label htmlFor="interview-notes">Preparation Notes</label><textarea id="interview-notes" rows="3" value={interviewForm.notes} onChange={(e) => setInterviewForm({...interviewForm, notes:e.target.value})} placeholder="Topics to prepare, meeting link, reminders..." /></div>
              </div><div className="form-actions"><button className="secondary-button" type="button" onClick={() => setInterviewForm({application_id:"",interview_date:"",interview_type:"Technical",interviewer:"",notes:""})} disabled={savingInterview}>Clear</button><button className="primary-button" type="submit" disabled={savingInterview}>{savingInterview ? "Scheduling..." : "Schedule Interview"}</button></div></form>}
            </section>
            <section className="applications-panel"><div className="panel-header"><div><h2>Scheduled Interviews</h2><p>Your upcoming and previous interview details.</p></div><button className="secondary-button" type="button" onClick={fetchInterviews} disabled={interviewsLoading}>{interviewsLoading ? "Refreshing..." : "Refresh"}</button></div>
              {interviewsLoading ? <div className="empty-state">Loading interviews...</div> : interviews.length === 0 ? <div className="empty-state"><h3>No interviews scheduled yet</h3><p>Use the form above to add your first interview.</p></div> : <div className="table-wrapper"><table className="applications-table"><thead><tr><th>Company</th><th>Job Title</th><th>Date &amp; Time</th><th>Type</th><th>Interviewer</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead><tbody>{interviews.map((i) => <tr key={i.id}><td className="company-cell">{i.company}</td><td>{i.job_title}</td><td>{i.interview_date ? new Date(String(i.interview_date).replace(" ","T")).toLocaleString() : "—"}</td><td>{i.interview_type || "—"}</td><td>{i.interviewer || "—"}</td><td>{i.notes || "—"}</td><td><select aria-label={`Status for ${i.company} interview`} value={i.status || "Scheduled"} onChange={(e) => handleInterviewStatusChange(i,e.target.value)}><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></td><td><div className="application-actions"><button className="edit-button" type="button" onClick={() => handleEditInterview(i)}>Edit</button><button className="delete-button" type="button" onClick={() => handleDeleteInterview(i)}>Delete</button></div></td></tr>)}</tbody></table></div>}
            </section>
          </>}
          <footer className="dashboard-footer">JobTrack · Stay organized. Get hired.</footer>
        </main>
      </div>
    );
  }

  return <div className="app-container"><div className="auth-card">
    <div className="brand"><div className="brand-icon">J</div><h1>JobTrack</h1></div>
    <p className="subtitle">Your career journey, organized.</p>
    <div className="auth-tabs"><button type="button" className={isLogin ? "tab active" : "tab"} onClick={() => {setIsLogin(true);setMessage("");setMessageType("");}}>Login</button><button type="button" className={!isLogin ? "tab active" : "tab"} onClick={() => {setIsLogin(false);setMessage("");setMessageType("");}}>Register</button></div>
    <h2>{isLogin ? "Welcome back!" : "Create your account"}</h2><p className="form-description">{isLogin ? "Enter your details to access your dashboard." : "Start organizing your job search today."}</p>
    <form onSubmit={handleSubmit}>
      {!isLogin && <div className="form-group"><label htmlFor="name">Full Name</label><input id="name" type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required /></div>}
      <div className="form-group"><label htmlFor="email">Email Address</label><input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="form-group"><label htmlFor="password">Password</label><input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></div>
      {message && <div className={`message ${messageType}`} role="status">{message}</div>}
      <button type="submit" className="submit-button" disabled={loading}>{loading ? "Please wait..." : isLogin ? "Login to JobTrack" : "Create Account"}</button>
    </form>
    <p className="switch-text">{isLogin ? "New to JobTrack? " : "Already have an account? "}<button type="button" className="switch-button" onClick={() => {setIsLogin(!isLogin);setMessage("");setMessageType("");}}>{isLogin ? "Create an account" : "Login"}</button></p>
    <div className="auth-footer">Your job search, all in one place.</div>
  </div></div>;
}

export default App;
