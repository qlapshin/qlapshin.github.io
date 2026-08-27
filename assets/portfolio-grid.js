document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".portfolio-grid");
  if (!grid) return;

  const cards = [...grid.children];
  const tallCards = cards.filter((card) => card.classList.contains("post-card-tall"));
  const largeCards = cards.filter((card) => card.classList.contains("post-card-large"));
  const normalCards = cards.filter(
    (card) => !card.classList.contains("post-card-tall") &&
      !card.classList.contains("post-card-large")
  );

  if (!tallCards.length && !largeCards.length) return;

  grid.classList.add("portfolio-grid-animate");
  cards.forEach((card, index) => {
    card.style.setProperty("--card-index", index);
  });

  let normalIndex;
  let row;
  let arrangedColumnCount;
  const referenceCards = new Map();

  const getColumnCount = () => {
    if (window.matchMedia("(max-width: 720px)").matches) return 2;
    if (window.matchMedia("(max-width: 1400px)").matches) return 3;
    return 4;
  };

  const place = (card, column, rowStart, columnSpan = 1, rowSpan = 1) => {
    if (!card) return;
    card.style.gridColumn = `${column} / span ${columnSpan}`;
    card.style.gridRow = `${rowStart} / span ${rowSpan}`;
  };

  const takeNormal = () => normalCards[normalIndex++];

  const fillTwoRows = (firstColumn, lastColumn) => {
    const placedCards = [];
    for (let rowOffset = 0; rowOffset < 2; rowOffset += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const card = takeNormal();
        place(card, column, row + rowOffset);
        if (card) placedCards.push(card);
      }
    }
    return placedCards;
  };

  const resetPlacement = () => {
    cards.forEach((card) => {
      card.style.removeProperty("grid-column");
      card.style.removeProperty("grid-row");
    });
    referenceCards.clear();
  };

  const resetMasonry = () => {
    grid.classList.remove("portfolio-grid-masonry");
    grid.style.removeProperty("height");
    cards.forEach((card) => {
      card.style.removeProperty("left");
      card.style.removeProperty("position");
      card.style.removeProperty("top");
      card.style.removeProperty("width");
    });
  };

  const resetFeatureCovers = () => {
    [...tallCards, ...largeCards].forEach((card) => {
      const cover = card.querySelector(".post-cover-link");
      cover?.style.removeProperty("flex");
      cover?.style.removeProperty("height");
    });
  };

  const alignFeatureCovers = () => {
    referenceCards.forEach((referenceCard, featureCard) => {
      const featureCover = featureCard.querySelector(".post-cover-link");
      const referenceCover = referenceCard?.querySelector(".post-cover-link");
      if (!featureCover || !referenceCover) return;

      const featureTop = featureCover.getBoundingClientRect().top;
      const referenceBottom = referenceCover.getBoundingClientRect().bottom;
      featureCover.style.flex = "none";
      featureCover.style.height = `${Math.max(0, referenceBottom - featureTop)}px`;
    });
  };

  const arrangeCards = (columnCount) => {
    resetMasonry();
    resetPlacement();

    normalIndex = 0;
    row = 1;

    // A 2x2 card always has two normal cards stacked directly beside it.
    // With four columns, the second neighbouring column is filled as well.
    largeCards.forEach((card, index) => {
      if (columnCount < 3) return;

      const placeOnRight = index % 2 === 1;
      const featureColumn = placeOnRight ? columnCount - 1 : 1;
      place(card, featureColumn, row, 2, 2);

      const companions = placeOnRight
        ? fillTwoRows(1, columnCount - 2)
        : fillTwoRows(3, columnCount);
      const companionColumnCount = columnCount - 2;
      const adjacentLowerCard = placeOnRight
        ? companions[companions.length - 1]
        : companions[companionColumnCount];
      referenceCards.set(card, adjacentLowerCard);

      row += 2;
    });

    // Two tall cards share a block: one on each side, with two normal
    // cards beside each of them defining the same pair of grid rows.
    for (let index = 0; index < tallCards.length; index += 2) {
      const leftCard = tallCards[index];
      const rightCard = tallCards[index + 1];

      place(leftCard, 1, row, 1, 2);

      if (rightCard && columnCount >= 3) {
        place(rightCard, columnCount, row, 1, 2);
        const companions = fillTwoRows(2, columnCount - 1);
        const companionColumnCount = columnCount - 2;
        referenceCards.set(leftCard, companions[companionColumnCount]);
        referenceCards.set(rightCard, companions[companions.length - 1]);
      } else {
        const companions = fillTwoRows(2, columnCount);
        referenceCards.set(leftCard, companions[columnCount - 1]);
      }

      row += 2;
    }

    // Continue the remaining normal cards in ordinary row-major order.
    while (normalIndex < normalCards.length) {
      for (let column = 1; column <= columnCount; column += 1) {
        const card = takeNormal();
        if (!card) break;
        place(card, column, row);
      }
      row += 1;
    }

    alignFeatureCovers();
  };

  const arrangeMasonry = (columnCount) => {
    resetPlacement();
    resetFeatureCovers();
    grid.classList.add("portfolio-grid-masonry");

    const styles = getComputedStyle(grid);
    const columnGap = parseFloat(styles.columnGap) || 0;
    const rowGap = parseFloat(styles.rowGap) || 0;
    const columnWidth =
      (grid.getBoundingClientRect().width - columnGap * (columnCount - 1)) /
      columnCount;
    const columnHeights = Array(columnCount).fill(0);

    cards.forEach((card) => {
      const columnSpan = card.classList.contains("post-card-large") ? 2 : 1;
      let bestColumn = 0;
      let bestTop = Infinity;

      for (let column = 0; column <= columnCount - columnSpan; column += 1) {
        const top = Math.max(...columnHeights.slice(column, column + columnSpan));
        if (top < bestTop) {
          bestTop = top;
          bestColumn = column;
        }
      }

      card.style.position = "absolute";
      card.style.left = `${bestColumn * (columnWidth + columnGap)}px`;
      card.style.top = `${bestTop}px`;
      card.style.width = `${columnWidth * columnSpan + columnGap * (columnSpan - 1)}px`;

      const nextTop = bestTop + card.getBoundingClientRect().height + rowGap;
      for (
        let column = bestColumn;
        column < bestColumn + columnSpan;
        column += 1
      ) {
        columnHeights[column] = nextTop;
      }
    });

    grid.style.height = `${Math.max(...columnHeights) - rowGap}px`;
  };

  const updateCards = () => {
    const columnCount = getColumnCount();
    if (columnCount < 4) {
      arrangedColumnCount = columnCount;
      arrangeMasonry(columnCount);
      return;
    }

    if (columnCount !== arrangedColumnCount) {
      arrangedColumnCount = columnCount;
      arrangeCards(columnCount);
      return;
    }

    alignFeatureCovers();
  };

  window.addEventListener("resize", () => requestAnimationFrame(updateCards), {
    passive: true,
  });
  ["(max-width: 1400px)", "(max-width: 720px)"].forEach((query) => {
    window.matchMedia(query).addEventListener("change", () => {
      requestAnimationFrame(updateCards);
    });
  });
  document.fonts?.ready.then(updateCards);
  updateCards();

  const revealCards = () => {
    updateCards();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    requestAnimationFrame(() => {
      if (!reduceMotion) {
        cards.forEach((card, index) => {
          card.animate(
            [
              { opacity: 0, transform: "translateY(14px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 520,
              delay: 120 + index * 55,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "both",
            }
          );
        });
      }

      grid.classList.remove("portfolio-grid-pending");
      grid.classList.remove("portfolio-grid-animate");
      grid.classList.add("portfolio-grid-ready");
    });
  };

  if (document.readyState === "complete") revealCards();
  else window.addEventListener("load", revealCards, { once: true });
});
