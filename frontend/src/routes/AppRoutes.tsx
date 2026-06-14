import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthProvider'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGate } from '../components/layout/RoleGate'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { PatientsPage } from '../pages/PatientsPage'
import { AppointmentsPage } from '../pages/AppointmentsPage'
import { AttendQueuePage } from '../pages/AttendQueuePage'
import { ScanPage } from '../pages/ScanPage'
import { RecommendationsPage } from '../pages/RecommendationsPage'
import { AgendaPage } from '../pages/AgendaPage'
import { UsersPage } from '../pages/admin/UsersPage'
import { RolesPage } from '../pages/admin/RolesPage'
import { MedicosPage } from '../pages/admin/MedicosPage'
import { PatientProfilePage } from '../pages/PatientProfilePage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="/patients"
              element={
                <RoleGate allow={['especialista', 'secretaria', 'admin']}>
                  <PatientsPage />
                </RoleGate>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <RoleGate allow={['especialista', 'secretaria', 'admin']}>
                  <PatientProfilePage />
                </RoleGate>
              }
            />
            <Route
              path="/attend-queue"
              element={
                <RoleGate allow={['especialista', 'admin']}>
                  <AttendQueuePage />
                </RoleGate>
              }
            />
            <Route
              path="/agenda"
              element={
                <RoleGate allow={['especialista', 'admin']}>
                  <AgendaPage />
                </RoleGate>
              }
            />
            <Route
              path="/appointments"
              element={
                <RoleGate allow={['secretaria', 'admin']}>
                  <AppointmentsPage />
                </RoleGate>
              }
            />
            <Route
              path="/users"
              element={
                <RoleGate allow={['admin']}>
                  <UsersPage />
                </RoleGate>
              }
            />
            <Route
              path="/roles"
              element={
                <RoleGate allow={['admin']}>
                  <RolesPage />
                </RoleGate>
              }
            />
            <Route
              path="/medicos"
              element={
                <RoleGate allow={['admin']}>
                  <MedicosPage />
                </RoleGate>
              }
            />
            <Route
              path="/scan"
              element={
                <RoleGate allow={['especialista', 'admin']}>
                  <ScanPage />
                </RoleGate>
              }
            />
            <Route
              path="/recommendations"
              element={
                <RoleGate allow={['especialista', 'admin']}>
                  <RecommendationsPage />
                </RoleGate>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
