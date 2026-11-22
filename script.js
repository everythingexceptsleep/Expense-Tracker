// Expense Tracker

let incomeCategories = ["Salary", "Pocket Money", "Freelance", "Gift", "Other"];
let expenseCategories = ["Food", "Travel", "Shopping", "Bills", "Education", "Entertainment", "Health", "Other"];

let transactions = [];

// get old data from localStorage
let saved = localStorage.getItem("transactions");
if (saved != null) {
    transactions = JSON.parse(saved);
}

function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// shows categories according to income or expense
function loadCategories() {
    let type = document.getElementById("type").value;
    let list;
    if (type == "income") {
        list = incomeCategories;
    } else {
        list = expenseCategories;
    }

    let options = "";
    for (let i = 0; i < list.length; i++) {
        options += "<option>" + list[i] + "</option>";
    }
    document.getElementById("category").innerHTML = options;
}

// all categories in the filter dropdown ("Other" comes only once)
function loadFilterCategories() {
    let all = incomeCategories.concat(expenseCategories);
    let options = "<option value='all'>All Categories</option>";
    for (let i = 0; i < all.length; i++) {
        if (all.indexOf(all[i]) == i) {
            options += "<option>" + all[i] + "</option>";
        }
    }
    document.getElementById("filterCategory").innerHTML = options;
}

// 1500 -> ₹1,500
function money(n) {
    if (n < 0) {
        return "-₹" + (-n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    }
    return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// 2026-11-22 -> 22-11-2026
function formatDate(d) {
    let parts = d.split("-");
    return parts[2] + "-" + parts[1] + "-" + parts[0];
}

function showMsg(text, color) {
    let msg = document.getElementById("msg");
    msg.innerHTML = text;
    msg.style.color = color;
    setTimeout(function () {
        msg.innerHTML = "";
    }, 2500);
}

function addTransaction() {
    let type = document.getElementById("type").value;
    let desc = document.getElementById("desc").value.trim();
    let amount = parseFloat(document.getElementById("amount").value);
    let category = document.getElementById("category").value;
    let date = document.getElementById("date").value;

    if (desc == "") {
        showMsg("Please enter a description", "red");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showMsg("Please enter a valid amount", "red");
        return;
    }
    if (date == "") {
        showMsg("Please select the date", "red");
        return;
    }

    let t = {
        id: Date.now(),      // current time in ms, works as a unique id
        type: type,
        desc: desc,
        amount: amount,
        category: category,
        date: date
    };

    transactions.push(t);
    saveData();
    showAll();

    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";
    showMsg("Transaction added!", "green");
}

function deleteTransaction(id) {
    if (!confirm("Delete this transaction?")) {
        return;
    }
    let newList = [];
    for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].id != id) {
            newList.push(transactions[i]);
        }
    }
    transactions = newList;
    saveData();
    showAll();
}

function clearAll() {
    if (transactions.length == 0) {
        return;
    }
    if (confirm("This will delete all transactions. Are you sure?")) {
        transactions = [];
        saveData();
        showAll();
    }
}

function updateSummary() {
    let income = 0;
    let expense = 0;

    for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].type == "income") {
            income = income + transactions[i].amount;
        } else {
            expense = expense + transactions[i].amount;
        }
    }
    let balance = income - expense;

    document.getElementById("totalIncome").innerHTML = money(income);
    document.getElementById("totalExpense").innerHTML = money(expense);
    document.getElementById("balance").innerHTML = money(balance);

    // red balance card if spent more than earned
    if (balance < 0) {
        document.getElementById("balanceCard").classList.add("negative");
    } else {
        document.getElementById("balanceCard").classList.remove("negative");
    }
}

function showTransactions() {
    let filterType = document.getElementById("filterType").value;
    let filterCategory = document.getElementById("filterCategory").value;

    // copy of the array so original order is not changed
    let list = transactions.slice();

    // newest date on top
    list.sort(function (a, b) {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return b.id - a.id;
    });

    let rows = "";
    let count = 0;
    for (let i = 0; i < list.length; i++) {
        let t = list[i];

        if (filterType != "all" && t.type != filterType) continue;
        if (filterCategory != "all" && t.category != filterCategory) continue;

        let amountText;
        if (t.type == "income") {
            amountText = "<span class='plus'>+ " + money(t.amount) + "</span>";
        } else {
            amountText = "<span class='minus'>- " + money(t.amount) + "</span>";
        }

        rows += "<tr>" +
            "<td>" + formatDate(t.date) + "</td>" +
            "<td>" + t.desc + "</td>" +
            "<td>" + t.category + "</td>" +
            "<td><span class='tag " + t.type + "'>" + t.type + "</span></td>" +
            "<td>" + amountText + "</td>" +
            "<td><button class='del-btn' title='Delete' onclick='deleteTransaction(" + t.id + ")'>&#10005;</button></td>" +
            "</tr>";
        count++;
    }

    document.getElementById("list").innerHTML = rows;

    if (transactions.length == 0) {
        document.getElementById("emptyMsg").innerHTML = "No transactions yet. Add your first one!";
    } else if (count == 0) {
        document.getElementById("emptyMsg").innerHTML = "No transactions match this filter.";
    } else {
        document.getElementById("emptyMsg").innerHTML = "";
    }
}

// how much money spent in each category
function showCategoryTotals() {
    let totals = {};
    let totalExpense = 0;

    for (let i = 0; i < transactions.length; i++) {
        let t = transactions[i];
        if (t.type == "expense") {
            if (totals[t.category] == undefined) {
                totals[t.category] = 0;
            }
            totals[t.category] += t.amount;
            totalExpense += t.amount;
        }
    }

    if (totalExpense == 0) {
        document.getElementById("categoryList").innerHTML = "<p class='empty'>No expenses added yet.</p>";
        return;
    }

    // make an array so we can sort biggest first
    let arr = [];
    for (let cat in totals) {
        arr.push({ name: cat, amount: totals[cat] });
    }
    arr.sort(function (a, b) {
        return b.amount - a.amount;
    });

    let html = "";
    for (let i = 0; i < arr.length; i++) {
        let percent = (arr[i].amount / totalExpense) * 100;
        html += "<div class='cat-item'>" +
            "<div class='cat-top'><span>" + arr[i].name + "</span><span>" + money(arr[i].amount) + " (" + percent.toFixed(1) + "%)</span></div>" +
            "<div class='bar'><div class='fill' style='width:" + percent + "%'></div></div>" +
            "</div>";
    }
    document.getElementById("categoryList").innerHTML = html;
}

function showAll() {
    updateSummary();
    showTransactions();
    showCategoryTotals();
}


// when page opens
loadCategories();
loadFilterCategories();

// today's date in the date box
let today = new Date();
let mm = String(today.getMonth() + 1).padStart(2, "0");
let dd = String(today.getDate()).padStart(2, "0");
document.getElementById("date").value = today.getFullYear() + "-" + mm + "-" + dd;

showAll();
