import React, { useState, useEffect } from "react";
import "./Projects.css";
import { fetchProjects } from "../../lib/api";
import { defaultProjects } from "../../data/defaultProjects";
import sample from "../../assets/imgs/logo.svg";

const Projects: React.FC = () => {
  const [projects, setProjects] = useState(defaultProjects);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    loadProjects();
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

  const filteredProjects = projects.filter((project) => {
    const type = project.type || "image";
    return filter === "all" || type === filter;
  });

  const currentProject =
    selectedImageIndex !== null ? filteredProjects[selectedImageIndex] : null;

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
    <section id="projects" className="projects">
      <div className="projects__container">
        <h2 className="section__title">Gallery</h2>
        <div className="projects__filter">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => {
              setFilter("all");
              setSelectedImageIndex(null);
            }}
          >
            all
          </button>
          <button
            className={filter === "image" ? "active" : ""}
            onClick={() => {
              setFilter("image");
              setSelectedImageIndex(null);
            }}
          >
            imgs
          </button>
          <button
            className={filter === "video" ? "active" : ""}
            onClick={() => {
              setFilter("video");
              setSelectedImageIndex(null);
            }}
          >
            vids
          </button>
        </div>
        <div className="projects__gallery">
          {filteredProjects.map((project, index) => (
            <figure key={project.id} className="gallery__item">
              <div
                className="gallery__image-wrap"
                onClick={() => handleImageClick(index)}
              >
                {project.type === "video" ? (
                  <video
                    src={project.video}
                    muted
                    loop
                    playsInline
                    poster={project.image}
                    onMouseOver={(e) => e.currentTarget.play()}
                    onMouseOut={(e) => e.currentTarget.pause()}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <img src={project.image || sample} alt={project.title} />
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
              <video
                src={currentProject.video}
                controls
                autoPlay
                className="modal__image"
              />
            ) : (
              <img
                src={currentProject.image || sample}
                alt={currentProject.title}
                className="modal__image"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Projects;
