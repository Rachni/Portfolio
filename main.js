// imports
// import * as THREE from "https://unpkg.com/three@0.150.0/build/three.module.js";
import { NeatGradient } from "https://esm.sh/@firecms/neat";

// Gradient config
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

const gradientElement = document.getElementById("gradient");

const neat = new NeatGradient({
  ref: gradientElement,

  ...config,
});

// cleaning if page reloads
window.addEventListener("beforeunload", () => neat.destroy());

// ===== SCROLLER ===== //
const scroller = document.querySelector(".technologies-scroller-container");

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  addAnimation();
}

function addAnimation() {
  scroller.setAttribute("data-animated", true);

  const scrollerInner = scroller.querySelector(".technologies-scroller");
  const scrollerContent = Array.from(scrollerInner.children);

  scrollerContent.forEach((item) => {
    const duplicatedItem = item.cloneNode(true);
    duplicatedItem.setAttribute("aria-hidden", true);
    scrollerInner.appendChild(duplicatedItem);
  });
}
        // ================== SLIDER ====================
        // Primero intenta cargar imagesLoaded de forma segura
        let imagesLoaded;
        try {
            imagesLoaded = (await import("https://esm.sh/imagesloaded")).default;
        } catch (error) {
            console.error("Error loading imagesLoaded:", error);
            // Fallback básico si imagesLoaded no carga
            imagesLoaded = function (el, callback) {
                if (el.complete) {
                    callback({ isComplete: true });
                } else {
                    el.addEventListener("load", () => callback({ isComplete: true }));
                    el.addEventListener("error", () => callback({ isComplete: true }));
                }
            };
        }

        // -------------------------------------------------
        // ------------------ Utilidades -------------------
        // -------------------------------------------------

        // Utilidades matemáticas
        const wrap = (n, max) => (n + max) % max;
        const lerp = (a, b, t) => a + (b - a) * t;

        // Utilidades DOM
        const isHTMLElement = (el) => el instanceof HTMLElement;

        // Generador de IDs único
        const genId = (() => {
            let count = 0;
            return () => (count++).toString();
        })();

        // Sistema de animación por frames
        class Raf {
            constructor() {
                this.rafId = 0;
                this.raf = this.raf.bind(this);
                this.callbacks = [];
                this.start();
            }

            start() {
                this.raf();
            }

            stop() {
                cancelAnimationFrame(this.rafId);
            }

            raf() {
                this.callbacks.forEach(({ callback, id }) => callback({ id }));
                this.rafId = requestAnimationFrame(this.raf);
            }

            add(callback, id) {
                this.callbacks.push({ callback, id: id || genId() });
            }

            remove(id) {
                this.callbacks = this.callbacks.filter((cb) => cb.id !== id);
            }
        }

        // Clase para manejar vectores 2D
        class Vec2 {
            constructor(x = 0, y = 0) {
                this.x = x;
                this.y = y;
            }

            set(x, y) {
                this.x = x;
                this.y = y;
            }

            lerp(v, t) {
                this.x = lerp(this.x, v.x, t);
                this.y = lerp(this.y, v.y, t);
            }
        }

        const vec2 = (x = 0, y = 0) => new Vec2(x, y);

        // Efecto de inclinación al pasar el mouse
        function tilt(node, options) {
            let { trigger, target } = resolveOptions(node, options);
            let lerpAmount = 0.06;
            const rotDeg = { current: vec2(), target: vec2() };
            const bgPos = { current: vec2(), target: vec2() };
            let rafId;

            const update = (newOptions) => {
                destroy();
                ({ trigger, target } = resolveOptions(node, newOptions));
                init();
            };

            function ticker({ id }) {
                rafId = id;
                rotDeg.current.lerp(rotDeg.target, lerpAmount);
                bgPos.current.lerp(bgPos.target, lerpAmount);

                for (const el of target) {
                    el.style.setProperty("--rotX", rotDeg.current.y.toFixed(2) + "deg");
                    el.style.setProperty("--rotY", rotDeg.current.x.toFixed(2) + "deg");
                    el.style.setProperty("--bgPosX", bgPos.current.x.toFixed(2) + "%");
                    el.style.setProperty("--bgPosY", bgPos.current.y.toFixed(2) + "%");
                }
            }

            const onMouseMove = ({ offsetX, offsetY }) => {
                lerpAmount = 0.1;
                for (const el of target) {
                    const ox = (offsetX - el.clientWidth * 0.5) / (Math.PI * 3);
                    const oy = -(offsetY - el.clientHeight * 0.5) / (Math.PI * 4);
                    rotDeg.target.set(ox, oy);
                    bgPos.target.set(-ox * 0.3, oy * 0.3);
                }
            };

            const onMouseLeave = () => {
                lerpAmount = 0.06;
                rotDeg.target.set(0, 0);
                bgPos.target.set(0, 0);
            };

            const addListeners = () => {
                trigger.addEventListener("mousemove", onMouseMove);
                trigger.addEventListener("mouseleave", onMouseLeave);
            };

            const removeListeners = () => {
                trigger.removeEventListener("mousemove", onMouseMove);
                trigger.removeEventListener("mouseleave", onMouseLeave);
            };

            const init = () => {
                addListeners();
                raf.add(ticker);
            };

            const destroy = () => {
                removeListeners();
                raf.remove(rafId);
            };

            init();
            return { destroy, update };
        }

        function resolveOptions(node, options) {
            return {
                trigger: options?.trigger ?? node,
                target: options?.target
                    ? Array.isArray(options.target)
                        ? options.target
                        : [options.target]
                    : [node],
            };
        }

        // -----------------------------------------------------
        // Instancia global de RAF
        const raf = new Raf();

        // Función para cambiar de slide - CORREGIDA
        function createChangeSlideHandler(direction) {
            return function () {
                // Obtener todos los proyectos e información
                const allProjects = [...document.querySelectorAll('.single-project')];
                const allProjectInfos = [...document.querySelectorAll('.project-info')];
                const allProjectBgs = [...document.querySelectorAll('.single-project-bg')];
                
                // Encontrar índices actuales
                const currentIndex = allProjects.findIndex(project => project.hasAttribute('data-current'));
                
                // Determinar nuevo índice basado en la dirección
                let newIndex;
                if (direction === 1) {
                    newIndex = (currentIndex + 1) % allProjects.length; // Avanzar (cíclico)
                } else {
                    newIndex = (currentIndex - 1 + allProjects.length) % allProjects.length; // Retroceder (cíclico)
                }
                
                // Remover todos los atributos de estado
                allProjects.forEach(project => {
                    project.removeAttribute('data-current');
                    project.removeAttribute('data-previous');
                    project.removeAttribute('data-next');
                });
                
                allProjectInfos.forEach(info => {
                    info.removeAttribute('data-current');
                    info.removeAttribute('data-previous');
                    info.removeAttribute('data-next');
                });
                
                allProjectBgs.forEach(bg => {
                    bg.removeAttribute('data-current');
                    bg.removeAttribute('data-previous');
                    bg.removeAttribute('data-next');
                });
                
                // Asignar nuevos estados
                allProjects[newIndex].setAttribute('data-current', '');
                allProjectInfos[newIndex].setAttribute('data-current', '');
                allProjectBgs[newIndex].setAttribute('data-current', '');
                
                // Proyecto anterior (para efecto visual)
                const prevIndex = (newIndex - 1 + allProjects.length) % allProjects.length;
                allProjects[prevIndex].setAttribute('data-previous', '');
                allProjectInfos[prevIndex].setAttribute('data-previous', '');
                allProjectBgs[prevIndex].setAttribute('data-previous', '');
                
                // Proyecto siguiente (para efecto visual)
                const nextIndex = (newIndex + 1) % allProjects.length;
                allProjects[nextIndex].setAttribute('data-next', '');
                allProjectInfos[nextIndex].setAttribute('data-next', '');
                allProjectBgs[nextIndex].setAttribute('data-next', '');
            };
        }

        // Inicializar el slider después de cargar las imágenes
        function init() {
            const loader = document.querySelector(".loader");
            const projects = [...document.querySelectorAll(".single-project")];
            const projectsInfo = [...document.querySelectorAll(".project-info")];
            const buttons = {
                prev: document.querySelector(".slider--btn__prev"),
                next: document.querySelector(".slider--btn__next"),
            };

            if (loader) {
                loader.style.opacity = "0";
                loader.style.pointerEvents = "none";
            }

            // Aplicar efecto de inclinación
            projects.forEach((project, i) => {
                const projectInner = project.querySelector(".single-project-inner");
                const projectInfoInner = projectsInfo[i]?.querySelector(
                    ".project-info__inner"
                );

                if (projectInner && projectInfoInner) {
                    tilt(project, { target: [projectInner, projectInfoInner] });
                }
            });

            // Añadir event listeners - CORREGIDO
            if (buttons.prev) {
                buttons.prev.addEventListener("click", createChangeSlideHandler(-1));
            }
            if (buttons.next) {
                buttons.next.addEventListener("click", createChangeSlideHandler(1)); // Corregido aquí
            }
        }

        // Configuración inicial (carga de imágenes)
        function setup() {
            const loaderText = document.querySelector(".loader__text");
            const images = [...document.querySelectorAll(".project-image")];
            const totalImages = images.length;
            let loadedImages = 0;
            let progress = { current: 0, target: 0 };

            if (totalImages === 0) {
                // Si no hay imágenes, inicializar directamente
                init();
                return;
            }

            images.forEach((image) => {
                imagesLoaded(image, (instance) => {
                    if (instance.isComplete) {
                        loadedImages++;
                        progress.target = loadedImages / totalImages;

                        if (loadedImages === totalImages) {
                            init();
                        }
                    }
                });
            });

            // Animación de progreso (solo si hay loader)
            if (loaderText) {
                raf.add(({ id }) => {
                    progress.current = lerp(progress.current, progress.target, 0.06);
                    const progressPercent = Math.round(progress.current * 100);
                    loaderText.textContent = `${progressPercent}%`;

                    if (progressPercent === 100) {
                        raf.remove(id);
                    }
                });
            }
        }

        // Esperar a que el DOM esté listo
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", setup);
        } else {
            setup();
        }