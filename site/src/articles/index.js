import { driverOrCar } from "./driver-or-car.js";

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const date = (value) =>
  new Date(value + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const pill = `<span class="pill">LLM generated</span>`;
const href = (a) => `#/posts/${a.id}`;

// Newest first.
export const articles = [driverOrCar].sort((a, b) =>
  b.date.localeCompare(a.date),
);

const listItem = (a) =>
  `<li><a href="${href(a)}">${esc(a.title)}</a><span class="post-date">${date(a.date)}</span></li>`;

// Home page accordion: the latest article as a stub, then links to the rest.
export function articlesSection(target) {
  const [latest, ...rest] = articles;
  target.innerHTML = latest
    ? `<article class="post-stub"><p class="post-date">${date(latest.date)} ${pill}</p><h3><a href="${href(latest)}">${esc(latest.title)}</a></h3><p>${esc(latest.summary)}</p><a class="read-more" href="${href(latest)}">Read the article</a></article>${rest.length ? `<h3 class="more-posts">More articles</h3><ul class="post-list">${rest.map(listItem).join("")}</ul>` : ""}`
    : `<p class="empty-page">No articles yet.</p>`;
}

export function postsPage(target) {
  target.innerHTML = `<div class="page-head"><h1>Posts</h1></div>${
    articles.length
      ? `<ul class="post-list">${articles.map(listItem).join("")}</ul>`
      : `<p class="empty-page">No posts yet.</p>`
  }`;
}

export function articlePage(target, id, context) {
  const a = articles.find((a) => a.id === id);
  if (!a) {
    target.innerHTML = `<div class="page-head"><h1>Article not found</h1></div><p><a href="#/posts">All posts</a></p>`;
    return null;
  }
  target.innerHTML = `<a class="back" href="#/posts">All posts</a><div class="page-head"><h1>${esc(a.title)}</h1>${pill}</div><p class="post-date">${date(a.date)}</p><div class="prose post-body"></div>`;
  a.render(target.querySelector(".post-body"), context);
  return a;
}
