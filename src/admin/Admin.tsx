import React, { useState, useEffect } from "react";
import "./Admin.css";
import {
  fetchProjects,
  saveProjects,
  uploadImage,
  verifyAdminPin,
  Project,
} from "../lib/api";
import { defaultProjects } from "../data/defaultProjects";

// Функция сжатия изображения
const compressImage = (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Вычисляем новые размеры с сохранением пропорций
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Конвертируем в base64 с заданным качеством
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const Admin: React.FC = () => {
  const [projects, setProjectsState] = useState<Project[]>(defaultProjects);
  const projectsRef = React.useRef(projects);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const [pin, setPin] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Restore auth from stored PIN (and validate against server)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const storedPin = localStorage.getItem("admin_pin");
        if (!storedPin) {
          if (alive) setIsAuthorized(false);
          return;
        }

        const ok = await verifyAdminPin(storedPin);
        if (!alive) return;
        if (ok) {
          setIsAuthorized(true);
        } else {
          localStorage.removeItem("admin_pin");
          setIsAuthorized(false);
        }
      } catch {
        if (alive) setIsAuthorized(false);
      } finally {
        if (alive) setIsAuthChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Загружаем проекты с сервера при монтировании и при авторизации
  useEffect(() => {
    if (isAuthorized) {
      loadProjects();
    } else {
      // Если не авторизован, просто показываем дефолтные проекты
      setIsLoading(false);
      setProjectsState(defaultProjects);
    }
  }, [isAuthorized]);

  const loadProjects = async () => {
    if (!isAuthorized) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Добавляем таймаут для запроса
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 5000);
    });

    try {
      const serverProjects = (await Promise.race([
        fetchProjects(),
        timeoutPromise,
      ])) as Project[];

      if (serverProjects && serverProjects.length > 0) {
        setProjectsState(serverProjects);
        setSaveStatus("");
      } else {
        // Если на сервере нет проектов, используем дефолтные
        setProjectsState(defaultProjects);
        setSaveStatus(
          "ℹ️ No projects on server. Using defaults. Add projects and save.",
        );
        setTimeout(() => setSaveStatus(""), 5000);
      }
    } catch (error: any) {
      console.error("Failed to load projects:", error);
      // Используем дефолтные проекты если сервер недоступен
      setProjectsState(defaultProjects);
      const errorMsg = error?.message || "Unknown error";
      if (errorMsg.includes("timeout") || errorMsg.includes("not available")) {
        setSaveStatus(
          "⚠️ Server offline. Using default projects. Start server to save changes.",
        );
      } else {
        setSaveStatus(
          `⚠️ Error loading projects: ${errorMsg}. Using defaults.`,
        );
      }
      setTimeout(() => setSaveStatus(""), 7000);
    } finally {
      setIsLoading(false);
    }
  };

  const addProject = () => {
    const id = projects.length ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
    const p: Project = {
      id,
      title: "New project",
      description: "",
      year: String(new Date().getFullYear()),
      category: "Uncategorized",
    };
    setProjectsState([p, ...projects]);
  };

  const updateProject = (id: number, patch: Partial<Project>) => {
    setProjectsState(
      projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  };

  const deleteProject = (id: number) => {
    setProjectsState(projects.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("💾 Saving...");

    try {
      const success = await saveProjects(projects);

      if (success) {
        setSaveStatus("✓ Saved successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        throw new Error("Failed to save to server");
      }
    } catch (error: any) {
      console.error("Save error:", error);
      const errorMsg = error?.message || "Unknown error";
      setSaveStatus(`✗ Save failed: ${errorMsg}`);
      setTimeout(() => setSaveStatus(""), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imported = JSON.parse(String(reader.result));
          if (Array.isArray(imported)) {
            setProjectsState(imported);
            // Автоматически сохраняем импортированные данные
            const success = await saveProjects(imported);
            if (success) {
              setSaveStatus("✓ Imported and saved successfully!");
            } else {
              setSaveStatus("⚠️ Imported but failed to save to server");
            }
          } else if (imported.projects && Array.isArray(imported.projects)) {
            setProjectsState(imported.projects);
            const success = await saveProjects(imported.projects);
            if (success) {
              setSaveStatus("✓ Imported and saved successfully!");
            } else {
              setSaveStatus("⚠️ Imported but failed to save to server");
            }
          } else {
            throw new Error("Invalid format");
          }
          setTimeout(() => setSaveStatus(""), 3000);
        } catch (error) {
          setSaveStatus("✗ Import failed: Invalid JSON format");
          setTimeout(() => setSaveStatus(""), 3000);
        }
      };
      reader.readAsText(f);
    } catch (error) {
      setSaveStatus("✗ Import failed");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSaving(true);

    const newProjects: Project[] = [];
    let successful = 0;
    let failed = 0;
    const fileArray = Array.from(files);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setSaveStatus(
          `⏳ Uploading ${i + 1}/${fileArray.length}: ${file.name}`,
        );

        try {
          let fileToUpload = file;
          const isVideo = file.type.startsWith("video/");

          // Only compress images, skip compression for videos
          if (!isVideo) {
            const compressedDataUrl = await compressImage(file);
            const response = await fetch(compressedDataUrl);
            const blob = await response.blob();
            fileToUpload = new File([blob], file.name, {
              type: "image/jpeg",
            });
          }

          // Upload the file (compressed image or original video)
          const imageUrl = await uploadImage(fileToUpload);

          if (imageUrl) {
            // Create project with auto-detected type
            newProjects.push({
              id: 0,
              title: file.name.split(".")[0] || "New Project",
              description: "",
              year: String(new Date().getFullYear()),
              category: "Uncategorized",
              image: isVideo ? undefined : imageUrl,
              video: isVideo ? imageUrl : undefined,
              type: isVideo ? "video" : "image",
            });
            successful++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`Failed to process ${file.name}`, err);
          failed++;
        }
      }

      if (newProjects.length > 0) {
        // Вычисляем новые ID
        const currentProjects = projectsRef.current;
        const currentMaxId =
          currentProjects.length > 0
            ? Math.max(...currentProjects.map((p) => p.id))
            : 0;

        const adjustedNewProjects = newProjects.map((p, index) => ({
          ...p,
          id: currentMaxId + index + 1,
        }));

        const updatedProjectsList = [
          ...adjustedNewProjects,
          ...currentProjects,
        ];

        // Обновляем стейт
        setProjectsState(updatedProjectsList);

        // Автоматически сохраняем
        setSaveStatus(`💾 Saving ${successful} new projects...`);
        const saveSuccess = await saveProjects(updatedProjectsList);

        if (saveSuccess) {
          setSaveStatus(
            `✓ Added and saved ${successful} images. ${failed > 0 ? `(${failed} failed)` : ""}`,
          );
        } else {
          setSaveStatus(
            `⚠️ Added ${successful} images but failed to save to server.`,
          );
        }
      } else {
        setSaveStatus(
          failed > 0 ? "✗ All uploads failed" : "No images processed",
        );
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      setSaveStatus("✗ Bulk upload failed");
    } finally {
      setIsSaving(false);
      e.target.value = "";
      setTimeout(() => setSaveStatus(""), 5000);
    }
  };

  const authorize = async () => {
    setSaveStatus("");
    setIsAuthChecking(true);
    try {
      const ok = await verifyAdminPin(pin);
      if (ok) {
        localStorage.setItem("admin_pin", pin);
        setPin("");
        setIsAuthorized(true);
      } else {
        alert("Wrong PIN");
      }
    } finally {
      setIsAuthChecking(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="admin admin--auth">
        <h2>Admin — enter PIN</h2>
        {isAuthChecking ? (
          <div style={{ opacity: 0.75, marginBottom: "0.75rem" }}>
            Checking…
          </div>
        ) : null}
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          onKeyPress={(e) => e.key === "Enter" && authorize()}
        />
        <button onClick={authorize} disabled={isAuthChecking || pin.length === 0}>
          Enter
        </button>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <h2>Admin Panel</h2>
          {saveStatus && <span className="admin__status">{saveStatus}</span>}
        </div>
        <div className="admin__actions">
          <button
            className="admin__btn admin__btn--primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "💾 Saving..." : "💾 Save Changes"}
          </button>
          <button className="admin__btn" onClick={addProject}>
            + Add Project
          </button>
          <label className="admin__btn admin__btn--import">
            📷 Bulk Upload
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleBulkUpload}
            />
          </label>
          <button className="admin__btn" onClick={handleExport}>
            📥 Export JSON
          </button>
          <label className="admin__btn admin__btn--import">
            📤 Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
            />
          </label>
          <button
            className="admin__btn"
            onClick={() => {
              const images = projects.filter(
                (pr) => (pr.type || "image") === "image",
              );
              const videos = projects.filter((pr) => pr.type === "video");
              setProjectsState([...images, ...videos]);
              setSaveStatus(
                "↕️ Videos moved to bottom. Click «Save Changes» to persist.",
              );
              setTimeout(() => setSaveStatus(""), 4000);
            }}
          >
            ↕️ Videos to bottom
          </button>
        </div>
      </header>

      <section className="admin__section">
        <h3>Gallery Projects</h3>
        <p className="admin__hint">
          Upload images, edit details, and click "Save Changes" to persist your
          updates.
        </p>
        {isLoading && projects.length === 0 ? (
          <div className="admin__loading">Loading projects...</div>
        ) : (
          <div className="admin__list">
            {projects.map((p) => (
              <div key={p.id} className="admin__item">
                <div className="admin__item-preview">
                  {p.image && p.image !== "loading..." ? (
                    <img
                      src={p.image}
                      alt={p.title || "Preview"}
                      className="admin__preview-img"
                    />
                  ) : p.image === "loading..." ? (
                    <div className="admin__preview-placeholder">
                      Compressing...
                    </div>
                  ) : (
                    <div className="admin__preview-placeholder">No image</div>
                  )}
                </div>
                <div className="admin__item-fields">
                  <div className="admin__field">
                    <label>Title</label>
                    <input
                      value={p.title}
                      onChange={(e) =>
                        updateProject(p.id, { title: e.target.value })
                      }
                      placeholder="Project title"
                    />
                  </div>
                  <div className="admin__field-group">
                    <div className="admin__field">
                      <label>Year</label>
                      <input
                        type="text"
                        value={p.year}
                        onChange={(e) =>
                          updateProject(p.id, { year: e.target.value })
                        }
                        placeholder="2024"
                        style={{ width: 100 }}
                      />
                    </div>
                    <div className="admin__field">
                      <label>Category</label>
                      <input
                        value={p.category}
                        onChange={(e) =>
                          updateProject(p.id, { category: e.target.value })
                        }
                        placeholder="Category"
                        style={{ width: 150 }}
                      />
                    </div>
                  </div>
                  <div className="admin__field-group">
                    <div className="admin__field">
                      <label>Type</label>
                      <select
                        value={p.type || "image"}
                        onChange={(e) =>
                          updateProject(p.id, {
                            type: e.target.value as "image" | "video",
                          })
                        }
                        style={{ width: 100 }}
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    {p.type === "video" && (
                      <div className="admin__field" style={{ flex: 1 }}>
                        <label>Video Source</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            value={p.video || ""}
                            onChange={(e) =>
                              updateProject(p.id, { video: e.target.value })
                            }
                            placeholder="https://... or upload"
                            style={{ flex: 1 }}
                          />
                          <label
                            className="admin__btn"
                            style={{
                              padding: "0.5rem",
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            📁
                            <input
                              type="file"
                              accept="video/*"
                              style={{ display: "none" }}
                              onChange={async (e) => {
                                const f = e.target.files && e.target.files[0];
                                if (!f) return;

                                const originalVideo = p.video;
                                updateProject(p.id, { video: "uploading..." });

                                try {
                                  // Upload video directly
                                  const videoUrl = await uploadImage(f);

                                  if (videoUrl) {
                                    updateProject(p.id, { video: videoUrl });
                                    setSaveStatus(
                                      '✓ Video uploaded. Click "Save Changes".',
                                    );
                                    setTimeout(() => setSaveStatus(""), 3000);
                                  } else {
                                    throw new Error("Upload failed");
                                  }
                                } catch (error) {
                                  console.error("Video upload error:", error);
                                  updateProject(p.id, { video: originalVideo });
                                  setSaveStatus("✗ Failed to upload video");
                                  setTimeout(() => setSaveStatus(""), 3000);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="admin__field">
                    <label>Description</label>
                    <textarea
                      value={p.description}
                      onChange={(e) =>
                        updateProject(p.id, { description: e.target.value })
                      }
                      placeholder="Project description (optional)"
                      rows={3}
                    />
                  </div>
                  <div className="admin__field">
                    <label>
                      {p.type === "video" ? "Cover Image" : "Image"}
                    </label>
                    <label className="admin__file-label">
                      {p.image && p.image !== "loading..."
                        ? p.type === "video"
                          ? "🖼️ Change Cover"
                          : "🖼️ Change Image"
                        : p.type === "video"
                          ? "📷 Upload Cover"
                          : "📷 Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;

                          // Показываем индикатор загрузки
                          const originalImage = p.image;
                          updateProject(p.id, { image: "loading..." });

                          try {
                            // Сжимаем изображение
                            const compressedDataUrl = await compressImage(f);

                            // Конвертируем base64 в Blob для загрузки на сервер
                            const response = await fetch(compressedDataUrl);
                            const blob = await response.blob();
                            const compressedFile = new File([blob], f.name, {
                              type: "image/jpeg",
                            });

                            // Загружаем на сервер
                            const imageUrl = await uploadImage(compressedFile);

                            if (imageUrl) {
                              updateProject(p.id, { image: imageUrl });
                              setSaveStatus(
                                '✓ Image uploaded. Click "Save Changes" to persist.',
                              );
                              setTimeout(() => setSaveStatus(""), 3000);
                            } else {
                              throw new Error("Upload failed");
                            }
                          } catch (error) {
                            console.error("Image upload error:", error);
                            updateProject(p.id, { image: originalImage });
                            setSaveStatus("✗ Failed to upload image");
                            setTimeout(() => setSaveStatus(""), 3000);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <button
                    className="admin__btn admin__btn--danger"
                    onClick={() => {
                      if (confirm(`Delete "${p.title}"?`)) {
                        deleteProject(p.id);
                      }
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Admin;
