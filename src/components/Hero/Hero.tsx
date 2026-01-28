import React from 'react'
import './Hero.css'
import photo from '../../assets/imgs/logo.svg'

const Hero: React.FC = () => {

  return (
    <section id="hero" className="hero">
      <div className="hero__container hero__container--centered">
        <div className="hero__media">
          <div className="hero__media-frame">
            <img src={photo} alt="deDouleur logo" />
          </div>
        </div>
        <div className="hero__content">
          <p className="hero__subtitle">
            Creatin', explorin', makin' stuff look dope.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Hero
