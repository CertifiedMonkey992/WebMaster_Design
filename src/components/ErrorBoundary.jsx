/* ═══════════════════════════════════════════════════════════════════════════
   ErrorBoundary.jsx — WHEN A PAGE THROWS
   ---------------------------------------------------------------------------
   A render error anywhere below would otherwise unmount the whole tree and
   leave a blank page. This catches it and offers the one useful action:
   reload. Progress is already persisted by the provider, so nothing is
   lost by doing so.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error('[page]', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main id="main" className="page-loading" role="alert">
        <p className="page-loading-text">Something went wrong.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    )
  }
}
