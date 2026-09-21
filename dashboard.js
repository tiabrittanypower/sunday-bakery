/**
 * Sunday Bakery — owner Bake Dashboard
 * Scales Month 1 recipes by boxes ordered; builds combined shopping list.
 */
(function () {
  "use strict";

  var DATA_URL = "data/recipes/month-1.json";
  var COSTINGS_URL = "data/costings/box-costings.json";
  var GROUP_ORDER = ["dry", "dairy", "produce", "pantry", "packaging"];
  var GROUP_LABELS = {
    dry: "Dry",
    dairy: "Dairy",
    produce: "Produce",
    pantry: "Pantry",
    packaging: "Packaging",
  };

  var state = {
    data: null,
    costings: null,
    week: 1,
    boxes: 1,
  };

  function money(n) {
    if (n == null || isNaN(n)) return "—";
    return "R" + Number(n).toFixed(2);
  }

  function moneyWhole(n) {
    if (n == null || isNaN(n)) return "—";
    return "R" + Math.round(Number(n));
  }

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function clampBoxes(n) {
    var v = parseInt(n, 10);
    if (isNaN(v) || v < 1) return 1;
    if (v > 50) return 50;
    return v;
  }

  /** Scale + round per unit rules */
  function scaleAmount(amount, unit, boxes) {
    var raw = Number(amount) * boxes;
    var u = String(unit || "").toLowerCase();

    if (u === "pinch") {
      return { kind: "pinch", count: Math.round(raw) || boxes };
    }
    if (u === "each" || u === "egg" || u === "eggs") {
      return { kind: "number", value: Math.ceil(raw), unit: unit };
    }
    if (u === "tsp" || u === "tbsp") {
      return { kind: "number", value: Math.round(raw * 10) / 10, unit: unit };
    }
    // g, ml, and anything else numeric → nearest whole
    return { kind: "number", value: Math.round(raw), unit: unit };
  }

  function formatScaled(scaled) {
    if (scaled.kind === "pinch") {
      return scaled.count <= 1 ? "1 pinch" : "pinch × " + scaled.count;
    }
    var v = scaled.value;
    var display =
      typeof v === "number" && !Number.isInteger(v) ? v.toFixed(1) : String(v);
    return display + " " + (scaled.unit || "");
  }

  function formatAmountOnly(scaled) {
    if (scaled.kind === "pinch") {
      return scaled.count <= 1 ? "1 pinch" : "pinch × " + scaled.count;
    }
    var v = scaled.value;
    if (typeof v === "number" && !Number.isInteger(v)) return v.toFixed(1);
    return String(v);
  }

  function unitForDisplay(scaled) {
    if (scaled.kind === "pinch") return "";
    return scaled.unit || "";
  }

  function getWeekData() {
    if (!state.data || !state.data.weeks) return null;
    return (
      state.data.weeks.find(function (w) {
        return w.week === state.week;
      }) || null
    );
  }

  function consolidateShopping(weekData, boxes) {
    var map = Object.create(null);

    weekData.recipes.forEach(function (recipe) {
      (recipe.ingredients || []).forEach(function (ing) {
        var key = ing.key + "::" + ing.unit;
        if (!map[key]) {
          map[key] = {
            key: ing.key,
            name: shoppingName(ing.name),
            unit: ing.unit,
            group: ing.group || "pantry",
            rawSum: 0,
          };
        }
        map[key].rawSum += Number(ing.amount) * boxes;
        // Prefer shorter, cleaner shopping name when consolidating
        var sn = shoppingName(ing.name);
        if (sn.length < map[key].name.length) map[key].name = sn;
      });
    });

    var items = Object.keys(map).map(function (k) {
      var item = map[k];
      var scaled = roundSum(item.rawSum, item.unit);
      return {
        key: item.key,
        name: item.name,
        unit: item.unit,
        group: item.group,
        scaled: scaled,
        display: formatScaled(scaled),
      };
    });

    items.sort(function (a, b) {
      var ga = GROUP_ORDER.indexOf(a.group);
      var gb = GROUP_ORDER.indexOf(b.group);
      if (ga < 0) ga = 99;
      if (gb < 0) gb = 99;
      if (ga !== gb) return ga - gb;
      return a.name.localeCompare(b.name);
    });

    return items;
  }

  /** Strip recipe-role notes for cleaner shopping lines */
  function shoppingName(name) {
    return String(name || "")
      .replace(/\s*\((?:dough|filling|glaze|batter|drizzle|pudding|sauce|base|custard|optional[^)]*)\)/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function roundSum(raw, unit) {
    var u = String(unit || "").toLowerCase();
    if (u === "pinch") {
      return { kind: "pinch", count: Math.round(raw) || 1 };
    }
    if (u === "each" || u === "egg" || u === "eggs") {
      return { kind: "number", value: Math.ceil(raw), unit: unit };
    }
    if (u === "tsp" || u === "tbsp") {
      return { kind: "number", value: Math.round(raw * 10) / 10, unit: unit };
    }
    return { kind: "number", value: Math.round(raw), unit: unit };
  }

  function render() {
    var weekData = getWeekData();
    if (!weekData) {
      els.loadError.hidden = false;
      els.loadError.textContent = "Week " + state.week + " not found in recipe data.";
      return;
    }
    els.loadError.hidden = true;

    var boxes = state.boxes;
    var price = weekData.price || 0;

    els.themeKicker.textContent =
      "Week " + weekData.week + " · Month 1 · R" + price + " / box · fits bakery box";
    els.themeTitle.textContent = weekData.themeName || "—";
    els.themePrice.textContent = "R" + price;
    els.scaleLabel.textContent = boxes + "×";
    els.revenueLabel.textContent = "R" + price * boxes;
    els.boxSummaryScale.textContent =
      boxes === 1 ? "(per 1 box · 2–3 people)" : "(yields × " + boxes + ")";
    els.shoppingScale.textContent =
      "for " + boxes + " box" + (boxes === 1 ? "" : "es");
    els.printTheme.textContent =
      "Week " + weekData.week + " · " + (weekData.themeName || "");
    els.printBoxes.textContent =
      boxes + " box" + (boxes === 1 ? "" : "es");

    // Box-fit callout (right-sized portions)
    if (els.boxFitNote) {
      var fit = (state.data && state.data.boxFit) || null;
      if (fit) {
        els.boxFitNote.hidden = false;
        els.boxFitNote.textContent =
          "Box-fit: sized for " +
          (fit.people || "2–3") +
          ". " +
          (fit.packaging || "") +
          " Portions are smaller than a full tea table so they pack without crushing.";
      } else {
        els.boxFitNote.hidden = true;
      }
    }

    renderCosting(weekData);

    // Box contents
    els.boxContents.innerHTML = "";
    weekData.recipes.forEach(function (recipe, i) {
      var li = document.createElement("li");
      if (recipe.image) li.classList.add("has-thumb");
      var yieldNote = recipe.yield || "";
      // When scaling boxes, show yield multiplied for countable items where possible
      var label = recipe.name;
      if (yieldNote) label += " — " + scaleYield(yieldNote, boxes);
      li.innerHTML =
        (recipe.image
          ? '<img class="box-thumb" src="' +
            recipe.image.replace(/"/g, "") +
            '" alt="" loading="lazy">'
          : "") +
        '<span class="box-num">' +
        String(i + 1).padStart(2, "0") +
        '</span><span class="box-label"></span>';
      li.querySelector(".box-label").textContent = label;
      els.boxContents.appendChild(li);
    });

    // Recipe cards
    els.recipeGrid.innerHTML = "";
    weekData.recipes.forEach(function (recipe) {
      els.recipeGrid.appendChild(buildRecipeCard(recipe, boxes));
    });

    // Shopping list
    var shopping = consolidateShopping(weekData, boxes);
    els.shoppingList.innerHTML = "";
    var byGroup = Object.create(null);
    shopping.forEach(function (item) {
      var g = item.group || "pantry";
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(item);
    });

    GROUP_ORDER.forEach(function (g) {
      var list = byGroup[g];
      if (!list || !list.length) return;
      var section = document.createElement("div");
      section.className = "shop-group";
      section.innerHTML = "<h4>" + (GROUP_LABELS[g] || g) + "</h4>";
      var ul = document.createElement("ul");
      list.forEach(function (item) {
        var li = document.createElement("li");
        var name = document.createElement("span");
        name.textContent = item.name;
        var amt = document.createElement("span");
        amt.className = "shop-amt";
        amt.textContent = item.display;
        li.appendChild(name);
        li.appendChild(amt);
        ul.appendChild(li);
      });
      section.appendChild(ul);
      els.shoppingList.appendChild(section);
    });
  }

  function scaleYield(yieldStr, boxes) {
    if (boxes === 1) return yieldStr;
    // Prefix with multiplier for clarity; keep original wording
    return yieldStr + " × " + boxes;
  }

  function buildRecipeCard(recipe, boxes) {
    var card = document.createElement("article");
    card.className = "recipe-card";
    card.setAttribute("data-recipe-id", recipe.id || "");

    if (recipe.image) {
      var media = document.createElement("div");
      media.className = "recipe-media";
      var img = document.createElement("img");
      img.src = recipe.image;
      img.alt = "Reference: " + (recipe.name || "bake");
      img.loading = "lazy";
      img.decoding = "async";
      media.appendChild(img);
      var cap = document.createElement("span");
      cap.className = "recipe-media-cap";
      cap.textContent = "What it should look like";
      media.appendChild(cap);
      card.appendChild(media);
    }

    var head = document.createElement("div");
    head.className = "recipe-card-head";
    head.innerHTML =
      "<div><h4></h4><p class=\"recipe-yield\"></p></div>" +
      '<span class="recipe-scale-badge"></span>';
    head.querySelector("h4").textContent = recipe.name;
    head.querySelector(".recipe-yield").textContent = scaleYield(
      recipe.yield || "",
      boxes
    );
    head.querySelector(".recipe-scale-badge").textContent =
      boxes + " box" + (boxes === 1 ? "" : "es");
    card.appendChild(head);

    var table = document.createElement("table");
    table.className = "recipe-table";
    table.innerHTML =
      "<thead><tr><th>Ingredient</th><th>Group</th><th colspan=\"2\">Amount</th></tr></thead>";
    var tbody = document.createElement("tbody");

    (recipe.ingredients || []).forEach(function (ing) {
      var scaled = scaleAmount(ing.amount, ing.unit, boxes);
      var tr = document.createElement("tr");
      var tdName = document.createElement("td");
      tdName.textContent = ing.name;
      var tdGroup = document.createElement("td");
      tdGroup.className = "group-tag";
      tdGroup.textContent = GROUP_LABELS[ing.group] || ing.group || "";
      var tdAmt = document.createElement("td");
      tdAmt.className = "amt";
      tdAmt.textContent = formatAmountOnly(scaled);
      var tdUnit = document.createElement("td");
      tdUnit.className = "unit";
      tdUnit.textContent = unitForDisplay(scaled);
      tr.appendChild(tdName);
      tr.appendChild(tdGroup);
      tr.appendChild(tdAmt);
      tr.appendChild(tdUnit);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);

    if (recipe.methodNote) {
      var note = document.createElement("p");
      note.className = "method-note";
      note.textContent = recipe.methodNote;
      card.appendChild(note);
    }

    return card;
  }

  function setBoxes(n) {
    state.boxes = clampBoxes(n);
    els.boxCount.value = String(state.boxes);
    render();
  }

  function renderCosting(weekData) {
    if (!els.costingPanel || !els.costingGrid) return;
    var weekCost = null;
    if (state.costings && state.costings.weeks) {
      weekCost = state.costings.weeks.find(function (w) {
        return w.week === state.week;
      });
    }
    if (!weekCost) {
      els.costingPanel.hidden = true;
      return;
    }

    els.costingPanel.hidden = false;
    var c = weekCost.costs;
    var boxes = state.boxes;
    var totalBatch = c.totalCashCostBatch10 * boxes;
    var totalSolo = c.totalCashCostSolo * boxes;
    var rec = weekCost.recommendedSellPrice.primary;
    var menu = weekCost.menuPrice;
    var marginBatch = weekCost.marginAtCurrentMenu.batch10;
    var marginOk = marginBatch && marginBatch.percent >= 50;

    if (els.costingSource) {
      els.costingSource.textContent =
        "Per box (batch of ~10 bake). Scaled totals use × " +
        boxes +
        ". Electricity ~R" +
        (state.costings.overheadAssumptions &&
        state.costings.overheadAssumptions.electricity
          ? state.costings.overheadAssumptions.electricity.ratePerKwh
          : "3.50") +
        "/kWh.";
    }
    if (els.costingDisclaimer) {
      els.costingDisclaimer.textContent =
        state.costings.disclaimer ||
        "Estimates — re-check Checkers pack prices and your prepaid tariff.";
    }

    var tiles =
      tile("Ingredients", money(c.ingredients), "") +
      tile("Wastage 5%", money(c.wastageContingency), "") +
      tile("Packaging", money(c.packaging), "") +
      tile("Electricity (batch)", money(c.electricityBatch10), "per box") +
      tile("Cleaning + wear", money(c.cleaningAndWear), "") +
      tile(
        "Total cost / box",
        money(c.totalCashCostBatch10),
        "batch of 10",
        "highlight"
      ) +
      tile(
        "Cost × " + boxes,
        money(totalBatch),
        boxes === 1 ? "one box" : boxes + " boxes",
        "highlight"
      ) +
      tile("Menu sell now", moneyWhole(menu), "current config") +
      tile(
        "Margin @ menu",
        money(marginBatch.rand) + " (" + marginBatch.percent + "%)",
        "after all cash costs",
        marginOk ? "good" : "warn"
      ) +
      tile(
        "Recommended sell",
        moneyWhole(rec),
        "~52% margin target",
        rec > menu ? "warn" : "good"
      );

    els.costingGrid.innerHTML = tiles;

    // Breakdown table under grid
    var tableHtml =
      '<table class="costing-breakdown"><thead><tr><th>Recipe</th><th>Ingredient cost / box</th><th>× ' +
      boxes +
      "</th></tr></thead><tbody>";
    (weekCost.recipes || []).forEach(function (r) {
      tableHtml +=
        "<tr><td>" +
        escapeHtml(r.name) +
        '</td><td class="num">' +
        money(r.ingredientCost) +
        '</td><td class="num">' +
        money(r.ingredientCost * boxes) +
        "</td></tr>";
    });
    tableHtml +=
      '<tr><td><strong>Elec solo vs batch/box</strong></td><td class="num">' +
      money(c.electricitySolo) +
      " / " +
      money(c.electricityBatch10) +
      '</td><td class="num">' +
      money(c.electricityBatch10 * boxes) +
      "</td></tr>";
    tableHtml +=
      '<tr><td><strong>Full cash cost (batch)</strong></td><td class="num">' +
      money(c.totalCashCostBatch10) +
      '</td><td class="num">' +
      money(totalBatch) +
      "</td></tr>";
    tableHtml +=
      '<tr><td>Full cash cost if baked solo</td><td class="num">' +
      money(c.totalCashCostSolo) +
      '</td><td class="num">' +
      money(totalSolo) +
      "</td></tr>";
    tableHtml += "</tbody></table>";

    // Append table after grid (replace previous if any)
    var old = els.costingPanel.querySelector(".costing-breakdown");
    if (old) old.remove();
    els.costingGrid.insertAdjacentHTML("afterend", tableHtml);

    // Also reflect rec on status bar if we can
    if (els.themePrice && rec) {
      els.themePrice.title =
        "Menu R" + menu + " · recommended sell R" + rec + " (see costing panel)";
    }
  }

  function tile(label, value, sub, extraClass) {
    return (
      '<div class="cost-tile' +
      (extraClass ? " " + extraClass : "") +
      '"><span class="lbl">' +
      escapeHtml(label) +
      '</span><span class="val">' +
      value +
      "</span>" +
      (sub
        ? '<span class="lbl" style="text-transform:none;letter-spacing:0;font-weight:400">' +
          escapeHtml(sub) +
          "</span>"
        : "") +
      "</div>"
    );
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bind() {
    els.weekSelect = $("week-select");
    els.boxCount = $("box-count");
    els.boxMinus = $("box-minus");
    els.boxPlus = $("box-plus");
    els.printBtn = $("print-list");
    els.themeKicker = $("theme-kicker");
    els.themeTitle = $("theme-title");
    els.themePrice = $("theme-price");
    els.scaleLabel = $("scale-label");
    els.revenueLabel = $("revenue-label");
    els.boxContents = $("box-contents");
    els.boxFitNote = $("box-fit-note");
    els.boxSummaryScale = $("box-summary-scale");
    els.costingPanel = $("costing-panel");
    els.costingGrid = $("costing-grid");
    els.costingSource = $("costing-source");
    els.costingDisclaimer = $("costing-disclaimer");
    els.recipeGrid = $("recipe-grid");
    els.shoppingList = $("shopping-list");
    els.shoppingScale = $("shopping-scale");
    els.printTheme = $("print-theme");
    els.printBoxes = $("print-boxes");
    els.loadError = $("load-error");

    els.weekSelect.addEventListener("change", function () {
      state.week = clampBoxes(els.weekSelect.value);
      if (state.week > 4) state.week = 4;
      render();
    });

    els.boxCount.addEventListener("input", function () {
      setBoxes(els.boxCount.value);
    });
    els.boxCount.addEventListener("change", function () {
      setBoxes(els.boxCount.value);
    });

    els.boxMinus.addEventListener("click", function () {
      setBoxes(state.boxes - 1);
    });
    els.boxPlus.addEventListener("click", function () {
      setBoxes(state.boxes + 1);
    });

    els.printBtn.addEventListener("click", function () {
      window.print();
    });
  }

  function init() {
    bind();

    // Optional query: ?week=2&boxes=10
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.has("week")) {
        var w = parseInt(params.get("week"), 10);
        if (w >= 1 && w <= 4) {
          state.week = w;
          els.weekSelect.value = String(w);
        }
      }
      if (params.has("boxes")) {
        state.boxes = clampBoxes(params.get("boxes"));
        els.boxCount.value = String(state.boxes);
      }
    } catch (e) {
      /* ignore */
    }

    Promise.all([
      fetch(DATA_URL, { cache: "no-store" }).then(function (res) {
        if (!res.ok) throw new Error("recipes HTTP " + res.status);
        return res.json();
      }),
      fetch(COSTINGS_URL, { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) return null;
          return res.json();
        })
        .catch(function () {
          return null;
        }),
    ])
      .then(function (pair) {
        state.data = pair[0];
        state.costings = pair[1];
        render();
      })
      .catch(function (err) {
        els.loadError.hidden = false;
        els.loadError.textContent =
          "Could not load " +
          DATA_URL +
          ". Start the app with npm start and open /dashboard.html. (" +
          (err && err.message ? err.message : err) +
          ")";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
