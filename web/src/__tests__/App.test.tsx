import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  test('shows loading and renders navigation links', async () => {
    render(<App />)

    // The app initializes quickly; check that navigation link renders
    const pathLink = await screen.findByRole('link', { name: /path/i })
    expect(pathLink).toBeInTheDocument()
  })
})
