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
 * Format date for display (e.g., "January 1, 2025")
 * @param {string} dateStr - Date in ISO format (YYYY-MM-DD)
 * @returns {string} - Formatted date string
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

/**
 * Format date with day of week for display (e.g., "Monday, January 1, 2025")
 * @param {string} dateStr - Date in ISO format (YYYY-MM-DD)
 * @returns {string} - Formatted date string with day of week
 */
function formatDateWithDay(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

/**
 * Check if the business is currently in a temporary closure period
 * @returns {Object|null} - Temporary closure object if active, null otherwise
 */
function getActiveTemporaryClosure() {
  if (!businessData.temporaryClosure) {
    return null;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(businessData.temporaryClosure.startDate + 'T00:00:00');
  const endDate = new Date(businessData.temporaryClosure.endDate + 'T23:59:59');
  
  if (today >= startDate && today <= endDate) {
    return businessData.temporaryClosure;
  }
  
  return null;
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
  
  const tempClosure = getActiveTemporaryClosure();
  
  // Group hours by time slots for structured data (only if not temporarily closed)
  const openingHoursSpecification = [];
  if (!tempClosure) {
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
    
    openingHoursSpecification.push(...Object.keys(hoursBySlot).map(function(key) {
      const [opens, closes] = key.split('-');
      return {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": hoursBySlot[key],
        "opens": opens,
        "closes": closes
      };
    }));
  }
  
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
    "priceRange": businessData.priceRange
  };
  
  // Only include opening hours if not temporarily closed
  if (openingHoursSpecification.length > 0) {
    data.openingHoursSpecification = openingHoursSpecification;
  }
  
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
 * Calculate the date one day after the given date
 * @param {string} dateStr - Date in ISO format (YYYY-MM-DD)
 * @returns {string} - Date one day after in ISO format (YYYY-MM-DD)
 */
function getNextDay(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

/**
 * Generate closure notice card HTML
 * @returns {string} - HTML string for the closure card, or empty string if no closure
 */
function generateClosureCardHTML() {
  const tempClosure = getActiveTemporaryClosure();
  
  if (!tempClosure) {
    return '';
  }
  
  const startFormatted = formatDate(tempClosure.startDate);
  const endFormatted = formatDate(tempClosure.endDate);
  const returnDateStr = getNextDay(tempClosure.endDate);
  const returnDateFormatted = formatDateWithDay(returnDateStr);
  const message = tempClosure.message || 'Temporarily closed';
  
  const warningIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style="flex-shrink: 0;"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>';
  
  return '<div class="alert alert-warning d-flex align-items-start mb-3" role="alert" style="border-left: 4px solid #ffc107; background-color: #fff3cd; border-color: #ffc107;"><div style="color: #856404; margin-right: 10px; flex-shrink: 0;">' + warningIcon + '</div><div style="flex: 1; color: #856404; word-wrap: break-word;"><div style="font-weight: bold; margin-bottom: 5px;">' + message + '</div><div style="margin-bottom: 5px;">' + startFormatted + ' – ' + endFormatted + '</div><div>We will return to regular hours on <strong>' + returnDateFormatted + '</strong></div></div></div>';
}

/**
 * Generate business hours table HTML
 * @returns {string} - HTML string for the hours table rows
 */
function generateHoursTableHTML() {
  let html = '';
  businessData.hours.forEach(function(hour) {
    const timeText = hour.closed ? 'Closed' : formatTime12Hour(hour.open) + ' – ' + formatTime12Hour(hour.close);
    html += '<tr><td><strong>' + hour.day + '</strong></td><td>' + timeText + '</td></tr>';
  });
  return html;
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
      const hoursTableRegex = /(<!-- AUTO-UPDATE: Business hours table -->)\s*([\s\S]*?)\s*(<!-- END AUTO-UPDATE -->)/;
      if (hoursTableRegex.test(content)) {
        const closureCardHTML = generateClosureCardHTML();
        const hoursTableHTML = generateHoursTableHTML();
        const tempClosure = getActiveTemporaryClosure();
        content = content.replace(hoursTableRegex, function(match, start, oldContent, end) {
          updated = true;
          let result = start;
          if (closureCardHTML) {
            result += closureCardHTML;
          }
          if (tempClosure) {
            result += '<table class="business-hours-table" style="opacity: 0.7;"><caption style="caption-side: top; text-align: left; font-size: 0.875em; color: #6c757d; margin-bottom: 0.5rem; font-style: italic;">Regular hours (currently closed)</caption>' + hoursTableHTML + '</table>';
          } else {
            result += '<table class="business-hours-table">' + hoursTableHTML + '</table>';
          }
          result += end;
          return result;
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
