export type Project = {
  id: number
  title: string
  description: string
  year: string
  category: string
  image?: string
  video?: string
  type?: 'image' | 'video'
}

export type Skill = {
  name: string
  category: string
}

const PROJECTS_KEY = 'projects_v1'
const SKILLS_KEY = 'skills_v1'

export function getProjects(defaults: Project[] = []) : Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    if (!raw) return defaults
    return JSON.parse(raw) as Project[]
  } catch {
    return defaults
  }
}

export function setProjects(projects: Project[]) {
  try {
    const dataString = JSON.stringify(projects)
    localStorage.setItem(PROJECTS_KEY, dataString)
    // Проверяем, что данные действительно сохранились
    const saved = localStorage.getItem(PROJECTS_KEY)
    if (saved !== dataString) {
      throw new Error('Data was not saved correctly')
    }
  } catch (error: any) {
    // Пробрасываем ошибку дальше для обработки в UI
    if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
      throw new Error('Storage quota exceeded. Please reduce image sizes or delete some projects.')
    }
    throw error
  }
}

export function getSkills(defaults: Skill[] = []) : Skill[] {
  try {
    const raw = localStorage.getItem(SKILLS_KEY)
    if (!raw) return defaults
    return JSON.parse(raw) as Skill[]
  } catch {
    return defaults
  }
}

export function setSkills(skills: Skill[]) {
  try {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skills))
  } catch {}
}

export function exportAll() {
  const data = {
    projects: getProjects(),
    skills: getSkills(),
  }
  return JSON.stringify(data, null, 2)
}

export function importAll(json: string) {
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed.projects)) setProjects(parsed.projects)
    if (Array.isArray(parsed.skills)) setSkills(parsed.skills)
    return true
  } catch {
    return false
  }
}
