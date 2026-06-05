import React from 'react'
import './Hero.css'
import desktopLogo from '../../assets/imgs/desktop_logo.svg'
import mobileLogo from '../../assets/imgs/mobile_logo.svg'

const Hero: React.FC = () => {
  return (
    <section id="hero" className="hero">
      <div className="hero__container hero__container--centered">
        <div className="hero__media">
          <div className="hero__media-frame">
            <picture>
        <source srcSet={desktopLogo} media="(min-width: 768px)" />
        <img src={mobileLogo} alt="deDouleur logo" className="hero__logo" />
      </picture>
          </div>
          <div className="hero__text-group">
            <p className="hero__role">contemporary artist</p>
            <p className="hero__subtitle">
              Creatin', explorin', makin' stuff look dope.
            </p>
          </div>
        </div>
      </div>
      <div className="hero__scroll-hint" aria-hidden="true">
        <span className="hero__scroll-hint-text">Scroll</span>
        <div className="hero__scroll-hint-icon-wrap">
          <span className="hero__scroll-hint-icon" />
        </div>
      </div>
    </section>
  )
}

export default Hero
