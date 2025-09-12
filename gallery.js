document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("project-gallery");
  const backdrop = document.getElementById("gallery-backdrop");
  const galleryMedia = document.getElementById("gallery-media");
  const titleEl = document.getElementById("gallery-title");
  const descEl = document.getElementById("gallery-desc");
  const counterEl = document.getElementById("gallery-counter");
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");
  const closeBtn = document.getElementById("gallery-close");
  const captionInner = document.querySelector(".gallery-caption-inner");

  if (!overlay) return;

  // image layers used for transitions
  let imgMain = null;
  let imgNext = null;

  function ensureImages() {
    if (!galleryMedia) return;
    imgMain = galleryMedia.querySelector("img.current");
    imgNext = galleryMedia.querySelector("img.next");

    if (!imgMain) {
      imgMain = document.createElement("img");
      imgMain.className = "current";
      imgMain.style.transform = "translate(-50%, -50%) translateX(0)";
      galleryMedia.appendChild(imgMain);
    }
    if (!imgNext) {
      imgNext = document.createElement("img");
      imgNext.className = "next";
      imgNext.style.transform = "translate(-50%, -50%) translateX(100%)";
      galleryMedia.appendChild(imgNext);
    }

    [imgMain, imgNext].forEach((el) => {
      if (!el) return;
      el.style.willChange = "transform, opacity";
      el.draggable = false;
      el.addEventListener("dragstart", (ev) => ev.preventDefault());
    });
  }
  ensureImages();

  const captionTextEls = [titleEl, descEl].filter(Boolean);
  let captionCleanup = null;
  function cancelCaptionAnimations() {
    if (captionCleanup) {
      try {
        captionCleanup();
      } catch {}
      captionCleanup = null;
    }
  }

  function animateCaptionOut() {
    if (!captionTextEls.length) return Promise.resolve();
    cancelCaptionAnimations();
    let active = true;
    const handlers = [];
    captionCleanup = () => {
      active = false;
      handlers.forEach(({ el, fn }) =>
        el.removeEventListener("transitionend", fn)
      );
    };

    return new Promise((resolve) => {
      let remaining = captionTextEls.length;
      captionTextEls.forEach((el) => {
        el.style.transition =
          "opacity 220ms cubic-bezier(.2,.8,.2,1), transform 260ms cubic-bezier(.2,.8,.2,1)";
        requestAnimationFrame(() => {
          el.style.opacity = "0";
          el.style.transform = "translateY(14px)";
        });
        const fn = (e) => {
          if (!active) return;
          if (
            e &&
            e.propertyName &&
            !["opacity", "transform"].includes(e.propertyName)
          )
            return;
          el.removeEventListener("transitionend", fn);
          remaining -= 1;
          if (remaining <= 0) {
            captionCleanup = null;
            active = false;
            resolve();
          }
        };
        handlers.push({ el, fn });
        el.addEventListener("transitionend", fn);
      });
      setTimeout(() => {
        if (!active) return;
        captionCleanup = null;
        active = false;
        resolve();
      }, 420);
    });
  }

  function animateCaptionIn() {
    if (!captionTextEls.length) return Promise.resolve();
    cancelCaptionAnimations();
    let active = true;
    const handlers = [];
    captionCleanup = () => {
      active = false;
      handlers.forEach(({ el, fn }) =>
        el.removeEventListener("transitionend", fn)
      );
    };

    return new Promise((resolve) => {
      let remaining = captionTextEls.length;
      captionTextEls.forEach((el) => {
        el.style.transition = "";
        el.style.opacity = "0";
        el.style.transform = "translateY(14px)";
      });
      captionTextEls[0] && captionTextEls[0].getBoundingClientRect();

      requestAnimationFrame(() => {
        captionTextEls.forEach((el) => {
          el.style.transition =
            "opacity 300ms cubic-bezier(.2,.8,.2,1), transform 360ms cubic-bezier(.2,.8,.2,1)";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          const fn = (e) => {
            if (!active) return;
            if (
              e &&
              e.propertyName &&
              !["opacity", "transform"].includes(e.propertyName)
            )
              return;
            el.removeEventListener("transitionend", fn);
            remaining -= 1;
            if (remaining <= 0) {
              captionTextEls.forEach((t) => {
                t.style.transition = "";
                t.style.transform = "";
                t.style.opacity = "";
              });
              captionCleanup = null;
              active = false;
              resolve();
            }
          };
          handlers.push({ el, fn });
          el.addEventListener("transitionend", fn);
        });
      });

      setTimeout(() => {
        if (!active) return;
        captionTextEls.forEach((t) => {
          t.style.transition = "";
          t.style.transform = "";
          t.style.opacity = "";
        });
        captionCleanup = null;
        active = false;
        resolve();
      }, 620);
    });
  }

  // gallery state
  let items = [];
  let current = 0;
  let activeCard = null;
  let isAnimating = false;

  function collectItems(card) {
    const list = [];
    const hiddenImgs = card.querySelectorAll(".gallery-items img");
    if (hiddenImgs && hiddenImgs.length) {
      hiddenImgs.forEach((i) => {
        if (i.src)
          list.push({ src: i.src, desc: i.dataset.desc || i.alt || "" });
      });
    } else {
      const thumb = card.querySelector("img.portfolio-grid-project-image, img");
      if (thumb && thumb.src)
        list.push({ src: thumb.src, desc: thumb.alt || "" });
    }
    return list;
  }

  function updateControlsVisibility() {
    const moreThanOne = items && items.length > 1;
    if (prevBtn) prevBtn.style.display = moreThanOne ? "" : "none";
    if (nextBtn) nextBtn.style.display = moreThanOne ? "" : "none";
    if (counterEl) counterEl.style.display = moreThanOne ? "" : "none";
  }

  // open gallery from project card
  document.querySelectorAll(".project-card").forEach((card) => {
    card.style.cursor = "zoom-in";
    card.addEventListener("click", (e) => {
      if (
        e.target.closest(".project-link-button") ||
        e.target.closest("a") ||
        e.target.closest("button")
      )
        return;
      const thumb = card.querySelector("img.portfolio-grid-project-image, img");
      openGallery(card, thumb);
    });
  });

  function openGallery(card) {
    ensureImages();
    items = collectItems(card);
    if (!items.length) return;
    activeCard = card;
    current = 0;
    titleEl &&
      (titleEl.textContent =
        (card.querySelector(".project-title") || {}).textContent || "");
    descEl &&
      (descEl.textContent =
        items[0].desc ||
        (card.querySelector(".project-description") || {}).textContent ||
        "");

    if (imgMain) {
      imgMain.src = items[0].src;
      imgMain.alt = titleEl ? titleEl.textContent : "";
    }

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0)
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    if (galleryMedia) galleryMedia.style.visibility = "hidden";
    overlay.classList.add("open");

    if (backdrop) {
      backdrop.style.opacity = "0";
      requestAnimationFrame(() => {
        backdrop.style.transition = "opacity 260ms ease";
        backdrop.style.opacity = "1";
      });
    }

    if (captionInner) {
      captionInner.style.opacity = "0";
      captionInner.style.transition = "opacity 320ms ease";
      captionInner.style.visibility = "visible";
      requestAnimationFrame(() => {
        captionInner.style.opacity = "1";
      });
    }

    updateControlsVisibility();

    if (galleryMedia) {
      galleryMedia.style.visibility = "visible";
      galleryMedia.style.opacity = "0";
      galleryMedia.style.transform = "scale(0.96) translateY(10px)";
      galleryMedia.style.borderRadius = "12px";
      galleryMedia.style.transition =
        "transform 360ms cubic-bezier(.2,.8,.2,1), opacity 360ms cubic-bezier(.2,.8,.2,1), border-radius 260ms linear";
      if (imgMain) {
        imgMain.style.transition = "opacity 300ms ease";
        imgMain.style.opacity = "0";
      }

      galleryMedia.getBoundingClientRect();
      requestAnimationFrame(() => {
        galleryMedia.style.opacity = "1";
        galleryMedia.style.transform = "scale(1) translateY(0)";
        galleryMedia.style.borderRadius = "0px";
        if (imgMain) imgMain.style.opacity = "1";
      });

      const onEnd = async (e) => {
        if (
          e &&
          e.propertyName &&
          !["opacity", "transform"].includes(e.propertyName)
        )
          return;
        galleryMedia.removeEventListener("transitionend", onEnd);
        galleryMedia.style.transition = "";
        galleryMedia.style.transform = "";
        galleryMedia.style.borderRadius = "";
        galleryMedia.style.opacity = "";
        if (imgMain) imgMain.style.transition = "";
        showSlide(0);
        await animateCaptionIn();
        closeBtn && closeBtn.focus();
      };
      galleryMedia.addEventListener("transitionend", onEnd, { once: true });
    } else {
      showSlide(0);
      animateCaptionIn().catch(() => {});
      closeBtn && closeBtn.focus();
    }
  }

  function showSlide(index, direction = null) {
    if (!items.length) return;
    const nextIndex = ((index % items.length) + items.length) % items.length;
    if (nextIndex === current && direction) return;
    ensureImages();

    // immediate swap
    if (!direction) {
      if (!imgMain || !imgNext) return;
      imgMain.style.transition = "none";
      imgMain.src = items[nextIndex].src;
      imgMain.alt = titleEl ? titleEl.textContent : "";
      descEl && (descEl.textContent = items[nextIndex].desc || "");
      counterEl &&
        (counterEl.textContent = `${nextIndex + 1} / ${items.length}`);
      current = nextIndex;

      imgMain.style.transform = "translate(-50%, -50%) translateX(0)";
      imgMain.style.opacity = "1";
      imgNext.style.transition = "none";
      imgNext.style.transform = "translate(-50%, -50%) translateX(100%)";
      imgNext.style.opacity = "1";

      imgNext.getBoundingClientRect();
      requestAnimationFrame(() => {
        imgMain.style.transition = "";
        imgNext.style.transition = "";
        cancelCaptionAnimations();
        animateCaptionIn().catch(() => {});
        updateControlsVisibility();
      });
      return;
    }

    // animated swap
    animateCaptionOut().catch(() => {});
    if (isAnimating) return;
    isAnimating = true;
    galleryMedia && galleryMedia.classList.add("animating");

    const fromRight = direction === "next";
    const pre = new Image();
    pre.src = items[nextIndex].src;

    const beginAnimation = () => {
      if (!imgMain || !imgNext) {
        isAnimating = false;
        galleryMedia && galleryMedia.classList.remove("animating");
        return;
      }

      imgNext.src = pre.src;
      imgNext.alt = titleEl ? titleEl.textContent : "";

      imgNext.style.transition = "none";
      imgNext.style.transform = `translate(-50%, -50%) translateX(${
        fromRight ? "100%" : "-100%"
      })`;
      imgNext.style.opacity = "1";
      imgNext.getBoundingClientRect();

      requestAnimationFrame(() => {
        imgNext.style.transition = "";
        imgMain.style.transition = "";

        imgMain.style.transform = `translate(-50%, -50%) translateX(${
          fromRight ? "-100%" : "100%"
        })`;
        imgMain.style.opacity = "0";
        imgNext.style.transform = `translate(-50%, -50%) translateX(0)`;
        imgNext.style.opacity = "1";
      });

      const onEnd = (e) => {
        if (e && e.propertyName && e.propertyName !== "transform") return;
        if (e && e.target !== imgNext) return;

        imgMain.style.transition = "none";
        imgNext.style.transition = "none";

        if (imgMain.classList.contains("current"))
          imgMain.classList.replace("current", "next");
        else imgMain.classList.add("next");
        if (imgNext.classList.contains("next"))
          imgNext.classList.replace("next", "current");
        else imgNext.classList.add("current");

        [imgMain, imgNext] = [imgNext, imgMain];

        imgNext.style.transform = "translate(-50%, -50%) translateX(100%)";

        descEl && (descEl.textContent = items[nextIndex].desc || "");
        counterEl &&
          (counterEl.textContent = `${nextIndex + 1} / ${items.length}`);
        current = nextIndex;

        cancelCaptionAnimations();
        animateCaptionIn().catch(() => {});
        updateControlsVisibility();

        imgNext.getBoundingClientRect();
        imgMain.getBoundingClientRect();

        requestAnimationFrame(() => {
          imgNext.style.transition = "";
          imgMain.style.transition = "";
          isAnimating = false;
          galleryMedia && galleryMedia.classList.remove("animating");
        });
      };

      imgNext.addEventListener("transitionend", onEnd, { once: true });
    };

    if (pre.complete) beginAnimation();
    else {
      pre.onload = beginAnimation;
      pre.onerror = beginAnimation;
    }
  }

  function doCloseCleanup() {
    overlay.classList.remove("open");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    activeCard = null;
    items = [];
    current = 0;

    if (backdrop) {
      backdrop.style.transition = "";
      backdrop.style.opacity = "";
    }
    if (galleryMedia) {
      galleryMedia.style.transition = "";
      galleryMedia.style.transform = "";
      galleryMedia.style.borderRadius = "";
      galleryMedia.style.opacity = "";
      galleryMedia.style.visibility = "hidden";
    }

    if (imgMain) {
      imgMain.style.transition = "";
      imgMain.style.opacity = "1";
      imgMain.src = "";
      imgMain.alt = "";
      imgMain.style.transform = "translate(-50%, -50%) translateX(0)";
    }
    if (imgNext) {
      imgNext.style.transition = "";
      imgNext.style.opacity = "1";
      imgNext.src = "";
      imgNext.alt = "";
      imgNext.style.transform = "translate(-50%, -50%) translateX(100%)";
    }

    if (captionInner) {
      captionInner.style.transition = "";
      captionInner.style.opacity = "";
      captionInner.style.visibility = "";
    }
    captionTextEls.forEach((t) => {
      t && (t.style.transition = "");
      t && (t.style.opacity = "");
      t && (t.style.transform = "");
    });
  }

  function closeGallery() {
    if (!overlay.classList.contains("open")) return;
    cancelCaptionAnimations();

    if (galleryMedia) {
      if (captionInner) {
        captionInner.style.transition = "opacity 220ms ease";
        captionInner.style.opacity = "0";
      }
      if (backdrop) {
        backdrop.style.transition = "opacity 220ms ease";
        backdrop.style.opacity = "0";
      }

      galleryMedia.style.transition =
        "transform 260ms cubic-bezier(.2,.8,.2,1), opacity 260ms cubic-bezier(.2,.8,.2,1), border-radius 220ms linear";
      galleryMedia.style.transform = "scale(1) translateY(0)";
      galleryMedia.style.borderRadius = "0px";
      galleryMedia.style.opacity = "1";

      if (imgMain) {
        imgMain.style.transition = "opacity 200ms ease";
        imgMain.style.opacity = "1";
      }

      galleryMedia.getBoundingClientRect();
      requestAnimationFrame(() => {
        galleryMedia.style.transform = "scale(0.96) translateY(10px)";
        galleryMedia.style.borderRadius = "12px";
        galleryMedia.style.opacity = "0";
        if (imgMain) imgMain.style.opacity = "0";
      });

      let cleaned = false;
      const doCleanup = () => {
        if (cleaned) return;
        cleaned = true;
        doCloseCleanup();
      };

      const onEnd = (e) => {
        if (
          e &&
          e.propertyName &&
          !["opacity", "transform"].includes(e.propertyName)
        )
          return;
        galleryMedia.removeEventListener("transitionend", onEnd);
        doCleanup();
      };
      galleryMedia.addEventListener("transitionend", onEnd, { once: true });
      setTimeout(doCleanup, 500);
    } else {
      doCloseCleanup();
      if (backdrop) backdrop.style.opacity = "0";
    }
  }

  // controls
  prevBtn &&
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showSlide(current - 1, "prev");
    });
  nextBtn &&
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showSlide(current + 1, "next");
    });
  closeBtn && closeBtn.addEventListener("click", closeGallery);
  backdrop && backdrop.addEventListener("click", closeGallery);

  // close when clicking outside media or caption
  overlay.addEventListener("click", (e) => {
    const target = e.target;
    if (galleryMedia && galleryMedia.contains(target)) return;
    if (captionInner && captionInner.contains(target)) return;
    closeGallery();
  });

  // stop propagation for clicks inside media/text
  galleryMedia &&
    galleryMedia.addEventListener("click", (e) => e.stopPropagation());
  captionInner &&
    captionInner.addEventListener("click", (e) => e.stopPropagation());
});
