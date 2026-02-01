import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading-spinner'

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('renders with default size', () => {
      render(<LoadingSpinner />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('h-6', 'w-6') // md size
    })

    it('renders with small size', () => {
      render(<LoadingSpinner size="sm" />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('renders with medium size', () => {
      render(<LoadingSpinner size="md" />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-6', 'w-6')
    })

    it('renders with large size', () => {
      render(<LoadingSpinner size="lg" />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-class" />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('custom-class')
    })

    it('has animate-spin class for animation', () => {
      render(<LoadingSpinner />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('has primary text color', () => {
      render(<LoadingSpinner />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('text-primary')
    })
  })
})

describe('LoadingPage', () => {
  describe('rendering', () => {
    it('renders with default message', () => {
      render(<LoadingPage />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders with custom message', () => {
      render(<LoadingPage message="Please wait..." />)
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
    })

    it('contains a large spinner', () => {
      render(<LoadingPage />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-8', 'w-8') // lg size
    })
  })

  describe('layout', () => {
    it('has centered flex container', () => {
      const { container } = render(<LoadingPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
    })

    it('has minimum height', () => {
      const { container } = render(<LoadingPage />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('min-h-[400px]')
    })
  })
})
