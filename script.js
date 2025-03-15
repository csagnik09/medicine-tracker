document.addEventListener("DOMContentLoaded", loadHistory);

function logCustomMedicine() {
    let medicineName = document.getElementById("medicineNameInput").value;
    let customTime = document.getElementById("manualTime").value;
    let remark = document.getElementById("remarkInput").value;
    let oldEntryDate = document.getElementById("dateInput").value;

    if (!medicineName || !customTime) {
        alert("Please provide both medicine name and time before logging.");
        return;
    }

    let date = new Date().toLocaleDateString('en-CA'); // Ensure consistent format (YYYY-MM-DD)
    
    if (document.getElementById("oldEntryCheckbox").checked && oldEntryDate) {
        date = oldEntryDate;
    }

    let formattedTime = formatTimeWithAMPM(customTime);

    let newEntry = {
        medicineName: medicineName,
        timeSlot: formattedTime,
        loggedAt: date,
        remark: remark
    };

    let history = JSON.parse(localStorage.getItem("medicineHistory")) || [];
    
    // Allow multiple records for the same medicine on the same date
    history.push(newEntry);
    localStorage.setItem("medicineHistory", JSON.stringify(history));
    loadHistory();

    document.getElementById("medicineNameInput").value = "";
    document.getElementById("manualTime").value = "";
    document.getElementById("remarkInput").value = "";
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem("medicineHistory")) || [];
    let historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    history.sort((a, b) => {
        let dateA = new Date(a.loggedAt);
        let dateB = new Date(b.loggedAt);
        if (dateA !== dateB) return dateA - dateB;
        
        let timeA = convertTimeToMinutes(a.timeSlot);
        let timeB = convertTimeToMinutes(b.timeSlot);
        return timeA - timeB;
    });

    history.forEach((entry, index) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${entry.medicineName}</td>
            <td>${entry.timeSlot}</td>
            <td>${entry.loggedAt}</td>
            <td>${entry.remark}</td>
            <td><button class="delete-btn" onclick="deleteEntry(${index})">Delete</button></td>
        `;
        historyList.appendChild(row);
    });
}

function convertTimeToMinutes(time) {
    let [hour, minute] = time.split(":").map(num => parseInt(num));
    let period = time.includes("PM") ? 1 : 0;

    if (period === 1 && hour < 12) hour += 12;
    if (period === 0 && hour === 12) hour = 0;

    return hour * 60 + minute;
}

function deleteEntry(index) {
    if (window.confirm("Are you sure you want to delete this entry?")) {
        let history = JSON.parse(localStorage.getItem("medicineHistory"));
        history.splice(index, 1);
        localStorage.setItem("medicineHistory", JSON.stringify(history));
        loadHistory();
    }
}

function resetApp() {
    if (window.confirm("Are you sure you want to clear all data?")) {
        localStorage.removeItem("medicineHistory");
        loadHistory();
    }
}

function toggleDateInput() {
    let dateInput = document.getElementById("dateInput");
    dateInput.style.display = document.getElementById("oldEntryCheckbox").checked ? "block" : "none";
}

function exportToExcel() {
    let history = JSON.parse(localStorage.getItem("medicineHistory")) || [];
    let ws = XLSX.utils.json_to_sheet(history);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicine History");
    XLSX.writeFile(wb, "MedicineHistory.xlsx");
}

function importFromExcel(event) {
    let file = event.target.files[0];
    let reader = new FileReader();

    reader.onload = function(e) {
        let data = e.target.result;
        if (file.name.endsWith(".csv")) {
            Papa.parse(data, {
                complete: function(results) {
                    let importedData = results.data;
                    processImportedData(importedData);
                },
                header: true
            });
        } else if (file.name.endsWith(".xlsx")) {
            let workbook = XLSX.read(data, { type: "binary" });
            let sheet = workbook.Sheets[workbook.SheetNames[0]];
            let jsonData = XLSX.utils.sheet_to_json(sheet);
            processImportedData(jsonData);
        } else {
            alert("Please import a valid CSV or Excel file.");
        }
    };

    reader.readAsBinaryString(file);
}

function processImportedData(importedData) {
    let history = JSON.parse(localStorage.getItem("medicineHistory")) || [];
    importedData.forEach(entry => {
        if (entry.medicineName && entry.loggedAt) {
            let formattedDate = new Date(entry.loggedAt).toLocaleDateString('en-CA');
            entry.loggedAt = formattedDate;

            if (entry.timeSlot) {
                entry.timeSlot = entry.timeSlot.trim();
            }
            history.push(entry);
        }
    });

    localStorage.setItem("medicineHistory", JSON.stringify(history));
    loadHistory();
}

function formatTimeWithAMPM(time) {
    let [hour, minute] = time.split(":").map(num => parseInt(num));
    let period = hour >= 12 ? "PM" : "AM";

    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    return `${hour}:${minute < 10 ? "0" + minute : minute} ${period}`;
}
