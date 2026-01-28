import React from 'react'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import Projects from './components/Projects/Projects'
import Contact from './components/Contact/Contact'
import Footer from './components/Footer/Footer'
import './App.css'

const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default App
