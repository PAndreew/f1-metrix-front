const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let uid = 0;
// A select-style button whose popup has a search box above the full option list.
// options: [{ value, label }]; value "" is allowed for an explicit "none" entry.
export function createCombobox(host, { label, options, value, onChange }) {
  const id = `combo-${++uid}`;
  host.classList.add("combo");
  host.innerHTML = `<button type="button" class="combo-button" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(label)}"></button><div class="combo-popup" hidden><input type="search" class="combo-search" placeholder="Search…" aria-label="Search ${esc(label)}" aria-controls="${id}" autocomplete="off"><ul class="combo-list" id="${id}" role="listbox" aria-label="${esc(label)}">${options
    .map(
      (o, i) =>
        `<li role="option" id="${id}-${i}" data-value="${esc(o.value)}" aria-selected="false">${esc(o.label)}</li>`,
    )
    .join("")}</ul></div>`;
  const button = host.querySelector(".combo-button"),
    popup = host.querySelector(".combo-popup"),
    search = host.querySelector(".combo-search"),
    items = [...host.querySelectorAll("li")];
  let current = value ?? "",
    active = -1;
  const visible = () => items.filter((li) => !li.hidden);
  function setActive(li) {
    items.forEach((x) => x.classList.toggle("active", x === li));
    active = li ? items.indexOf(li) : -1;
    if (li) {
      search.setAttribute("aria-activedescendant", li.id);
      // Scroll only the list, never the page.
      const list = li.parentElement;
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
      else if (
        li.offsetTop + li.offsetHeight >
        list.scrollTop + list.clientHeight
      )
        list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
    } else search.removeAttribute("aria-activedescendant");
  }
  function render() {
    const selected = options.find((o) => o.value === current);
    button.textContent = selected?.label ?? "";
    items.forEach((li) =>
      li.setAttribute("aria-selected", String(li.dataset.value === current)),
    );
  }
  function open() {
    popup.hidden = false;
    button.setAttribute("aria-expanded", "true");
    search.value = "";
    items.forEach((li) => (li.hidden = false));
    setActive(items.find((li) => li.dataset.value === current) ?? items[0]);
    search.focus();
  }
  function close(focusButton = true) {
    if (popup.hidden) return;
    popup.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (focusButton) button.focus();
  }
  function choose(li) {
    if (!li) return;
    const changed = li.dataset.value !== current;
    current = li.dataset.value;
    render();
    close();
    if (changed) onChange(current);
  }
  button.addEventListener("click", () => (popup.hidden ? open() : close()));
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    items.forEach(
      (li) =>
        (li.hidden = q !== "" && !li.textContent.toLowerCase().includes(q)),
    );
    setActive(visible()[0]);
  });
  search.addEventListener("keydown", (event) => {
    const list = visible(),
      at = list.indexOf(items[active]);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive(list[Math.max(0, Math.min(list.length - 1, at + step))]);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(items[active]?.hidden ? null : items[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") close(false);
  });
  host
    .querySelector(".combo-list")
    .addEventListener("click", (event) => choose(event.target.closest("li")));
  host.querySelector(".combo-list").addEventListener("mousemove", (event) => {
    const li = event.target.closest("li");
    if (li && items.indexOf(li) !== active) setActive(li);
  });
  document.addEventListener("click", (event) => {
    if (!host.contains(event.target)) close(false);
  });
  render();
  return {
    set(value) {
      current = value ?? "";
      render();
    },
  };
}
