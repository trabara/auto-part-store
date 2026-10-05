import { expandMenuItems } from "./menu";

/** Source of the virtual module `virtual:medusa-router-ext/runtime`. */
export const RUNTIME_SOURCE = `
export ${expandMenuItems.toString()}

import React, { Suspense } from "react"
import { useLocation, useParams } from "react-router-dom"

class Boundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }
  render() {
    if (this.state.error) {
      return React.createElement(this.props.fallback, {
        error: this.state.error,
        reset: () => this.setState({ error: null }),
      })
    }
    return this.props.children
  }
}

function LocationBoundary(props) {
  const { pathname } = useLocation()
  return React.createElement(Boundary, { ...props, resetKey: pathname })
}

/** Wraps a page with its layout.tsx chain (outermost first), loading.tsx and error.tsx. */
export function withBoundaries(Page, layouts = [], opts = {}) {
  function RouteWithBoundaries(props) {
    let el = React.createElement(Page, props)
    if (opts.Error) el = React.createElement(LocationBoundary, { fallback: opts.Error }, el)
    if (opts.Loading) el = React.createElement(Suspense, { fallback: React.createElement(opts.Loading) }, el)
    for (let i = layouts.length - 1; i >= 0; i--) el = React.createElement(layouts[i], null, el)
    return el
  }
  RouteWithBoundaries.displayName = "RouteWithBoundaries(" + (Page.displayName || Page.name || "Page") + ")"
  return RouteWithBoundaries
}

/** Segments matched by a catch-all: /docs/a/b -> ["a", "b"] */
export function useCatchAll() {
  const splat = useParams()["*"]
  return splat ? splat.split("/").filter(Boolean) : []
}
`;
