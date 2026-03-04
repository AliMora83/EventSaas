import React from 'react'

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode; componentName: string },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-100/50 text-red rounded-md m-4 border border-red-200">
                    <h2 className="text-lg font-bold mb-2">Crash in {this.props.componentName}</h2>
                    <pre className="text-xs font-mono whitespace-pre-wrap">{this.state.error?.message}</pre>
                    <pre className="text-xs font-mono whitespace-pre-wrap mt-2 text-red/70">{this.state.error?.stack}</pre>
                </div>
            )
        }
        return this.props.children
    }
}
