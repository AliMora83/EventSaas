import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Budget } from '@/pages/Budget'
import { Stock } from '@/pages/Stock'
import { Timeline } from '@/pages/Timeline'
import { Proposals } from '@/pages/Proposals'
import { Visual } from '@/pages/Visual'
import { Settings } from '@/pages/Settings'
import { Admin } from '@/pages/Admin'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Private — wrapped in AppLayout (handles auth guard) */}
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/proposals" element={<Proposals />} />
            <Route path="/visual" element={<Visual />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
