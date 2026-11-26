import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
    }
  }

  componentDidCatch() {}

  handleReload = () => {
    this.setState({ hasError: false, message: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="login-screen">
          <div className="login-card">
            <div className="login-brand">
              <div className="logo-mark">S</div>
              <div>
                <strong>Salvia</strong>
                <span>RESTAURANT OS</span>
              </div>
            </div>
            <div className="login-error" style={{ textAlign: 'center', padding: '20px' }}>
              <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>
                Error de aplicación
              </strong>
              <p style={{ fontSize: '11px', lineHeight: '1.5', margin: 0 }}>
                {this.state.message}
              </p>
              <button
                className="primary"
                style={{ marginTop: '16px', width: '100%' }}
                onClick={this.handleReload}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
