import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// Fallback images as local placeholders (in case needed)
const logoFallback = '/images/fallback-logo.png';
const doctorImageFallback = '/images/fallback-doctor.jpg';
const doctorPatientImageFallback = '/images/fallback-doctor-patient.jpg';

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <header className="header">
        <div className="logo">
          <img
            src="/logo.avif"
            alt="App-Orthane"
            onError={(e) => (e.target.src = logoFallback)}
          />
          <h2>App-Orthane</h2>
        </div>
        <nav className="navigation">
          <ul>
            <li><a href="#home">Accueil</a></li>
            <li><a href="#about">À propos</a></li>
            <li><a href="#features">Fonctionnalités</a></li>
            <li><a href="#testimonials">Témoignages</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
        <div className="auth-buttons">
          <Link to="/login" className="btn-secondary">Se connecter</Link>
          <Link to="/register" className="btn-primary">S'inscrire</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-content">
          <div className="badge">#1 Plateforme Médicale</div>
          <h1>La solution complète pour votre gestion hospitalière</h1>
          <p>
            App-Orthane est conçue pour simplifier la gestion des images médicales DICOM 
            et optimiser le flux de travail dans votre établissement de santé.
          </p>
          <Link to="/register" className="cta-button">Commencer</Link>
        </div>
        <div className="hero-image-container">
          <div className="circle-background"></div>
          <img
            src="/images/doctor.jpg"
            alt="Médecin professionnel"
            className="doctor-image"
            onError={(e) => (e.target.src = doctorImageFallback)}
          />
          <div className="stat-card">
            <div className="stat-icon">❤️</div>
            <div className="stat-content">
              <span className="stat-number">+200K</span>
              <span className="stat-label">Patients</span>
            </div>
          </div>
          <div className="review-card">
            <div className="stars">★★★★★</div>
            <p>"Application très professionnelle, améliore considérablement notre workflow médical"</p>
          </div>
        </div>
      </section>

      {/* Healthcare Solutions Section */}
      <section className="solutions-section">
        <div className="solution-image">
          <img
            src="/images/doctor-patient.jpg"
            alt="Médecin avec patient"
            onError={(e) => (e.target.src = doctorPatientImageFallback)}
          />
          <div className="solution-badge">
            <span>Où que vous soyez, nous sommes prêts</span>
            <div className="heart-icon">❤️</div>
          </div>
        </div>
        <div className="solution-content">
          <h2>Où que vous soyez</h2>
          <h3>Nos Solutions Adaptées</h3>
          <p>
            Notre plateforme s'adapte à tous les établissements de santé, 
            quelle que soit leur taille ou leur spécialité. Nous offrons des solutions 
            personnalisées pour répondre à vos besoins spécifiques.
          </p>
          <a href="#contact" className="read-more">En savoir plus</a>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="section-header">
          <h2>À Propos de App-Orthane</h2>
        </div>
        <div className="about-content">
          <div className="about-text">
            <p>
              App-Orthane est une plateforme innovante dédiée à la gestion hospitalière moderne. 
              Notre mission est de simplifier les processus complexes des établissements de santé, 
              en offrant des outils puissants pour gérer les images médicales DICOM, optimiser les flux 
              de travail et améliorer l’expérience des patients et des professionnels de santé.
            </p>
            <p>
              Fondée par une équipe de passionnés de la santé et de la technologie, App-Orthane combine 
              expertise médicale et innovation numérique pour répondre aux besoins uniques de chaque établissement.
            </p>
          </div>
          <div className="about-image">
            <img
              src="/images/about-team.jpg"
              alt="Équipe App-Orthane"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2>Nos Fonctionnalités</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-image-container">
              <img
                src="/images/dicom-icon.png"
                alt="DICOM Icon"
                className="feature-image"
              />
            </div>
            <h3>Gestion des Images DICOM</h3>
            <p>Visualisez, stockez et partagez facilement des images médicales DICOM en toute sécurité.</p>
            <a href="#dicom" className="feature-btn">En savoir plus</a>
          </div>
          <div className="feature-card highlighted">
            <div className="feature-image-container">
              <img
                src="/images/appointment-icon.png"
                alt="Appointment Icon"
                className="feature-image"
              />
            </div>
            <h3>Prise de Rendez-vous</h3>
            <p>Planifiez et gérez les rendez-vous des patients avec une interface intuitive.</p>
            <a href="#appointment" className="feature-btn">En savoir plus</a>
          </div>
          <div className="feature-card">
            <div className="feature-image-container">
              <img
                src="/images/analytics-icon.png"
                alt="Analytics Icon"
                className="feature-image"
              />
            </div>
            <h3>Analyse de Données</h3>
            <p>Obtenez des insights grâce à des rapports détaillés sur les performances de votre établissement.</p>
            <a href="#analytics" className="feature-btn">En savoir plus</a>
          </div>
          <div className="feature-card">
            <div className="feature-image-container">
              <img
                src="/images/security-icon.png"
                alt="Security Icon"
                className="feature-image"
              />
            </div>
            <h3>Sécurité des Données</h3>
            <p>Protégez les données des patients avec des protocoles de sécurité avancés.</p>
            <a href="#security" className="feature-btn">En savoir plus</a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <h2>Témoignages de Nos Utilisateurs</h2>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p>"App-Orthane a transformé notre manière de gérer les patients. C’est un outil indispensable !"</p>
            <span className="testimonial-author">Dr. Marie Dupont, Cardiologue</span>
          </div>
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p>"La prise de rendez-vous est devenue tellement simple grâce à cette plateforme."</p>
            <span className="testimonial-author">Sophie Martin, Patient</span>
          </div>
          <div className="testimonial-card">
            <div className="stars">★★★★☆</div>
            <p>"Un excellent support client et une interface très intuitive. Je recommande !"</p>
            <span className="testimonial-author">Dr. Ahmed Benali, Radiologue</span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="section-header">
          <h2>Contactez-Nous</h2>
        </div>
        <div className="contact-content">
          <div className="contact-info">
            <h3>Informations de Contact</h3>
            <p><strong>Email :</strong> support@app-orthane.com</p>
            <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
            <p><strong>Adresse :</strong> 123 Rue de la Santé, 75001 Paris, France</p>
          </div>
          <div className="contact-form">
            <h3>Envoyez-nous un Message</h3>
            <form>
              <div className="form-group">
                <label htmlFor="name">Nom</label>
                <input type="text" id="name" name="name" placeholder="Votre nom" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Votre email" required />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" placeholder="Votre message" rows="5" required></textarea>
              </div>
              <button type="submit" className="btn-primary">Envoyer</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;