/**
 * Shared Site JavaScript
 * Common functionality used across all pages
 */

(function() {
  'use strict';

  /**
   * Initialize mobile navigation - close offcanvas when clicking nav links
   */
  function initMobileNav() {
    try {
      var mobileNav = document.getElementById('mobileNav');
      if (mobileNav) {
        var navLinks = mobileNav.querySelectorAll('.nav-link');
        navLinks.forEach(function(link) {
          link.addEventListener('click', function() {
            var offcanvas = bootstrap.Offcanvas.getInstance(mobileNav);
            if (offcanvas) {
              offcanvas.hide();
            }
          });
        });
      }
    } catch (error) {
      console.error('Error initializing mobile navigation:', error);
    }
  }

  /**
   * Initialize carousel with custom settings
   * @param {string} carouselId - ID of the carousel element
   * @param {Object} options - Carousel options (interval, wrap, etc.)
   */
  function initCarousel(carouselId, options) {
    try {
      var carouselElement = document.querySelector(carouselId);
      if (carouselElement && typeof bootstrap !== 'undefined' && bootstrap.Carousel) {
        var defaultOptions = {
          interval: 5000,
          wrap: true
        };
        var carouselOptions = Object.assign({}, defaultOptions, options || {});
        var carousel = new bootstrap.Carousel(carouselElement, carouselOptions);
        carousel.cycle();
        return carousel;
      }
    } catch (error) {
      console.error('Error initializing carousel:', error);
    }
    return null;
  }

  /**
   * Update copyright year automatically
   */
  function updateCopyrightYear() {
    try {
      var copyrightElements = document.querySelectorAll('.copyright-year');
      var currentYear = new Date().getFullYear();
      copyrightElements.forEach(function(element) {
        element.textContent = currentYear;
      });
    } catch (error) {
      console.error('Error updating copyright year:', error);
    }
  }

  /**
   * Initialize all site functionality when DOM is ready
   */
  function init() {
    // Update copyright year
    updateCopyrightYear();

    // Initialize mobile navigation
    initMobileNav();

    // Initialize carousel if present (only on index page)
    var carouselElement = document.querySelector('#carousel-example-generic');
    if (carouselElement) {
      initCarousel('#carousel-example-generic');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready
    init();
  }
})();

