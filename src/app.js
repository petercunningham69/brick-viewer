import { BRICKS, MORTARS, findBrick } from "./data.js";

const root = document.getElementById("app");

const MORTAR_SWATCH = {
  "1_White": "#f1efe9",
  "2_Cement_Grey": "#8d8d8b",
  "3_Buff": "#c9ad7c",
};

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return { view: "grid" };
  return { view: "brick", slug: hash };
}

function render() {
  const route = parseRoute();
  if (route.view === "brick" && findBrick(route.slug)) {
    renderDetail(findBrick(route.slug));
  } else {
    renderGrid();
  }
}

function renderGrid() {
  root.innerHTML = `
    <header class="site-header">
      <h1>Brick Sample Library</h1>
      <p>Select a brick to compare mortar colours and zoom in on the texture.</p>
    </header>
    <main>
      <div class="brick-grid">
        ${BRICKS.map(
          (b) => `
          <a class="brick-card" href="#/${b.slug}">
            <div class="thumb-wrap">
              <img src="${b.thumb}" alt="${b.name} brick sample" loading="lazy" />
            </div>
            <div class="label">
              <div class="name">${b.name}</div>
              <div class="sub">${MORTARS.length} mortar colours</div>
            </div>
          </a>`
        ).join("")}
      </div>
    </main>
    <footer class="site-footer">Brick Sample Library &mdash; share this URL with clients to review options.</footer>
  `;
}

function renderDetail(brick) {
  let activeMortar = MORTARS[0].key;

  root.innerHTML = `
    <header class="site-header">
      <h1>${brick.name}</h1>
      <p>Compare mortar colours below, then click or scroll on the image to zoom in.</p>
    </header>
    <main>
      <a class="back-link" href="#/">&larr; All bricks</a>
      <div class="detail-layout">
        <div class="viewer-frame" id="viewer-frame">
          <img id="viewer-img" src="${brick.images[activeMortar]}" alt="${brick.name} with ${MORTARS[0].label} mortar" draggable="false" />
          <div class="zoom-hint" id="zoom-hint">Scroll or pinch to zoom &middot; drag to pan</div>
          <div class="viewer-controls">
            <button type="button" id="zoom-out" aria-label="Zoom out">&minus;</button>
            <button type="button" id="zoom-reset" aria-label="Reset zoom">&#8634;</button>
            <button type="button" id="zoom-in" aria-label="Zoom in">&plus;</button>
          </div>
        </div>
        <div class="side-panel">
          <h2>${brick.name}</h2>
          <p class="desc">Mortar colour</p>
          <div class="mortar-toggle" role="radiogroup" aria-label="Mortar colour">
            ${MORTARS.map(
              (m) => `
              <button type="button" class="mortar-option${m.key === activeMortar ? " active" : ""}" data-mortar="${m.key}" role="radio" aria-checked="${m.key === activeMortar}">
                <span class="swatch" style="background:${MORTAR_SWATCH[m.key]}" aria-hidden="true"></span>
                <span class="name">${m.label}</span>
                <span class="check" aria-hidden="true">&#10003;</span>
              </button>`
            ).join("")}
          </div>
          <div class="other-bricks">
            <div class="toggle-label">Other bricks</div>
            <div class="mini-grid">
              ${BRICKS.map(
                (b) => `
                <a href="#/${b.slug}" class="${b.slug === brick.slug ? "current" : ""}" title="${b.name}">
                  <img src="${b.thumb}" alt="${b.name}" loading="lazy" />
                </a>`
              ).join("")}
            </div>
          </div>
        </div>
      </div>
    </main>
    <footer class="site-footer">Brick Sample Library &mdash; share this URL with clients to review options.</footer>
  `;

  setupMortarToggle(brick);
  setupZoomPan();
}

function setupMortarToggle(brick) {
  const buttons = root.querySelectorAll(".mortar-option");
  const img = document.getElementById("viewer-img");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.mortar;
      const mortar = MORTARS.find((m) => m.key === key);
      img.src = brick.images[key];
      img.alt = `${brick.name} with ${mortar.label} mortar`;
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("active", active);
        b.setAttribute("aria-checked", String(active));
      });
    });
  });
}

function setupZoomPan() {
  const frame = document.getElementById("viewer-frame");
  const img = document.getElementById("viewer-img");
  const hint = document.getElementById("zoom-hint");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomResetBtn = document.getElementById("zoom-reset");

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  let scale = 1;
  let originX = 0; // translation in px
  let originY = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pointerMoved = false;

  function apply() {
    img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    frame.classList.toggle("zoomed", scale > 1);
    if (scale > 1) hint.style.opacity = "0";
    else hint.style.opacity = "0.85";
  }

  function clampOrigin() {
    const rect = frame.getBoundingClientRect();
    const maxX = 0;
    const maxY = 0;
    const minX = rect.width - rect.width * scale;
    const minY = rect.height - rect.height * scale;
    originX = Math.min(maxX, Math.max(minX, originX));
    originY = Math.min(maxY, Math.max(minY, originY));
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = frame.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    if (newScale === scale) return;

    // Keep point under cursor stationary
    originX = px - ((px - originX) / scale) * newScale;
    originY = py - ((py - originY) / scale) * newScale;
    scale = newScale;

    if (scale === 1) {
      originX = 0;
      originY = 0;
    }

    clampOrigin();
    apply();
  }

  function reset() {
    scale = 1;
    originX = 0;
    originY = 0;
    apply();
  }

  frame.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      zoomAt(e.clientX, e.clientY, factor);
    },
    { passive: false }
  );

  frame.addEventListener("dblclick", (e) => {
    if (e.target.closest(".viewer-controls")) return;
    if (scale > 1) {
      reset();
    } else {
      zoomAt(e.clientX, e.clientY, 2.5);
    }
  });

  frame.addEventListener("pointerdown", (e) => {
    if (scale <= 1) return;
    if (e.target.closest(".viewer-controls")) return;
    dragging = true;
    pointerMoved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    frame.classList.add("panning");
    frame.setPointerCapture(e.pointerId);
  });

  frame.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pointerMoved = true;
    lastX = e.clientX;
    lastY = e.clientY;
    originX += dx;
    originY += dy;
    clampOrigin();
    apply();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    frame.classList.remove("panning");
  }

  frame.addEventListener("pointerup", endDrag);
  frame.addEventListener("pointercancel", endDrag);
  frame.addEventListener("pointerleave", endDrag);

  zoomInBtn.addEventListener("click", () => {
    const rect = frame.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.4);
  });
  zoomOutBtn.addEventListener("click", () => {
    const rect = frame.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.4);
  });
  zoomResetBtn.addEventListener("click", reset);

  apply();
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);
render();
