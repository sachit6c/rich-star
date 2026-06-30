import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-8" style={{ background: '#050810' }}>
        <p className="text-slate-300 text-sm tracking-wide text-center">
          Something went wrong loading the sky view.
        </p>
        <p className="text-slate-600 text-xs text-center font-mono">{this.state.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-5 py-2 rounded-full text-xs text-slate-400 border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
        >
          Reload
        </button>
      </div>
    )
  }
}
