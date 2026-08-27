document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".shop-cover-preview[data-preview-count]").forEach((preview) => {
    const image = preview.querySelector("img");
    const folder = preview.dataset.previewFolder?.replace(/\/$/, "");
    const count = Number.parseInt(preview.dataset.previewCount, 10);
    const extension = preview.dataset.previewExtension || "jpg";
    if (!image || !folder || !Number.isFinite(count) || count < 1) return;

    const coverSource = image.currentSrc || image.src;
    const sources = Array.from(
      { length: count },
      (_, index) => `${folder}/${index + 1}.${extension}`
    );
    const indicators = document.createElement("span");
    indicators.className = "shop-preview-indicators";
    indicators.setAttribute("aria-hidden", "true");
    const indicatorDots = sources.map(() => {
      const dot = document.createElement("span");
      dot.className = "shop-preview-indicator";
      indicators.append(dot);
      return dot;
    });
    preview.append(indicators);

    let currentIndex = -1;
    let frameRequest;

    const setActiveIndicator = (index = -1) => {
      indicatorDots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    };

    const preload = () => {
      sources.forEach((source) => {
        const preloadImage = new Image();
        preloadImage.src = source;
      });
    };

    const updateFrame = (event) => {
      cancelAnimationFrame(frameRequest);
      frameRequest = requestAnimationFrame(() => {
        const bounds = preview.getBoundingClientRect();
        const position = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width - 1);
        const previewRange = 0.5;
        const rangeStart = (1 - previewRange) / 2;
        const progress = Math.min(
          Math.max((position / bounds.width - rangeStart) / previewRange, 0),
          0.999999
        );
        const index = Math.floor(progress * count);
        if (index === currentIndex) return;
        currentIndex = index;
        image.src = sources[index];
        setActiveIndicator(index);
      });
    };

    preview.addEventListener("mouseenter", preload, { once: true });
    preview.addEventListener("mousemove", updateFrame);
    preview.addEventListener("mouseleave", () => {
      cancelAnimationFrame(frameRequest);
      currentIndex = -1;
      image.src = coverSource;
      setActiveIndicator();
    });
  });
});
