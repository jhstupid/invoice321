const storageKey = "billing-app-state";
const defaultState = {
  customer: {
    name: "",
    address: "",
    phone: "",
  },
  invoice: {
    date: "",
    number: "",
    paymentType: "COD",
  },
  items: [
    {
      barcode: "1078068",
      description: "Stripe Polo T-Shirt Size M",
      qty: 1,
      uom: "PCS",
      unitPrice: 2790,
      discount: 35,
    },
  ],
  vatRate: 10,
  shipping: 0,
  terms:
    "Items purchased can be exchanged within 7 days. Invoice & tag must be intact.",
};

const selectors = {
  customerName: document.getElementById("customerName"),
  customerAddress: document.getElementById("customerAddress"),
  customerPhone: document.getElementById("customerPhone"),
  invoiceDate: document.getElementById("invoiceDate"),
  invoiceNumber: document.getElementById("invoiceNumber"),
  paymentType: document.getElementById("paymentType"),
  itemsBody: document.getElementById("itemsBody"),
  addItem: document.getElementById("addItem"),
  vatRate: document.getElementById("vatRate"),
  shipping: document.getElementById("shipping"),
  terms: document.getElementById("terms"),
  amountWords: document.getElementById("amountWords"),
  subTotal: document.getElementById("subTotal"),
  vatAmount: document.getElementById("vatAmount"),
  shippingAmount: document.getElementById("shippingAmount"),
  total: document.getElementById("total"),
  due: document.getElementById("due"),
  newInvoice: document.getElementById("newInvoice"),
  printInvoice: document.getElementById("printInvoice"),
  downloadCsv: document.getElementById("downloadCsv"),
  exportJson: document.getElementById("exportJson"),
  importJson: document.getElementById("importJson"),
  clearStorage: document.getElementById("clearStorage"),
  onlineStatus: document.getElementById("onlineStatus"),
  saveStatus: document.getElementById("saveStatus"),
};

const state = loadState();

function loadState() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return structuredClone(defaultState);
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  selectors.saveStatus.textContent = `Last saved: ${new Date().toLocaleString()}`;
}

function syncHeader() {
  selectors.customerName.value = state.customer.name;
  selectors.customerAddress.value = state.customer.address;
  selectors.customerPhone.value = state.customer.phone;
  selectors.invoiceDate.value = state.invoice.date;
  selectors.invoiceNumber.value = state.invoice.number;
  selectors.paymentType.value = state.invoice.paymentType;
  selectors.vatRate.value = state.vatRate;
  selectors.shipping.value = state.shipping;
  selectors.terms.value = state.terms;
}

function buildRow(item, index) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${index + 1}</td>
    <td><input type="text" value="${item.barcode}" data-field="barcode" /></td>
    <td><input type="text" value="${item.description}" data-field="description" /></td>
    <td><input type="number" min="0" step="1" value="${item.qty}" data-field="qty" /></td>
    <td><input type="text" value="${item.uom}" data-field="uom" /></td>
    <td><input type="number" min="0" step="0.01" value="${item.unitPrice}" data-field="unitPrice" /></td>
    <td><input type="number" min="0" step="0.1" value="${item.discount}" data-field="discount" /></td>
    <td class="amount"></td>
    <td><button class="ghost" data-action="remove">Remove</button></td>
  `;

  row.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const field = target.dataset.field;
    if (!field) return;
    const value = target.type === "number" ? Number(target.value) : target.value;
    state.items[index][field] = value;
    updateTotals();
    saveState();
  });

  row.querySelector("button")?.addEventListener("click", () => {
    state.items.splice(index, 1);
    if (state.items.length === 0) {
      state.items.push({
        barcode: "",
        description: "",
        qty: 1,
        uom: "PCS",
        unitPrice: 0,
        discount: 0,
      });
    }
    renderItems();
    saveState();
  });

  return row;
}

function renderItems() {
  selectors.itemsBody.innerHTML = "";
  state.items.forEach((item, index) => {
    const row = buildRow(item, index);
    selectors.itemsBody.appendChild(row);
  });
  updateTotals();
}

function calculateLine(item) {
  const lineTotal = item.qty * item.unitPrice;
  const discountAmount = (lineTotal * item.discount) / 100;
  return lineTotal - discountAmount;
}

function updateTotals() {
  const amounts = state.items.map(calculateLine);
  const subTotal = amounts.reduce((sum, value) => sum + value, 0);
  const vatAmount = (subTotal * state.vatRate) / 100;
  const shipping = Number(state.shipping) || 0;
  const total = subTotal + vatAmount + shipping;

  selectors.itemsBody.querySelectorAll("tr").forEach((row, index) => {
    const cell = row.querySelector(".amount");
    if (cell) {
      cell.textContent = amounts[index].toFixed(2);
    }
  });

  selectors.subTotal.textContent = subTotal.toFixed(2);
  selectors.vatAmount.textContent = vatAmount.toFixed(2);
  selectors.shippingAmount.textContent = shipping.toFixed(2);
  selectors.total.textContent = total.toFixed(2);
  selectors.due.textContent = total.toFixed(2);
  selectors.amountWords.value = toWords(total);
}

function toWords(amount) {
  if (Number.isNaN(amount)) return "";
  const whole = Math.floor(amount);
  const fraction = Math.round((amount - whole) * 100);
  return `${numberToWords(whole)} taka and ${numberToWords(fraction)} paisa`;
}

function numberToWords(num) {
  const ones = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  if (num < 20) return ones[num];
  if (num < 100)
    return `${tens[Math.floor(num / 10)]}${num % 10 ? "-" + ones[num % 10] : ""}`;
  if (num < 1000)
    return `${ones[Math.floor(num / 100)]} hundred${
      num % 100 ? " " + numberToWords(num % 100) : ""
    }`;
  if (num < 1000000)
    return `${numberToWords(Math.floor(num / 1000))} thousand${
      num % 1000 ? " " + numberToWords(num % 1000) : ""
    }`;
  return `${numberToWords(Math.floor(num / 1000000))} million${
    num % 1000000 ? " " + numberToWords(num % 1000000) : ""
  }`;
}

function randomInvoiceNumber() {
  const prefix = new Date().getFullYear().toString().slice(-2);
  const number = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}${number}`;
}

function bindHeaderInputs() {
  selectors.customerName.addEventListener("input", (event) => {
    state.customer.name = event.target.value;
    saveState();
  });
  selectors.customerAddress.addEventListener("input", (event) => {
    state.customer.address = event.target.value;
    saveState();
  });
  selectors.customerPhone.addEventListener("input", (event) => {
    state.customer.phone = event.target.value;
    saveState();
  });
  selectors.invoiceDate.addEventListener("input", (event) => {
    state.invoice.date = event.target.value;
    saveState();
  });
  selectors.invoiceNumber.addEventListener("input", (event) => {
    state.invoice.number = event.target.value;
    saveState();
  });
  selectors.paymentType.addEventListener("change", (event) => {
    state.invoice.paymentType = event.target.value;
    saveState();
  });
  selectors.vatRate.addEventListener("input", (event) => {
    state.vatRate = Number(event.target.value);
    updateTotals();
    saveState();
  });
  selectors.shipping.addEventListener("input", (event) => {
    state.shipping = Number(event.target.value);
    updateTotals();
    saveState();
  });
  selectors.terms.addEventListener("input", (event) => {
    state.terms = event.target.value;
    saveState();
  });
}

function setupActions() {
  selectors.addItem.addEventListener("click", () => {
    state.items.push({
      barcode: "",
      description: "",
      qty: 1,
      uom: "PCS",
      unitPrice: 0,
      discount: 0,
    });
    renderItems();
    saveState();
  });

  selectors.newInvoice.addEventListener("click", () => {
    Object.assign(state, structuredClone(defaultState));
    state.invoice.date = new Date().toISOString().slice(0, 16);
    state.invoice.number = randomInvoiceNumber();
    syncHeader();
    renderItems();
    saveState();
  });

  selectors.printInvoice.addEventListener("click", () => {
    window.print();
  });

  selectors.downloadCsv.addEventListener("click", () => {
    const rows = [
      [
        "Barcode",
        "Description",
        "Qty",
        "UOM",
        "Unit Price",
        "Discount %",
        "Amount",
      ],
      ...state.items.map((item) => [
        item.barcode,
        item.description,
        item.qty,
        item.uom,
        item.unitPrice,
        item.discount,
        calculateLine(item).toFixed(2),
      ]),
    ];
    const csv = rows.map((row) => row.map(formatCsv).join(",")).join("\n");
    downloadFile("invoice.csv", csv, "text/csv");
  });

  selectors.exportJson.addEventListener("click", () => {
    downloadFile(
      "invoice.json",
      JSON.stringify(state, null, 2),
      "application/json"
    );
  });

  selectors.importJson.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((content) => {
      const imported = JSON.parse(content);
      Object.assign(state, imported);
      syncHeader();
      renderItems();
      saveState();
    });
  });

  selectors.clearStorage.addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    Object.assign(state, structuredClone(defaultState));
    syncHeader();
    renderItems();
    saveState();
  });
}

function formatCsv(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\"")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function updateOnlineStatus() {
  const online = navigator.onLine;
  selectors.onlineStatus.textContent = online ? "Online" : "Offline";
  selectors.onlineStatus.style.background = online ? "#b8f0c2" : "#ffd5d5";
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

function init() {
  if (!state.invoice.date) {
    state.invoice.date = new Date().toISOString().slice(0, 16);
  }
  if (!state.invoice.number) {
    state.invoice.number = randomInvoiceNumber();
  }
  syncHeader();
  bindHeaderInputs();
  setupActions();
  renderItems();
  updateOnlineStatus();
  registerServiceWorker();
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
}

init();
