document.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector("[data-logo-gradient]");

  if (!logo) return;

  let lastVariant = null;

  logo.addEventListener("pointerenter", () => {
    const variants = [1, 2, 3, 4, 5].filter((variant) => variant !== lastVariant);
    const variant = variants[Math.floor(Math.random() * variants.length)];
    lastVariant = variant;
    logo.className = `site-logo gradient-${variant}`;
  });

  logo.addEventListener("pointerleave", () => {
    logo.className = "site-logo";
  });
});
