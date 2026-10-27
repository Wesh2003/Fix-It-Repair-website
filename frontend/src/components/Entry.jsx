import React from 'react';
import { Link } from 'react-router-dom';
import '../css/EntryPage.css';

function Entry() {
  return (
    <main className="entry-page">
      <header className="entry-header">
        <Link className="entry-brand" to="/" aria-label="FixIt home">
          <span className="entry-brand-mark" aria-hidden="true">F</span>
          <span>Fix<span>It</span></span>
        </Link>
        <nav className="entry-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#services">What we fix</a>
        </nav>
        <div className="entry-header-actions">
          <Link className="entry-login-link" to="/studentlogin">Log in</Link>
          <Link className="entry-header-cta" to="/studentregister">Get started</Link>
        </div>
      </header>

      <section className="entry-hero" aria-labelledby="entry-heading">
        <div className="entry-hero-copy">
          <p className="entry-eyebrow"><span aria-hidden="true" /> CAMPUS REPAIRS, MADE SIMPLE</p>
          <h1 id="entry-heading">Something broken on Campus? <span>We’ll help fix it.</span></h1>
          <p className="entry-intro">
            From a leaky tap to a faulty light, post the problem and connect with a repair
            professional. Less time dealing with repairs, more time for student life.
          </p>
          <div className="entry-hero-actions">
            <Link className="entry-primary-cta" to="/studentregister">
              Post a repair request <span aria-hidden="true">→</span>
            </Link>
            <Link className="entry-secondary-cta" to="/studentlogin">I already have an account</Link>
          </div>
          <div className="entry-trust-note">
            <span className="entry-trust-icon" aria-hidden="true">✓</span>
            Keep your repair details and updates together in one place
          </div>
        </div>

        <div className="entry-hero-visual" role="img" aria-label="Example repair request status">
          <div className="entry-orbit entry-orbit-one" />
          <div className="entry-orbit entry-orbit-two" />
          <div className="entry-spark entry-spark-one" aria-hidden="true">✳</div>
          <div className="entry-spark entry-spark-two" aria-hidden="true">✳</div>
          <article className="entry-request-card">
            <div className="entry-card-topline">
              <span className="entry-card-label">YOUR REPAIR REQUEST</span>
              <span className="entry-card-menu" aria-hidden="true">•••</span>
            </div>
            <div className="entry-request-icon" aria-hidden="true">⌁</div>
            <p className="entry-request-category">PLUMBING</p>
            <h2>Leaking bathroom tap</h2>
            <p className="entry-request-description">Water keeps dripping even when the tap is off.</p>
            <div className="entry-request-divider" />
            <div className="entry-status-row">
              <span className="entry-status-dot" />
              <span>Request received</span>
              <span className="entry-status-time">Just now</span>
            </div>
            <div className="entry-progress-track"><span /></div>
            <div className="entry-request-footer">
              <span className="entry-avatar" aria-hidden="true">JD</span>
              <span>We’ll keep you posted</span>
              <span className="entry-footer-arrow" aria-hidden="true">↗</span>
            </div>
          </article>
          <div className="entry-floating-note">
            <span className="entry-floating-check" aria-hidden="true">✓</span>
            <span><strong>Easy to track</strong><small>Every step, in one place</small></span>
          </div>
        </div>
      </section>

      <section className="entry-services" id="services" aria-labelledby="services-heading">
        <div>
          <p className="entry-section-kicker">A HAND WITH THE EVERYDAY</p>
          <h2 id="services-heading">Repairs big and small.</h2>
        </div>
        <p className="entry-services-description">
          Tell us what needs attention and we’ll help get it to the right hands.
        </p>
        <div className="entry-service-list" aria-label="Example repair categories">
          <span><i className="entry-service-symbol entry-water" aria-hidden="true">↝</i> Plumbing</span>
          <span><i className="entry-service-symbol entry-bolt" aria-hidden="true">ϟ</i> Electrical</span>
          <span><i className="entry-service-symbol entry-home" aria-hidden="true">⌂</i> General repairs</span>
        </div>
      </section>

      <section className="entry-steps" id="how-it-works" aria-labelledby="steps-heading">
        <div className="entry-steps-heading">
          <p className="entry-section-kicker">A BETTER WAY TO GET IT SORTED</p>
          <h2 id="steps-heading">Three steps to fixed.</h2>
        </div>
        <div className="entry-step-grid">
          <article className="entry-step">
            <span className="entry-step-number">01</span>
            <h3>Tell us what’s wrong</h3>
            <p>Describe the issue and where it needs fixing. It only takes a moment.</p>
          </article>
          <article className="entry-step">
            <span className="entry-step-number">02</span>
            <h3>Get connected</h3>
            <p>Your request can be matched with a repair professional who handles that kind of job.</p>
          </article>
          <article className="entry-step">
            <span className="entry-step-number">03</span>
            <h3>Follow the progress</h3>
            <p>Check your request status as your repair moves from received to complete.</p>
          </article>
        </div>
      </section>

      <footer className="entry-footer">
        <Link className="entry-brand entry-footer-brand" to="/">
          <span className="entry-brand-mark" aria-hidden="true">F</span>
          <span>Fix<span>It</span></span>
        </Link>
        <p>Making student spaces work better.</p>
        <Link to="/studentregister">Start with your first request <span aria-hidden="true">→</span></Link>
      </footer>
    </main>
  );
}

export default Entry;
