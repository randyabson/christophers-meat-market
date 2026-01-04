#!/usr/bin/env node

/**
 * Format HTML Files
 * 
 * Formats all HTML files in the public directory using js-beautify.
 * 
 * Usage: npm run format:html
 */

const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').html;

/**
 * Format a single HTML file
 * @param {string} filePath - Path to the HTML file to format
 * @returns {boolean} - True if formatting succeeded, false otherwise
 */
function formatHTMLFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const formatted = beautify(content, {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 2,
      preserve_newlines: true,
      wrap_line_length: 120,
      wrap_attributes: 'auto',
      end_with_newline: true
    });
    fs.writeFileSync(filePath, formatted, 'utf8');
    return true;
  } catch (error) {
    console.error('Error formatting ' + path.basename(filePath) + ':', error.message);
    return false;
  }
}

/**
 * Main function - orchestrates the formatting process
 * @returns {void}
 */
function main() {
  console.log('Formatting HTML files...\n');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const htmlFiles = [
    path.join(publicDir, 'index.html'),
    path.join(publicDir, 'contact.html'),
    path.join(publicDir, 'specials.html'),
    path.join(publicDir, 'services.html')
  ];
  
  let formattedCount = 0;
  htmlFiles.forEach(function(filePath) {
    if (fs.existsSync(filePath)) {
      if (formatHTMLFile(filePath)) {
        console.log('✓ Formatted: ' + path.basename(filePath));
        formattedCount++;
      }
    } else {
      console.log('✗ File not found: ' + path.basename(filePath));
    }
  });
  
  console.log('\n' + formattedCount + ' file(s) formatted successfully!');
}

// Run the script
main();
