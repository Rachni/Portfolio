// main.js
import * as THREE from "https://unpkg.com/three@0.150.0/build/three.module.js";
import { NeatGradient } from "https://esm.sh/@firecms/neat";

// Configuración del gradient
export const config = {
  colors: [
    { color: "#FF7954", enabled: true },
    { color: "#A73C5A", enabled: true },
    { color: "#631E50", enabled: true },
    { color: "#E04070", enabled: true },
    { color: "#6A1B9A", enabled: true },
  ],
  speed: 2,
  horizontalPressure: 3,
  verticalPressure: 4,
  waveFrequencyX: 0,
  waveFrequencyY: 0,
  waveAmplitude: 0,
  shadows: 5,
  highlights: 0,
  colorBrightness: 1.5,
  colorSaturation: 2,
  wireframe: false,
  colorBlending: 4,
  backgroundColor: "#FF0058",
  backgroundAlpha: 0.25,
  grainScale: 0,
  grainSparsity: 0,
  grainIntensity: 0,
  grainSpeed: 0,
  resolution: 0.35,
  yOffset: 0,
};

// Elemento HTML para el gradient
const gradientElement = document.getElementById("gradient");

// Crear el gradient
const neat = new NeatGradient({
  ref: gradientElement,
  ...config,
});

// Limpieza si se recarga la página
window.addEventListener("beforeunload", () => neat.destroy());
