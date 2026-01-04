/**
 * Business Data Configuration
 * Single source of truth for all business information
 * 
 * After editing this file, run: npm run update-business-data
 * This will automatically update all HTML files with the new information.
 */

module.exports = {
  // Business Information
  name: "Christopher's Meat Market",
  shortName: "Christopher's",
  
  address: {
    street: "6146 Perth Street",
    city: "Richmond",
    region: "Ontario",
    regionCode: "ON",
    postalCode: "K0A 2Z0",
    country: "CA",
    countryCode: "CA"
  },
  
  phone: {
    display: "(613) 838-8800",
    tel: "+1-613-838-8800"
  },
  
  coordinates: {
    latitude: 45.193608692634434,
    longitude: -75.84403566715355
  },
  
  url: "https://christophersmeatmarket.com",
  priceRange: "$$",
  description: "Family-owned butcher shop in Richmond, Ontario, specializing in quality free-range, grain-fed meats. Over 25 years of experience.",
  tagline: "Quality Products for Families",
  
  // Business Hours
  // Format: 24-hour time (e.g., "09:30", "17:00")
  // closed: true means the business is closed that day
  hours: [
    { day: "Monday", open: null, close: null, closed: true },
    { day: "Tuesday", open: "09:30", close: "17:00", closed: false },
    { day: "Wednesday", open: "09:30", close: "17:00", closed: false },
    { day: "Thursday", open: "09:30", close: "17:00", closed: false },
    { day: "Friday", open: "09:30", close: "17:00", closed: false },
    { day: "Saturday", open: "09:00", close: "17:00", closed: false },
    { day: "Sunday", open: null, close: null, closed: true }
  ],
  
  // Default Images
  images: {
    defaultImage: "img/slide-1.jpg"
  },
  
  // Additional structured data fields
  servesCuisine: "Butcher Shop"
};

