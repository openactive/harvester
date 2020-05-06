#!/usr/bin/env node

import express from 'express'
import Settings from './src/lib/settings.js';

const app = express();

app.listen(Settings.webServerPort, () => { console.log("started web server on port " + Settings.webServerPort); } );
