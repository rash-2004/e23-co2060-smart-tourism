import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './HomePage.css';
import { FaMapMarkerAlt, FaRoute, FaUserTie, FaSearch } from 'react-icons/fa';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const isGuide = user?.role === 'guide';

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <motion.main 
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <section className="hero">
        <motion.div 
          className="hero-content"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={fadeInUp}>
            {isGuide ? 'Welcome Back, Travel Guide' : 'Discover the World, Plan Your Journey'}
          </motion.h1>
          <motion.p variants={fadeInUp}>
            {isGuide
              ? 'Manage your booking requests, update your guide profile, and connect with tourists.'
              : 'Smart Tourism Management System - Your Complete Travel Companion'}
          </motion.p>
          <motion.div className="hero-buttons" variants={fadeInUp}>
            {isGuide ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  My Dashboard
                </Link>
                <Link to="/clients" className="btn btn-success btn-large">
                  Client Requests
                </Link>
              </>
            ) : (
              <>
                <Link to="/places" className="btn btn-primary btn-large">
                  Explore Places
                </Link>
                {!isAuthenticated() ? (
                  <Link to="/register" className="btn btn-success btn-large">
                    Get Started
                  </Link>
                ) : (
                  <Link to="/itinerary" className="btn btn-success btn-large">
                    Plan Your Trip
                  </Link>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features">
        <motion.div 
          className="container"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeInUp}>{isGuide ? 'Powerful Guide Tools' : 'Why Choose Us?'}</motion.h2>
          <motion.div className="features-grid">
            <motion.div className="feature-card" variants={fadeInUp} whileHover={{ y: -10, transition: { duration: 0.2 } }}>
              <FaMapMarkerAlt className="feature-icon" />
              <h3>{isGuide ? 'Manage Requests' : 'Explore Places'}</h3>
              <p>
                {isGuide
                  ? 'Review and respond to traveler requests, set quotes, and confirm bookings.'
                  : 'Discover thousands of amazing travel destinations with detailed information and reviews.'}
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={fadeInUp} whileHover={{ y: -10, transition: { duration: 0.2 } }}>
              <FaRoute className="feature-icon" />
              <h3>{isGuide ? 'Update Your Profile' : 'Plan Itineraries'}</h3>
              <p>
                {isGuide
                  ? 'Keep your guide profile, photos, locations, and experience up to date.'
                  : 'Create custom travel itineraries and organize places in a logical travel sequence.'}
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={fadeInUp} whileHover={{ y: -10, transition: { duration: 0.2 } }}>
              <FaUserTie className="feature-icon" />
              <h3>{isGuide ? 'Connect with Tourists' : 'Travel Guides'}</h3>
              <p>
                {isGuide
                  ? 'Use the chat feature to stay in touch with tourists and clarify details.'
                  : 'Connect with experienced travel guides to enhance your journey with local insights.'}
              </p>
            </motion.div>

            <motion.div className="feature-card" variants={fadeInUp} whileHover={{ y: -10, transition: { duration: 0.2 } }}>
              <FaSearch className="feature-icon" />
              <h3>{isGuide ? 'Build Your Visibility' : 'Smart Search'}</h3>
              <p>
                {isGuide
                  ? 'Get discovered by travelers looking for local expertise and tour support.'
                  : 'Find places using advanced search algorithms - by name, location, or proximity.'}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <motion.div 
          className="container"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeInUp}>{isGuide ? 'How Guide Accounts Work' : 'How It Works'}</motion.h2>
          <div className="steps">
            {isGuide ? (
              <>
                <motion.div className="step" variants={fadeInUp}>
                  <div className="step-number">1</div>
                  <h3>Complete Your Profile</h3>
                  <p>Add experience, languages, photos, and service locations.</p>
                </motion.div>

                <motion.div className="step" variants={fadeInUp}>
                  <div className="step-number">2</div>
                  <h3>Receive Requests</h3>
                  <p>Get notified when tourists send guide booking requests.</p>
                </motion.div>

                <motion.div className="step" variants={fadeInUp}>
                  <div className="step-number">3</div>
                  <h3>Quote and Chat</h3>
                  <p>Provide prices, talk with tourists, and confirm bookings fast.</p>
                </motion.div>

                <motion.div className="step" variants={fadeInUp}>
                  <div className="step-number">4</div>
                  <h3>Deliver Memorable Tours</h3>
                  <p>Use itinerary details and customer feedback to grow your guide reputation.</p>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div className="step" variants={fadeInUp}>
                  <div className="step-number">1</div>
                  <h3>Create Account</h3>
                  <p>Sign up to unlock all features.</p>
                </motion.div>

                <motion.div className="step" variants={fadeInUp}>
                  <div className="step-number">2</div>
                  <h3>Explore Places</h3>
                  <p>Browse destinations and reviews.</p>
                </motion.div>

                <motion.div className="step" variants={fadeInUp}>
                  <div className="step-number">3</div>
                  <h3>Plan Your Trip</h3>
                  <p>Create custom itineraries.</p>
                </motion.div>

                <motion.div className="step" variants={fadeInUp}>
                  <div className="step-number">4</div>
                  <h3>Connect & Share</h3>
                  <p>Share experiences and reviews.</p>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div 
          className="container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          variants={fadeInUp}
        >
          <h2>{isGuide ? 'Ready to Grow Your Guide Business?' : 'Ready to Start Your Adventure?'}</h2>
          {!isAuthenticated() ? (
            <Link to="/register" className="btn btn-primary btn-large">
              Register Now
            </Link>
          ) : isGuide ? (
            <Link to="/dashboard" className="btn btn-primary btn-large">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/places" className="btn btn-primary btn-large">
              Explore Places
            </Link>
          )}
        </motion.div>
      </section>
    </motion.main>
  );
};

export default HomePage;
