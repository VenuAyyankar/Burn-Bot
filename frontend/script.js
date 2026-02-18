// BurnoutGuard AI – Frontend Application
// Auto-detect: if served from Nginx (Docker), use /api proxy; otherwise use localhost for local dev
const API_URL = window.location.port === "5500" ? "http://localhost:8000" : "/api";

// ========== Global Dataset State ==========
let currentDatasetId = null; // null = "All Data"
let allDatasets = [];

function getDatasetParam() {
    if (currentDatasetId !== null) return `?dataset_id=${currentDatasetId}`;
    return "";
}

// ========== Toast Notification System ==========
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icons = { success: "check-circle", error: "alert-circle", info: "info" };
    toast.innerHTML = `<i data-lucide="${icons[type] || "info"}" class="toast-icon"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons({ nodes: [toast] });
    setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 200);
    }, 3500);
}

// ========== Modal System ==========
const modalOverlay = document.getElementById("modalOverlay");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
function openModal(title, bodyHtml) {
    document.querySelector(".modal-header h2").textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalOverlay.classList.add("active");
    lucide.createIcons({ nodes: [modalBody] });
}
function closeModal() { modalOverlay.classList.remove("active"); }
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// Confirm dialog helper
function showConfirm(title, message, onConfirm) {
    openModal(title, `
        <div class="confirm-content">
            <div class="confirm-icon"><i data-lucide="alert-triangle"></i></div>
            <div class="confirm-title">${title}</div>
            <div class="confirm-text">${message}</div>
            <div class="confirm-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-danger" id="confirmActionBtn">Confirm</button>
            </div>
        </div>
    `);
    document.getElementById("confirmActionBtn").addEventListener("click", () => {
        closeModal();
        onConfirm();
    });
}

// ========== SPA Router ==========
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
function navigateTo(page) {
    pages.forEach((p) => p.classList.remove("active"));
    navItems.forEach((n) => n.classList.remove("active"));
    const target = document.getElementById(`page-${page}`);
    const navTarget = document.getElementById(`nav-${page}`);
    if (target) target.classList.add("active");
    if (navTarget) navTarget.classList.add("active");
    document.getElementById("sidebar").classList.remove("mobile-open");
    document.getElementById("sidebarOverlay").classList.remove("active");
    if (page === "dashboard") loadDashboard();
    if (page === "employees") loadEmployees();
    if (page === "analytics") loadAnalytics();
}
navItems.forEach((item) => {
    item.addEventListener("click", (e) => { e.preventDefault(); window.location.hash = item.dataset.page; });
});
document.querySelectorAll(".action-card[data-nav]").forEach((card) => {
    card.addEventListener("click", (e) => { e.preventDefault(); window.location.hash = card.dataset.nav; });
});
window.addEventListener("hashchange", () => { navigateTo(window.location.hash.slice(1) || "dashboard"); });

// ========== Mobile Sidebar ==========
document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("mobile-open");
    document.getElementById("sidebarOverlay").classList.add("active");
});
document.getElementById("sidebarOverlay").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("mobile-open");
    document.getElementById("sidebarOverlay").classList.remove("active");
});
document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
});

// ========== Helpers ==========
function animateCounter(el, target, suffix = "") {
    const dur = 1000, start = performance.now();
    function upd(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(upd);
    }
    requestAnimationFrame(upd);
}

const avatarColors = [
    "linear-gradient(135deg, #4f8cff, #9080f0)",
    "linear-gradient(135deg, #2dd4a8, #6ee7b7)",
    "linear-gradient(135deg, #f0a030, #fcd34d)",
    "linear-gradient(135deg, #f06070, #fda4af)",
    "linear-gradient(135deg, #9080f0, #c4b5fd)",
    "linear-gradient(135deg, #20c8e8, #67e8f9)",
    "linear-gradient(135deg, #f472b6, #f9a8d4)",
];
function getAvatarColor(name) {
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return avatarColors[Math.abs(h) % avatarColors.length];
}
function getInitials(name) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }
function getRiskLevel(score) {
    if (score > 70) return { label: "High", cls: "high", color: "#f06070" };
    if (score > 40) return { label: "Medium", cls: "medium", color: "#f0a030" };
    return { label: "Low", cls: "low", color: "#2dd4a8" };
}

const CHART_COLORS = ["#4f8cff", "#2dd4a8", "#f0a030", "#f06070", "#9080f0", "#20c8e8", "#f472b6"];

// ========== Dataset Management ==========
async function loadDatasets() {
    try {
        const res = await fetch(`${API_URL}/datasets`);
        if (!res.ok) throw new Error("Failed");
        allDatasets = await res.json();
        renderDatasetChips();
    } catch (err) { console.error("Failed to load datasets:", err); }
}

function renderDatasetChips() {
    const container = document.getElementById("datasetChips");
    // Build the "All Data" chip
    let html = `<button class="dataset-chip ${currentDatasetId === null ? 'active' : ''}" data-dataset-id="" onclick="selectDataset(null)">
        <i data-lucide="layers"></i> All Data
    </button>`;

    // Build each dataset chip
    allDatasets.forEach(ds => {
        const isActive = currentDatasetId === ds.id;
        html += `<button class="dataset-chip ${isActive ? 'active' : ''}" data-dataset-id="${ds.id}" onclick="selectDataset(${ds.id})">
            <i data-lucide="database"></i>
            ${ds.name}
            <span class="chip-count">${ds.employee_count}</span>
            <span class="chip-delete" onclick="event.stopPropagation(); confirmDeleteDataset(${ds.id}, '${ds.name.replace(/'/g, "\\'")}')" title="Delete dataset">
                <i data-lucide="x" style="width:12px;height:12px"></i>
            </span>
        </button>`;
    });

    container.innerHTML = html;
    lucide.createIcons({ nodes: [container] });
}

function selectDataset(id) {
    currentDatasetId = id;
    renderDatasetChips();
    // Reload whichever page is currently active
    const activePage = document.querySelector(".page.active");
    if (activePage) {
        const pageId = activePage.id.replace("page-", "");
        if (pageId === "dashboard") loadDashboard();
        else if (pageId === "employees") loadEmployees();
        else if (pageId === "analytics") loadAnalytics();
    }
}

function confirmDeleteDataset(id, name) {
    showConfirm("Delete Dataset", `Delete <strong>${name}</strong> and <strong>all its employees</strong>? This cannot be undone.`, async () => {
        try {
            const res = await fetch(`${API_URL}/datasets/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            showToast(`Dataset "${name}" deleted`, "success");
            if (currentDatasetId === id) currentDatasetId = null;
            loadDatasets();
            loadDashboard();
        } catch (err) { showToast("Failed to delete dataset", "error"); }
    });
}

document.getElementById("createDatasetBtn").addEventListener("click", () => {
    openModal("Create Dataset", `
        <div style="text-align:left">
            <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
                Give your dataset a name (e.g. "Q1 2026 Engineering", "Marketing Team")
            </p>
            <div class="form-group">
                <label>Dataset Name</label>
                <div class="input-wrapper">
                    <input id="newDatasetName" placeholder="Enter dataset name…" required autofocus>
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" id="createDatasetSubmitBtn">Create</button>
            </div>
        </div>
    `);
    document.getElementById("createDatasetSubmitBtn").addEventListener("click", async () => {
        const name = document.getElementById("newDatasetName").value.trim();
        if (!name) { showToast("Please enter a dataset name", "error"); return; }
        try {
            const res = await fetch(`${API_URL}/datasets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.detail || "Failed");
            showToast(`Dataset "${name}" created!`, "success");
            closeModal();
            currentDatasetId = result.id;
            loadDatasets();
            loadDashboard();
        } catch (err) { showToast(err.message, "error"); }
    });
});

// ========== Dashboard ==========
async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/analytics${getDatasetParam()}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const total = data.length;
        const avg = total > 0 ? Math.round(data.reduce((s, e) => s + e.burnout_score, 0) / total) : 0;
        const high = data.filter((e) => e.burnout_score > 70).length;
        const low = data.filter((e) => e.burnout_score <= 40).length;
        animateCounter(document.getElementById("statTotalEmployees"), total);
        animateCounter(document.getElementById("statAvgBurnout"), avg, "%");
        animateCounter(document.getElementById("statHighRisk"), high);
        animateCounter(document.getElementById("statLowRisk"), low);

        const recent = data.slice(-4).reverse();
        const el = document.getElementById("recentEmployees");
        if (recent.length === 0) {
            el.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>No employees yet. Upload data or add your first employee.</p></div>`;
        } else {
            el.innerHTML = recent.map(emp => {
                const r = getRiskLevel(emp.burnout_score);
                return `<div class="employee-card">
                    <div class="employee-card-header">
                        <div class="employee-card-header-left">
                            <div class="employee-avatar" style="background:${getAvatarColor(emp.name)}">${getInitials(emp.name)}</div>
                            <div><div class="employee-name">${emp.name}</div><div class="employee-dept">${emp.department}</div></div>
                        </div>
                        <span class="risk-badge ${r.cls}">${r.label}</span>
                    </div>
                    <div class="employee-stats">
                        <div class="employee-stat"><span class="employee-stat-label">Hours/week</span><span class="employee-stat-value">${emp.weekly_work_hours}h</span></div>
                        <div class="employee-stat"><span class="employee-stat-label">Burnout</span><span class="employee-stat-value">${emp.burnout_score}%</span></div>
                    </div>
                </div>`;
            }).join("");
        }
        lucide.createIcons();
    } catch (err) { console.error(err); }
}

// ========== Download Template ==========
document.getElementById("downloadTemplateBtn").addEventListener("click", (e) => {
    e.preventDefault();
    const headers = ["Name", "Department", "Weekly Work Hours", "Overtime Hours", "Tasks Completed", "Meeting Hours", "Leave Days (Last 3 Months)", "Performance Score"];
    const dummy = ["John Doe", "Engineering", 40, 5, 20, 10, 2, 4.5];
    const csvContent = headers.join(",") + "\n" + dummy.join(",");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "burnout_guard_template.csv";
    a.click();
    URL.revokeObjectURL(url);
});

// ========== Upload Employee Data ==========
document.getElementById("uploadBtn").addEventListener("click", () => {
    // Prompt for dataset name before file selection
    openModal("Upload to Dataset", `
        <div style="text-align:left">
            <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
                Name this dataset so you can view its analytics separately later.
            </p>
            <div class="form-group">
                <label>Dataset Name</label>
                <div class="input-wrapper">
                    <input id="uploadDatasetName" placeholder="e.g. Q1 Engineering, Marketing…" required autofocus>
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" id="uploadWithDatasetBtn">
                    <i data-lucide="upload"></i><span>Choose File</span>
                </button>
            </div>
        </div>
    `);
    document.getElementById("uploadWithDatasetBtn").addEventListener("click", () => {
        const name = document.getElementById("uploadDatasetName").value.trim();
        if (!name) { showToast("Please enter a dataset name", "error"); return; }
        closeModal();
        // Store the name and trigger file picker
        window._pendingDatasetName = name;
        document.getElementById("uploadFileInput").click();
    });
});

document.getElementById("uploadFileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const datasetName = window._pendingDatasetName || "";
    window._pendingDatasetName = null;

    // If no dataset name was set (shouldn't happen, but fallback)
    if (!datasetName) {
        showToast("Please use the Upload button to specify a dataset name", "error");
        e.target.value = "";
        return;
    }

    const btn = document.getElementById("uploadBtn");
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<div class="spinner" style="border-width:2px;width:14px;height:14px"></div><span>Uploading…</span>`;
    btn.disabled = true;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dataset_name", datasetName);
    try {
        const res = await fetch(`${API_URL}/upload-employees`, { method: "POST", body: formData });
        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.detail || "Upload failed");
        }
        showToast(`${result.message} → Dataset: "${datasetName}"`, "success");
        if (result.warnings && result.warnings.length > 0) {
            showToast(`${result.warnings.length} row(s) had issues`, "info");
        }
        // Switch to the newly created dataset
        if (result.dataset_id) {
            currentDatasetId = result.dataset_id;
        }
        await loadDatasets();
        loadDashboard();
    } catch (err) {
        console.error(err);
        showToast(err.message, "error");
    }
    finally {
        btn.innerHTML = origHtml;
        btn.disabled = false;
        e.target.value = "";
    }
});

// ========== Add Employee ==========
document.getElementById("addEmployeeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitEmployeeBtn");
    const loader = btn.querySelector(".btn-loader");
    loader.style.display = "flex"; btn.disabled = true;
    const data = {
        name: document.getElementById("emp-name").value,
        department: document.getElementById("emp-department").value,
        weekly_work_hours: parseFloat(document.getElementById("emp-weekly-hours").value),
        overtime_hours: parseFloat(document.getElementById("emp-overtime").value),
        tasks_completed: parseInt(document.getElementById("emp-tasks").value),
        meeting_hours: parseFloat(document.getElementById("emp-meeting").value),
        leave_days_last_3_months: parseInt(document.getElementById("emp-leave").value),
        performance_score: parseFloat(document.getElementById("emp-performance").value),
        dataset_id: currentDatasetId, // assign to currently selected dataset
    };
    try {
        const res = await fetch(`${API_URL}/employees`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error("Failed");
        const dsName = currentDatasetId ? allDatasets.find(d => d.id === currentDatasetId)?.name : "All Data";
        showToast(`${data.name} added${currentDatasetId ? ` to "${dsName}"` : ''}!`, "success");
        document.getElementById("addEmployeeForm").reset();
        loadDatasets(); // refresh counts
    } catch (err) { showToast("Failed to add employee.", "error"); }
    finally { loader.style.display = "none"; btn.disabled = false; }
});

// ========== Employees ==========
let allEmployeesData = [];
async function loadEmployees() {
    const grid = document.getElementById("employeesGrid");
    try {
        const [empRes, analyticsRes] = await Promise.all([
            fetch(`${API_URL}/employees${getDatasetParam()}`),
            fetch(`${API_URL}/analytics${getDatasetParam()}`)
        ]);
        const employees = await empRes.json();
        const analytics = await analyticsRes.json();
        const scoreMap = {};
        analytics.forEach((a) => (scoreMap[a.id] = a.burnout_score));
        allEmployeesData = employees.map((emp) => ({ ...emp, burnout_score: scoreMap[emp.id] ?? null }));
        renderEmployees(allEmployeesData);
    } catch (err) {
        grid.innerHTML = `<div class="empty-state"><i data-lucide="wifi-off"></i><p>Failed to load employees. Is the backend running?</p></div>`;
        lucide.createIcons();
    }
}
function renderEmployees(employees) {
    const grid = document.getElementById("employeesGrid");
    if (employees.length === 0) {
        grid.innerHTML = `<div class="empty-state"><i data-lucide="users"></i><p>No employees found.</p></div>`;
        lucide.createIcons(); return;
    }
    grid.innerHTML = employees.map((emp, i) => {
        const score = emp.burnout_score;
        const risk = score !== null ? getRiskLevel(score) : { label: "N/A", cls: "low", color: "#5a6580" };
        return `<div class="employee-card" style="animation-delay:${i * 50}ms">
            <div class="employee-card-header">
                <div class="employee-card-header-left">
                    <div class="employee-avatar" style="background:${getAvatarColor(emp.name)}">${getInitials(emp.name)}</div>
                    <div><div class="employee-name">${emp.name}</div><div class="employee-dept">${emp.department} · #${emp.id}</div></div>
                </div>
                ${score !== null ? `<span class="risk-badge ${risk.cls}">${risk.label}</span>` : ""}
            </div>
            <div class="employee-stats">
                <div class="employee-stat"><span class="employee-stat-label">Hours/week</span><span class="employee-stat-value">${emp.weekly_work_hours}h</span></div>
                <div class="employee-stat"><span class="employee-stat-label">Overtime</span><span class="employee-stat-value">${emp.overtime_hours}h</span></div>
                <div class="employee-stat"><span class="employee-stat-label">Meetings</span><span class="employee-stat-value">${emp.meeting_hours}h</span></div>
                <div class="employee-stat"><span class="employee-stat-label">Performance</span><span class="employee-stat-value">${emp.performance_score}</span></div>
            </div>
            <div class="employee-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="checkBurnout(${emp.id}, '${emp.name.replace(/'/g, "\\'")}')">
                    <i data-lucide="activity"></i><span>Burnout Check</span>
                </button>
                <button class="btn-icon" onclick="openEditModal(${emp.id})" title="Edit">
                    <i data-lucide="pencil"></i>
                </button>
                <button class="btn-icon danger" onclick="confirmDeleteEmployee(${emp.id}, '${emp.name.replace(/'/g, "\\'")}')" title="Delete">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>`;
    }).join("");
    lucide.createIcons();
}
document.getElementById("employeeSearch").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    renderEmployees(allEmployeesData.filter(emp =>
        emp.name.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q) || String(emp.id).includes(q)
    ));
});

// ========== Delete Employee ==========
function confirmDeleteEmployee(id, name) {
    showConfirm("Delete Employee", `Are you sure you want to delete <strong>${name}</strong> (#${id})? This action cannot be undone.`, async () => {
        try {
            const res = await fetch(`${API_URL}/employees/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            showToast(`${name} deleted successfully`, "success");
            loadEmployees();
            loadDatasets(); // refresh counts
        } catch (err) { showToast("Failed to delete employee", "error"); }
    });
}

// ========== Clear All Employees ==========
document.getElementById("clearAllBtn").addEventListener("click", () => {
    const target = currentDatasetId
        ? `all employees in the selected dataset`
        : `<strong>all employees</strong> across all datasets`;
    showConfirm("Clear Data", `This will permanently delete ${target}. Are you sure?`, async () => {
        try {
            const res = await fetch(`${API_URL}/employees${getDatasetParam()}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            showToast("Employee data cleared", "success");
            loadEmployees();
            loadDatasets();
        } catch (err) { showToast("Failed to clear data", "error"); }
    });
});

// ========== Edit Employee ==========
function openEditModal(id) {
    const emp = allEmployeesData.find(e => e.id === id);
    if (!emp) return;
    openModal("Edit Employee", `
        <form id="editForm" style="text-align:left">
            <div class="form-grid">
                <div class="form-group"><label>Name</label><div class="input-wrapper"><input id="edit-name" value="${emp.name}" required></div></div>
                <div class="form-group"><label>Department</label><div class="input-wrapper"><input id="edit-dept" value="${emp.department}" required></div></div>
                <div class="form-group"><label>Weekly Hours</label><div class="input-wrapper"><input type="number" id="edit-hours" value="${emp.weekly_work_hours}" required></div></div>
                <div class="form-group"><label>Overtime</label><div class="input-wrapper"><input type="number" id="edit-overtime" value="${emp.overtime_hours}" required></div></div>
                <div class="form-group"><label>Tasks Completed</label><div class="input-wrapper"><input type="number" id="edit-tasks" value="${emp.tasks_completed}" required></div></div>
                <div class="form-group"><label>Meeting Hours</label><div class="input-wrapper"><input type="number" id="edit-meetings" value="${emp.meeting_hours}" required></div></div>
                <div class="form-group"><label>Leave Days</label><div class="input-wrapper"><input type="number" id="edit-leave" value="${emp.leave_days_last_3_months}" required></div></div>
                <div class="form-group"><label>Performance</label><div class="input-wrapper"><input type="number" step="0.1" id="edit-perf" value="${emp.performance_score}" required></div></div>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `);
    document.getElementById("editForm").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const updatedData = {
            name: document.getElementById("edit-name").value,
            department: document.getElementById("edit-dept").value,
            weekly_work_hours: parseFloat(document.getElementById("edit-hours").value),
            overtime_hours: parseFloat(document.getElementById("edit-overtime").value),
            tasks_completed: parseInt(document.getElementById("edit-tasks").value),
            meeting_hours: parseFloat(document.getElementById("edit-meetings").value),
            leave_days_last_3_months: parseInt(document.getElementById("edit-leave").value),
            performance_score: parseFloat(document.getElementById("edit-perf").value),
        };
        try {
            const res = await fetch(`${API_URL}/employees/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) throw new Error("Failed");
            showToast(`${updatedData.name} updated successfully`, "success");
            closeModal();
            loadEmployees();
        } catch (err) { showToast("Failed to update employee", "error"); }
    });
}

// ========== Export CSV ==========
document.getElementById("exportCsvBtn").addEventListener("click", () => {
    if (allEmployeesData.length === 0) { showToast("No data to export", "info"); return; }
    const headers = ["ID", "Name", "Department", "Weekly Hours", "Overtime", "Tasks Completed", "Meeting Hours", "Leave Days", "Performance", "Burnout Score"];
    const rows = allEmployeesData.map(e => [
        e.id, e.name, e.department, e.weekly_work_hours, e.overtime_hours,
        e.tasks_completed, e.meeting_hours, e.leave_days_last_3_months,
        e.performance_score, e.burnout_score ?? "N/A"
    ]);
    let csv = headers.join(",") + "\n" + rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `burnoutguard_employees_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully", "success");
});

// ========== Burnout Modal ==========
async function checkBurnout(id, name) {
    openModal("Burnout Analysis", `<div style="padding:40px 0"><div class="spinner" style="margin:0 auto;width:32px;height:32px;border-width:3px"></div><p style="color:var(--text-muted);margin-top:16px;font-size:13px">Analyzing burnout risk…</p></div>`);
    try {
        const res = await fetch(`${API_URL}/burnout/${id}`);
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        const score = result.burnout_score;
        const risk = getRiskLevel(score);
        const circ = 2 * Math.PI * 65;
        const offset = circ - (score / 100) * circ;
        openModal("Burnout Analysis", `
            <div class="burnout-gauge">
                <svg viewBox="0 0 150 150">
                    <circle class="burnout-gauge-bg" cx="75" cy="75" r="65"/>
                    <circle class="burnout-gauge-fill" cx="75" cy="75" r="65" stroke="${risk.color}" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"/>
                </svg>
                <div class="burnout-gauge-text">
                    <span class="burnout-score-value" style="color:${risk.color}">${score}%</span>
                    <span class="burnout-score-label">Burnout</span>
                </div>
            </div>
            <div class="modal-employee-name">${name}</div>
            <div class="modal-risk-badge risk-badge ${risk.cls}">${risk.label} Risk</div>
            <div class="modal-explanation">${result.explanation}</div>
        `);
        setTimeout(() => { const f = document.querySelector(".burnout-gauge-fill"); if (f) f.style.strokeDashoffset = offset; }, 50);
    } catch (err) { closeModal(); showToast("Failed: " + err.message, "error"); }
}

// ========== Analytics (with filters) ==========
let analyticsData = [];
let activeRiskFilter = "all";

async function loadAnalytics() {
    try {
        const res = await fetch(`${API_URL}/analytics${getDatasetParam()}`);
        if (!res.ok) throw new Error("Failed");
        analyticsData = await res.json();
        populateDepartmentFilter(analyticsData);
        applyAnalyticsFilters();
    } catch (err) { console.error(err); }
}

function populateDepartmentFilter(data) {
    const sel = document.getElementById("filterDepartment");
    const depts = [...new Set(data.map(e => e.department))].sort();
    const current = sel.value;
    sel.innerHTML = `<option value="all">All Departments</option>` + depts.map(d => `<option value="${d}">${d}</option>`).join("");
    sel.value = current || "all";
}

function getFilteredData() {
    let filtered = [...analyticsData];
    const dept = document.getElementById("filterDepartment").value;
    if (dept !== "all") filtered = filtered.filter(e => e.department === dept);
    const empId = document.getElementById("filterEmpId").value;
    if (empId) filtered = filtered.filter(e => String(e.id) === empId);
    if (activeRiskFilter !== "all") {
        filtered = filtered.filter(e => getRiskLevel(e.burnout_score).cls === activeRiskFilter);
    }
    return filtered;
}

function applyAnalyticsFilters() {
    const data = getFilteredData();
    drawSummaryStats(data);
    drawRiskDistribution(data);
    drawBarChart(data);
    drawPieChart(data);
    drawWorkloadHeatmap(data);
    drawRanking(data);
    lucide.createIcons();
}

document.getElementById("filterDepartment").addEventListener("change", applyAnalyticsFilters);
document.getElementById("filterEmpId").addEventListener("input", applyAnalyticsFilters);
document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeRiskFilter = chip.dataset.risk;
        applyAnalyticsFilters();
    });
});

// ========== Summary Stats ==========
function drawSummaryStats(data) {
    const el = document.getElementById("analyticsSummary");
    if (data.length === 0) { el.innerHTML = ""; return; }
    const total = data.length;
    const avg = Math.round(data.reduce((s, e) => s + e.burnout_score, 0) / total);
    const maxB = data.reduce((m, e) => e.burnout_score > m.burnout_score ? e : m, data[0]);
    const avgHrs = Math.round(data.reduce((s, e) => s + e.weekly_work_hours, 0) / total);
    const avgOT = Math.round(data.reduce((s, e) => s + e.overtime_hours, 0) / total);
    el.innerHTML = `
        <div class="summary-item"><span class="summary-val" style="color:var(--accent-blue)">${total}</span><span class="summary-lbl">Showing</span></div>
        <div class="summary-item"><span class="summary-val" style="color:${getRiskLevel(avg).color}">${avg}%</span><span class="summary-lbl">Avg Burnout</span></div>
        <div class="summary-item"><span class="summary-val" style="color:var(--accent-rose)">${maxB.name}</span><span class="summary-lbl">Highest Risk (${maxB.burnout_score}%)</span></div>
        <div class="summary-item"><span class="summary-val" style="color:var(--accent-amber)">${avgHrs}h / ${avgOT}h</span><span class="summary-lbl">Avg Work / Overtime</span></div>
    `;
}

// ========== Risk Distribution ==========
function drawRiskDistribution(data) {
    const bar = document.getElementById("riskDistBar");
    const legend = document.getElementById("riskDistLegend");
    if (data.length === 0) { bar.innerHTML = ""; legend.innerHTML = ""; return; }
    const high = data.filter(e => e.burnout_score > 70).length;
    const med = data.filter(e => e.burnout_score > 40 && e.burnout_score <= 70).length;
    const low = data.filter(e => e.burnout_score <= 40).length;
    const t = data.length;
    bar.innerHTML = `
        <div class="risk-dist-segment" style="width:${(high / t) * 100}%;background:var(--accent-rose)"></div>
        <div class="risk-dist-segment" style="width:${(med / t) * 100}%;background:var(--accent-amber)"></div>
        <div class="risk-dist-segment" style="width:${(low / t) * 100}%;background:var(--accent-teal)"></div>
    `;
    legend.innerHTML = `
        <div class="risk-dist-legend-item"><div class="risk-dist-legend-dot" style="background:var(--accent-rose)"></div>High Risk: ${high} (${Math.round((high / t) * 100)}%)</div>
        <div class="risk-dist-legend-item"><div class="risk-dist-legend-dot" style="background:var(--accent-amber)"></div>Medium: ${med} (${Math.round((med / t) * 100)}%)</div>
        <div class="risk-dist-legend-item"><div class="risk-dist-legend-dot" style="background:var(--accent-teal)"></div>Low: ${low} (${Math.round((low / t) * 100)}%)</div>
    `;
}

// ========== Chart.js Config ==========
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#64748b";
Chart.defaults.scale.grid.color = "#f1f5f9";

let burnoutChartInstance = null;
let deptChartInstance = null;

// ========== Bar Chart ==========
function drawBarChart(data) {
    const ctx = document.getElementById("burnoutBarChart").getContext("2d");
    if (burnoutChartInstance) burnoutChartInstance.destroy();
    if (data.length === 0) return;
    const sortedData = [...data].sort((a, b) => b.burnout_score - a.burnout_score).slice(0, 15);
    burnoutChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => d.name),
            datasets: [{
                label: 'Burnout Score (%)',
                data: sortedData.map(d => d.burnout_score),
                backgroundColor: sortedData.map(d => getRiskLevel(d.burnout_score).color),
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { borderDash: [4, 4] } },
                x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } }
            }
        }
    });
}

// ========== Pie Chart ==========
function drawPieChart(data) {
    const ctx = document.getElementById("deptPieChart").getContext("2d");
    if (deptChartInstance) deptChartInstance.destroy();
    if (data.length === 0) return;
    const depts = {};
    data.forEach(e => { depts[e.department] = (depts[e.department] || 0) + 1; });
    const labels = Object.keys(depts);
    const values = Object.values(depts);
    deptChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: CHART_COLORS,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 12, usePointStyle: true, padding: 20 }
                }
            }
        }
    });
}

// ========== Workload Heatmap ==========
function drawWorkloadHeatmap(data) {
    const container = document.getElementById("workloadHeatmap");
    if (data.length === 0) { container.innerHTML = `<div class="empty-state small" style="grid-column:1/-1"><p>No data to display.</p></div>`; return; }
    const metrics = ["Weekly Hrs", "Overtime", "Meetings", "Performance"];
    const keys = ["weekly_work_hours", "overtime_hours", "meeting_hours", "burnout_score"];
    const maxVals = keys.map(k => Math.max(...data.map(e => e[k] || 0), 1));
    let html = `<div class="heatmap-label"></div>`;
    metrics.forEach(m => { html += `<div class="heatmap-header">${m}</div>`; });
    data.forEach(emp => {
        html += `<div class="heatmap-label">${emp.name}</div>`;
        keys.forEach((k, ki) => {
            const val = emp[k] || 0;
            const intensity = val / maxVals[ki];
            let color;
            if (k === "burnout_score") { color = getRiskLevel(val).color; }
            else if (k === "overtime_hours") { color = `rgba(240,96,112,${0.15 + intensity * 0.55})`; }
            else { color = `rgba(79,140,255,${0.1 + intensity * 0.5})`; }
            html += `<div class="heatmap-cell" style="background:${color}" title="${emp.name}: ${val}">${k === "burnout_score" ? val + "%" : val}</div>`;
        });
    });
    container.style.gridTemplateColumns = `100px repeat(${metrics.length}, 1fr)`;
    container.innerHTML = html;
}

// ========== Ranking ==========
function drawRanking(data) {
    const list = document.getElementById("rankingList");
    if (data.length === 0) { list.innerHTML = `<div class="empty-state small"><p>No data to display.</p></div>`; return; }
    const sorted = [...data].sort((a, b) => b.burnout_score - a.burnout_score);
    list.innerHTML = sorted.map((emp, i) => {
        const risk = getRiskLevel(emp.burnout_score);
        return `<div class="ranking-item">
            <span class="ranking-rank">#${i + 1}</span>
            <span class="ranking-name">${emp.name}</span>
            <span class="ranking-dept">${emp.department} · #${emp.id}</span>
            <div class="ranking-bar-bg"><div class="ranking-bar" style="width:${emp.burnout_score}%;background:${risk.color}"></div></div>
            <span class="ranking-score" style="color:${risk.color}">${emp.burnout_score}%</span>
        </div>`;
    }).join("");
}

// ========== Init ==========
window.addEventListener("DOMContentLoaded", async () => {
    lucide.createIcons();
    await loadDatasets();
    navigateTo(window.location.hash.slice(1) || "dashboard");
});