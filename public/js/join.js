const form = document.getElementById("join-form");
const errorEls = new Map(
  Array.from(document.querySelectorAll(".field__error")).map((el) => [
    el.dataset.errorFor,
    el,
  ])
);

function showError(field, message) {
  const errorEl = errorEls.get(field);
  if (errorEl) {
    errorEl.textContent = message;
  }
}

function clearErrors() {
  for (const el of errorEls.values()) {
    el.textContent = "";
  }
}

function persistIdentity(name, email) {
  try {
    window.localStorage.setItem(
      "graffiti-wall-identity",
      JSON.stringify({ name, email })
    );
  } catch (error) {
    // Ignore storage errors
  }
}

function restoreIdentity() {
  try {
    const stored = window.localStorage.getItem("graffiti-wall-identity");
    if (!stored) return;
    const { name, email } = JSON.parse(stored);
    if (name) {
      form.elements.name.value = name;
    }
    if (email) {
      form.elements.email.value = email;
    }
  } catch (error) {
    // Ignore parse errors
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const termsAccepted = form.elements.terms.checked;

  let hasError = false;

  if (!name) {
    showError("name", "Please enter your name.");
    hasError = true;
  }

  if (!email) {
    showError("email", "Please provide an email address.");
    hasError = true;
  }

  if (!termsAccepted) {
    showError("terms", "You need to agree to the guidelines before joining.");
    hasError = true;
  }

  if (hasError) {
    return;
  }

  persistIdentity(name, email);

  const params = new URLSearchParams({ name, email });
  window.location.href = `/paint?${params.toString()}`;
});

restoreIdentity();
