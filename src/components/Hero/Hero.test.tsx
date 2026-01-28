import React from 'react'
import { render, screen } from '@testing-library/react'
import Hero from './Hero'

describe('Hero', () => {
  it('renders hero section with title and subtitle', () => {
    render(<Hero />)
    
    expect(screen.getByText('deDouleur')).toBeInTheDocument()
    expect(screen.getByText(/Creatin'|makin' stuff/)).toBeInTheDocument()
  })
})
