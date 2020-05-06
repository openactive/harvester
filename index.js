#!/usr/bin/env node

// Import Libs
import express from 'express'
import path from 'path';

// Import our code
import Settings from './src/lib/settings.js';

// Setup
const __dirname = path.resolve();
const app = express();

// Setup Dynamic pages
// TODO

// Setup Assets
app.use(express.static(path.join(__dirname, 'web-assets')));

// Run server
app.listen(Settings.webServerPort, () => { console.log("started web server on port " + Settings.webServerPort); } );
