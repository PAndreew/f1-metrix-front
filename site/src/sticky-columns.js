// Preserve row identity during horizontal scrolling, including dynamically replaced rows.
export function installStickyColumns(root) {
  let scheduled = false;
  const visible = (table) =>
    !table.closest("[hidden]") &&
    ![...ancestors(table)].some((e) => e.tagName === "DETAILS" && !e.open);
  function* ancestors(element) {
    for (let e = element.parentElement; e; e = e.parentElement) yield e;
  }
  function refresh() {
    scheduled = false;
    for (const table of root.querySelectorAll(".table-wrap table")) {
      const header = table.tHead?.rows[0];
      if (!header || !visible(table)) continue;
      const labels = [...header.cells].map((c) =>
        c.textContent.trim().replace(/\s+/g, " "),
      );
      let indices = [];
      if (table.id === "rankings") indices = [0, 1];
      else if (labels[0] === "Driver")
        indices = labels[1]?.startsWith("Finish") ? [0, 1] : [0];
      else if (labels[0] === "Round" && labels.includes("Faster"))
        indices = [0, labels.indexOf("Faster")];
      else if (["Faster", "Teammates", "Name"].includes(labels[0]))
        indices = [0];
      if (!indices.length) continue;
      for (const row of table.rows) {
        if (row.cells.length !== header.cells.length) continue;
        for (const index of indices) {
          const cell = row.cells[index];
          const rank =
            (table.id === "rankings" && index === 0) ||
            labels[index] === "Round" ||
            labels[index]?.startsWith("Finish");
          cell.classList.add(
            "frozen-column",
            rank ? "frozen-rank" : "frozen-identity",
          );
        }
      }
      let left = 0;
      for (const index of indices) {
        for (const row of table.rows) {
          if (row.cells.length === header.cells.length)
            row.cells[index].style.setProperty("--frozen-left", `${left}px`);
        }
        left += header.cells[index].getBoundingClientRect().width;
      }
    }
  }
  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(refresh);
    }
  }
  const observer = new MutationObserver(schedule);
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["hidden", "open"],
  });
  window.addEventListener("resize", schedule);
  document.fonts?.ready.then(schedule);
  schedule();
}
