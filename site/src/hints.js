const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// One shared hint box, positioned against the viewport so scrolling tables
// (overflow: auto) cannot clip it.
const box = document.createElement("div");
box.className = "hint-box";
box.id = "hint-box";
box.setAttribute("role", "tooltip");
box.hidden = true;
document.body.append(box);
let owner = null;
function close() {
  owner?.setAttribute("aria-expanded", "false");
  owner = null;
  box.hidden = true;
}
function open(button) {
  close();
  owner = button;
  button.setAttribute("aria-expanded", "true");
  box.textContent = button.dataset.hint;
  box.hidden = false;
  const r = button.getBoundingClientRect(),
    width = box.offsetWidth;
  box.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - width / 2, innerWidth - width - 8))}px`;
  box.style.top =
    r.bottom + 8 + box.offsetHeight > innerHeight
      ? `${r.top - 8 - box.offsetHeight}px`
      : `${r.bottom + 8}px`;
}
document.addEventListener("click", (event) => {
  const button = event.target.closest(".info");
  if (!button) return close();
  event.preventDefault();
  event.stopPropagation();
  button === owner ? close() : open(button);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && owner) {
    const button = owner;
    close();
    button.focus();
  }
});
addEventListener("scroll", close, true);
addEventListener("resize", close);
export const info = (label, text) =>
  `<button type="button" class="info" aria-label="What is ${esc(label)}?" aria-expanded="false" aria-describedby="hint-box" data-hint="${esc(text)}">i</button>`;
