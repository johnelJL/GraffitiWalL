const STORAGE_KEY = "graffiti-wall-notes";
const notesList = document.querySelector("#notes");
const emptyState = document.querySelector("#empty-state");
const form = document.querySelector("#note-form");
const clearButton = document.querySelector("#clear-wall");
const randomButton = document.querySelector("#random-message");
const noteTemplate = document.querySelector("#note-template");

const ideas = [
  "Share a win from today!",
  "Shout out someone who inspired you!",
  "What keeps you motivated?",
  "Describe your dream creative project.",
  "Leave an uplifting quote!",
  "What song is on repeat right now?",
];

/**
 * A single note displayed on the wall.
 * @typedef {Object} Note
 * @property {string} id - Unique note id
 * @property {string} author - Author of the note
 * @property {string} message - Message text
 * @property {string} color - Color theme slug
 * @property {string} createdAt - ISO timestamp
 * @property {number} likes - Number of likes
 * @property {boolean} liked - Whether the current user liked the note
 */

/**
 * Persist notes to localStorage.
 * @param {Note[]} notes
 */
function saveNotes(notes) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/**
 * Retrieve notes from localStorage.
 * @returns {Note[]}
 */
function loadNotes() {
  try {
    const notes = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(notes)) {
      return [];
    }
    return notes;
  } catch (error) {
    console.warn("Could not parse stored notes", error);
    return [];
  }
}

/**
 * Format a timestamp into a readable string.
 * @param {string} isoString
 * @returns {string}
 */
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Render the empty state if no notes exist.
 * @param {number} noteCount
 */
function toggleEmptyState(noteCount) {
  emptyState.hidden = noteCount > 0;
}

/**
 * Create the DOM representation for a note.
 * @param {Note} note
 * @returns {HTMLElement}
 */
function renderNote(note) {
  const noteNode = noteTemplate.content.firstElementChild.cloneNode(true);
  noteNode.dataset.color = note.color;
  noteNode.dataset.id = note.id;

  const author = noteNode.querySelector(".note__author");
  const message = noteNode.querySelector(".note__message");
  const timestamp = noteNode.querySelector(".note__timestamp");
  const likeButton = noteNode.querySelector(".note__like");
  const deleteButton = noteNode.querySelector(".note__delete");

  author.textContent = note.author || "Anonymous";
  message.textContent = note.message;
  timestamp.textContent = formatTimestamp(note.createdAt);
  timestamp.dateTime = note.createdAt;

  likeButton.setAttribute("aria-pressed", String(note.liked));
  likeButton.querySelector("span").textContent = String(note.likes);

  likeButton.addEventListener("click", () => {
    const notes = loadNotes();
    const index = notes.findIndex((storedNote) => storedNote.id === note.id);
    if (index === -1) return;

    const currentNote = notes[index];
    currentNote.liked = !currentNote.liked;
    currentNote.likes += currentNote.liked ? 1 : -1;
    notes[index] = currentNote;

    saveNotes(notes);
    likeButton.setAttribute("aria-pressed", String(currentNote.liked));
    likeButton.querySelector("span").textContent = String(currentNote.likes);
  });

  deleteButton.addEventListener("click", () => deleteNote(note.id));

  return noteNode;
}

/**
 * Paint all notes on the wall.
 */
function paintWall() {
  const notes = loadNotes().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  notesList.replaceChildren(...notes.map(renderNote));
  toggleEmptyState(notes.length);
}

/**
 * Remove a note from storage and repaint the wall.
 * @param {string} id
 */
function deleteNote(id) {
  const notes = loadNotes();
  const updated = notes.filter((note) => note.id !== id);
  saveNotes(updated);
  paintWall();
}

/**
 * Clear every note.
 */
function clearNotes() {
  if (loadNotes().length === 0) return;
  const confirmed = window.confirm("Clear the entire wall? This cannot be undone.");
  if (!confirmed) return;
  window.localStorage.removeItem(STORAGE_KEY);
  paintWall();
}

/**
 * Create a note from form values.
 * @param {FormData} formData
 * @returns {Note}
 */
function createNoteFromForm(formData) {
  const message = formData.get("message").toString().trim();
  if (!message) {
    throw new Error("Message is required");
  }
  const author = formData.get("author");
  const color = formData.get("color");
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    author: author ? author.toString().trim() : "",
    message,
    color: color ? color.toString() : "sunrise",
    createdAt: timestamp,
    likes: 0,
    liked: false,
  };
}

/**
 * Submit handler for new notes.
 * @param {SubmitEvent} event
 */
function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);

  try {
    const note = createNoteFromForm(formData);
    const notes = loadNotes();
    notes.push(note);
    saveNotes(notes);
    form.reset();
    paintWall();
  } catch (error) {
    window.alert(error.message);
  }
}

form.addEventListener("submit", handleSubmit);
clearButton.addEventListener("click", clearNotes);
randomButton.addEventListener("click", () => {
  const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
  document.querySelector("#message").value = randomIdea;
  document.querySelector("#message").focus();
});

document.addEventListener("DOMContentLoaded", paintWall);
