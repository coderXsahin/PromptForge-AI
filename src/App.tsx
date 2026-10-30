import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Bot,
  ChevronDown,
  Code2,
  Command,
  Eye,
  FileCode2,
  Globe,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Monitor,
  MoreHorizontal,
  Plus,
  Settings2,
  Smartphone,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import "./App.css";

const API_BASE = "http://localhost:8080/api";

type WebsiteProject = {
  id: number;
  title: string;
  prompt: string;
  html: string;
  createdAt: string;
};

const examples = [
  {
    title: "Portfolio website",
    description: "A minimal portfolio for a creative developer",
    icon: Code2,
    prompt:
      "Create a modern developer portfolio with a dark theme, a hero section, selected projects, skills, and a contact form.",
  },
  {
    title: "Online store",
    description: "A stylish storefront for a clothing brand",
    icon: Globe,
    prompt:
      "Build a premium clothing e-commerce homepage with product cards, a navigation bar, a shopping cart, and a beige and black color palette.",
  },
  {
    title: "SaaS landing page",
    description: "A polished landing page for a startup",
    icon: LayoutDashboard,
    prompt:
      "Create a modern SaaS landing page with a compelling hero, product features, pricing plans, testimonials, and a call-to-action.",
  },
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [view, setView] = useState<"builder" | "projects">("builder");
  const [projects, setProjects] = useState<WebsiteProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [savingProject, setSavingProject] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  async function loadProjects() {
    setProjectsLoading(true);
    setProjectsError("");

    try {
      const response = await fetch(`${API_BASE}/projects`);
      if (!response.ok) {
        throw new Error("Unable to load your projects.");
      }

      const data: WebsiteProject[] = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjectsError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend.",
      );
    } finally {
      setProjectsLoading(false);
    }
  }

  function openProjects() {
    setView("projects");
    setSidebarOpen(false);
    void loadProjects();
  }

  function startNewWebsite() {
    setView("builder");
    setPrompt("");
    setSubmittedPrompt("");
    setGeneratedHtml("");
    setError("");
    setSaveMessage("");
    setCurrentProjectId(null);
    setActiveTab("preview");
    setSidebarOpen(false);
  }

  async function generateWebsite() {
    const websitePrompt = prompt.trim();

    if (!websitePrompt || generating) return;

    setView("builder");
    setSubmittedPrompt(websitePrompt);
    setGenerating(true);
    setError("");
    setSaveMessage("");
    setCurrentProjectId(null);
    setGeneratedHtml("");
    setActiveTab("preview");

    try {
      const response = await fetch(`${API_BASE}/websites/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: websitePrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Website generation failed. Please try again.",
        );
      }

      if (!data.html) {
        throw new Error("The AI returned an empty website.");
      }

      setGeneratedHtml(data.html);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function saveProject() {
    if (!generatedHtml || !submittedPrompt || savingProject || currentProjectId) {
      return;
    }

    setSavingProject(true);
    setSaveMessage("");
    setError("");

    const projectTitle =
      submittedPrompt.length > 55
        ? `${submittedPrompt.slice(0, 55).trim()}…`
        : submittedPrompt;

    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: projectTitle,
          prompt: submittedPrompt,
          html: generatedHtml,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.detail || "Unable to save this project.",
        );
      }

      setCurrentProjectId(data.id);
      setSaveMessage("Project saved successfully.");
      setProjects((previous) => [
        data,
        ...previous.filter((project) => project.id !== data.id),
      ]);
    } catch (err) {
      setSaveMessage(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend.",
      );
    } finally {
      setSavingProject(false);
    }
  }

  async function openProject(projectId: number) {
    setProjectsError("");

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Unable to open this project.");
      }

      const project: WebsiteProject = await response.json();
      setPrompt(project.prompt);
      setSubmittedPrompt(project.prompt);
      setGeneratedHtml(project.html);
      setCurrentProjectId(project.id);
      setError("");
      setSaveMessage("");
      setActiveTab("preview");
      setView("builder");
      setSidebarOpen(false);
    } catch (err) {
      setProjectsError(
        err instanceof Error ? err.message : "Unable to open this project.",
      );
    }
  }

  async function deleteProject(projectId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete this project.");
      }

      setProjects((previous) =>
        previous.filter((project) => project.id !== projectId),
      );

      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
      }
    } catch (err) {
      setProjectsError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend.",
      );
    }
  }

  function selectExample(examplePrompt: string) {
    setView("builder");
    setPrompt(examplePrompt);
    setSubmittedPrompt("");
    setGeneratedHtml("");
    setError("");
    setSaveMessage("");
    setCurrentProjectId(null);
    setActiveTab("preview");
    setSidebarOpen(false);
  }

  function downloadWebsite() {
    if (!generatedHtml) return;

    const blob = new Blob([generatedHtml], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "promptforge-website.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function formatProjectDate(dateValue: string) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <WandSparkles size={21} />
          </div>
          <span>
            promptforge<span className="brand-ai">.ai</span>
          </span>
          <button
            className="icon-button sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <button className="new-project-button" onClick={startNewWebsite}>
          <Plus size={18} />
          <span>New website</span>
          <span className="shortcut">⌘ K</span>
        </button>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${view === "builder" ? "active" : ""}`}
            onClick={() => {
              setView("builder");
              setSidebarOpen(false);
            }}
          >
            <LayoutDashboard size={18} />
            <span>Builder</span>
          </button>
          <button
            className={`nav-item ${view === "projects" ? "active" : ""}`}
            onClick={openProjects}
          >
            <FileCode2 size={18} />
            <span>My projects</span>
            <span className="nav-count">{projects.length}</span>
          </button>
        </nav>

        <div className="sidebar-label templates-label">GET STARTED</div>
        <div className="sidebar-nav">
          <button
            className="nav-item"
            onClick={() => selectExample(examples[0].prompt)}
          >
            <Code2 size={18} />
            <span>Portfolio</span>
          </button>
          <button
            className="nav-item"
            onClick={() => selectExample(examples[1].prompt)}
          >
            <Globe size={18} />
            <span>E-commerce</span>
          </button>
          <button
            className="nav-item"
            onClick={() => selectExample(examples[2].prompt)}
          >
            <Sparkles size={18} />
            <span>Landing page</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={17} />
            </div>
            <strong>Your ideas, built with AI.</strong>
            <p>Turn your next big idea into a website.</p>
            <span className="upgrade-link">
              Explore the builder <ArrowRight size={14} />
            </span>
          </div>

          <button className="profile-button">
            <div className="avatar">P</div>
            <div className="profile-info">
              <strong>My workspace</strong>
              <span>Free plan</span>
            </div>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-muted">Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">
              {view === "projects" ? "My projects" : "New website"}
            </span>
            <ChevronDown size={15} className="breadcrumb-chevron" />
          </div>

          <div className="topbar-actions">
            <span className="connection-status">
              <span className="status-dot" /> Ready to create
            </span>
            <button
              className="icon-button settings-button"
              aria-label="Settings"
              onClick={() => alert("Settings will be added later.")}
            >
              <Settings2 size={18} />
            </button>
            <button className="avatar topbar-avatar">P</button>
          </div>
        </header>

        {view === "projects" ? (
          <section
            className="projects-view"
            style={{
              width: "100%",
              height: "100%",
              minHeight: 0,
              overflowY: "auto",
              padding: "clamp(22px, 4vw, 42px)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-icon">
                    <FileCode2 size={13} />
                  </span>
                  YOUR WORKSPACE
                </div>
                <h1 style={{ margin: "12px 0 8px" }}>My projects</h1>
                <p className="welcome-description" style={{ margin: 0 }}>
                  Your saved websites, ready to open and continue editing.
                </p>
              </div>
              <button
                className="generate-button"
                onClick={startNewWebsite}
                style={{ width: "auto", margin: 0 }}
              >
                <Plus size={17} />
                New website
              </button>
            </div>

            {projectsLoading ? (
              <div className="generated-placeholder">
                <LoaderCircle size={26} className="spin" />
                <h2>Loading your projects...</h2>
              </div>
            ) : projectsError ? (
              <div className="generated-placeholder">
                <h2>Couldn't load projects</h2>
                <p>{projectsError}</p>
                <button className="preview-cta" onClick={() => void loadProjects()}>
                  Try again
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-preview">
                <div className="generated-icon">
                  <FileCode2 size={27} />
                </div>
                <h2>No saved projects yet.</h2>
                <p>
                  Generate a website and save it to find it here whenever you
                  need it.
                </p>
                <button className="preview-cta" onClick={startNewWebsite}>
                  <Sparkles size={15} />
                  Create your first website
                </button>
              </div>
            ) : (
              <div
                className="project-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                  gap: 18,
                }}
              >
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="project-card"
                    style={{
                      minWidth: 0,
                      padding: 20,
                      border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
                      borderRadius: 16,
                      background: "var(--card-background, rgba(255,255,255,0.025))",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 18,
                      }}
                    >
                      <div className="example-icon">
                        <FileCode2 size={19} />
                      </div>
                      <button
                        className="icon-button"
                        title="Delete project"
                        aria-label={`Delete ${project.title}`}
                        onClick={() => void deleteProject(project.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <h3 style={{ margin: "0 0 9px", overflowWrap: "anywhere" }}>
                      {project.title}
                    </h3>
                    <p
                      style={{
                        margin: "0 0 16px",
                        opacity: 0.72,
                        fontSize: 13,
                        lineHeight: 1.55,
                        minHeight: 40,
                      }}
                    >
                      {project.prompt}
                    </p>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.6,
                        marginBottom: 17,
                      }}
                    >
                      Saved {formatProjectDate(project.createdAt)}
                    </div>
                    <button
                      className="preview-cta"
                      style={{ width: "100%" }}
                      onClick={() => void openProject(project.id)}
                    >
                      <Eye size={15} />
                      Open project
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="workspace">
            <section className="creation-panel">
              <div className="welcome-block">
                <div className="eyebrow">
                  <span className="eyebrow-icon">
                    <Sparkles size={13} />
                  </span>
                  YOUR AI WEBSITE BUILDER
                </div>

                <h1>
                  Imagine it.
                  <br />
                  <span>We'll build it.</span>
                </h1>

                <p className="welcome-description">
                  Describe your idea in plain English. Turn it into a website
                  that's uniquely yours.
                </p>
              </div>

              <div className="prompt-card">
                <div className="prompt-card-header">
                  <div className="prompt-label">
                    <WandSparkles size={16} />
                    <span>Describe your website</span>
                  </div>
                  <span className="prompt-ai-label">AI POWERED</span>
                </div>

                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void generateWebsite();
                    }
                  }}
                  placeholder="Create a beautiful website for..."
                  rows={5}
                  maxLength={4000}
                  aria-label="Describe the website you want to create"
                />

                <div className="prompt-card-footer">
                  <span className="prompt-hint">
                    <Command size={13} /> Enter to submit
                  </span>
                  <span className="character-count">{prompt.length}/4000</span>
                </div>

                <button
                  className="generate-button"
                  onClick={() => void generateWebsite()}
                  disabled={!prompt.trim() || generating}
                >
                  {generating ? (
                    <LoaderCircle size={17} className="spin" />
                  ) : (
                    <Sparkles size={17} />
                  )}
                  {generating ? "Preparing preview..." : "Generate website"}
                  {!generating && <ArrowRight size={17} />}
                </button>
              </div>

              <div className="examples-section">
                <div className="section-heading">
                  <span>NEED SOME INSPIRATION?</span>
                  <span className="heading-sparkle">
                    <Sparkles size={14} />
                  </span>
                </div>

                <div className="example-list">
                  {examples.map((example) => {
                    const ExampleIcon = example.icon;

                    return (
                      <button
                        key={example.title}
                        className="example-card"
                        onClick={() => selectExample(example.prompt)}
                      >
                        <div className="example-icon">
                          <ExampleIcon size={19} />
                        </div>
                        <div className="example-copy">
                          <strong>{example.title}</strong>
                          <span>{example.description}</span>
                        </div>
                        <ArrowRight size={16} className="example-arrow" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="creation-footer">
                <span>
                  <Bot size={15} /> Your creativity, amplified.
                </span>
                <span>Built for your next big idea.</span>
              </div>
            </section>

            <section className="preview-panel">
              <div className="preview-toolbar">
                <div className="preview-toolbar-left">
                  <div className="preview-live-dot" />
                  <span>LIVE PREVIEW</span>
                  <span className="preview-divider">/</span>
                  <span className="preview-name">
                    {submittedPrompt ? "Your website" : "Untitled project"}
                  </span>
                </div>

                <div className="preview-toolbar-right">
                  <div className="preview-tabs">
                    <button
                      className={activeTab === "preview" ? "selected" : ""}
                      onClick={() => setActiveTab("preview")}
                    >
                      <Eye size={15} /> Preview
                    </button>
                    <button
                      className={activeTab === "code" ? "selected" : ""}
                      onClick={() => setActiveTab("code")}
                    >
                      <Code2 size={15} /> Code
                    </button>
                  </div>

                  <div className="device-switcher">
                    <button
                      aria-label="Desktop preview"
                      title="Desktop preview"
                      className={previewMode === "desktop" ? "selected" : ""}
                      onClick={() => setPreviewMode("desktop")}
                    >
                      <Monitor size={16} />
                    </button>
                    <button
                      aria-label="Mobile preview"
                      title="Mobile preview"
                      className={previewMode === "mobile" ? "selected" : ""}
                      onClick={() => setPreviewMode("mobile")}
                    >
                      <Smartphone size={16} />
                    </button>
                  </div>

                  {generatedHtml && !currentProjectId && (
                    <button
                      className="preview-cta"
                      onClick={() => void saveProject()}
                      disabled={savingProject}
                      title="Save this website to My projects"
                    >
                      {savingProject ? (
                        <LoaderCircle size={15} className="spin" />
                      ) : (
                        <Plus size={15} />
                      )}
                      {savingProject ? "Saving..." : "Save"}
                    </button>
                  )}

                  {generatedHtml && currentProjectId && (
                    <span
                      className="prompt-ai-label"
                      title="This project is saved in your library"
                    >
                      SAVED
                    </span>
                  )}

                  <button
                    className="icon-button export-button"
                    title="Export website"
                    aria-label="Export website"
                    onClick={downloadWebsite}
                    disabled={!generatedHtml}
                  >
                    <ArrowDownToLine size={17} />
                  </button>
                </div>
              </div>

              {saveMessage && (
                <div
                  role="status"
                  style={{
                    padding: "8px 16px",
                    fontSize: 12,
                    color: currentProjectId ? "inherit" : "#f0a0a0",
                  }}
                >
                  {saveMessage}
                </div>
              )}

              <div className="preview-canvas">
                {activeTab === "preview" ? (
                  <div
                    className={`browser-frame ${
                      previewMode === "mobile" ? "mobile-frame" : ""
                    }`}
                  >
                    <div className="browser-chrome">
                      <div className="browser-dots">
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="browser-address">
                        <Globe size={12} />
                        <span>your-website.preview</span>
                      </div>
                      <MoreHorizontal size={17} className="browser-more" />
                    </div>

                    {generatedHtml ? (
                      <iframe
                        title="Generated website preview"
                        srcDoc={generatedHtml}
                        sandbox="allow-scripts"
                        className="generated-website-frame"
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          minHeight: "500px",
                          border: 0,
                          background: "#ffffff",
                        }}
                      />
                    ) : generating ? (
                      <div className="generated-placeholder">
                        <div className="generated-icon">
                          <LoaderCircle size={27} className="spin" />
                        </div>
                        <h2>Building your website...</h2>
                        <p>
                          Your AI developer is turning your idea into a real
                          website.
                        </p>
                      </div>
                    ) : error ? (
                      <div className="generated-placeholder">
                        <div className="generated-icon">
                          <Bot size={27} />
                        </div>
                        <h2>Generation failed</h2>
                        <p>{error}</p>
                        <button
                          className="preview-cta"
                          onClick={() => void generateWebsite()}
                        >
                          <Sparkles size={15} />
                          Try again
                        </button>
                      </div>
                    ) : (
                      <div className="empty-preview">
                        <div className="empty-preview-art">
                          <div className="art-window">
                            <div className="art-topbar">
                              <span />
                              <span />
                              <span />
                            </div>
                            <div className="art-content">
                              <div className="art-sparkle">
                                <Sparkles size={24} />
                              </div>
                              <div className="art-line art-line-long" />
                              <div className="art-line art-line-short" />
                              <div className="art-button" />
                              <div className="art-cards">
                                <span />
                                <span />
                                <span />
                              </div>
                            </div>
                          </div>
                          <div className="floating-sparkle sparkle-one">
                            <Sparkles size={17} />
                          </div>
                          <div className="floating-sparkle sparkle-two">
                            <WandSparkles size={20} />
                          </div>
                        </div>

                        <h2>Your canvas awaits.</h2>
                        <p>
                          Every great website begins with an idea.
                          <br />
                          Tell us yours to see it come to life.
                        </p>
                        <button
                          className="preview-cta"
                          onClick={() =>
                            document.querySelector("textarea")?.focus()
                          }
                        >
                          <Sparkles size={15} />
                          Start creating
                        </button>
                      </div>
                    )}
                  </div>
                ) : generatedHtml ? (
                  <div
                    className="generated-code-panel"
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: "500px",
                      overflow: "auto",
                      padding: "20px",
                      boxSizing: "border-box",
                      background: "#111318",
                      color: "#e6e6e6",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <strong>Generated HTML</strong>
                      <button
                        className="preview-cta"
                        onClick={() =>
                          void navigator.clipboard.writeText(generatedHtml)
                        }
                      >
                        Copy code
                      </button>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        fontSize: "12px",
                        lineHeight: 1.6,
                        fontFamily: "Consolas, Monaco, monospace",
                      }}
                    >
                      <code>{generatedHtml}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="code-placeholder">
                    <div className="code-placeholder-icon">
                      <FileCode2 size={26} />
                    </div>
                    <h2>
                      {error
                        ? "Website generation failed."
                        : "Your code will live here."}
                    </h2>
                    <p>
                      {error
                        ? error
                        : "Generate a website to start working with its source files."}
                    </p>
                    <span>HTML · CSS · JavaScript</span>
                  </div>
                )}
              </div>

              <div className="preview-statusbar">
                <div className="statusbar-left">
                  <span className="status-dot" />
                  <span>
                    {generating
                      ? "Generating website..."
                      : error
                        ? "Generation failed"
                        : generatedHtml
                          ? currentProjectId
                            ? "Saved project"
                            : "Website generated"
                          : "No website generated"}
                  </span>
                </div>
                <div className="statusbar-right">
                  <span>{previewMode === "desktop" ? "100%" : "Mobile"}</span>
                  <span className="statusbar-divider">|</span>
                  <span>Preview environment</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
