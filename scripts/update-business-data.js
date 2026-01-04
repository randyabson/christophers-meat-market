#!/usr/bin/env node

/**
 * Update Business Data Script
 * 
 * This script reads business-data.js and automatically updates all HTML files
 * with the latest business information.
 * 
 * Usage: npm run update-business-data
 */

const fs = require('fs');
const path = require('path');

// Load business data
const businessData = require('./business-data.js');

/**
 * Convert 24-hour time to 12-hour format with am/pm
 * @param {string} time24 - Time in 24-hour format (e.g., "09:30", "17:00")
 * @returns {string|null} - Time in 12-hour format (e.g., "9:30 am", "5:00 pm") or null if invalid
 */
function formatTime12Hour(time24) {
  if (!time24) {
    return null;
  }
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Generate structured data (JSON-LD) for schema.org
 * @param {Object} [options] - Optional configuration object
 * @param {string} [options.image] - Custom image URL (optional)
 * @param {string} [options.description] - Custom description (optional)
 * @returns {Object} - Structured data object for JSON-LD
 */
function generateStructuredData(options) {
  options = options || {};
  
  // Group hours by time slots for structured data
  const hoursBySlot = {};
  businessData.hours.forEach(function(hour) {
    if (!hour.closed) {
      const key = hour.open + '-' + hour.close;
      if (!hoursBySlot[key]) {
        hoursBySlot[key] = [];
      }
      hoursBySlot[key].push(hour.day);
    }
  });
  
  const openingHoursSpecification = Object.keys(hoursBySlot).map(function(key) {
    const [opens, closes] = key.split('-');
    return {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": hoursBySlot[key],
      "opens": opens,
      "closes": closes
    };
  });
  
  const data = {
    "@context": "https://schema.org",
    "@type": "ButcherShop",
    "name": businessData.name,
    "image": businessData.url + "/" + (options.image || businessData.images.defaultImage),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": businessData.address.street,
      "addressLocality": businessData.address.city,
      "addressRegion": businessData.address.regionCode,
      "postalCode": businessData.address.postalCode,
      "addressCountry": businessData.address.countryCode
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": businessData.coordinates.latitude,
      "longitude": businessData.coordinates.longitude
    },
    "url": businessData.url,
    "telephone": businessData.phone.tel,
    "priceRange": businessData.priceRange,
    "openingHoursSpecification": openingHoursSpecification
  };
  
  if (options.description) {
    data.description = options.description;
  } else {
    data.description = businessData.description;
  }
  
  if (businessData.servesCuisine) {
    data.servesCuisine = businessData.servesCuisine;
  }
  
  return data;
}

/**
 * Generate structured data as formatted JSON string
 * @param {Object} [options] - Optional configuration object (passed to generateStructuredData)
 * @returns {string} - Formatted JSON string
 */
function generateStructuredDataJSON(options) {
  const data = generateStructuredData(options);
  return JSON.stringify(data, null, 2);
}

/**
 * Generate business hours table HTML
 * @returns {string} - HTML string for the hours table rows
 */
function generateHoursTableHTML() {
  let html = '';
  businessData.hours.forEach(function(hour) {
    const timeText = hour.closed ? 'Closed' : formatTime12Hour(hour.open) + ' – ' + formatTime12Hour(hour.close);
    html += '                    <tr><td><strong>' + hour.day + '</strong></td><td>' + timeText + '</td></tr>\n';
  });
  return html.trimRight();
}

/**
 * Generate address bar HTML
 * @returns {string} - Formatted address bar string
 */
function generateAddressBarHTML() {
  return businessData.address.street + ' | ' + 
         businessData.address.city + ', ' + 
         businessData.address.region + ' ' + 
         businessData.address.postalCode + ' | ' + 
         businessData.phone.display;
}

/**
 * Update a single HTML file with business data
 * @param {string} filePath - Path to the HTML file to update
 * @returns {boolean} - True if file was updated, false otherwise
 */
function updateHTMLFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Update structured data (JSON-LD)
  const structuredDataRegex = /(<!-- AUTO-UPDATE: Structured Data -->\s*<script type="application\/ld\+json">)\s*([\s\S]*?)\s*(<\/script>\s*<!-- END AUTO-UPDATE -->)/;
  if (structuredDataRegex.test(content)) {
    let structuredDataJSON = generateStructuredDataJSON();
    // Determine if this is index.html (has servesCuisine) or contact.html
    const isIndex = filePath.includes('index.html');
    if (!isIndex) {
      // Remove servesCuisine for contact page
      const data = generateStructuredData();
      delete data.servesCuisine;
      structuredDataJSON = JSON.stringify(data, null, 2);
    }
    content = content.replace(structuredDataRegex, function(match, start, oldData, end) {
      updated = true;
      const indentedJSON = structuredDataJSON.split('\n').map(function(line, index) {
        return index === 0 ? line : '    ' + line;
      }).join('\n');
      return start + '\n    ' + indentedJSON + '\n    ' + end;
    });
  }
  
  // Update address bar
  const addressBarRegex = /(<!-- AUTO-UPDATE: Address bar -->\s*<div class="address-bar">)([^<]+)(<\/div>\s*<!-- END AUTO-UPDATE -->)/;
  if (addressBarRegex.test(content)) {
    const addressBarHTML = generateAddressBarHTML();
    content = content.replace(addressBarRegex, function(match, start, oldContent, end) {
      updated = true;
      return start + addressBarHTML + end;
    });
  }
  
  // Update navigation brand
  const navBrandRegex = /(<!-- AUTO-UPDATE: Navigation brand -->\s*<a class="navbar-brand"[^>]*>)([^<]+)(<\/a>\s*<!-- END AUTO-UPDATE -->)/;
  if (navBrandRegex.test(content)) {
    content = content.replace(navBrandRegex, function(match, start, oldContent, end) {
      updated = true;
      return start + businessData.shortName + end;
    });
  }
  
  // Update brand header (top of page)
  const brandHeaderRegex = /(<!-- AUTO-UPDATE: Brand header -->\s*<div class="brand">)([^<]+)(<\/div>\s*<!-- END AUTO-UPDATE -->)/;
  if (brandHeaderRegex.test(content)) {
    content = content.replace(brandHeaderRegex, function(match, start, oldContent, end) {
      updated = true;
      return start + businessData.name + end;
    });
  }
  
    // Update business hours table (contact.html only)
    if (filePath.includes('contact.html')) {
      const hoursTableRegex = /(<!-- AUTO-UPDATE: Business hours table -->\s*<table class="business-hours-table">)\s*([\s\S]*?)\s*(<\/table>\s*<!-- END AUTO-UPDATE -->)/;
      if (hoursTableRegex.test(content)) {
        const hoursTableHTML = generateHoursTableHTML();
        content = content.replace(hoursTableRegex, function(match, start, oldContent, end) {
          updated = true;
          return start + '\n                 ' + hoursTableHTML + '\n                 ' + end;
        });
      }
    
    // Update contact info phone
    const phoneRegex = /(<!-- AUTO-UPDATE: Contact phone -->\s*<p>Phone:<br><strong>)([^<]+)(<\/strong><\/p>\s*<!-- END AUTO-UPDATE -->)/;
    if (phoneRegex.test(content)) {
      content = content.replace(phoneRegex, function(match, start, oldContent, end) {
        updated = true;
        return start + businessData.phone.display + end;
      });
    }
    
    // Update contact info address
    const addressRegex = /(<!-- AUTO-UPDATE: Contact address -->\s*<p>Address:<br><strong>)([^<]+<br>[^<]+)(<\/strong><\/p>\s*<!-- END AUTO-UPDATE -->)/;
    if (addressRegex.test(content)) {
      const addressHTML = businessData.address.street + '<br>' + businessData.address.city + ', ' + businessData.address.region + ' ' + businessData.address.postalCode;
      content = content.replace(addressRegex, function(match, start, oldContent, end) {
        updated = true;
        return start + addressHTML + end;
      });
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

/**
 * Main function - orchestrates the update process
 * @returns {void}
 */
function main() {
  console.log('Updating business data in HTML files...\n');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const htmlFiles = [
    path.join(publicDir, 'index.html'),
    path.join(publicDir, 'contact.html'),
    path.join(publicDir, 'specials.html'),
    path.join(publicDir, 'services.html')
  ];
  
  let updatedCount = 0;
  htmlFiles.forEach(function(filePath) {
    if (fs.existsSync(filePath)) {
      if (updateHTMLFile(filePath)) {
        console.log('✓ Updated: ' + path.basename(filePath));
        updatedCount++;
      } else {
        console.log('⚠ No updates needed: ' + path.basename(filePath));
      }
    } else {
      console.log('✗ File not found: ' + filePath);
    }
  });
  
  console.log('\n' + updatedCount + ' file(s) updated successfully!');
  console.log('\nNext steps:');
  console.log('1. Review the changes');
  console.log('2. Test locally: npm start');
  console.log('3. Commit and deploy');
}

// Run the script
main();
