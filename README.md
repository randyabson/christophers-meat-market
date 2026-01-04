# Christopher's Meat Market

Static website for Christopher's Meat Market - A family-owned butcher shop in Richmond, Ontario.

## Quick Start

```bash
npm install          # Install dependencies
npm start            # Start local server at http://localhost:8080
npm run lint         # Check code quality
npm run format:html  # Format all HTML files
```

## Updating Business Information

**Easy!** All business data is centralized in one file:

1. Edit `scripts/business-data.js` with your changes
2. Run `npm run update-business-data`
3. All HTML files are automatically updated (structured data, hours table, address bars, meta tags)

That's it! No need to manually update multiple files.

## Deployment

Deployments are automatically triggered when you push a new commit to GitHub. Cloudflare Pages will automatically build and deploy your changes.

## Project Structure

```
christophers-meat-market/
├── scripts/
│   ├── business-data.js          # Business data (edit this to update site)
│   └── update-business-data.js   # Auto-update script
├── public/
│   ├── css/business-casual.css   # All styles
│   ├── js/site.js                # Shared JavaScript
│   ├── index.html                # Home page (auto-updated)
│   ├── contact.html              # Contact page (auto-updated)
│   ├── specials.html             # Specials page
│   └── services.html            # Services page
```

## Technologies

- Bootstrap 5.3.3
- jQuery 3.7.1
- Static HTML/CSS/JavaScript
