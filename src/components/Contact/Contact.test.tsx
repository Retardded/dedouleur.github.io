import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import Contact from './Contact'

describe('Contact', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders contact section with title', () => {
    render(<Contact />)
    
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('shows social links', () => {
    render(<Contact />)
    expect(screen.getByText('tg @deDouleur')).toBeInTheDocument()
    expect(screen.getByText('inst @deddouleur')).toBeInTheDocument()
  })
})
