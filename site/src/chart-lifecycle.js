import { Chart } from "chart.js";
const charts = new Set();
let scheduled = false;
const visible = (canvas) =>
  canvas.isConnected &&
  !canvas.closest("[hidden]") &&
  ![...ancestors(canvas)].some((e) => e.tagName === "DETAILS" && !e.open);
function* ancestors(element) {
  for (let e = element.parentElement; e; e = e.parentElement) yield e;
}
function refresh() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    for (const chart of charts) chart.resize();
  });
}
// Closed accordions can retain layout dimensions in some browsers. Observe visibility
// explicitly instead of relying on Chart.js's container ResizeObserver alone.
new MutationObserver(refresh).observe(document.documentElement, {
  subtree: true,
  attributes: true,
  attributeFilter: ["open", "hidden"],
});
document.fonts?.ready.then(refresh);
window.addEventListener("resize", refresh);
export function createChart(canvas, config) {
  let instance = null;
  canvas.setAttribute("aria-busy", "true");
  const controller = {
    canvas,
    resize() {
      if (!visible(canvas)) return;
      const parent = canvas.parentElement;
      const width = parent.clientWidth,
        height = parent.clientHeight;
      if (width <= 0 || height <= 0) return;
      if (!instance) {
        instance = new Chart(canvas, config);
        canvas.setAttribute("aria-busy", "false");
      } else if (
        Math.abs(instance.width - width) > 1 ||
        Math.abs(instance.height - height) > 1
      )
        instance.resize(width, height);
    },
    destroy() {
      observer.disconnect();
      charts.delete(controller);
      instance?.destroy();
      canvas.setAttribute("aria-busy", "true");
      instance = null;
    },
  };
  const observer = new ResizeObserver(refresh);
  observer.observe(canvas.parentElement);
  charts.add(controller);
  controller.resize();
  return controller;
}
