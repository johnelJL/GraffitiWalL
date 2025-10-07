const form = document.getElementById("join-form");

if (!form) {
  // If the form is missing we have nothing to wire up; bail early so the
  // browser can fall back to the default behaviour.
  console.warn("Join form not found; skipping enhanced validation.");
} else {
  form.setAttribute("novalidate", "novalidate");
}

const errorEls = form
  ? new Map(
      Array.from(form.querySelectorAll(".field__error")).map((el) => [
        el.dataset.errorFor,
        el,
      ])
    )
  : new Map();
const termsCheckbox = form
  ? form.querySelector("input[name='terms']")
  : null;

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
  if (!form) {
    return;
  }
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

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const termsAccepted = termsCheckbox ? termsCheckbox.checked : false;

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

    form.elements.name.value = name;
    form.elements.email.value = email;

    form.submit();
  });
}

restoreIdentity();
