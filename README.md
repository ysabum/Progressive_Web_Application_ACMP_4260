# 🐛 Glowworm Music Studio  
An Interactive Web-Based Digital Audio Workstation (DAW)

---

## 🌟 Project Overview  
Glowworm Music Studio is a progressive web application (PWA) designed to bring high-quality music creation to the browser. It transforms keyboard input into playable digital instruments, score‑writing, and multi‑track “band” or song performances for musicians and/or creators who want an intuitive and customizable way to compose and perform music that can be shared with others.

---

## 🎹 Current Features  
- **Professional Sampler Engine:** Uses Tone.js and high-fidelity Salamander Grand Piano audio samples for an authentic sound.  
- **Piano-Style Keyboard Mapping:** An intuitive "Left-to-Right" layout where the left hand handles bass (C2-C4) and the right hand handles melody (D4-D6).  
- **Dynamic Music Studio:** A dedicated performance space featuring a Forest Green aesthetic designed for visual comfort and focus.  
- **Visual Feedback & Score Generation:** Real-time display showing the musical note and octave associated with every keypress, alongside live VexFlow sheet music generation that can be exported as a PNG.
- **Multi-Track Overlay:** Upload individual recordings, trim clips, adjust volumes, and mix them together into a single downloadable MP3. 

---

## 🛠️ How to Use the Studio  
1. **Select an Instrument:** Choose from the `Instrument` navbar menu (currently optimized for Grand Piano).  
2. **Play:** Use your keyboard to trigger notes:  
    - **Left Hand (Q to B):** Low-range octaves.  
    - **Right Hand (Y to /):** High-range octaves.  
3. **Visual Reference:** The on-screen keys will show you exactly which note you are playing (e.g., C4).  

---

## 🎙️ How to Record & Save Sheet Music
1. Click the red **Record (Enter)** button in the Studio to begin capturing your performance.
2. Play your melody using the keyboard. The VexFlow notation will populate in real-time.
3. Click **Stop** when finished. A `.wav` file of your recording will automatically download to your computer.
4. To save your sheet music, click the **Save Score Image** button to download a high-quality PNG of your composition.

---

## 🎛️ How to Overlay Music (Mixing)
1. Navigate to the **Overlay** page.
2. Click **Add Audio Files** to upload the `.wav` files you generated in the Studio (or any compatible audio file).
3. **Arrange & Edit:**
    - Drag and drop tracks to reorder them.
    - Click **Edit** to adjust the Volume, Start Time (when the instrument enters), and Trim times (to cut out unwanted audio).
4. Click **Play All** to preview your layered mix.
5. Once satisfied, click **Download MP3** to render and save your final song.

---

## 🔧 Troubleshooting
- **"Module not found: Error: Can't resolve '@breezystack/lamejs'"**: This means the MP3 encoder library is missing. Run `npm install` or `npm install @breezystack/lamejs` in your terminal to fix it.
- **Notes overlapping on sheet music:** Ensure your browser is maximized. The VexFlow renderer is optimized for standard desktop widths.
- **No sound playing:** Ensure your browser tab is not muted and that you have interacted with the page (clicked anywhere) before playing, as browsers require user interaction to start the AudioContext.

---

## 👥 Team Glowworm  
- **Gregory Treinen:** Lead Backend & Database Developer.  
- **Allan Hernandez:** Project Team Member.  
- **Hennysa Omoregie:** Project Team Member.  
- **Laurelle Sekpe:** Project Team Member.