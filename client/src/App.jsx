import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  Copy,
  Clock3,
  Eye,
  ExternalLink,
  FileArchive,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  HardDriveUpload,
  Link2,
  LoaderCircle,
  LogOut,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  UploadCloud,
  Users,
  X,
} from "lucide-react";

const API_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;
const BRAND_LOGO =
  "https://www.tomorrowisbetter.org/assets/Tomorrow%20is%20better%20logo-CBq5aH4y.jpg";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

const fileIcon = (type) => {
  if (type?.startsWith("image/")) return <FileImage />;
  if (type?.startsWith("video/")) return <FileVideo />;
  if (type?.includes("zip") || type?.includes("archive"))
    return <FileArchive />;
  return <FileText />;
};

const previewUrl = (file) => `${API_URL}/files/${file.id}/download?preview=1`;

function FilePreview({ file, onClose }) {
  const url = previewUrl(file);
  const canEmbed =
    file.type?.startsWith("image/") ||
    file.type?.startsWith("video/") ||
    file.type?.startsWith("audio/") ||
    file.type === "application/pdf" ||
    file.type?.startsWith("text/");

  return (
    <div className="preview-panel">
      <div className="preview-heading">
        <div>
          <span className="eyebrow">QUICK PREVIEW</span>
          <strong>{file.name}</strong>
        </div>
        <div className="preview-actions">
          <a
            className="preview-link"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={15} /> Open
          </a>
          {onClose && (
            <button
              className="icon-button"
              type="button"
              onClick={onClose}
              title="Close preview"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>
      {canEmbed ? (
        file.type?.startsWith("image/") ? (
          <img className="preview-media" src={url} alt={file.name} />
        ) : file.type?.startsWith("video/") ? (
          <video className="preview-media" src={url} controls />
        ) : file.type?.startsWith("audio/") ? (
          <audio className="preview-audio" src={url} controls />
        ) : file.type?.startsWith("text/") ? (
          <iframe
            className="preview-frame text-preview"
            src={url}
            title={`Preview of ${file.name}`}
          />
        ) : (
          <iframe
            className="preview-frame"
            src={url}
            title={`Preview of ${file.name}`}
          />
        )
      ) : (
        <div className="preview-unavailable">
          <span className="file-type">{fileIcon(file.type)}</span>
          <strong>This file type is not previewable yet.</strong>
          <span>Open or download it to view the contents.</span>
        </div>
      )}
    </div>
  );
}

function SharePage({ token }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("This share link is missing its file token.");
      setIsLoading(false);
      return;
    }

    fetch(`${API_URL}/share/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            result.message || "This link is no longer available.",
          );
        setFile(result);
      })
      .catch((requestError) =>
        setError(
          requestError.message ||
            "Could not reach the file service. Start the server and try again.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <div className="share-shell">
      <a className="brand" href="/">
        <img
          className="brand-logo"
          src={BRAND_LOGO}
          alt="Tomorrow is Better logo"
        />
        <span>Tomorrow is Better</span>
      </a>
      <main className="share-card">
        <div className="share-badge">
          <Link2 size={18} />
        </div>
        {file ? (
          <>
            <p className="eyebrow">SHARED FILE</p>
            <h1>{file.name}</h1>
            <p className="share-meta">
              {formatBytes(file.size)} · shared from Tomorrow is Better
            </p>
            <FilePreview file={file} />
            <a
              className="choose-button share-download"
              href={`${API_URL}/files/${file.id}/download`}
            >
              <ArrowDownToLine size={17} /> Download file
            </a>
          </>
        ) : (
          <p className="share-status">
            {isLoading ? "Loading shared file..." : error}
          </p>
        )}
      </main>
    </div>
  );
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Could not authenticate.");
      localStorage.setItem("tomorrow-token", result.token);
      onAuthenticated(result);
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <a className="brand auth-brand" href="/">
        <img
          className="brand-logo"
          src={BRAND_LOGO}
          alt="Tomorrow is Better logo"
        />
        <span>Tomorrow is Better</span>
      </a>
      <main className="auth-card">
        <p className="eyebrow">YOUR PRIVATE FILE SPACE</p>
        <h1>{mode === "login" ? "Welcome back." : "Make room for better."}</h1>
        <p className="auth-copy">
          {mode === "login"
            ? "Sign in to access your files and shared links."
            : "Create an account to keep your files close and share them freely."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              placeholder="At least 8 characters"
            />
          </label>
          {error && <div className="error-banner">{error}</div>}
          <button
            className="choose-button auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <LoaderCircle className="spin" size={17} />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </main>
    </div>
  );
}

function ProfilePage({ user, onUserUpdated, onBack }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    jobRole: user.jobRole || "",
  });
  const [users, setUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = async (url, options = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("tomorrow-token")}`,
        ...options.headers,
      },
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "Something went wrong.");
    return result;
  };

  useEffect(() => {
    if (user.role !== "admin") return;
    request("/users")
      .then(setUsers)
      .catch((requestError) => setError(requestError.message));
  }, [user.role]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const updatedUser = await request("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      onUserUpdated(updatedUser);
      setNotice("Profile updated successfully.");
    } catch (profileError) {
      setError(profileError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const changeRole = async (userId, role) => {
    try {
      const updatedUser = await request(`/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item,
        ),
      );
      if (updatedUser.id === user.id) onUserUpdated(updatedUser);
    } catch (roleError) {
      setError(roleError.message);
    }
  };

  return (
    <main className="profile-page">
      <button className="back-link" type="button" onClick={onBack}>
        <ArrowDownToLine size={15} /> Back to files
      </button>
      <div className="profile-page-heading">
        <div>
          <p className="eyebrow">ACCOUNT CENTER</p>
          <h1>Profile & access</h1>
          <p className="profile-lead">
            Manage your identity and control who can manage this workspace.
          </p>
        </div>
        <div className="profile-avatar-large">
          {user.name.slice(0, 2).toUpperCase()}
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}
      <section className="profile-grid">
        <form className="settings-panel" onSubmit={saveProfile}>
          <div className="panel-title">
            <UserRound size={18} />
            <div>
              <h2>Personal details</h2>
              <p>Update the information attached to your account.</p>
            </div>
          </div>
          <label>
            Full name
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>
          <label>
            Email address
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </label>
          <label>
            Job role
            <input
              value={form.jobRole}
              onChange={(event) =>
                setForm({ ...form, jobRole: event.target.value })
              }
              placeholder="e.g. Product designer"
            />
          </label>
          <div className="role-readout">
            <span>Current role</span>
            <strong className={`role-badge role-${user.role}`}>
              {user.role}
            </strong>
          </div>
          <button className="choose-button" type="submit" disabled={isSaving}>
            {isSaving && <LoaderCircle className="spin" size={16} />}
            {isSaving ? "Saving changes" : "Save changes"}
          </button>
        </form>
        <section className="settings-panel account-summary">
          <div className="panel-title">
            <ShieldCheck size={18} />
            <div>
              <h2>Account status</h2>
              <p>Your workspace permissions at a glance.</p>
            </div>
          </div>
          <div className="summary-line">
            <span>Access level</span>
            <strong>
              {user.role === "admin" ? "Administrator" : "Member"}
            </strong>
          </div>
          <div className="summary-line">
            <span>Member since</span>
            <strong>{formatDate(user.createdAt)}</strong>
          </div>
          <div className="summary-line">
            <span>Security</span>
            <strong className="status-text">
              <span className="status-dot" /> Protected
            </strong>
          </div>
        </section>
      </section>
      {user.role === "admin" && (
        <section className="settings-panel people-panel">
          <div className="panel-title">
            <Users size={18} />
            <div>
              <h2>People & roles</h2>
              <p>Give trusted members the access they need.</p>
            </div>
          </div>
          <div className="people-table">
            <div className="people-header">
              <span>PERSON</span>
              <span>JOB ROLE</span>
              <span>ACCESS</span>
              <span>JOINED</span>
            </div>
            {users.map((item) => (
              <div className="person-row" key={item.id}>
                <div className="person-name">
                  <span className="mini-avatar">
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.email}</span>
                  </div>
                </div>
                <span className="person-job-role">
                  {item.jobRole || "No job role set"}
                </span>
                <select
                  value={item.role}
                  onChange={(event) => changeRole(item.id, event.target.value)}
                  disabled={item.id === user.id}
                  aria-label={`Role for ${item.name}`}
                >
                  <option value="user">Member</option>
                  <option value="admin">Administrator</option>
                </select>
                <span className="muted">{formatDate(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [activeView, setActiveView] = useState("files");
  const inputRef = useRef(null);

  const loadFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/files`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tomorrow-token")}`,
        },
      });
      if (!response.ok) throw new Error("Could not load files.");
      setFiles(await response.json());
    } catch {
      setError("Start the API and MongoDB to load your library.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("tomorrow-token");
    if (!token) {
      setIsCheckingSession(false);
      return;
    }
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setUser(await response.json());
        await loadFiles();
      })
      .catch(() => localStorage.removeItem("tomorrow-token"))
      .finally(() => setIsCheckingSession(false));
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tomorrow-token")}`,
        },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upload failed.");
      setFiles((current) => [result, ...current]);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copyShareLink = async (file) => {
    const link = `${window.location.origin}/share/${file.shareToken}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(query.toLowerCase()),
  );
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const shareToken = window.location.pathname.startsWith("/share/")
    ? window.location.pathname.split("/").pop()
    : null;

  if (shareToken) return <SharePage token={shareToken} />;
  if (isCheckingSession)
    return (
      <div className="auth-loading">
        <LoaderCircle className="spin" size={22} /> Loading your space...
      </div>
    );
  if (!user)
    return (
      <AuthPage
        onAuthenticated={({ user: authenticatedUser }) => {
          setUser(authenticatedUser);
          loadFiles();
        }}
      />
    );

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    uploadFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="/">
          <img
            className="brand-logo"
            src={BRAND_LOGO}
            alt="Tomorrow is Better logo"
          />
          <span>Tomorrow is Better</span>
        </a>
        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          <a className="sidebar-link is-current" href="#library">
            <FolderOpen size={17} /> Files <span>{files.length}</span>
          </a>
          <a className="sidebar-link" href="#recent">
            <Clock3 size={17} /> Recent
          </a>
          <a className="sidebar-link" href="#shared">
            <Star size={17} /> Shared links
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-storage">
            <div className="storage-meter">
              <span />
            </div>
            <strong>Local storage</strong>
            <span>{formatBytes(totalSize)} of 100 MB used</span>
          </div>
          <button
            className="sidebar-link sidebar-settings"
            type="button"
            onClick={() => setActiveView("profile")}
          >
            <Settings size={17} /> Settings
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <a className="brand" href="/">
              <img
                className="brand-logo"
                src={BRAND_LOGO}
                alt="Tomorrow is Better logo"
              />
              <span>Tomorrow is Better</span>
            </a>
          </div>
          <div className="topbar-right">
            <span className="secure-label">
              <ShieldCheck size={15} /> private by default
            </span>
            <div className="profile-wrap">
              <button
                className="avatar"
                type="button"
                aria-label="Account menu"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </button>
              {isProfileOpen && (
                <div className="profile-popover">
                  <div className="profile-heading">
                    <span className="profile-icon">
                      <UserRound size={17} />
                    </span>
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <div className="profile-divider" />
                  <button
                    className="profile-link"
                    type="button"
                    onClick={() => {
                      setActiveView("profile");
                      setIsProfileOpen(false);
                    }}
                  >
                    <UserRound size={16} /> View profile
                  </button>
                  <button
                    className="logout-button"
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("tomorrow-token");
                      setUser(null);
                      setFiles([]);
                    }}
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeView === "profile" ? (
          <ProfilePage
            user={user}
            onUserUpdated={setUser}
            onBack={() => setActiveView("files")}
          />
        ) : (
          <main className="content">
            <section className="intro-row" id="recent">
              <div>
                <p className="eyebrow">MONDAY, SEPTEMBER 06</p>
                <h1>
                  Your files,
                  <br />
                  <em>in one place.</em>
                </h1>
                <p className="intro-copy">
                  Upload, organize, and share the things that keep your work
                  moving.
                </p>
              </div>
              <div className="storage-note">
                <div className="storage-icon">
                  <HardDriveUpload size={19} />
                </div>
                <div>
                  <strong>Local storage</strong>
                  <span>Up to 100 MB per file</span>
                </div>
              </div>
            </section>

            <section
              className={`upload-zone ${isDragging ? "is-dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="upload-symbol">
                <UploadCloud size={25} />
              </div>
              <div className="upload-copy">
                <h2>
                  {isUploading ? "Uploading your file..." : "Drop a file here"}
                </h2>
                <p>or choose one from your device. Files stay yours.</p>
              </div>
              <button
                className="choose-button"
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <FolderOpen size={17} />
                )}
                {isUploading ? "Working" : "Choose file"}
              </button>
              <input
                ref={inputRef}
                type="file"
                hidden
                onChange={(event) => uploadFile(event.target.files[0])}
              />
            </section>

            {error && <div className="error-banner">{error}</div>}

            <section className="library-section" id="library">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE LIBRARY</p>
                  <h2>
                    Your files <span>{files.length}</span>
                  </h2>
                </div>
                <label className="search-box">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search files"
                  />
                </label>
              </div>

              <div className="stats-row">
                <div>
                  <strong>{files.length}</strong>
                  <span>files stored</span>
                </div>
                <div>
                  <strong>{formatBytes(totalSize)}</strong>
                  <span>total size</span>
                </div>
                <div>
                  <strong>
                    {files.reduce((sum, file) => sum + file.downloads, 0)}
                  </strong>
                  <span>downloads</span>
                </div>
              </div>

              <div className="file-table">
                <div className="table-header">
                  <span>FILE NAME</span>
                  <span>ADDED</span>
                  <span>SIZE</span>
                  <span>ACTIONS</span>
                </div>
                {filteredFiles.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <FileText size={23} />
                    </div>
                    <strong>
                      {query
                        ? "No files match that search"
                        : "Your library is waiting"}
                    </strong>
                    <span>Upload your first file above to get started.</span>
                  </div>
                ) : (
                  filteredFiles.map((file) => (
                    <div className="file-entry" key={file.id}>
                      <div className="file-row">
                        <div className="file-name">
                          <span className="file-type">
                            {fileIcon(file.type)}
                          </span>
                          <div>
                            <strong>{file.name}</strong>
                            <span>{file.downloads} downloads</span>
                          </div>
                        </div>
                        <span className="muted">
                          {formatDate(file.createdAt)}
                        </span>
                        <span className="muted">{formatBytes(file.size)}</span>
                        <div className="row-actions">
                          <button
                            className={`icon-button ${previewId === file.id ? "is-active" : ""}`}
                            type="button"
                            onClick={() =>
                              setPreviewId(
                                previewId === file.id ? null : file.id,
                              )
                            }
                            title="Preview file"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => copyShareLink(file)}
                            title="Copy share link"
                          >
                            {copiedId === file.id ? (
                              <Check size={17} />
                            ) : (
                              <Link2 size={17} />
                            )}
                          </button>
                          <a
                            className="icon-button"
                            href={`${API_URL}/files/${file.id}/download`}
                            title="Download file"
                          >
                            <ArrowDownToLine size={17} />
                          </a>
                          <button
                            className="icon-button"
                            type="button"
                            title="More actions"
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </div>
                      </div>
                      {previewId === file.id && (
                        <FilePreview
                          file={file}
                          onClose={() => setPreviewId(null)}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <footer>
              <span>
                <ShieldCheck size={14} /> Your files are stored privately.
              </span>
              <span>Share only with people you trust.</span>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
