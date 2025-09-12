// imports
// import * as THREE from "https://unpkg.com/three@0.150.0/build/three.module.js";
import { NeatGradient } from "https://esm.sh/@firecms/neat";

// Gradient config
export const config = {
  colors: [
    {
      color: "#a793ee",
      enabled: true,
    },
    {
      color: "#dec2ed",
      enabled: true,
    },
    {
      color: "#0f2d87",
      enabled: true,
    },
    {
      color: "#3f0e8b",
      enabled: true,
    },
    {
      color: "#dec2ed",
      enabled: false,
    },
  ],
  speed: 6,
  horizontalPressure: 7,
  verticalPressure: 8,
  waveFrequencyX: 2,
  waveFrequencyY: 1,
  waveAmplitude: 8,
  shadows: 4,
  highlights: 6,
  colorBrightness: 0.95,
  colorSaturation: -8,
  wireframe: false,
  colorBlending: 10,
  backgroundColor: "#003FFF",
  backgroundAlpha: 1,
  grainScale: 4,
  grainSparsity: 0,
  grainIntensity: 0.25,
  grainSpeed: 1,
  resolution: 1,
  yOffset: 0,
};

const gradientElement = document.getElementById("gradient");

const neat = new NeatGradient({
  ref: gradientElement,

  ...config,
});

// cleaning if page reloads
window.addEventListener("beforeunload", () => neat.destroy());

// ================ SCROLLER ======================== //
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
// ================== TODO: REVISE SLIDER WITH 3D EFFECT ======================== //

// basic utils
const wrap = (n, max) => (n + max) % max;
const lerp = (a, b, t) => a + (b - a) * t;

// 2d vectors
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

// Animation frame manager
class Raf {
  constructor() {
    this.callbacks = [];
    this.rafId = null;
    this.isRunning = false;
    this.raf = this.raf.bind(this);
  }
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.raf();
    }
  }
  stop() {
    if (this.isRunning) {
      cancelAnimationFrame(this.rafId);
      this.isRunning = false;
    }
  }
  raf() {
    this.callbacks.forEach((callback) => callback());
    this.rafId = requestAnimationFrame(this.raf);
  }
  add(callback) {
    this.callbacks.push(callback);
  }
  remove(callback) {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }
}

const raf = new Raf();
raf.start();

// Tilt effect
function tilt(node, options = {}) {
  const trigger = options.trigger || node;
  const target = Array.isArray(options.target)
    ? options.target
    : [options.target || node];

  let lerpAmount = 0.06;
  const rotDeg = { current: new Vec2(), target: new Vec2() };
  const bgPos = { current: new Vec2(), target: new Vec2() };

  const updateTilt = () => {
    rotDeg.current.lerp(rotDeg.target, lerpAmount);
    bgPos.current.lerp(bgPos.target, lerpAmount);

    for (const el of target) {
      el.style.setProperty("--rotX", `${rotDeg.current.y.toFixed(2)}deg`);
      el.style.setProperty("--rotY", `${rotDeg.current.x.toFixed(2)}deg`);
      el.style.setProperty("--bgPosX", `${bgPos.current.x.toFixed(2)}%`);
      el.style.setProperty("--bgPosY", `${bgPos.current.y.toFixed(2)}%`);
    }
  };

  raf.add(updateTilt);

  const onMouseMove = (e) => {
    const rect = trigger.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    lerpAmount = 0.1;

    for (const el of target) {
      const ox = (offsetX - el.clientWidth * 0.5) / (Math.PI * 7);
      const oy = -(offsetY - el.clientHeight * 0.5) / (Math.PI * 10);
      rotDeg.target.set(ox, oy);
      bgPos.target.set(-ox * 0.4, oy * 0.4);
    }
  };

  const onMouseLeave = () => {
    lerpAmount = 0.06;
    rotDeg.target.set(0, 0);
    bgPos.target.set(0, 0);
  };

  trigger.addEventListener("mousemove", onMouseMove);
  trigger.addEventListener("mouseleave", onMouseLeave);

  // Cleanup function
  return () => {
    raf.remove(updateTilt);
    trigger.removeEventListener("mousemove", onMouseMove);
    trigger.removeEventListener("mouseleave", onMouseLeave);
  };
}

// Función para actualizar z-index de manera consistente
function updateZIndex(allProjects, currentIndex) {
  allProjects.forEach((project, index) => {
    project.style.zIndex = "";
    if (index === currentIndex) {
      project.style.zIndex = "30";
    } else {
      const distanceForward = wrap(index - currentIndex, allProjects.length);
      const distanceBackward = wrap(currentIndex - index, allProjects.length);
      const minDistance = Math.min(distanceForward, distanceBackward);
      if (minDistance === 1) project.style.zIndex = "25";
      else if (minDistance === 2) project.style.zIndex = "20";
      else project.style.zIndex = "10";
    }
  });
}

// function to change slides
function changeSlide(direction) {
  const allProjects = [...document.querySelectorAll(".single-project")];
  const allProjectInfos = [...document.querySelectorAll(".project-info")];
  const allProjectBgs = [...document.querySelectorAll(".single-project-bg")];

  if (!allProjects.length) return;

  // find current index
  const currentIndex = allProjects.findIndex((project) =>
    project.hasAttribute("data-current")
  );
  if (currentIndex === -1) return;

  const newIndex = wrap(currentIndex + direction, allProjects.length);

  // clear inline transforms/transitions from any previous drag so layout / stacking is predictable
  allProjects.forEach((p) => {
    p.style.transition = "";
    p.style.transform = "";
  });
  allProjectInfos.forEach((p) => {
    p.style.transition = "";
    p.style.transform = "";
  });
  allProjectBgs.forEach((p) => {
    p.style.transition = "";
    p.style.transform = "";
  });

  const removeAttributes = (elements) => {
    elements.forEach((el) => {
      el.removeAttribute("data-current");
      el.removeAttribute("data-previous");
      el.removeAttribute("data-next");
    });
  };

  removeAttributes(allProjects);
  removeAttributes(allProjectInfos);
  removeAttributes(allProjectBgs);

  // set new attributes
  allProjects[newIndex].setAttribute("data-current", "");
  allProjectInfos[newIndex] &&
    allProjectInfos[newIndex].setAttribute("data-current", "");
  allProjectBgs[newIndex] &&
    allProjectBgs[newIndex].setAttribute("data-current", "");

  const prevIndex = wrap(newIndex - 1, allProjects.length);
  allProjects[prevIndex].setAttribute("data-previous", "");
  allProjectInfos[prevIndex] &&
    allProjectInfos[prevIndex].setAttribute("data-previous", "");
  allProjectBgs[prevIndex] &&
    allProjectBgs[prevIndex].setAttribute("data-previous", "");

  const nextIndex = wrap(newIndex + 1, allProjects.length);
  allProjects[nextIndex].setAttribute("data-next", "");
  allProjectInfos[nextIndex] &&
    allProjectInfos[nextIndex].setAttribute("data-next", "");
  allProjectBgs[nextIndex] &&
    allProjectBgs[nextIndex].setAttribute("data-next", "");

  // ensure z-index is updated after DOM attributes are applied and any reflow has occurred
  requestAnimationFrame(() => updateZIndex(allProjects, newIndex));
  setTimeout(() => updateZIndex(allProjects, newIndex), 60);
}

// Inicializar el slider
function initSlider() {
  const projects = [...document.querySelectorAll(".single-project")];
  const projectsInfo = [...document.querySelectorAll(".project-info")];
  const prevBtn = document.querySelector(".slider--btn__prev");
  const nextBtn = document.querySelector(".slider--btn__next");

  if (!projects.length) return;

  // Aplicar efecto de inclinación (leave active during drag)
  let cleanUpTilt = [];
  const initTilt = () => {
    cleanUpTilt.forEach((c) => c());
    cleanUpTilt = [];
    projects.forEach((project, i) => {
      const projectInner = project.querySelector(".single-project-inner");
      const projectInfoInner = projectsInfo[i]?.querySelector(
        ".project-info__inner"
      );
      if (projectInner && projectInfoInner) {
        const cleanup = tilt(project, {
          target: [projectInner, projectInfoInner],
        });
        cleanUpTilt.push(cleanup);
      } else if (projectInner) {
        const cleanup = tilt(project, { target: projectInner });
        cleanUpTilt.push(cleanup);
      }
    });
  };
  initTilt();

  // Prevent native image drag + ensure images won't trigger HTML5 drag (fixes stop cursor)
  projects.forEach((p) => {
    p.querySelectorAll("img").forEach((img) => {
      img.draggable = false;
      img.addEventListener("dragstart", (ev) => ev.preventDefault());
    });
  });

  // Añadir event listeners a los botones
  const prevHandler = () => changeSlide(-1);
  const nextHandler = () => changeSlide(1);

  if (prevBtn) prevBtn.addEventListener("click", prevHandler);
  if (nextBtn) nextBtn.addEventListener("click", nextHandler);

  // Drag to change slides (pointer based)
  const sliderEl =
    document.querySelector(".projects-slider") ||
    projects[0]?.parentElement ||
    document.querySelector(".projects");

  // allow horizontal gestures via pointer events but preserve default cursor (no forced grabbing cursor)
  if (sliderEl)
    sliderEl.style.touchAction = sliderEl.style.touchAction || "pan-y";

  let pointerId = null;
  let startX = 0;
  let lastX = 0;
  let dragging = false;
  const DRAG_THRESHOLD = 60; // px

  const onPointerDown = (e) => {
    // only primary button / pointer
    if (e.button && e.button !== 0) return;

    // Prevent default drag behavior for OS-level image drag — images already set draggable=false, but keep lightweight preventDefault
    if (e.type === "pointerdown") {
      try {
        e.preventDefault();
      } catch (err) {}
    }

    pointerId = e.pointerId;
    startX = e.clientX;
    lastX = startX;
    dragging = true;

    try {
      sliderEl &&
        sliderEl.setPointerCapture &&
        sliderEl.setPointerCapture(pointerId);
    } catch (err) {}

    // prevent text selection during drag
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    lastX = e.clientX;

    // Only move the current card for a simple left/right movement (avoid overlap / close stacking)
    const currentIndex = projects.findIndex((p) =>
      p.hasAttribute("data-current")
    );
    if (currentIndex === -1) return;

    const current = projects[currentIndex];
    if (current) {
      // translate only the active card for direct, simple feedback
      current.style.transform = `translateX(${dx}px)`;
    }
  };

  const endDrag = (_e) => {
    if (!dragging) return;
    dragging = false;
    try {
      sliderEl &&
        sliderEl.releasePointerCapture &&
        sliderEl.releasePointerCapture(pointerId);
    } catch (err) {}

    const dx = lastX - startX;

    // animate reset of transforms for all projects (only current will have a transform)
    projects.forEach((p) => {
      p.style.transition = "transform 260ms cubic-bezier(.2,.8,.2,1)";
      p.style.transform = "";
    });
    // clear transitions after animation
    setTimeout(() => {
      projects.forEach((p) => (p.style.transition = ""));
    }, 300);

    // change slide if beyond threshold (left/right simple movement)
    if (dx > DRAG_THRESHOLD) changeSlide(-1);
    else if (dx < -DRAG_THRESHOLD) changeSlide(1);

    // restore selection
    document.body.style.userSelect = "";
  };

  if (sliderEl) {
    sliderEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  // Inicializar z-index correctamente
  const currentIndex = projects.findIndex((p) =>
    p.hasAttribute("data-current")
  );
  updateZIndex(projects, currentIndex);

  // cleanup function
  return () => {
    cleanUpTilt.forEach((cleanup) => cleanup());
    if (prevBtn) prevBtn.removeEventListener("click", prevHandler);
    if (nextBtn) nextBtn.removeEventListener("click", nextHandler);
    if (sliderEl) {
      sliderEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    }
  };
}

// Load images and then init slider
function loadImagesAndInit() {
  const images = [...document.querySelectorAll(".project-image")];
  let loadedCount = 0;

  if (images.length === 0) {
    initSlider();
    return;
  }

  const onImageLoad = () => {
    loadedCount++;
    if (loadedCount === images.length) {
      initSlider();
    }
  };

  images.forEach((img) => {
    if (img.complete) {
      onImageLoad();
    } else {
      img.addEventListener("load", onImageLoad);
      img.addEventListener("error", onImageLoad);
    }
  });
}

//////////////////////
loadImagesAndInit();
