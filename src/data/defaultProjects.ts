import { Project } from '../lib/storage'

export const defaultProjects: Project[] = [
  {
    id: 1,
    title: 'fivecorner',
    description: 'Created a streetwear brand with identic design.',
    year: '2024',
    category: 'Branding',
    type: 'image',
  },
  {
    id: 2,
    title: 'Web Platform',
    description: 'Interface and UX design for a project management platform.',
    year: '2024',
    category: 'Web Design',
    type: 'image',
  },
  {
    id: 3,
    title: 'Mobile App',
    description: 'UI/UX design for a mobile app focused on simplicity and usability.',
    year: '2023',
    category: 'UI/UX',
    type: 'image',
  },
  {
    id: 4,
    title: 'Showreel',
    description: 'Motion design showreel showcasing various animation projects.',
    year: '2024',
    category: 'Motion',
    type: 'video',
    video: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
]
