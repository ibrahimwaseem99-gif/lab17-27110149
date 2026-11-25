const form = document.querySelector("#split-form");
const billInput = document.querySelector("#bill-amount");
const peopleInput = document.querySelector("#people-count");
const result = document.querySelector("#result");
const shareAmount = document.querySelector("#share-amount");
const splitDetail = document.querySelector("#split-detail");
const formError = document.querySelector("#form-error");

function clearError() {
  formError.textContent = "";
  formError.hidden = true;
  billInput.removeAttribute("aria-invalid");
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
  const people = Number(peopleInput.value);

  if (totalPaisa === null) {
    showError(billInput, "Enter a valid amount with up to two decimal places.");
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

  const peopleBigInt = BigInt(people);
  const baseShare = totalPaisa / peopleBigInt;
  const remainder = totalPaisa % peopleBigInt;
  const higherShare = baseShare + (remainder > 0n ? 1n : 0n);

  shareAmount.textContent = formatPaisa(baseShare);

  if (remainder === 0n) {
    splitDetail.textContent =
      `Split equally among ${people} ${people === 1 ? "person" : "people"} ` +
      `for ${formatPaisa(totalPaisa)} total.`;
  } else {
    const lowerCount = peopleBigInt - remainder;
    splitDetail.textContent =
      `${remainder} ${remainder === 1n ? "person" : "people"} pay ` +
      `${formatPaisa(higherShare)} and ${lowerCount} ` +
      `${lowerCount === 1n ? "person" : "people"} pay ${formatPaisa(baseShare)}.`;
  }

  result.hidden = false;
});

form.addEventListener("reset", () => {
  clearError();
  result.hidden = true;
  shareAmount.textContent = "PKR 0.00";
  splitDetail.textContent = "";
});

for (const input of [billInput, peopleInput]) {
  input.addEventListener("input", () => {
    clearError();
    result.hidden = true;
  });
}
