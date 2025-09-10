import React from 'react'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Steps from '../components/Steps'
import Privacy from '../components/Privacy'
import FAQ from '../components/FAQ'
import Install from '../components/Install'

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Features />
      <Steps />
      <Privacy />
      <FAQ />
      <Install />
    </main>
  )
}
