const form = document.querySelector("#booking-form");
const statusBox = document.querySelector("#booking-status");
const serviceSelect = document.querySelector("#service");
const dateInput = document.querySelector("#date");

// Set min date to today
const today = new Date().toISOString().split("T")[0];
if (dateInput) {
  dateInput.setAttribute("min", today);
  dateInput.value = today;
}

function showStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.className = isError ? "notice error" : "notice";
  statusBox.style.display = "block";
  statusBox.style.color = isError ? "#8f4524" : "#1f1b16";
}

// Optional: if you do NOT use backend, remove fetch("/api/services")
// and keep your services directly in HTML.
// So this part can be removed if your select already has options.

// Form submit
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const service = form.service.value;
  const date = form.date.value;
  const time = form.time.value;
  const notes = form.notes.value.trim();

  if (!name || !phone || !service || !date || !time) {
    showStatus("Please fill all required fields.", true);
    return;
  }

  showStatus("Processing your booking...");

  // Redirect to dashboard.html with form data in URL
  const queryString = new URLSearchParams({
    name: name,
    phone: phone,
    service: service,
    date: date,
    time: time,
    notes: notes
  }).toString();

  window.location.href = `dashboard.html?${queryString}`;
});