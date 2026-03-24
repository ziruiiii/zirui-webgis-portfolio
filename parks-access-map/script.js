require([
  "esri/WebMap",
  "esri/views/MapView",
  "esri/widgets/Search",
  "esri/widgets/Legend",
  "esri/widgets/LayerList",
  "esri/widgets/ScaleBar",
  "esri/widgets/BasemapToggle",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch"
], function (
  WebMap,
  MapView,
  Search,
  Legend,
  LayerList,
  ScaleBar,
  BasemapToggle,
  GraphicsLayer,
  Sketch
) {
  /* =========================================================
     DOM REFERENCES
     ========================================================= */
  const resultsEl = document.getElementById("results");
  const resultsStatusEl = document.getElementById("resultsStatus");
  const clearBtn = document.getElementById("clearBtn");

  const statAccess = document.getElementById("statAccess");
  const statDiversity = document.getElementById("statDiversity");
  const statCount = document.getElementById("statCount");
  const statDominant = document.getElementById("statDominant");

  const jumpToMapBtn = document.getElementById("jumpToMapBtn");
  const jumpToResultsBtn = document.getElementById("jumpToResultsBtn");
  const backToTopBtn = document.getElementById("backToTopBtn");

  /* =========================================================
     HELPER FUNCTIONS FOR UI
     ========================================================= */
  function scrollToSection(selector) {
    const target = document.querySelector(selector);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function setStatus(message, type) {
    resultsStatusEl.textContent = message;
    resultsStatusEl.className = "results-status";

    if (type === "success") {
      resultsStatusEl.classList.add("success-status");
    } else if (type === "warning") {
      resultsStatusEl.classList.add("warning-status");
    } else if (type === "error") {
      resultsStatusEl.classList.add("error-status");
    } else {
      resultsStatusEl.classList.add("info-status");
    }
  }

  function resetStats() {
    statAccess.textContent = "–";
    statDiversity.textContent = "–";
    statCount.textContent = "–";
    statDominant.textContent = "–";
  }

  function updateStats(accessRating, diversityLevel, totalCount, dominantCategory) {
    statAccess.textContent = accessRating || "–";
    statDiversity.textContent = diversityLevel || "–";
    statCount.textContent = totalCount != null ? String(totalCount) : "–";
    statDominant.textContent = dominantCategory || "–";
  }

  function setInitialResults() {
    resultsEl.innerHTML = `
      <p><strong>No area selected yet.</strong></p>
      <p>Draw a rectangle or polygon on the map to analyse green space access and diversity.</p>
    `;
    setStatus(
      "No area selected yet. Draw a rectangle or polygon on the map to start analysis.",
      "info"
    );
    resetStats();
  }

  function setLoadingState() {
    resultsEl.innerHTML = `
      <p><strong>Running spatial query...</strong></p>
      <p>Please wait while the application checks all green-space layers within the selected area.</p>
    `;
    setStatus("Spatial query is running for the selected area.", "info");
  }

  /* =========================================================
     PAGE INTERACTIONS
     ========================================================= */
  if (jumpToMapBtn) {
    jumpToMapBtn.addEventListener("click", function () {
      scrollToSection("#mapSection");
    });
  }

  if (jumpToResultsBtn) {
    jumpToResultsBtn.addEventListener("click", function () {
      scrollToSection("#resultsSection");
    });
  }

  window.addEventListener("scroll", function () {
    if (window.scrollY > 280) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  /* =========================================================
     SCROLL REVEAL ANIMATION
     ========================================================= */
  const revealElements = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  revealElements.forEach(function (element) {
    revealObserver.observe(element);
  });

  /* =========================================================
     LOAD THE ARCGIS ONLINE WEB MAP
     ========================================================= */
  const webmap = new WebMap({
    portalItem: {
      id: "a9806fd6d0f541d19d86308b1b611a85"
    }
  });

  /* =========================================================
     CREATE THE MAP VIEW
     ========================================================= */
  const view = new MapView({
    container: "viewDiv",
    map: webmap
  });

  /* =========================================================
     CREATE A GRAPHICS LAYER FOR USER SELECTION GEOMETRY
     ========================================================= */
  const selectionLayer = new GraphicsLayer({
    title: "Selection Graphics"
  });
  webmap.add(selectionLayer);

  /* =========================================================
     ADD ESSENTIAL WIDGETS
     ========================================================= */
  const search = new Search({
    view: view
  });
  view.ui.add(search, "top-right");

  const legend = new Legend({
    view: view
  });
  view.ui.add(legend, "bottom-left");

  const layerList = new LayerList({
    view: view
  });
  view.ui.add(layerList, "top-right");

  const scaleBar = new ScaleBar({
    view: view,
    unit: "metric"
  });
  view.ui.add(scaleBar, "bottom-right");

  const basemapToggle = new BasemapToggle({
    view: view,
    nextBasemap: "hybrid"
  });
  view.ui.add(basemapToggle, "bottom-right");

  /* =========================================================
     ADD THE SKETCH WIDGET
     Rectangle and polygon tools are enabled for area analysis
     ========================================================= */
  const sketch = new Sketch({
    view: view,
    layer: selectionLayer,
    creationMode: "single",
    availableCreateTools: ["rectangle", "polygon"],
    visibleElements: {
      createTools: {
        point: false,
        polyline: false,
        circle: false
      },
      selectionTools: {
        "lasso-selection": false,
        "rectangle-selection": false
      },
      settingsMenu: false
    }
  });

  view.ui.add(sketch, "top-left");

  /* =========================================================
     TARGET LAYER REFERENCES
     These layers are searched by title after the web map loads
     ========================================================= */
  let parksOpenSpaceLayer = null;
  let parkConnectorLayer = null;
  let parkLayer = null;
  let nationalParkLayer = null;

  /* =========================================================
     INITIALIZE LAYERS AFTER THE WEB MAP LOADS
     ========================================================= */
  view.when(function () {
    webmap.layers.forEach(function (layer) {
      if (layer.title === "Parks and Open Space") {
        parksOpenSpaceLayer = layer;
      } else if (layer.title === "Park Connector") {
        parkConnectorLayer = layer;
      } else if (layer.title === "Park") {
        parkLayer = layer;
      } else if (layer.title === "National Park") {
        nationalParkLayer = layer;
      }
    });

    console.log("Layer check:");
    console.log("Parks and Open Space:", parksOpenSpaceLayer);
    console.log("Park Connector:", parkConnectorLayer);
    console.log("Park:", parkLayer);
    console.log("National Park:", nationalParkLayer);
  });

  /* =========================================================
     RUN ANALYSIS WHEN A NEW SKETCH IS COMPLETED
     ========================================================= */
  sketch.on("create", function (event) {
    if (event.state === "complete") {
      setLoadingState();
      runAllQueries(event.graphic.geometry);
      scrollToSection("#resultsSection");
    }
  });

  /* =========================================================
     RUN ANALYSIS AGAIN AFTER AN EXISTING GEOMETRY IS UPDATED
     ========================================================= */
  sketch.on("update", function (event) {
    if (event.state === "complete" && event.graphics.length > 0) {
      setLoadingState();
      runAllQueries(event.graphics[0].geometry);
      scrollToSection("#resultsSection");
    }
  });

  /* =========================================================
     QUERY ALL TARGET LAYERS
     ========================================================= */
  function runAllQueries(geometry) {
    const queryPromises = [];

    if (parksOpenSpaceLayer) {
      queryPromises.push(queryLayer(parksOpenSpaceLayer, geometry));
    } else {
      queryPromises.push(createEmptyResult("Parks and Open Space"));
    }

    if (parkConnectorLayer) {
      queryPromises.push(queryLayer(parkConnectorLayer, geometry));
    } else {
      queryPromises.push(createEmptyResult("Park Connector"));
    }

    if (parkLayer) {
      queryPromises.push(queryLayer(parkLayer, geometry));
    } else {
      queryPromises.push(createEmptyResult("Park"));
    }

    if (nationalParkLayer) {
      queryPromises.push(queryLayer(nationalParkLayer, geometry));
    } else {
      queryPromises.push(createEmptyResult("National Park"));
    }

    Promise.all(queryPromises)
      .then(function (results) {
        updateResultsPanel(results);
      })
      .catch(function (error) {
        console.error("Query error:", error);

        resultsEl.innerHTML = `
          <p><strong>An error occurred while running the spatial query.</strong></p>
          <p>Please check the browser console for details.</p>
        `;

        setStatus("An error occurred while running the spatial query.", "error");
        resetStats();
      });
  }

  /* =========================================================
     CREATE AN EMPTY RESULT IF A LAYER CANNOT BE FOUND
     ========================================================= */
  function createEmptyResult(title) {
    return Promise.resolve({
      title: title,
      count: 0,
      names: []
    });
  }

  /* =========================================================
     QUERY A SINGLE LAYER USING THE USER-DRAWN GEOMETRY
     ========================================================= */
  function queryLayer(layer, geometry) {
    const query = layer.createQuery();
    query.geometry = geometry;
    query.spatialRelationship = "intersects";
    query.returnGeometry = false;
    query.outFields = ["*"];

    return layer.queryFeatures(query).then(function (featureSet) {
      const features = featureSet.features || [];

      const names = features
        .map(function (feature) {
          return getFeatureName(feature.attributes);
        })
        .filter(function (value) {
          return value !== null && value !== "";
        })
        .slice(0, 8);

      return {
        title: layer.title,
        count: features.length,
        names: names
      };
    });
  }

  /* =========================================================
     EXTRACT A READABLE FEATURE NAME FROM COMMON FIELDS
     ========================================================= */
  function getFeatureName(attributes) {
    if (!attributes) return null;

    return (
      attributes.NAME ||
      attributes.Name ||
      attributes.PARK_NAME ||
      attributes.Park_Name ||
      attributes.SITE_NAME ||
      attributes.Site_Name ||
      attributes.TITLE ||
      attributes.TYPE ||
      attributes.Type ||
      null
    );
  }

  /* =========================================================
     BUILD THE RESULT INTERPRETATION FOR THE SELECTED AREA
     ========================================================= */
  function updateResultsPanel(results) {
    const parksOpenSpace = results.find(function (item) {
      return item.title === "Parks and Open Space";
    });

    const parkConnector = results.find(function (item) {
      return item.title === "Park Connector";
    });

    const park = results.find(function (item) {
      return item.title === "Park";
    });

    const nationalPark = results.find(function (item) {
      return item.title === "National Park";
    });

    const totalCount = results.reduce(function (sum, item) {
      return sum + item.count;
    }, 0);

    const hasParksOpenSpace = parksOpenSpace && parksOpenSpace.count > 0;
    const hasConnector = parkConnector && parkConnector.count > 0;
    const hasPark = park && park.count > 0;
    const hasNationalPark = nationalPark && nationalPark.count > 0;

    let categoriesPresent = 0;
    if (hasParksOpenSpace) categoriesPresent += 1;
    if (hasConnector) categoriesPresent += 1;
    if (hasPark) categoriesPresent += 1;
    if (hasNationalPark) categoriesPresent += 1;

    let diversityLevel = "Low";
    let diversityClass = "badge-low";

    if (categoriesPresent >= 3) {
      diversityLevel = "High";
      diversityClass = "badge-high";
    } else if (categoriesPresent === 2) {
      diversityLevel = "Moderate";
      diversityClass = "badge-medium";
    }

    const dominantResult = results.reduce(
      function (prev, current) {
        return current.count > prev.count ? current : prev;
      },
      { title: "None", count: 0 }
    );

    const dominantCategory =
      dominantResult.count > 0 ? dominantResult.title : "None";

    let accessScore = 0;
    if (hasNationalPark) accessScore += 2;
    if (hasConnector) accessScore += 1;
    if (hasParksOpenSpace || hasPark) accessScore += 1;
    if (categoriesPresent >= 2) accessScore += 1;

    let accessRating = "Limited";
    if (accessScore >= 4) {
      accessRating = "Strong";
    } else if (accessScore >= 2) {
      accessRating = "Moderate";
    }

    let exampleNames = [];
    results.forEach(function (item) {
      if (item.names && item.names.length > 0) {
        exampleNames = exampleNames.concat(item.names);
      }
    });

    exampleNames = [...new Set(exampleNames)].slice(0, 10);

    const connectorBadge = hasConnector
      ? `<span class="result-badge badge-yes">Available</span>`
      : `<span class="result-badge badge-no">Not available</span>`;

    const nationalParkBadge = hasNationalPark
      ? `<span class="result-badge badge-yes">Yes</span>`
      : `<span class="result-badge badge-no">No</span>`;

    const parkBadge =
      hasParksOpenSpace || hasPark
        ? `<span class="result-badge badge-yes">Yes</span>`
        : `<span class="result-badge badge-no">No</span>`;

    updateStats(accessRating, diversityLevel, totalCount, dominantCategory);

    if (totalCount > 0) {
      setStatus(
        "Spatial query completed successfully for the selected area.",
        "success"
      );
    } else {
      setStatus(
        "The selected area returned no intersecting green-space features.",
        "warning"
      );
    }

    let html = `
      <p><strong>Selected Area Green Space Summary</strong></p>

      <p>
        <strong>Total intersecting green-space features:</strong> ${totalCount}
      </p>

      <p>
        <strong>Dominant green-space type:</strong> ${dominantCategory}
      </p>

      <p>
        <strong>Green Access Rating:</strong>
        <span class="result-badge badge-rating">${accessRating}</span>
      </p>

      <hr>

      <p><strong>Access Indicators</strong></p>

      <p>
        <strong>Park / open space present:</strong>
        ${parkBadge}
      </p>

      <p>
        <strong>Park connector access:</strong>
        ${connectorBadge}
      </p>

      <p>
        <strong>National park present:</strong>
        ${nationalParkBadge}
      </p>

      <hr>

      <p><strong>Green Space Diversity</strong></p>

      <p>
        <strong>Number of green-space categories present:</strong> ${categoriesPresent}
      </p>

      <p>
        <strong>Diversity level:</strong>
        <span class="result-badge ${diversityClass}">${diversityLevel}</span>
      </p>

      <hr>

      <p><strong>Feature Summary by Layer</strong></p>
      <ul>
    `;

    results.forEach(function (item) {
      html += `<li><strong>${item.title}:</strong> ${item.count}</li>`;
    });

    html += `</ul>`;

    if (exampleNames.length > 0) {
      html += `
        <hr>
        <p><strong>Example Green Spaces in the Selected Area</strong></p>
        <ul>
      `;

      exampleNames.forEach(function (name) {
        html += `<li>${name}</li>`;
      });

      html += `</ul>`;
    } else {
      html += `
        <hr>
        <p><strong>Example Green Spaces in the Selected Area</strong></p>
        <p>No named features were returned for this selection.</p>
      `;
    }

    resultsEl.innerHTML = html;
  }

  /* =========================================================
     CLEAR CURRENT GRAPHICS AND RESET THE RESULT PANEL
     ========================================================= */
  clearBtn.addEventListener("click", function () {
    selectionLayer.removeAll();
    setInitialResults();
  });

  /* =========================================================
     INITIAL PAGE STATE
     ========================================================= */
  setInitialResults();
});