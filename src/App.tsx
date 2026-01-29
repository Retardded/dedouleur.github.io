import React, { useState, useEffect } from "react";
import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";
import Projects from "./components/Projects/Projects";
import Contact from "./components/Contact/Contact";
import Footer from "./components/Footer/Footer";
import { fetchProjects, type Project } from "./lib/api";
import { defaultProjects } from "./data/defaultProjects";
import { getCloudinaryVideoPoster } from "./lib/cloudinary";
import logoSvg from "./assets/imgs/logo.svg";
import "./App.css";

const PRELOAD_TIMEOUT_MS = 12000;

function collectPreviewUrls(projects: Project[]): string[] {
  const urls: string[] = [];
  for (const p of projects) {
    const type = p.type || "image";
    if (type === "video") {
      const poster =
        p.image || getCloudinaryVideoPoster(p.video, 3) || undefined;
      if (poster) urls.push(poster);
    } else if (p.image) {
      urls.push(p.image);
    }
  }
  return urls;
}

function preloadImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return Promise.resolve();
  return Promise.race([
    Promise.all(
      urls.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          }),
      ),
    ).then(() => undefined),
    new Promise<void>((resolve) =>
      setTimeout(resolve, PRELOAD_TIMEOUT_MS),
    ),
  ]);
}

const App: React.FC = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialProjects, setInitialProjects] = useState<Project[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const projects = await fetchProjects();
        if (!alive) return;
        const list = projects.length > 0 ? projects : defaultProjects;
        const urls = collectPreviewUrls(list);
        await preloadImages(urls);
        if (!alive) return;
        setInitialProjects(list);
      } catch {
        if (alive) setInitialProjects(defaultProjects);
      } finally {
        if (alive) setInitialLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (initialLoading) {
    return (
      <div className="app-loading" aria-busy="true" aria-label="Загрузка">
        <img
          src={logoSvg}
          alt=""
          className="app-loading__logo"
          width={80}
          height={80}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <Projects initialProjects={initialProjects} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default App;
