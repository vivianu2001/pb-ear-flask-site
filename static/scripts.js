let projectList = [];

// Dynamically generates input fields for entering project names and costs
function generateProjectFields() {
  const container = document.getElementById("project-fields");
  const num = parseInt(document.getElementById("num-projects").value);
  container.innerHTML = "";
  projectList = [];
  // Create name and cost inputs for each project
  for (let i = 0; i < num; i++) {
    const label = document.createElement("label");
    label.textContent = `Project ${i + 1}:`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "project-name";
    nameInput.placeholder = "e.g. Clinic";

    const costInput = document.createElement("input");
    costInput.type = "number";
    costInput.step = "0.01";
    costInput.min = "0";
    costInput.className = "project-cost";
    costInput.placeholder = "Cost (e.g. 40)";

    container.appendChild(label);
    container.appendChild(nameInput);
    container.appendChild(costInput);
  }
  // Add real-time validation listeners
  const inputs = container.querySelectorAll(".project-name");
  inputs.forEach((input) => {
    input.addEventListener("input", () => validateProjectFields());
  });
  const costInputs = container.querySelectorAll(".project-cost");
  costInputs.forEach((input) => {
    input.addEventListener("input", () => validateProjectFields());
  });
  // Validates that all project fields are filled correctly and uniquely
  function validateProjectFields() {
    const nameInputs = Array.from(document.querySelectorAll(".project-name"));
    const costInputs = Array.from(document.querySelectorAll(".project-cost"));

    const allNamesFilled = nameInputs.every((inp) => inp.value.trim() !== "");
    const allCostsValid = costInputs.every((inp) => {
      const val = parseFloat(inp.value);
      return !isNaN(val) && val >= 0;
    });

    const names = nameInputs.map((inp) => inp.value.trim().toLowerCase());
    const hasDuplicates = new Set(names).size !== names.length;
    const allValidNames = names.every((n) => /^[a-zA-Z0-9 ]+$/.test(n));
    // Highlight invalid name fields
    nameInputs.forEach((inp) => {
      const val = inp.value.trim();
      if (!/^[a-zA-Z0-9 ]*$/.test(val)) {
        inp.style.borderColor = "red";
      } else {
        inp.style.borderColor = "#ccc";
      }
    });
    // Enable "Next" button if all fields are valid
    if (allNamesFilled && allCostsValid && allValidNames && !hasDuplicates) {
      document.getElementById("next-button-container").style.display = "block";
    } else {
      document.getElementById("next-button-container").style.display = "none";
    }
  }
}

// Creates dropdowns for ranking projects based on the user-defined list
function generatePreferenceInputs() {
  const inputs = document.querySelectorAll(".project-name");
  projectList = Array.from(inputs)
    .map((input) => input.value.trim())
    .filter(Boolean);

  if (projectList.length === 0) return;

  const rankInputs = document.getElementById("rank-inputs");
  rankInputs.innerHTML = "";
  // Create a dropdown for each rank position
  projectList.forEach((_, i) => {
    const rank = i + 1;
    const div = document.createElement("div");
    div.className = "rank-row";

    const label = document.createElement("label");
    label.innerText = `Rank ${rank}:`;

    const select = document.createElement("select");
    select.name = `rank-${rank}`;
    projectList.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.text = p;
      select.appendChild(opt);
    });

    div.appendChild(label);
    div.appendChild(select);
    rankInputs.appendChild(div);
  });
  // Show voter form once preferences are generated
  document.getElementById("voter-form").style.display = "block";
}

let voterGroups = [];
// Adds a voter group with specified weight and preferences
function submitVoterGroup() {
  const numVoters = parseInt(document.getElementById("voter-count").value);
  if (isNaN(numVoters) || numVoters <= 0) {
    alert("Number of voters must be a positive integer.");
    return;
  }

  const weight = parseFloat(document.getElementById("voter-weight").value);
  const selects = document.querySelectorAll("#rank-inputs select");
  const preferences = Array.from(selects).map((s) => s.value);

  // Validation: no duplicate preferences
  const unique = new Set(preferences);
  if (unique.size !== preferences.length) {
    alert("Each project must appear only once in the rankings.");
    return;
  }

  // Validation: weight must be between 0 and 1 (inclusive)
  if (isNaN(weight) || weight <= 0 || weight > 1) {
    alert("Weight must be a number greater than 0 and at most 1.");
    return;
  }

  // Add group to internal list
  for (let i = 0; i < numVoters; i++) {
    voterGroups.push([weight, preferences]);
  }

  // Validation: total weight must be an integer
  if (!validateTotalWeightIsInteger()) {
    alert(
      "Total voter weight must be an integer. Check group sizes and weights."
    );
    // Undo group addition
    for (let i = 0; i < numVoters; i++) voterGroups.pop();
    return;
  }

  // Update hidden input
  document.getElementById("voters-json").value = JSON.stringify(voterGroups);

  // Show group summary
  showSubmittedGroup(numVoters, weight, preferences);

  // Reset form
  document.getElementById("voter-count").value = 1;
  document.getElementById("voter-weight").value = 1.0;
  selects.forEach((select) => (select.selectedIndex = 0));
  document.querySelector("#voter-form button").textContent =
    "➕ Add Another Group";
}

function addVoterGroup(count, weight, preferences) {
  // Add to internal array
  for (let i = 0; i < count; i++) {
    voterGroups.push([weight, preferences]);
  }

  document.getElementById("voters-json").value = JSON.stringify(voterGroups);

  showSubmittedGroup(count, weight, preferences);
}

// Updates hidden inputs and on-screen debug area with current voter groups
function updateVoterGroupsDisplay() {
  document.getElementById("voter-groups-display").textContent = JSON.stringify(
    voterGroups,
    null,
    2
  );
  document.getElementById("voters-json").value = JSON.stringify(voterGroups);
}
// Collects all form data and prepares for submission
function prepareSubmission() {
  const budgetVal = parseFloat(document.getElementById("budget").value);
  if (isNaN(budgetVal) || budgetVal < 0) {
    alert("Please enter a valid non-negative budget.");
    return false;
  }
  document.getElementById("form-budget").value = budgetVal;

  const names = document.querySelectorAll(".project-name");
  const costs = document.querySelectorAll(".project-cost");
  const projects = [];
  // Validate and collect each project
  for (let i = 0; i < names.length; i++) {
    const name = names[i].value.trim();
    const cost = parseFloat(costs[i].value);

    if (!name) {
      alert(`Project ${i + 1} has no name.`);
      return false;
    }

    if (isNaN(cost) || cost < 0) {
      alert(`Project "${name}" must have a valid non-negative cost.`);
      return false;
    }

    projects.push([name, cost]);
  }

  document.getElementById("projects-json").value = JSON.stringify(projects);
  return true;
}

// Shows a summary of a submitted voter group on screen
function showSubmittedGroup(count, weight, preferences) {
  const container = document.getElementById("voter-group-list");
  container.style.display = "block";

  const div = document.createElement("div");
  div.style.marginBottom = "15px";
  div.innerHTML = `
    <p>🧑‍🤝‍🧑 <strong>Group of ${count} voters added</strong></p>
    <p>💬 <strong>Preferences:</strong> ${preferences.join(" > ")}</p>
    <p>⚖️ <strong>Weight per voter:</strong> ${weight}</p>
    <hr>
  `;
  container.appendChild(div);
}

// Checks if any duplicate project names exist (case-insensitive)
function hasDuplicateProjects() {
  const names = Array.from(document.querySelectorAll(".project-name")).map(
    (input) => input.value.trim().toLowerCase()
  );
  const nameSet = new Set(names);
  return nameSet.size !== names.length;
}

// Returns true only if the sum of all voter weights is an integer
function validateTotalWeightIsInteger() {
  const totalWeight = voterGroups.reduce((sum, [weight]) => sum + weight, 0);
  return Number.isInteger(totalWeight);
}

function generateRandomInstance(numProjects, numGroups, budget) {
  const projects = [];
  let totalCost = 0;

  // 1. Create random weights for projects
  const weights = [];
  for (let i = 0; i < numProjects; i++) {
    weights.push(Math.random() + 0.3); // ensures no project gets 0
  }

  const weightSum = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < numProjects; i++) {
    // Calculate the project's relative share out of the total weight
    // Example: if this project's weight is 2, and total is 10 the share = 0.2
    let share = weights[i] / weightSum;
    let cost = Math.round(share * budget * 1.2); // 120% of budget total to allow over-budget
    cost = Math.max(cost, 10); // minimum cost to avoid 0
    totalCost += cost;
    projects.push(["P" + (i + 1), cost]);
  }

  // Ensure total cost > budget
  if (totalCost <= budget) {
    projects[0][1] += budget - totalCost + 10;
  }

  // 2. Generate random voter groups (unchanged)
  const voterGroupsToAdd = [];
  for (let i = 0; i < numGroups; i++) {
    const count = Math.floor(Math.random() * 10) + 5; // 5–14
    const weight = 1.0;
    const shuffled = [...projects.map((p) => p[0])].sort(
      () => Math.random() - 0.5
    );
    voterGroupsToAdd.push({
      count: count,
      weight: weight,
      preferences: shuffled,
    });
  }

  // 3. Populate the form with these values
  document.getElementById("budget").value = budget;
  document.getElementById("num-projects").value = numProjects;
  generateProjectFields();

  const nameInputs = document.querySelectorAll(".project-name");
  const costInputs = document.querySelectorAll(".project-cost");
  projects.forEach(([name, cost], i) => {
    nameInputs[i].value = name;
    costInputs[i].value = cost;
  });

  generatePreferenceInputs();
  voterGroups = [];
  document.getElementById("voter-group-list").innerHTML =
    "<h3>🗳️ Voter Groups Entered</h3>";
  document.getElementById("voter-group-list").style.display = "block";
  document.getElementById("voter-form").style.display = "block";

  voterGroupsToAdd.forEach((group) => {
    addVoterGroup(group.count, group.weight, group.preferences);
  });

  alert("Random instance generated.");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("generate-random-button");
  if (btn) {
    btn.addEventListener("click", () => {
      const numProjects = parseInt(
        document.getElementById("num-projects-random").value
      );
      const numGroups = parseInt(
        document.getElementById("num-groups-random").value
      );
      const budget = parseFloat(document.getElementById("budget-random").value);
      generateRandomInstance(numProjects, numGroups, budget);
    });
  }
});
