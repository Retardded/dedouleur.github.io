import React from 'react'
import './Hero.css'
import photo from '../../assets/imgs/logo.svg'

const Hero: React.FC = () => {
  return (
    <section id="hero" className="hero">
      <div className="hero__container hero__container--centered">
        <div className="hero__media">
          <div className="hero__media-frame">
            <img src={photo} alt="deDouleur logo" className="hero__logo" />
          </div>
          <p className="hero__role">contemporary artist</p>
        </div>
        <div className="hero__content">
          <p className="hero__subtitle">
            Creatin', explorin', makin' stuff look dope.
          </p>
        </div>
      </div>
      <div className="hero__scroll-hint" aria-hidden="true">
        <span className="hero__scroll-hint-text">Scroll</span>
        <span className="hero__scroll-hint-icon" />
      </div>
    </section>
  )
}

export default Hero
