import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import Header from "./components/Header"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import DramaDetails from "./pages/DramaDetails"
import AddDrama from "./pages/AddDrama"
import EditDrama from "./pages/EditDrama"
import ManageDramas from "./pages/ManageDramas"
import Favorites from "./pages/Favorites"
import Movies from "./pages/Movies"
import Series from "./pages/Series"
import Genres from "./pages/Genres"
import TopRated from "./pages/TopRated"
import Search from "./pages/Search"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminRoute from "./components/AdminRoute"
import { AuthProvider } from "./contexts/AuthContext"
import { FavoritesProvider } from "./contexts/FavoritesContext"
import ManageUsers from "./pages/ManageUsers";
import "./style.css"

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <Router>
          <Header />
          <main className="main-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dramas/:id" element={<DramaDetails />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/series" element={<Series />} />
              <Route path="/genres" element={<Genres />} />
              <Route path="/genres/:genre" element={<Genres />} />
              <Route path="/top" element={<TopRated />} />
              <Route path="/search" element={<Search />} />

              {/* Protected Routes (require authentication) */}
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/add"
                element={
                  <AdminRoute>
                    <AddDrama />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/edit/:id"
                element={
                  <AdminRoute>
                    <EditDrama />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/manage"
                element={
                  <AdminRoute>
                    <ManageDramas />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/users"
                element={                 
                  <AdminRoute>                  
                    <ManageUsers />
                  </AdminRoute>
                }
              />

              {/* Redirects */}
              <Route path="/tovarform" element={<Navigate to="/admin/add" replace />} />
              <Route path="/tovaritem" element={<Navigate to="/admin/manage" replace />} />
              <Route path="/tovars" element={<Navigate to="/admin/manage" replace />} />

              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <ToastContainer position="bottom-right" />
        </Router>
      </FavoritesProvider>
    </AuthProvider>
  )
}

export default App
