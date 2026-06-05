import React from 'react'
import { render, screen } from '@testing-library/react'
import Projects from './Projects'

describe('Projects', () => {
  it('renders projects section with title', () => {
    render(<Projects />)
    
    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('renders project cards', () => {
    render(<Projects />)
    
    expect(screen.getByText('fivecorner')).toBeInTheDocument()
    expect(screen.getByText('Web Platform')).toBeInTheDocument()
    expect(screen.getByText('Mobile App')).toBeInTheDocument()
  })

  it('renders project years', () => {
    render(<Projects />)
    
    const years2024 = screen.getAllByText(/2024/)
    expect(years2024.length).toBeGreaterThan(0)
    expect(screen.getByText(/2023/)).toBeInTheDocument()
  })

  it('renders project categories', () => {
    render(<Projects />)
    
    expect(screen.getByText(/Branding/)).toBeInTheDocument()
    expect(screen.getByText(/Web Design/)).toBeInTheDocument()
    expect(screen.getByText(/UI\/UX/)).toBeInTheDocument()
  })
})
