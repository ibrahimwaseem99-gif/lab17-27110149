const form = document.querySelector("#split-form");
const billInput = document.querySelector("#bill-amount");
const serviceChargeInput = document.querySelector("#service-charge");
const peopleInput = document.querySelector("#people-count");
const result = document.querySelector("#result");
const originalAmount = document.querySelector("#original-amount");
const serviceChargeLabel = document.querySelector("#service-charge-label");
const serviceChargeAmount = document.querySelector("#service-charge-amount");
const finalTotal = document.querySelector("#final-total");
const shareAmount = document.querySelector("#share-amount");
const splitDetail = document.querySelector("#split-detail");
const formError = document.querySelector("#form-error");

function clearError() {
  formError.textContent = "";
  formError.hidden = true;
  billInput.removeAttribute("aria-invalid");
  serviceChargeInput.removeAttribute("aria-invalid");
  peopleInput.removeAttribute("aria-invalid");
}

function showError(input, message) {
  clearError();
  input.setAttribute("aria-invalid", "true");
  formError.textContent = message;
  formError.hidden = false;
  input.focus();
}

function parsePaisa(value) {
  const normalized = String(value).trim();
  if (!normalized) return null;

  const match = normalized.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const rupees = BigInt(match[1]);
  const fraction = (match[2] || "").padEnd(2, "0");
  return rupees * 100n + BigInt(fraction);
}

function formatPaisa(paisa) {
  const rupees = paisa / 100n;
  const remainder = paisa % 100n;
  return `PKR ${rupees}.${remainder.toString().padStart(2, "0")}`;
}

function formatPercent(hundredths) {
  const whole = hundredths / 100n;
  const fraction = hundredths % 100n;
  return `${whole}.${fraction.toString().padStart(2, "0")}%`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError();

  const billValue = billInput.value.trim();
  if (!billValue) {
    showError(billInput, "Enter a bill amount.");
    return;
  }

  if (billValue.startsWith("-")) {
    showError(billInput, "Bill amount cannot be negative.");
    return;
  }

  const totalPaisa = parsePaisa(billValue);
  const serviceChargeValue = serviceChargeInput.value.trim();
  const serviceChargeHundredths = serviceChargeValue
    ? parsePaisa(serviceChargeValue)
    : 0n;
  const people = Number(peopleInput.value);

  if (totalPaisa === null) {
    showError(billInput, "Enter a valid amount with up to two decimal places.");
    return;
  }

  if (serviceChargeValue.startsWith("-")) {
    showError(serviceChargeInput, "Service charge cannot be negative.");
    return;
  }

  if (serviceChargeHundredths === null) {
    showError(serviceChargeInput, "Enter a valid service charge with up to two decimal places.");
    return;
  }

  if (
    !peopleInput.value.trim() ||
    !Number.isInteger(people) ||
    people < 1 ||
    people > 100
  ) {
    const message = peopleInput.value.trim() !== "" && people === 0
      ? "Enter at least one person to split the bill."
      : "Enter a whole number of people from 1 to 100.";
    showError(peopleInput, message);
    return;
  }

  const serviceChargePaisa =
    (totalPaisa * serviceChargeHundredths + 5000n) / 10000n;
  const finalTotalPaisa = totalPaisa + serviceChargePaisa;
  const peopleBigInt = BigInt(people);
  const baseShare = finalTotalPaisa / peopleBigInt;
  const remainder = finalTotalPaisa % peopleBigInt;
  const higherShare = baseShare + (remainder > 0n ? 1n : 0n);

  originalAmount.textContent = formatPaisa(totalPaisa);
  serviceChargeLabel.textContent =
    `Service charge (${formatPercent(serviceChargeHundredths)})`;
  serviceChargeAmount.textContent = formatPaisa(serviceChargePaisa);
  finalTotal.textContent = formatPaisa(finalTotalPaisa);
  shareAmount.textContent = formatPaisa(baseShare);

  if (remainder === 0n) {
    splitDetail.textContent =
      `Split equally among ${people} ${people === 1 ? "person" : "people"} ` +
      `for ${formatPaisa(finalTotalPaisa)} total.`;
  } else {
    const lowerCount = peopleBigInt - remainder;
    const higherVerb = remainder === 1n ? "pays" : "pay";
    const lowerVerb = lowerCount === 1n ? "pays" : "pay";
    splitDetail.textContent =
      `${remainder} ${remainder === 1n ? "person" : "people"} ${higherVerb} ` +
      `${formatPaisa(higherShare)} and ${lowerCount} ` +
      `${lowerCount === 1n ? "person" : "people"} ${lowerVerb} ` +
      `${formatPaisa(baseShare)}.`;
  }

  result.hidden = false;
});

form.addEventListener("reset", () => {
  clearError();
  result.hidden = true;
  originalAmount.textContent = "PKR 0.00";
  serviceChargeLabel.textContent = "Service charge (0.00%)";
  serviceChargeAmount.textContent = "PKR 0.00";
  finalTotal.textContent = "PKR 0.00";
  shareAmount.textContent = "PKR 0.00";
  splitDetail.textContent = "";
});

for (const input of [billInput, serviceChargeInput, peopleInput]) {
  input.addEventListener("input", () => {
    clearError();
    result.hidden = true;
  });
}
