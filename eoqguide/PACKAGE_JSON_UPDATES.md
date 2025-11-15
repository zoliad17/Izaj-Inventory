// Add these scripts to your package.json in the backend/Server directory

{
"scripts": {
"start": "node server.js",
"dev": "nodemon server.js",

    // Analytics service scripts
    "analytics-dev": "cd ../../../analytics && python -m flask --app analytics.app run --port 5001",
    "analytics-prod": "cd ../../../analytics && gunicorn --bind 0.0.0.0:5001 --workers 4 'analytics.app:create_app()'",

    // Run both services concurrently
    "dev-full": "concurrently \"npm run dev\" \"npm run analytics-dev\"",

    // Database scripts
    "create-superadmin": "node scripts/create-superadmin.js",
    "apply-schema": "node scripts/apply-schema.js"

}
}

// Usage:
// npm run analytics-dev - Start analytics service only
// npm run dev-full - Start both Node.js and Python services
// npm run analytics-prod - Production mode with Gunicorn
