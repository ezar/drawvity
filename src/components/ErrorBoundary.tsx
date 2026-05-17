import { Component } from 'react'
import type { ReactNode } from 'react'
import { palette, toy } from '../theme/toy'

interface Props  { children: ReactNode }
interface State  { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: palette.paper,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 32, fontFamily: 'Nunito',
      }}>
        <div style={{ fontSize: 48 }}>💥</div>
        <h2 style={{ fontFamily: 'Caprasimo, serif', fontSize: 28, color: palette.ink, margin: 0 }}>
          Something broke
        </h2>
        <p style={{ color: palette.inkSoft, fontSize: 14, maxWidth: 320, textAlign: 'center', margin: 0 }}>
          {this.state.error.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            height: 44, padding: '0 24px',
            background: palette.primary, color: '#fff',
            border: 'none', borderRadius: 999,
            fontFamily: 'Caprasimo, serif', fontSize: 16,
            cursor: 'pointer', boxShadow: toy.shadow,
          }}
        >
          Reload game
        </button>
      </div>
    )
  }
}
