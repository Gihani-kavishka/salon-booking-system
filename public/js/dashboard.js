const list = document.querySelector("#appointment-list");
const refreshBtn = document.querySelector("#refresh");

function renderAppointments(appointments) {
  list.innerHTML = "";
  if (!appointments || !appointments.length) {
    list.innerHTML = `<div class="list-item" style="text-align: center; color: var(--muted); padding: 40px;">
      <p>No appointments scheduled yet.</p>
    </div>`;
    return;
  }
  
  appointments
    .slice()
    .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))
    .forEach((appt) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <strong>${appt.name}</strong><br>
            <span style="color: var(--muted); font-size: 0.9rem;">${appt.serviceName}</span>
          </div>
          <span class="pill" style="margin: 0; font-size: 0.7rem; text-transform: uppercase;">${appt.status}</span>
        </div>
        <div style="margin-top: 10px; font-size: 0.9rem;">
          📅 ${appt.date} at ${appt.time}<br>
          📞 ${appt.phone}
        </div>
        ${appt.notes ? `<div style="margin-top: 8px; font-style: italic; font-size: 0.85rem; color: var(--muted); border-top: 1px solid #eee; padding-top: 8px;">"${appt.notes}"</div>` : ""}
      `;
      list.appendChild(item);
    });
}

async function loadAppointments() {
  list.innerHTML = "<div class=\"list-item\">Updating list...</div>";
  try {
    const res = await fetch("/api/appointments");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    renderAppointments(data.appointments);
  } catch (err) {
    list.innerHTML = `<div class="notice error">
      Error: Could not load appointments. Please check connection.
    </div>`;
  }
}

refreshBtn.addEventListener("click", loadAppointments);
loadAppointments();

