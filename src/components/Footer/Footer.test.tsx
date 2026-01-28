import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('renders footer with copyright text', () => {
    render(<Footer />)
    
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument()
    expect(screen.getByText(/Portfolio/)).toBeInTheDocument()
  })
})
