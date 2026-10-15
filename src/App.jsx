import { Toaster } from "@/components/ui/toaster"
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from '@/lib/cartStore';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/auth-context';
// Add page imports here
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Tutorials from '@/pages/Tutorials';
import Admin from '@/pages/Admin';
import AdminPrank from '@/pages/AdminPrank';
import Account from '@/pages/Account';
import ResetPassword from '@/pages/ResetPassword';
import PageNotFound from '@/pages/PageNotFound';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin border-2 border-primary/30 border-t-primary rounded-full" />
        <p className="mt-4 font-mono-tech text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/tutorials" element={<Tutorials />} />
            <Route path="/console" element={<Admin />} />
            <Route path="/admin" element={<AdminPrank />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </CartProvider>
      <Toaster />
    </Router>
  )
}

export default App
