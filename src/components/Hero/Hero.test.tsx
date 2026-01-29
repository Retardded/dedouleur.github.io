import React from 'react'
import { render, screen } from '@testing-library/react'
import Hero from './Hero'

describe('Hero', () => {
  it('renders hero section with logo, role, and subtitle', () => {
    render(<Hero />)

    expect(screen.getByAltText('deDouleur logo')).toBeInTheDocument()
    expect(screen.getByText('graphic designer')).toBeInTheDocument()
    expect(screen.getByText(/Creatin'|makin' stuff/)).toBeInTheDocument()
  })
})
