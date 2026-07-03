// Load dotenv FIRST before any imports
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../../.env.local') });

// Now import everything else
import express from 'express';
import fetch from 'node-fetch';
import multer from 'multer';
import OpenAI from 'openai';
import detectIntentFromText from './intentMap.cjs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const PICOVOICE_ACCESS_KEY = process.env.PICOVOICE_ACCESS_KEY || '';
const USE_RHINO = /^true1/i.test(process.env.USE_RHINO || 'false');

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

console.log('🎙️ Voice Router initialized');
console.log('�� OpenAI API Key:', OPENAI_API_KEY ? $... : '❌ MISSING');
console.log('🔑 ElevenLabs API Key:', ELEVENLABS_API_KEY ? '✅ Loaded' : '❌ MISSING');
console.log('✅ Whisper STT endpoint ready');
console.log('✅ ElevenLabs TTS endpoint ready');
console.log('✅ Intent detection endpoint ready');
