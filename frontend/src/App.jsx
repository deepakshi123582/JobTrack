import { useEffect, useState } from "react";
import axios from "axios";
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

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getEmptyForm);

  const [formMessage, setFormMessage] = useState("");
  const [formMessageType, setFormMessageType] = useState("");
  const [savingApplication, setSavingApplication] = useState(false);

  const [activePage, setActivePage] = useState("Dashboard");

  // Search and status filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Handle expired login sessions
  const handleAuthError = (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);
      setIsLoggedIn(false);
      setApplications([]);

      setMessage("Your session expired. Please log in again.");
      setMessageType("error");

      return true;
    }

    return false;
  };

  // Fetch saved applications
  const fetchApplications = async () => {
    setApplicationsLoading(true);

    try {
      const response = await axios.get(
        APPLICATIONS_URL,
        getAuthConfig()
      );

      setApplications(response.data.applications || []);
    } catch (error) {
      if (!handleAuthError(error)) {
        setFormMessage(
          error.response?.data?.message ||
            "Could not load applications. Please try again."
        );
        setFormMessageType("error");
      }
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchApplications();
    }
  }, [isLoggedIn]);

  // Login and registration
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password,
        });

        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        setUser(response.data.user);
        setIsLoggedIn(true);

        setEmail("");
        setPassword("");
      } else {
        await axios.post(`${API_URL}/auth/register`, {
          name,
          email,
          password,
        });

        setMessage("Registration successful! Please log in.");
        setMessageType("success");

        setIsLogin(true);
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setIsLoggedIn(false);
    setIsLogin(true);

    setName("");
    setEmail("");
    setPassword("");

    setApplications([]);
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());

    setSearchTerm("");
    setStatusFilter("All");

    setMessage("");
    setMessageType("");
    setFormMessage("");
    setFormMessageType("");
  };

  // Switch between login and registration
  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setName("");
    setEmail("");
    setPassword("");
    setMessage("");
    setMessageType("");
  };

  // Open a new application form
  const openApplicationForm = () => {
    setEditingId(null);
    setForm(getEmptyForm());
    setFormMessage("");
    setFormMessageType("");
    setShowForm(true);
  };

  // Open an existing application for editing
  const openEditForm = (application) => {
    setEditingId(application.id);

    setForm({
      company: application.company || "",
      job_title: application.job_title || "",
      location: application.location || "",
      job_type: application.job_type || "Full-time",
      application_date: application.application_date
        ? String(application.application_date).slice(0, 10)
        : "",
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

  // Update form fields
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // Add or update an application
  const handleApplicationSubmit = async (event) => {
    event.preventDefault();

    setSavingApplication(true);
    setFormMessage("");
    setFormMessageType("");

    const payload = {
      ...form,
      application_date: form.application_date || null,
    };

    try {
      if (editingId !== null) {
        await axios.put(
          `${APPLICATIONS_URL}/${editingId}`,
          payload,
          getAuthConfig()
        );

        setFormMessage("Application updated successfully!");
      } else {
        await axios.post(
          APPLICATIONS_URL,
          payload,
          getAuthConfig()
        );

        setFormMessage("Application added successfully!");
      }

      setFormMessageType("success");
      setForm(getEmptyForm());
      setEditingId(null);
      setShowForm(false);
      setActivePage("Applications");

      await fetchApplications();
    } catch (error) {
      if (!handleAuthError(error)) {
        setFormMessage(
          error.response?.data?.message ||
            "Could not save application. Please try again."
        );
        setFormMessageType("error");
      }
    } finally {
      setSavingApplication(false);
    }
  };

  // Delete an application
  const handleDeleteApplication = async (application) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the application for ${application.company}?`
    );

    if (!confirmed) {
      return;
    }

    setFormMessage("");
    setFormMessageType("");

    try {
      await axios.delete(
        `${APPLICATIONS_URL}/${application.id}`,
        getAuthConfig()
      );

      setFormMessage("Application deleted successfully!");
      setFormMessageType("success");

      if (editingId === application.id) {
        setShowForm(false);
        setEditingId(null);
        setForm(getEmptyForm());
      }

      await fetchApplications();
    } catch (error) {
      if (!handleAuthError(error)) {
        setFormMessage(
          error.response?.data?.message ||
            "Could not delete application. Please try again."
        );
        setFormMessageType("error");
      }
    }
  };

  // Close application form
  const closeApplicationForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());
    setFormMessage("");
    setFormMessageType("");
  };

  // Status badge styling
  const getStatusClass = (status) => {
    const normalizedStatus = (status || "Applied")
      .toLowerCase()
      .replace(/\s+/g, "-");

    return `status-badge status-${normalizedStatus}`;
  };

  // Search by company, job title or location and filter by status
  const filteredApplications = applications.filter((application) => {
    const query = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !query ||
      (application.company || "").toLowerCase().includes(query) ||
      (application.job_title || "").toLowerCase().includes(query) ||
      (application.location || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" ||
      application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Dashboard statistics
  const totalApplications = applications.length;

  const appliedCount = applications.filter(
    (application) => application.status === "Applied"
  ).length;

  const interviewCount = applications.filter((application) =>
    ["Interview", "Interview Scheduled"].includes(application.status)
  ).length;

  const offerCount = applications.filter((application) =>
    ["Offer", "Offered"].includes(application.status)
  ).length;

  // Dashboard
  if (isLoggedIn) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <div className="dashboard-brand">
            <div className="brand-icon">J</div>
            <h2>JobTrack</h2>
          </div>

          <p className="sidebar-label">WORKSPACE</p>

          <nav className="sidebar-nav">
            {["Dashboard", "Applications", "Interviews"].map((page) => (
              <button
                key={page}
                className={`nav-item ${
                  activePage === page ? "active" : ""
                }`}
                type="button"
                onClick={() => {
                  setActivePage(page);
                  setShowForm(false);
                  setEditingId(null);
                  setForm(getEmptyForm());
                  setFormMessage("");
                  setFormMessageType("");
                }}
              >
                <span>
                  {page === "Dashboard"
                    ? "▦"
                    : page === "Applications"
                      ? "▤"
                      : "▣"}
                </span>
                {page}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="user-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="sidebar-user">
              <strong>{user?.name || "User"}</strong>
              <span>{user?.email || ""}</span>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
              type="button"
              title="Logout"
            >
              ↪
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header">
            <div>
              <p className="eyebrow">YOUR CAREER WORKSPACE</p>
              <h1>{activePage}</h1>
              <p className="dashboard-subtitle">
                Welcome back, {user?.name || "there"}! Keep your job
                search organized.
              </p>
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={openApplicationForm}
            >
              + Add Application
            </button>
          </header>

          {formMessage && !showForm && (
            <div
              className={`message ${formMessageType}`}
              role="status"
            >
              {formMessage}
            </div>
          )}

          {/* Add/Edit Application Form */}
          {showForm && (
            <section className="applications-panel application-form-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    {editingId !== null
                      ? "Edit Job Application"
                      : "Add Job Application"}
                  </h2>
                  <p>
                    {editingId !== null
                      ? "Update the details of your application."
                      : "Enter the details of the job you applied for."}
                  </p>
                </div>

                <button
                  className="close-button"
                  type="button"
                  onClick={closeApplicationForm}
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>

              <form
                className="application-form"
                onSubmit={handleApplicationSubmit}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="company">Company Name *</label>
                    <input
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={handleFormChange}
                      placeholder="e.g. Microsoft"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="job_title">Job Title *</label>
                    <input
                      id="job_title"
                      name="job_title"
                      value={form.job_title}
                      onChange={handleFormChange}
                      placeholder="e.g. Software Engineer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      name="location"
                      value={form.location}
                      onChange={handleFormChange}
                      placeholder="e.g. Bengaluru"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="job_type">Job Type</label>
                    <select
                      id="job_type"
                      name="job_type"
                      value={form.job_type}
                      onChange={handleFormChange}
                    >
                      <option>Full-time</option>
                      <option>Internship</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="application_date">
                      Application Date
                    </label>
                    <input
                      id="application_date"
                      name="application_date"
                      type="date"
                      value={form.application_date}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Application Status</label>
                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                    >
                      <option>Applied</option>
                      <option>Assessment</option>
                      <option>Interview</option>
                      <option>Interview Scheduled</option>
                      <option>Offer</option>
                      <option>Offered</option>
                      <option>Selected</option>
                      <option>Rejected</option>
                      <option>Withdrawn</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="job_link">Job Posting Link</label>
                    <input
                      id="job_link"
                      name="job_link"
                      type="url"
                      value={form.job_link}
                      onChange={handleFormChange}
                      placeholder="https://company.com/careers/job"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      placeholder="Add any reminders or details..."
                      rows="3"
                    />
                  </div>
                </div>

                {formMessage && (
                  <div
                    className={`message ${formMessageType}`}
                    role="status"
                  >
                    {formMessage}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={closeApplicationForm}
                    disabled={savingApplication}
                  >
                    Cancel
                  </button>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={savingApplication}
                  >
                    {savingApplication
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Application"
                        : "Save Application"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Dashboard Overview */}
          {!showForm && activePage === "Dashboard" && (
            <>
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Total Applications</span>
                    <span className="stat-icon purple">▤</span>
                  </div>
                  <strong>{totalApplications}</strong>
                  <p>All tracked job applications</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Applied</span>
                    <span className="stat-icon blue">↗</span>
                  </div>
                  <strong>{appliedCount}</strong>
                  <p>Applications submitted</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Interviews</span>
                    <span className="stat-icon orange">◷</span>
                  </div>
                  <strong>{interviewCount}</strong>
                  <p>Interview opportunities</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Offers</span>
                    <span className="stat-icon green">✓</span>
                  </div>
                  <strong>{offerCount}</strong>
                  <p>Offers received</p>
                </div>
              </section>

              <section className="applications-panel">
                <div className="panel-header">
                  <div>
                    <h2>Recent Applications</h2>
                    <p>Your latest job application activity.</p>
                  </div>

                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setActivePage("Applications")}
                  >
                    View all
                  </button>
                </div>

                {applicationsLoading ? (
                  <div className="empty-state">
                    Loading applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">▤</div>
                    <h3>No applications yet</h3>
                    <p>
                      Add your first job application to start tracking
                      your progress.
                    </p>

                    <button
                      className="primary-button"
                      type="button"
                      onClick={openApplicationForm}
                    >
                      + Add Your First Application
                    </button>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Job Title</th>
                          <th>Applied On</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {applications.slice(0, 5).map((application) => (
                          <tr key={application.id}>
                            <td className="company-cell">
                              {application.company}
                            </td>
                            <td>{application.job_title}</td>
                            <td>
                              {application.application_date
                                ? String(application.application_date).slice(0, 10)
                                : "—"}
                            </td>
                            <td>
                              <span
                                className={getStatusClass(application.status)}
                              >
                                {application.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* All Applications with Search and Filter */}
          {!showForm && activePage === "Applications" && (
            <section className="applications-panel">
              <div className="panel-header">
                <div>
                  <h2>All Applications</h2>
                  <p>
                    Showing {filteredApplications.length} of {totalApplications}{" "}
                    tracked application{totalApplications === 1 ? "" : "s"}.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={fetchApplications}
                  disabled={applicationsLoading}
                >
                  {applicationsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {/* Search and filter controls */}
              <div className="application-filters">
                <div className="form-group search-group">
                  <label htmlFor="application-search">Search applications</label>
                  <input
                    id="application-search"
                    type="search"
                    placeholder="Search company, job title or location..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                <div className="form-group filter-group">
                  <label htmlFor="status-filter">Filter by status</label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="All">All statuses</option>
                    <option value="Applied">Applied</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Interview">Interview</option>
                    <option value="Interview Scheduled">
                      Interview Scheduled
                    </option>
                    <option value="Offer">Offer</option>
                    <option value="Offered">Offered</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>

                <button
                  className="secondary-button clear-filters-button"
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                  }}
                >
                  Clear filters
                </button>
              </div>

              {applicationsLoading ? (
                <div className="empty-state">
                  Loading applications...
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▤</div>
                  <h3>
                    {applications.length === 0
                      ? "No applications yet"
                      : "No matching applications"}
                  </h3>
                  <p>
                    {applications.length === 0
                      ? "Your saved job applications will appear here."
                      : "Try a different search term or clear your filters."}
                  </p>

                  {applications.length === 0 && (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={openApplicationForm}
                    >
                      + Add Application
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Job Title</th>
                        <th>Location</th>
                        <th>Job Type</th>
                        <th>Applied On</th>
                        <th>Status</th>
                        <th>Job Link</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr key={application.id}>
                          <td className="company-cell">
                            {application.company}
                          </td>
                          <td>{application.job_title}</td>
                          <td>{application.location || "—"}</td>
                          <td>{application.job_type || "—"}</td>
                          <td>
                            {application.application_date
                              ? String(application.application_date).slice(0, 10)
                              : "—"}
                          </td>
                          <td>
                            <span className={getStatusClass(application.status)}>
                              {application.status}
                            </span>
                          </td>
                          <td>
                            {application.job_link ? (
                              <a
                                href={application.job_link}
                                target="_blank"
                                rel="noreferrer"
                                className="job-link"
                              >
                                Open link
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <div className="application-actions">
                              <button
                                className="edit-button"
                                type="button"
                                onClick={() => openEditForm(application)}
                              >
                                Edit
                              </button>

                              <button
                                className="delete-button"
                                type="button"
                                onClick={() => handleDeleteApplication(application)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Interviews Page */}
          {!showForm && activePage === "Interviews" && (
            <section className="applications-panel">
              <div className="panel-header">
                <div>
                  <h2>Interviews</h2>
                  <p>
                    View applications that have reached the interview stage.
                  </p>
                </div>
              </div>

              {applications.filter((application) =>
                ["Interview", "Interview Scheduled"].includes(application.status)
              ).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▣</div>
                  <h3>No interviews tracked yet</h3>
                  <p>
                    Update an application status to Interview or Interview
                    Scheduled to see it here.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Job Title</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {applications
                        .filter((application) =>
                          ["Interview", "Interview Scheduled"].includes(
                            application.status
                          )
                        )
                        .map((application) => (
                          <tr key={application.id}>
                            <td className="company-cell">
                              {application.company}
                            </td>
                            <td>{application.job_title}</td>
                            <td>{application.location || "—"}</td>
                            <td>
                              <span className={getStatusClass(application.status)}>
                                {application.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <footer className="dashboard-footer">
            JobTrack · Stay organized. Get hired.
          </footer>
        </main>
      </div>
    );
  }

  // Login and registration screen
  return (
    <div className="app-container">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-icon">J</div>
          <h1>JobTrack</h1>
        </div>

        <p className="subtitle">
          Your career journey, organized.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? "tab active" : "tab"}
            onClick={() => switchMode(true)}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? "tab active" : "tab"}
            onClick={() => switchMode(false)}
          >
            Register
          </button>
        </div>

        <h2>{isLogin ? "Welcome back!" : "Create your account"}</h2>

        <p className="form-description">
          {isLogin
            ? "Enter your details to access your dashboard."
            : "Start organizing your job search today."}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          {message && (
            <div className={`message ${messageType}`} role="status">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Login to JobTrack"
                : "Create Account"}
          </button>
        </form>

        <p className="switch-text">
          {isLogin ? "New to JobTrack? " : "Already have an account? "}

          <button
            type="button"
            className="switch-button"
            onClick={() => switchMode(!isLogin)}
          >
            {isLogin ? "Create an account" : "Login"}
          </button>
        </p>

        <div className="auth-footer">
          Your job search, all in one place.
        </div>
      </div>
    </div>
  );
}

export default App;