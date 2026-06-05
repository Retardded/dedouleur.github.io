import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

describe('Header', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn()
    // Создаем мок для getElementById
    document.getElementById = jest.fn((id: string) => {
      const element = document.createElement('div')
      element.id = id
      element.scrollIntoView = jest.fn()
      return element
    })
  })

  it('renders header with logo and navigation', () => {
    render(<Header />)
    
    expect(screen.getByText('deDouleur')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('toggles mobile menu when menu button is clicked', () => {
    render(<Header />)
    
    const menuButton = screen.getByLabelText('Toggle menu')
    const nav = screen.getByText('Projects').closest('nav')
    
    expect(nav).not.toHaveClass('header__nav--open')
    
    fireEvent.click(menuButton)
    expect(nav).toHaveClass('header__nav--open')
    
    fireEvent.click(menuButton)
    expect(nav).not.toHaveClass('header__nav--open')
  })

  it('scrolls to section when navigation link is clicked', () => {
    const mockScrollIntoView = jest.fn()
    const mockElement = {
      scrollIntoView: mockScrollIntoView,
    } as unknown as HTMLElement
    
    document.getElementById = jest.fn(() => mockElement)
    
    render(<Header />)
    
    const aboutLink = screen.getByText('Projects')
    fireEvent.click(aboutLink)
    
    // Проверяем, что функция была вызвана
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })
})
