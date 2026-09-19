/* =========================================================
   DOJOTRACK V1
   Karate Dojo Register
   ========================================================= */

const STORAGE_KEY = "DOJOTRACK_V1_DATA";

const DEFAULT_DATA = {
    students: [],
    attendance: {},
    classes: {},
    fees: {}
};

let data = loadData();


/* =========================================================
   STORAGE
   ========================================================= */

function loadData() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(DEFAULT_DATA);
        }

        const parsed = JSON.parse(saved);

        return {
            students: Array.isArray(parsed.students) ? parsed.students : [],
            attendance: parsed.attendance || {},
            classes: parsed.classes || {},
            fees: parsed.fees || {}
        };

    } catch (error) {

        console.error(error);

        return structuredClone(DEFAULT_DATA);
    }
}


function saveData() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(error);

        toast("Could not save data");

        return false;
    }
}


/* =========================================================
   DATE FUNCTIONS
   ========================================================= */

function todayISO() {

    const now = new Date();

    const local =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() * 60000
        );

    return local.toISOString().split("T")[0];
}


function currentMonth() {
    return todayISO().slice(0, 7);
}


function formatDate(date) {

    if (!date) return "";

    return new Date(date + "T00:00:00")
        .toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}


function formatShortDate(date) {

    return new Date(date + "T00:00:00")
        .toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}


function isWeekend(date) {

    const day =
        new Date(date + "T00:00:00").getDay();

    return day === 0 || day === 6;
}


function isSaturdayOrSunday(date) {

    return isWeekend(date);
}


/* =========================================================
   CLASS SYSTEM
   =========================================================

   Saturday / Sunday = regular class

   Monday-Friday = no class

   Extra class = manually created

   Cancelled = excluded from attendance calculation
   ========================================================= */

function getClassStatus(date) {

    if (data.classes[date]) {
        return data.classes[date].status;
    }

    if (isSaturdayOrSunday(date)) {
        return "held";
    }

    return "none";
}


function setClassStatus(status) {

    const date =
        document.getElementById("attendanceDate").value;

    if (!date) return;

    data.classes[date] = {
        status: status
    };

    if (status === "cancelled") {

        delete data.attendance[date];

        toast("Class cancelled");

    } else {

        toast(
            isWeekend(date)
                ? "Class restored"
                : "Extra class added"
        );
    }

    saveData();

    renderAttendance();
    renderHome();
    renderReports();
}


/* =========================================================
   NAVIGATION
   ========================================================= */

const pageInfo = {

    home: {
        title: "Dojo",
        subtitle: "Karate student register"
    },

    students: {
        title: "Students",
        subtitle: "Dojo members"
    },

    admission: {
        title: "New Admission",
        subtitle: "Add a new student"
    },

    attendance: {
        title: "Attendance",
        subtitle: "Training register"
    },

    fees: {
        title: "Fees",
        subtitle: "Payment register"
    },

    reports: {
        title: "Reports",
        subtitle: "Dojo records"
    },

    settings: {
        title: "Settings",
        subtitle: "Dojo settings & backup"
    }

};


document.querySelectorAll(".nav").forEach(button => {

    button.addEventListener("click", () => {

        showPage(button.dataset.page);

    });

});


function showPage(page) {

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    const target =
        document.getElementById(page);

    if (target) {
        target.classList.add("active");
    }


    document.querySelectorAll(".nav").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });


    document.getElementById("pageTitle").textContent =
        pageInfo[page].title;

    document.getElementById("pageSubtitle").textContent =
        pageInfo[page].subtitle;


    if (page === "home") renderHome();
    if (page === "students") renderStudents();
    if (page === "attendance") renderAttendance();
    if (page === "fees") renderFees();
    if (page === "reports") renderReports();


    document.getElementById("sidebar")
        .classList.remove("open");
}


function toggleMenu() {

    document
        .getElementById("sidebar")
        .classList.toggle("open");
}


/* =========================================================
   INITIAL UI
   ========================================================= */

document.getElementById("headerDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });


document.getElementById("attendanceDate").value =
    todayISO();

document.getElementById("feeMonth").value =
    currentMonth();

document.getElementById("reportMonth").value =
    currentMonth();


/* =========================================================
   ADMISSION
   ========================================================= */

document
    .getElementById("admissionForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();


        const name =
            document
                .getElementById("admissionName")
                .value
                .trim();

        const phone =
            document
                .getElementById("admissionPhone")
                .value
                .trim();

        const belt =
            document
                .getElementById("admissionBelt")
                .value;

        const grade =
            document
                .getElementById("admissionGrade")
                .value
                .trim();


        if (!name) {

            toast("Please enter the student name");

            return;
        }


        const student = {

            id:
                Date.now().toString() +
                Math.random().toString(16).slice(2),

            name: name,

            phone: phone,

            belt: belt,

            grade: grade,

            active: true,

            admissionDate: todayISO(),

            fees: {

                admission: false,

                uniform: false

            },

            beltHistory: [

                {
                    belt: belt,
                    grade: grade,
                    date: todayISO()
                }

            ]

        };


        data.students.push(student);

        saveData();


        this.reset();

        document.getElementById("admissionBelt").value =
            "White";


        toast(`${name} added to the dojo`);

        showPage("students");

    });


/* =========================================================
   STUDENTS
   ========================================================= */

function renderStudents() {

    const container =
        document.getElementById("studentsList");

    const search =
        document
            .getElementById("searchStudent")
            .value
            .trim()
            .toLowerCase();


    const students =
        data.students.filter(student => {

            return (
                student.active &&
                student.name.toLowerCase().includes(search)
            );

        });


    if (!students.length) {

        container.innerHTML = `
            <div class="empty">
                No students found.
                <br><br>
                Add a new student using New Admission.
            </div>
        `;

        return;
    }


    container.innerHTML =
        students.map(student => {

            const initials =
                student.name
                    .split(/\s+/)
                    .map(part => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();


            return `

                <div class="student-card">

                    <div class="student-left">

                        <div class="avatar">
                            ${escapeHTML(initials)}
                        </div>

                        <div>

                            <div class="student-name">
                                ${escapeHTML(student.name)}
                            </div>

                            <div class="student-sub">

                                ${escapeHTML(student.belt)}

                                ${
                                    student.grade
                                    ? " • " + escapeHTML(student.grade)
                                    : ""
                                }

                                ${
                                    student.phone
                                    ? " • " + escapeHTML(student.phone)
                                    : ""
                                }

                            </div>

                        </div>

                    </div>


                    <div class="student-right">

                        <button
                            class="small-btn"
                            onclick="viewStudent('${student.id}')">
                            View
                        </button>

                        <button
                            class="small-btn"
                            onclick="editStudent('${student.id}')">
                            Edit
                        </button>

                        <button
                            class="small-btn"
                            onclick="removeStudent('${student.id}')">
                            Remove
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


function editStudent(id) {

    const student =
        findStudent(id);

    if (!student) return;


    const name =
        prompt("Student name:", student.name);

    if (name === null) return;


    const phone =
        prompt("Phone number:", student.phone || "");

    if (phone === null) return;


    const belt =
        prompt(
            "Current belt:",
            student.belt
        );

    if (belt === null) return;


    const grade =
        prompt(
            "Current grade:",
            student.grade || ""
        );

    if (grade === null) return;


    student.name =
        name.trim();

    student.phone =
        phone.trim();

    student.belt =
        belt.trim() || student.belt;

    student.grade =
        grade.trim();


    saveData();

    renderStudents();
    renderHome();

    toast("Student updated");
}


function removeStudent(id) {

    const student =
        findStudent(id);

    if (!student) return;


    const confirmed =
        confirm(
            `Remove ${student.name} from active students?`
        );

    if (!confirmed) return;


    student.active = false;

    saveData();

    renderStudents();
    renderHome();
    renderAttendance();

    toast("Student removed");
}


function findStudent(id) {

    return data.students.find(
        student => student.id === id
    );
}


/* =========================================================
   STUDENT PROFILE
   ========================================================= */

function viewStudent(id) {

    const student =
        findStudent(id);

    if (!student) return;


    const attendanceStats =
        getStudentAttendanceAllTime(student.id);


    const initials =
        student.name
            .split(/\s+/)
            .map(x => x[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();


    const history =
        student.beltHistory || [];


    document.getElementById("modalContent").innerHTML = `

        <div style="display:flex;align-items:center;gap:14px;margin-bottom:25px">

            <div class="avatar">
                ${escapeHTML(initials)}
            </div>

            <div>
                <h2>${escapeHTML(student.name)}</h2>

                <p style="color:#999;font-size:12px;margin-top:5px">
                    ${escapeHTML(student.belt)}
                    ${
                        student.grade
                        ? " • " + escapeHTML(student.grade)
                        : ""
                    }
                </p>
            </div>

        </div>


        <div class="rule-card">

            <div class="rule-icon">
                ${attendanceStats.percentage}%
            </div>

            <div>

                <strong>Attendance</strong>

                <p>
                    ${attendanceStats.present}
                    / ${attendanceStats.total}
                    classes attended
                </p>

            </div>

        </div>


        <h3 style="margin:20px 0 12px">
            💴 Fees
        </h3>


        <div class="fee-details">

            <span class="fee-chip ${student.fees?.admission ? "paid" : "pending"}">
                Admission ₹800 —
                ${student.fees?.admission ? "Paid" : "Pending"}
            </span>

            <span class="fee-chip ${student.fees?.uniform ? "paid" : "pending"}">
                Uniform ₹800 —
                ${student.fees?.uniform ? "Paid" : "Pending"}
            </span>

        </div>


        <h3 style="margin:22px 0 12px">
            🏅 Belt & Grade History
        </h3>


        ${
            history.length
            ? history.map(item => `

                <div class="setting-row">

                    <span>
                        ${escapeHTML(item.belt)}
                        ${
                            item.grade
                            ? " • " + escapeHTML(item.grade)
                            : ""
                        }
                    </span>

                    <strong>
                        ${formatShortDate(item.date)}
                    </strong>

                </div>

            `).join("")
            : `<p style="color:#777">No history yet.</p>`
        }

    `;


    document
        .getElementById("studentModal")
        .classList.add("show");
}


function closeModal() {

    document
        .getElementById("studentModal")
        .classList.remove("show");
}


/* =========================================================
   ATTENDANCE
   ========================================================= */

function renderAttendance() {

    const date =
        document
            .getElementById("attendanceDate")
            .value;


    if (!date) return;


    const status =
        getClassStatus(date);


    const control =
        document.getElementById("classControl");


    if (status === "held") {

        control.innerHTML = `

            <div class="class-control">

                <div>

                    <div class="class-title">
                        🥋 Class is scheduled
                    </div>

                    <div class="class-sub">
                        ${formatDate(date)}
                    </div>

                </div>


                <div class="control-buttons">

                    <button
                        class="cancel"
                        onclick="setClassStatus('cancelled')">
                        ✕ Cancel Class
                    </button>

                </div>

            </div>

        `;

    }


    else if (status === "cancelled") {

        control.innerHTML = `

            <div class="class-control">

                <div>

                    <div class="class-title">
                        🔴 Class Cancelled
                    </div>

                    <div class="class-sub">
                        ${formatDate(date)}
                    </div>

                </div>


                <div class="control-buttons">

                    <button
                        onclick="setClassStatus('held')">
                        Restore Class
                    </button>

                </div>

            </div>

        `;

    }


    else {

        control.innerHTML = `

            <div class="class-control">

                <div>

                    <div class="class-title">
                        ⚪ No regular class
                    </div>

                    <div class="class-sub">
                        ${formatDate(date)}
                        <br>
                        Monday-Friday is normally a no-class day.
                    </div>

                </div>


                <div class="control-buttons">

                    <button
                        onclick="setClassStatus('held')">
                        ＋ Add Extra Class
                    </button>

                </div>

            </div>

        `;

    }


    const list =
        document.getElementById("attendanceList");


    if (status !== "held") {

        list.innerHTML = `

            <div class="empty">

                ${
                    status === "cancelled"
                    ? "Attendance is disabled because this class was cancelled."
                    : "No class on this date."
                }

            </div>

        `;

        updateAttendanceSummary();

        return;
    }


    const students =
        data.students.filter(
            student => student.active
        );


    if (!students.length) {

        list.innerHTML = `
            <div class="empty">
                No students have been added yet.
            </div>
        `;

        updateAttendanceSummary();

        return;
    }


    if (!data.attendance[date]) {
        data.attendance[date] = {};
    }


    list.innerHTML =
        students.map(student => {

            const state =
                data.attendance[date][student.id] || "";


            const initials =
                student.name
                    .split(/\s+/)
                    .map(x => x[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();


            return `

                <div class="attendance-row">

                    <div class="att-name">

                        <div class="avatar">
                            ${escapeHTML(initials)}
                        </div>

                        <strong>
                            ${escapeHTML(student.name)}
                        </strong>

                    </div>


                    <div class="att-buttons">

                        <button
                            class="att-btn present ${state === "present" ? "active" : ""}"
                            onclick="
                                setAttendance(
                                    '${date}',
                                    '${student.id}',
                                    'present'
                                )
                            ">
                            ✓ Present
                        </button>


                        <button
                            class="att-btn absent ${state === "absent" ? "active" : ""}"
                            onclick="
                                setAttendance(
                                    '${date}',
                                    '${student.id}',
                                    'absent'
                                )
                            ">
                            ✕ Absent
                        </button>

                    </div>

                </div>

            `;

        }).join("");


    updateAttendanceSummary();
}


function setAttendance(
    date,
    studentId,
    state
) {

    if (!data.attendance[date]) {
        data.attendance[date] = {};
    }


    data.attendance[date][studentId] =
        state;


    saveData();

    renderAttendance();
    renderHome();
    renderReports();
}


function markAllPresent() {

    const date =
        document
            .getElementById("attendanceDate")
            .value;


    if (getClassStatus(date) !== "held") {

        toast("There is no active class on this date");

        return;
    }


    if (!data.attendance[date]) {
        data.attendance[date] = {};
    }


    data.students
        .filter(student => student.active)
        .forEach(student => {

            data.attendance[date][student.id] =
                "present";

        });


    saveData();

    renderAttendance();
    renderHome();
    renderReports();

    toast("Everyone marked present");
}


function clearAttendance() {

    const date =
        document
            .getElementById("attendanceDate")
            .value;


    if (!data.attendance[date]) {

        toast("Attendance is already empty");

        return;
    }


    if (!confirm(
        "Clear attendance for this date?"
    )) return;


    delete data.attendance[date];

    saveData();

    renderAttendance();
    renderHome();
    renderReports();

    toast("Attendance cleared");
}


function updateAttendanceSummary() {

    const date =
        document
            .getElementById("attendanceDate")
            .value;


    const records =
        data.attendance[date] || {};


    const students =
        data.students.filter(
            student => student.active
        );


    let present = 0;
    let absent = 0;
    let unmarked = 0;


    students.forEach(student => {

        const state =
            records[student.id];


        if (state === "present") {

            present++;

        } else if (state === "absent") {

            absent++;

        } else {

            unmarked++;

        }

    });


    document.getElementById("attPresent").textContent =
        present;

    document.getElementById("attAbsent").textContent =
        absent;

    document.getElementById("attUnmarked").textContent =
        unmarked;
}


/* =========================================================
   FEES
   =========================================================

   Admission = one-time ₹800

   Uniform = one-time ₹800

   Monthly = ₹500 every month

   Admission/uniform payment status lives
   inside the student.

   Monthly payments use month_student_id key.
   ========================================================= */

function renderFees() {

    const month =
        document
            .getElementById("feeMonth")
            .value;


    const container =
        document.getElementById("feesList");


    const students =
        data.students.filter(
            student => student.active
        );


    if (!students.length) {

        container.innerHTML = `
            <div class="empty">
                No students added yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        students.map(student => {

            const monthlyKey =
                `monthly_${month}_${student.id}`;


            const monthlyPaid =
                data.fees[monthlyKey] === "paid";


            const admissionPaid =
                !!student.fees?.admission;


            const uniformPaid =
                !!student.fees?.uniform;


            return `

                <div class="fee-row">

                    <div>

                        <div class="fee-name">
                            ${escapeHTML(student.name)}
                        </div>


                        <div class="fee-details">

                            <span class="fee-chip ${monthlyPaid ? "paid" : "pending"}">
                                Monthly ₹500 —
                                ${monthlyPaid ? "Paid" : "Pending"}
                            </span>


                            <span class="fee-chip ${uniformPaid ? "paid" : "pending"}">
                                Uniform ₹800 —
                                ${uniformPaid ? "Paid" : "Pending"}
                            </span>


                            <span class="fee-chip ${admissionPaid ? "paid" : "pending"}">
                                Admission ₹800 —
                                ${admissionPaid ? "Paid" : "Pending"}
                            </span>

                        </div>

                    </div>


                    <div class="fee-buttons">

                        <button
                            class="fee-btn"
                            onclick="
                                toggleMonthlyFee(
                                    '${student.id}',
                                    '${month}'
                                )
                            ">
                            ${monthlyPaid
                                ? "✓ Monthly Paid"
                                : "Mark Monthly"}
                        </button>


                        ${
                            uniformPaid

                            ? `<button
                                class="fee-btn"
                                onclick="toggleOneTimeFee('${student.id}', 'uniform')">
                                ✓ Uniform
                            </button>`

                            : `<button
                                class="fee-btn"
                                onclick="toggleOneTimeFee('${student.id}', 'uniform')">
                                Uniform ₹800
                            </button>`
                        }


                        ${
                            admissionPaid

                            ? `<button
                                class="fee-btn"
                                onclick="toggleOneTimeFee('${student.id}', 'admission')">
                                ✓ Admission
                            </button>`

                            : `<button
                                class="fee-btn"
                                onclick="toggleOneTimeFee('${student.id}', 'admission')">
                                Admission ₹800
                            </button>`
                        }

                    </div>

                </div>

            `;

        }).join("");
}


function toggleMonthlyFee(studentId, month) {
    const key = `monthly_${month}_${studentId}`;

    if (data.fees[key] === "paid") {
        delete data.fees[key];
        toast(`${month} monthly fee marked pending`);
    } else {
        data.fees[key] = "paid";
        toast(`${month} monthly fee marked paid`);
    }

    saveData();
    renderFees();
    renderHome();
}


/* =========================================================
   OLD / PENDING MONTHLY FEES
   ========================================================= */

function addPendingMonthlyFee(studentId) {
    const month = prompt(
        "Enter pending month (YYYY-MM)\nExample: 2026-08"
    );

    if (!month) return;

    if (!/^\d{4}-\d{2}$/.test(month)) {
        toast("Please enter month like 2026-08");
        return;
    }

    const key = `monthly_${month}_${studentId}`;

    if (data.fees[key] === "paid") {
        toast("This month is already marked paid");
        return;
    }

    data.fees[key] = "pending";

    saveData();
    renderFees();
    renderHome();

    toast(`${month} added as pending`);
}


function markOldMonthlyFeePaid(studentId, month) {
    const key = `monthly_${month}_${studentId}`;

    data.fees[key] = "paid";

    saveData();
    renderFees();
    renderHome();

    toast(`${month} fee marked paid`);
}


function deleteMonthlyFeeRecord(studentId, month) {
    const key = `monthly_${month}_${studentId}`;

    if (!data.fees[key]) return;

    const confirmDelete = confirm(
        `Delete ${month} monthly fee record?`
    );

    if (!confirmDelete) return;

    delete data.fees[key];

    saveData();
    renderFees();
    renderHome();

    toast(`${month} fee record deleted`);
} 


/* =========================================================
   REPORTS
   ========================================================= */

function getHeldClassDates(month) {

    const [year, monthNumber] =
        month.split("-").map(Number);


    const days =
        new Date(
            year,
            monthNumber,
            0
        ).getDate();


    const dates = [];


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        const date =
            `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        if (
            getClassStatus(date) === "held"
        ) {

            dates.push(date);

        }

    }


    return dates;
}


function getStudentAttendance(
    studentId,
    month
) {

    const dates =
        getHeldClassDates(month);


    let present = 0;


    dates.forEach(date => {

        if (
            data.attendance[date] &&
            data.attendance[date][studentId] === "present"
        ) {

            present++;

        }

    });


    const total =
        dates.length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (present / total) * 1000
            ) / 10;


    return {
        present,
        total,
        percentage
    };
}


function getStudentAttendanceAllTime(
    studentId
) {

    const dates =
        Object.keys(data.attendance);


    let total = 0;
    let present = 0;


    dates.forEach(date => {

        if (
            getClassStatus(date) !== "held"
        ) {
            return;
        }


        const state =
            data.attendance[date]?.[studentId];


        if (
            state === "present" ||
            state === "absent"
        ) {

            total++;

        }


        if (state === "present") {
            present++;
        }

    });


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (present / total) * 1000
            ) / 10;


    return {
        present,
        total,
        percentage
    };
}


function renderReports() {

    const month =
        document
            .getElementById("reportMonth")
            .value;


    const container =
        document.getElementById("reportsList");


    const students =
        data.students.filter(
            student => student.active
        );


    if (!students.length) {

        container.innerHTML = `
            <div class="empty">
                No students added yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        students.map(student => {

            const stats =
                getStudentAttendance(
                    student.id,
                    month
                );


            const eligible =
                stats.percentage >= 75;


            return `

                <div class="report-card">

                    <div class="report-top">

                        <div>

                            <div class="report-name">
                                ${escapeHTML(student.name)}
                            </div>

                            <div class="report-info">

                                🥋 ${escapeHTML(student.belt)}

                                ${
                                    student.grade
                                    ? " • " + escapeHTML(student.grade)
                                    : ""
                                }

                                <br>

                                ${stats.present}
                                / ${stats.total}
                                classes attended

                            </div>

                        </div>


                        <div class="report-percent">

                            <strong>
                                ${stats.percentage}%
                            </strong>


                            <div class="${
                                eligible
                                    ? "eligible"
                                    : "not-eligible"
                            }">

                                ${
                                    eligible
                                    ? "✓ BELT ELIGIBLE"
                                    : "✕ NOT ELIGIBLE"
                                }

                            </div>

                        </div>

                    </div>


                    <div class="progress">

                        <div
                            class="progress-bar"
                            style="width:${Math.min(
                                stats.percentage,
                                100
                            )}%">
                        </div>

                    </div>

                </div>

            `;

        }).join("");
}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

    const students =
        data.students.filter(
            student => student.active
        );


    const today =
        todayISO();


    const records =
        data.attendance[today] || {};


    let present = 0;
    let absent = 0;


    students.forEach(student => {

        if (
            records[student.id] === "present"
        ) {

            present++;

        }

        if (
            records[student.id] === "absent"
        ) {

            absent++;

        }

    });


    let pendingMoney = 0;


    students.forEach(student => {

        const monthlyKey =
            `monthly_${currentMonth()}_${student.id}`;


        if (
            data.fees[monthlyKey] !== "paid"
        ) {

            pendingMoney += 500;

        }


        if (!student.fees?.uniform) {
            pendingMoney += 800;
        }


        if (!student.fees?.admission) {
            pendingMoney += 800;
        }

    });


    document.getElementById("statStudents").textContent =
        students.length;

    document.getElementById("statPresent").textContent =
        present;

    document.getElementById("statAbsent").textContent =
        absent;

    document.getElementById("statPending").textContent =
        "₹" + pendingMoney;


    document.getElementById("homeDate").textContent =
        formatDate(today);


    const status =
        getClassStatus(today);


    const badge =
        document.getElementById("homeClassBadge");


    const content =
        document.getElementById("homeClass");


    if (status === "held") {

        badge.className =
            "badge green";

        badge.textContent =
            "CLASS";


        content.innerHTML = `

            <p style="color:#999;font-size:12px;margin-bottom:15px">
                Today's karate training is scheduled.
            </p>

            <button
                class="red-btn"
                onclick="showPage('attendance')">
                🥋 Mark Attendance →
            </button>

        `;

    }


    else if (status === "cancelled") {

        badge.className =
            "badge red";

        badge.textContent =
            "CANCELLED";


        content.innerHTML = `

            <p style="color:#999;font-size:12px">
                Today's class has been cancelled.
            </p>

        `;

    }


    else {

        badge.className =
            "badge gray";

        badge.textContent =
            "NO CLASS";


        content.innerHTML = `

            <p style="color:#999;font-size:12px">
                No regular class today.
            </p>

        `;

    }

}


/* =========================================================
   BACKUP
   ========================================================= */

function exportBackup() {

    const backup = {

        app: "DojoTrack",

        version: "V1",

        exportedAt:
            new Date().toISOString(),

        data: data

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    backup,
                    null,
                    2
                )
            ],
            {
                type: "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `DojoTrack_Backup_${todayISO()}.json`;


    link.click();


    URL.revokeObjectURL(url);


    toast("Backup exported");
}


function importBackup(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload = function() {

        try {

            const backup =
                JSON.parse(
                    reader.result
                );


            const imported =
                backup.data || backup;


            if (
                !imported.students ||
                !imported.attendance ||
                !imported.fees
            ) {

                throw new Error(
                    "Invalid backup"
                );

            }


            if (
                !confirm(
                    "Import this backup? Current local data will be replaced."
                )
            ) {

                return;

            }


            data = {

                students:
                    imported.students || [],

                attendance:
                    imported.attendance || {},

                classes:
                    imported.classes || {},

                fees:
                    imported.fees || {}

            };


            saveData();


            renderAll();


            toast("Backup restored successfully");

        } catch (error) {

            console.error(error);

            toast("Invalid backup file");

        }

    };


    reader.readAsText(file);

}


function clearAllData() {

    const first =
        confirm(
            "WARNING: Delete all DojoTrack data from this browser?"
        );


    if (!first) return;


    const second =
        confirm(
            "Are you absolutely sure? Make a backup first if needed."
        );


    if (!second) return;


    localStorage.removeItem(
        STORAGE_KEY
    );


    data =
        structuredClone(DEFAULT_DATA);


    renderAll();


    toast("All local data deleted");
}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function capitalize(value) {

    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value).slice(1);
}


function toast(message) {

    const element =
        document.getElementById("toast");


    element.textContent =
        message;


    element.classList.add("show");


    clearTimeout(
        window.dojoToastTimer
    );


    window.dojoToastTimer =
        setTimeout(() => {

            element.classList.remove("show");

        }, 2200);
}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderAll() {

    renderHome();
    renderStudents();
    renderAttendance();
    renderFees();
    renderReports();
}


/* =========================================================
   START
   ========================================================= */

renderAll();