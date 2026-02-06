import React, { useState, useEffect, useRef } from "react";
import "./Projects.css";
import { fetchProjects, type Project } from "../../lib/api";
import { defaultProjects } from "../../data/defaultProjects";
import {
  getCloudinaryVideoPoster,
  getCloudinaryIOSVideoSrc,
} from "../../lib/cloudinary";

type ProjectsProps = { initialProjects?: Project[] };

const Projects: React.FC<ProjectsProps> = ({ initialProjects }) => {
  const [projects, setProjects] = useState<Project[]>(
    initialProjects ?? defaultProjects,
  );
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [videoFailed, setVideoFailed] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const [sectionInView, setSectionInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (initialProjects != null && initialProjects.length > 0) return;
    loadProjects();
  }, [initialProjects]);

  // Section in view: animate header (title + filter)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setSectionInView(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const loadProjects = async () => {
    try {
      const serverProjects = await fetchProjects();
      if (serverProjects.length > 0) {
        setProjects(serverProjects);
      } else {
        setProjects(defaultProjects);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects(defaultProjects);
    }
  };

  const filteredProjects = projects
    .filter((project) => {
      const type = project.type || "image";
      return filter === "all" || type === filter;
    })
    .sort((a, b) => {
      // Images first, videos at the bottom
      const typeA = a.type || "image";
      const typeB = b.type || "image";
      if (typeA === "video" && typeB !== "video") return 1;
      if (typeA !== "video" && typeB === "video") return -1;
      return 0;
    });

  // Scroll-triggered animations: mark items visible when they enter the viewport
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredProjects.length);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const i = el.getAttribute("data-gallery-index");
          if (i != null) setVisibleIndices((prev) => new Set([...prev, Number(i)]));
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.1 }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [filteredProjects.length]);

  const currentProject =
    selectedImageIndex !== null ? filteredProjects[selectedImageIndex] : null;

  // Reset per-modal state when switching items
  useEffect(() => {
    setVideoFailed(false);
  }, [selectedImageIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => {
          if (prev === null || filteredProjects.length === 0) return null;
          return (prev - 1 + filteredProjects.length) % filteredProjects.length;
        });
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => {
          if (prev === null || filteredProjects.length === 0) return null;
          return (prev + 1) % filteredProjects.length;
        });
      }
    };

    if (selectedImageIndex !== null) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedImageIndex, filteredProjects.length]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && filteredProjects.length > 0) {
      setSelectedImageIndex((selectedImageIndex + 1) % filteredProjects.length);
    }
  };

  const handlePrevious = () => {
    if (selectedImageIndex !== null && filteredProjects.length > 0) {
      setSelectedImageIndex(
        (selectedImageIndex - 1 + filteredProjects.length) %
          filteredProjects.length,
      );
    }
  };

  return (
    <section
      id="projects"
      ref={sectionRef}
      className={`projects ${sectionInView ? "projects--in-view" : ""}`}
    >
      <div className="projects__container">
        <h2 className="section__title">Gallery</h2>
        <div className="projects__filter">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => {
              setFilter("all");
              setSelectedImageIndex(null);
              setVisibleIndices(new Set());
            }}
          >
            all
          </button>
          <button
            className={filter === "image" ? "active" : ""}
            onClick={() => {
              setFilter("image");
              setSelectedImageIndex(null);
              setVisibleIndices(new Set());
            }}
          >
            imgs
          </button>
          <button
            className={filter === "video" ? "active" : ""}
            onClick={() => {
              setFilter("video");
              setSelectedImageIndex(null);
              setVisibleIndices(new Set());
            }}
          >
            vids
          </button>
        </div>
        <div className="projects__gallery">
          {filteredProjects.map((project, index) => (
            <figure
              key={project.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              data-gallery-index={index}
              className={`gallery__item ${visibleIndices.has(index) ? "gallery__item--visible" : ""}`}
              style={{ ["--i" as string]: index }}
            >
              <div
                className="gallery__image-wrap"
                onClick={() => handleImageClick(index)}
              >
                {project.type === "video" ? (
                  (() => {
                    const poster =
                      project.image ||
                      getCloudinaryVideoPoster(project.video, 3) ||
                      undefined;
                    return poster ? (
                      <>
                        <img src={poster} alt={project.title} />
                        <div className="gallery__play-badge" aria-hidden="true">
                          ▶
                        </div>
                      </>
                    ) : (
                      <div className="gallery__video-placeholder">
                        Video preview unavailable
                      </div>
                    );
                  })()
                ) : (
                  project.image && <img src={project.image} alt={project.title} />
                )}
              </div>
            </figure>
          ))}
        </div>
      </div>

      {currentProject && selectedImageIndex !== null && (
        <div className="modal" onClick={handleCloseModal}>
          <button
            className="modal__close"
            onClick={handleCloseModal}
            aria-label="Close"
          >
            ×
          </button>
          <button
            className="modal__nav modal__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            aria-label="Previous image"
          >
            <span>‹</span>
          </button>
          <button
            className="modal__nav modal__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
          >
            <span>›</span>
          </button>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            {currentProject.type === "video" ? (
              videoFailed ? (
                currentProject.image ||
                getCloudinaryVideoPoster(currentProject.video, 3) ? (
                  <img
                    src={
                      currentProject.image ||
                      getCloudinaryVideoPoster(currentProject.video, 3) ||
                      ""
                    }
                    alt={currentProject.title}
                    className="modal__image"
                  />
                ) : (
                  <div style={{ color: "white" }}>
                    Video could not be loaded.
                  </div>
                )
              ) : (
                <video
                  src={
                    getCloudinaryIOSVideoSrc(currentProject.video) ||
                    currentProject.video
                  }
                  controls
                  playsInline
                  preload="metadata"
                  poster={
                    currentProject.image ||
                    getCloudinaryVideoPoster(currentProject.video, 3) ||
                    undefined
                  }
                  className="modal__image"
                  onError={() => setVideoFailed(true)}
                />
              )
            ) : (
              currentProject.image && (
                <img
                  src={currentProject.image}
                  alt={currentProject.title}
                  className="modal__image"
                />
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Projects;
