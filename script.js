const form = document.getElementById("reportForm");
const reportList = document.getElementById("reportList");
const filter = document.getElementById("filter");

let reports = [];

try {
  reports = JSON.parse(
    localStorage.getItem("mtaaFixReports") || "[]"
  );

  if (!Array.isArray(reports)) reports = [];
} catch {
  reports = [];
}

function saveReports() {
  try {
    localStorage.setItem(
      "mtaaFixReports",
      JSON.stringify(reports)
    );
  } catch {
    alert("Could not save data in this browser.");
  }
}

function makeElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) {
    element.textContent = content;
  }
  return element;
}

function formatDateTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function renderReports() {
  reportList.replaceChildren();

  const visibleReports = reports
    .filter(report =>
      filter.value === "All" ||
      report.category === filter.value
    )
    .sort((a, b) =>
      (b.votes * 2 + (b.status === "Open" ? 1 : 0)) -
      (a.votes * 2 + (a.status === "Open" ? 1 : 0))
    );

  document.getElementById("total").textContent =
    reports.length;

  document.getElementById("open").textContent =
    reports.filter(r => r.status === "Open").length;

  document.getElementById("resolved").textContent =
    reports.filter(r => r.status === "Resolved").length;

  if (visibleReports.length === 0) {
    reportList.append(
      makeElement("p", "", "No reports yet. Be the first to report a problem!")
    );
    return;
  }

  visibleReports.forEach(report => {
    const card = makeElement("article", "report");

    card.append(
      makeElement("span", "tag", report.category),
      makeElement("h3", "", report.title),
      makeElement(
        "p", "",
        (report.county || "Nairobi") + " County • " +
        (report.constituency || "Constituency not specified") + " • " +
        (report.ward || "Ward not specified") + " • " +
        report.location
      ),
      makeElement("p", "", report.description),
      makeElement("p", "status", "Status: " + report.status),
      makeElement(
        "p", "",
        "Reported: " +
        (formatDateTime(report.reportedAt) || "Date not available")
      ),
      makeElement(
        "p", "",
        "Community support: " + report.votes +
        " | Priority score: " +
        (report.votes * 2 + (report.status === "Open" ? 1 : 0))
      )
    );

    if (report.status === "Resolved") {
      card.append(
        makeElement(
          "p", "",
          "Resolved: " +
          (formatDateTime(report.resolvedAt) || "Date not available")
        )
      );
    }

    const actions = makeElement("div", "report-actions");

    const voteButton = makeElement(
      "button", "vote", "👍 Support"
    );

    voteButton.addEventListener("click", () => {
      report.votes++;
      saveReports();
      renderReports();
    });

    actions.append(voteButton);

    const statusButton = makeElement(
      "button", "", "Change Status"
    );

    statusButton.addEventListener("click", () => {
      if (report.status === "Open") {
        report.status = "Resolved";
        report.resolvedAt = new Date().toISOString();
      } else {
        report.status = "Open";
        delete report.resolvedAt;
      }

      saveReports();
      renderReports();
    });

    actions.append(statusButton);

    const deleteButton = makeElement(
      "button", "delete", "Delete"
    );

    deleteButton.addEventListener("click", () => {
      if (confirm("Delete this report?")) {
        reports = reports.filter(r => r.id !== report.id);
        saveReports();
        renderReports();
      }
    });

    actions.append(deleteButton);
    card.append(actions);
    reportList.append(card);
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const report = {
    id: Date.now() + Math.random(),
    title: document.getElementById("title").value.trim(),
    category: document.getElementById("category").value,
    county: document.getElementById("county").value,
    constituency: document.getElementById("constituency").value.trim(),
    ward: document.getElementById("ward").value.trim(),
    location: document.getElementById("location").value.trim(),
    description: document.getElementById("description").value.trim(),
    reportedAt: new Date().toISOString(),
    status: "Open",
    votes: 0
  };

  if (
    !report.title ||
    !report.county ||
    !report.constituency ||
    !report.ward ||
    !report.location ||
    !report.description ||
    !report.category
  ) {
    alert("Please complete every field.");
    return;
  }

  reports.push(report);
  saveReports();
  form.reset();
  filter.value = "All";
  renderReports();

  alert("Your community report has been added!");
});

filter.addEventListener("change", renderReports);

renderReports();
