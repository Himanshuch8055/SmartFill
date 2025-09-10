import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import FeaturesPage from './pages/Features'
import HowPage from './pages/How'
import FAQPage from './pages/FAQ'
import InstallPage from './pages/Install'
import DocsPage from './pages/Docs'
import ChangelogPage from './pages/Changelog'
import StatusPage from './pages/Status'
import PrivacyPage from './pages/Privacy'
import TermsPage from './pages/Terms'
import ContactPage from './pages/Contact'

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how" element={<HowPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
