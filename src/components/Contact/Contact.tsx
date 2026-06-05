import React from 'react'
import './Contact.css'

const Contact: React.FC = () => {
  return (
    <section id="contact" className="contact">
      <div className="contact__container">
        <h2 className="section__title">Contact</h2>
        <div className="contact__content">
          <div className="contact__info">
            <p className="contact__text">
              Hit me up on socials:
            </p>
            <div className="contact__links">
              <a href="https://t.me/deDouleur" className="contact__link" target="_blank" rel="noopener noreferrer">tg @deDouleur</a>
              <a href="https://instagram.com/deddouleur" className="contact__link" target="_blank" rel="noopener noreferrer">inst @deddouleur</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
