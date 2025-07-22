import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App'

// Mock fetch for testing
globalThis.fetch = vi.fn()

const mockFetch = globalThis.fetch as any

test('renders App component', () => {
  // Setup fetch mocks
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('package.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: '4.4.9' })
      })
    }
    return Promise.resolve({
      ok: false
    })
  })

  render(<App />)

  // Check if the loading text appears initially
  expect(screen.getByText(/Loading Client API Documentation/i)).toBeInTheDocument()
})

test('renders header with correct branding', () => {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('package.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ version: '4.4.9' })
      })
    }
    return Promise.resolve({
      ok: false
    })
  })

  render(<App />)

  // Check for Fjell Client API branding
  expect(screen.getByText('Fjell')).toBeInTheDocument()
  expect(screen.getByText('Client API')).toBeInTheDocument()
  expect(screen.getByText('HTTP client library for modern applications')).toBeInTheDocument()
})
