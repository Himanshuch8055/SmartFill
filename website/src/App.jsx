import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import PrivacyPage from './pages/Privacy'
import ChangelogPage from './pages/Changelog'
import NotFound from './pages/NotFound'

const HOME_TITLE = 'SmartFill: fill any form in one click'

// Scroll to the top on page changes, or to the #section in the URL.
function ScrollManager() {
  const { pathname, hash } = useLocation()
  React.useEffect(() => {
    if (pathname === '/') document.title = HOME_TITLE
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn btn-secondary btn-sm">
        Skip to content
      </a>
      <ScrollManager />
      <Navbar />
      <main id="content" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
