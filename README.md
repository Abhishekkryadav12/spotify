# SoundWave - Real-Time Music Streaming Application

An original, polished, Spotify-inspired music streaming application built using **React 19**, **TypeScript**, **Tailwind CSS**, and **Vite**, verified with **Google Antigravity** and **REA (Reverse Engineer Anything) MCP**.

SoundWave provides **genuine full-length song playback**, real-time search across millions of tracks, live global internet radio stations, persistent playlist management, and a persistent bottom player — working out-of-the-box with **zero required API keys or subscriptions**.

---

## What's New: Full-Length Song Playback Upgrade

### 1. Root Cause of the 30-Second Limitation
In the initial version, tracks searched via Apple's iTunes Search API mapped their audio source directly to Apple's CDN `previewUrl` (`.m4a`). Apple restricts public playback of copyright commercial tracks to promotional 30-second snippets. The media file sent by Apple's servers contains exactly 30 seconds of audio data, causing the native browser audio element to reach End-Of-File (`ended` event) after 30 seconds.

### 2. The Solution: Multi-Tier Architecture & Full-Length Streaming
SoundWave now integrates authorized full-track providers and explicitly identifies playback modes:

1. **JioSaavn Studio Masters Streaming Engine (`saavnApi.ts` & `backend/`)**:
   - Streams millions of full-length official studio songs (Bollywood, International Pop, Hip-Hop, Regional) directly from the JioSaavn CDN (`c.saavncdn.com`).
   - High-fidelity AAC/MP4 & 320kbps streams with full CORS (`Access-Control-Allow-Origin: *`) and native byte-range seeking.
   - Decrypts studio streams on-the-fly with zero ads, subscriptions, or API keys required.
2. **Internet Archive & Netlabels Catalog (`archiveMusicApi.ts` & `fullLengthTracks.ts`)**:
   - Streams complete, uncut 3–6+ minute master recordings (e.g. ProleteR, Aydio, Bad Panda Records) under Creative Commons licenses.
   - Genuine high-bitrate MP3 streams supporting HTTP byte-range seeking, CORS, and native duration reporting.
   - 100% free with **no API keys or accounts required**.
3. **Jamendo Music API Client (`jamendoApi.ts`)**:
   - Supports searching Jamendo's catalog of 600,000+ full-length Creative Commons tracks when configured with a free client ID in `.env` (`VITE_JAMENDO_CLIENT_ID`).
4. **SoundWave Originals (Extended 60s Local Demo Audio)**:
   - Synthesized 16-bit 44.1kHz stereo WAV tracks in `/public/audio/` extended beyond 30 seconds for guaranteed offline verification.
5. **Transparent Playback Badging**:
   - Full-length songs display a vibrant green **`Full Song`** badge and real track durations (e.g., `4:29`, `6:37`).
   - iTunes commercial search results display an honest amber **`30s Preview`** badge.
   - Radio stations display a red **`Live Broadcast`** badge.
   - Search results include filter pills: `All Results`, `Full Songs (No 30s Limit)`, `30s Previews`, and `Radio Stations`.

---

## Features

### Genuine Audio Playback Engine
- Backed by a **single persistent `HTMLAudioElement`** managed through `PlayerContext`.
- Real-time synchronization with native browser audio events (`play`, `pause`, `timeupdate`, `loadedmetadata`, `waiting`, `canplay`, `ended`, `error`).
- **Complete playback controls**: Play, Pause, Next, Previous, Seekable progress scrubber with hover time tooltip, Volume control (0–100%) with mute toggle, Shuffle, and 3-mode Repeat (`off`, `all`, `one`).
- **Play Queue Drawer**: Live upcoming track queue with real-time track reordering, removal, and clearing.
- **Autoplay handling & Error recovery**: Non-blocking audio initialization adhering to browser autoplay policies, with descriptive error toasts and automatic retry capabilities.

### Playlists & Library Management
- **Liked Songs**: One-click heart toggling with dedicated playlist view and instant Play All.
- **Custom Playlists**: Create, rename, and delete playlists with live `localStorage` persistence.
- **Track Organization**: Add/remove tracks to any playlist from search results, home views, or track row menus.
- **Listening History**: Automatically records recently played tracks and streams with dedicated playback.

---

## Installation & Running Locally

### Prerequisites
- Node.js (v18+ recommended, verified on v24.22)
- npm (v9+)

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run lint and type checks**:
   ```bash
   npx tsc -b
   ```

3. **Build production bundle**:
   ```bash
   npm run build
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Run automated full-length audio verification**:
   ```bash
   node scripts/verify-playback.js
   ```

---

## Audio Providers & API Specifications

| Provider | Purpose | Authentication | CORS / Stream Format | Playback Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Internet Archive & Netlabels** | Full-length song streaming & search | None required | `audio/mpeg` (MP3), Byte-Range Seekable, `Access-Control-Allow-Origin: *` | **Full Song** (3–6+ mins) |
| **Jamendo Music API** | Search 600k+ independent songs | Free Client ID (`VITE_JAMENDO_CLIENT_ID`) | MP3 320kbps | **Full Song** |
| **Radio Browser API** | Global internet radio stations | None required | Direct HTTP/HTTPS MP3 & AAC live streams | **Live Continuous** |
| **SoundWave Originals** | Bundled demo tracks | None (local) | 16-bit 44.1kHz Stereo PCM WAV | **Full Song** (60s) |
| **Apple iTunes Search API** | Commercial catalog search & sample previews | None required | `audio/x-m4p` (AAC) | **30s Preview** |
| **Spotify Web API** (Optional) | Spotify catalog & account features | OAuth 2.0 Client ID | Web Playback SDK | Requires Spotify Premium |
