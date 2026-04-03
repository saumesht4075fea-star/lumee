document.getElementById('year').textContent = new Date().getFullYear();

let loadedEbooks = []; // This array will hold ebooks fetched from Firestore for filtering
let currentActiveSection = 'home'; // Track the currently active section

// Function to save and restore active section
function saveActiveSection(sectionId) {
localStorage.setItem('activeSection', sectionId);
currentActiveSection = sectionId;
}

function restoreActiveSection() {
const savedSection = localStorage.getItem('activeSection');
if (savedSection && document.getElementById(savedSection)) {
showSection(savedSection);
} else {
showSection('home');
}
}

// Function to generate a product card HTML
function createProductCard(book, id) {
return `
<article class="card" onclick="showEbookDetail('${id}')">
<img src="${book.coverImageUrl}" alt="${book.title} cover">
<div class="card-body">
<h3>${book.title}</h3>
<div class="author">by ${book.author}</div>
<div class="price">₹${book.price.toFixed(2)}</div>
</div>
</article>`;
}

// Function to load products into a given list element
function loadProducts(elementId, booksToLoad) {
const productList = document.getElementById(elementId);
if (productList) {
productList.innerHTML = booksToLoad.map(book => createProductCard(book.data, book.id)).join('');
if (booksToLoad.length === 0) {
productList.innerHTML = '<p style="text-align:center;color:var(--muted);">No ebooks found.</p>';
}
}
}

// Show specific section and hide others, plus save state
const originalShowSection = function(sectionId) { // Renamed for clarity
document.querySelectorAll('.page-section').forEach(section => {
section.classList.remove('active');
});
const targetSection = document.getElementById(sectionId);
if (targetSection) {
targetSection.classList.add('active');
saveActiveSection(sectionId); // Save the active section
}

closeModal('signin-modal');
closeModal('register-modal');

// Re-fetch ebooks if navigating to relevant sections
if (sectionId === 'books' || sectionId === 'home') {
fetchEbooks();
const searchInput = document.getElementById('searchInput');
if (searchInput) {
searchInput.value = '';
filterBooks(); // Apply filter after fetching
}
}

// Update admin panel visibility based on sign-in status
updateAdminPanelVisibility(window.auth.currentUser, sectionId);
};

// Global showSection variable, allowing it to be overridden for back button logic
window.showSection = function(sectionId) {
if (currentActiveSection!== sectionId) { // Only update if actually changing sections
window.previousSectionId = currentActiveSection; // Use window to make it truly global
}
originalShowSection(sectionId);
};

// NEW: Function to navigate to ebook detail page
function showEbookDetail(ebookId) {
const ebook = loadedEbooks.find(b => b.id === ebookId);
if (!ebook) {
console.error("Ebook not found:", ebookId);
showSection('books'); // Fallback to books section
return;
}

const bookData = ebook.data;
const detailSection = document.getElementById('ebook-detail');

document.getElementById('ebook-detail-cover-img').src = bookData.coverImageUrl;
document.getElementById('ebook-detail-cover-img').alt = `${bookData.title} cover`;
document.getElementById('ebook-detail-title').textContent = bookData.title;
document.getElementById('ebook-detail-author').textContent = `by ${bookData.author}`;
document.getElementById('ebook-detail-price').textContent = `₹${bookData.price.toFixed(2)}`;
document.getElementById('ebook-detail-description').textContent = bookData.description || 'No description available.';

const buyButton = document.getElementById('ebook-detail-buy-btn');
if (bookData.downloadUrl) {
buyButton.href = bookData.downloadUrl;
buyButton.style.display = 'inline-block';
} else {
buyButton.removeAttribute('href');
buyButton.style.display = 'none';
}

// Load related books
loadAuthorBooks(bookData.author, ebookId);
loadSimilarBooks(ebookId); // Simplified for now

showSection('ebook-detail');
}

// NEW: Go back functionality
window.previousSectionId = 'home'; // Default previous section, now global

function goBackToPreviousSection() {
showSection(window.previousSectionId);
}

// Close Modal - improved to only close on overlay or actual close button
function closeModal(modalId, event = null){
const modalElement = document.getElementById(modalId);
if (!modalElement) return;

if (event) {
const clickedElement = event.target;
// Check if clicked element is the modal overlay itself or a close button
if (clickedElement === modalElement || clickedElement.closest('.close-btn')) {
modalElement.classList.remove('active');
}
} else {
modalElement.classList.remove('active');
}
}

// Function to filter books based on search input
function filterBooks() {
const searchTerm = document.getElementById('searchInput').value.toLowerCase();
const filteredEbooks = loadedEbooks.filter(ebook =>
ebook.data.title.toLowerCase().includes(searchTerm) ||
ebook.data.author.toLowerCase().includes(searchTerm)
);
loadProducts('all-books-list', filteredEbooks);
}

// NEW: Load books by the same author
function loadAuthorBooks(author, currentEbookId) {
const authorBooks = loadedEbooks.filter(ebook =>
ebook.data.author === author && ebook.id!== currentEbookId
);
loadProducts('author-books-list', authorBooks);
}

// NEW: Load similar books (simplified for now, could be improved with tags/categories)
function loadSimilarBooks(currentEbookId) {
// Get a few random books that are not the current one or by the same author
const similarBooks = loadedEbooks.filter(ebook => ebook.id!== currentEbookId)
.sort(() => 0.5 - Math.random()) // Randomize order
.slice(0, 3); // Take top 3
loadProducts('similar-books-list', similarBooks);
}

// Fetch Ebooks from Firestore
async function fetchEbooks() {
const homepageList = document.getElementById('homepage-ebook-list');
const allBooksList = document.getElementById('all-books-list');
if (homepageList) homepageList.innerHTML = '<p>Loading featured ebooks...</p>';
if (allBooksList) allBooksList.innerHTML = '<p>Loading all ebooks...</p>';

try {
const ebooksCollection = window.firestoreCollection(window.db, 'books');
const q = window.firestoreQuery(ebooksCollection, window.firestoreOrderBy('createdAt', 'desc'));
const querySnapshot = await window.firestoreGetDocs(q);

loadedEbooks = [];
querySnapshot.forEach((doc) => {
loadedEbooks.push({ id: doc.id, data: doc.data() });
});

if (loadedEbooks.length === 0) {
if (homepageList) homepageList.innerHTML = '<p>No featured ebooks available yet.</p>';
if (allBooksList) allBooksList.innerHTML = '<p>No ebooks available yet.</p>';
} else {
loadProducts('homepage-ebook-list', loadedEbooks.slice(0, 3));
loadProducts('all-books-list', loadedEbooks);
}
} catch (error) {
console.error("Error fetching ebooks:", error);
if (homepageList) homepageList.innerHTML = `<p style="color:var(--error-red);">Error loading featured ebooks: ${error.message}</p>`;
if (allBooksList) allBooksList.innerHTML = `<p style="color:var(--error-red);">Error loading all ebooks: ${error.message}</p>`;
}
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
fetchEbooks();
restoreActiveSection(); // Restore previous section
updateAuthControls(window.auth.currentUser); // Initial auth control setup
});

// *******************************************************************
// Firebase Authentication JavaScript Logic
// *******************************************************************

// NEW: Open Sign In Modal
function openSignInModal() {
document.getElementById('signInForm').reset();
document.getElementById('signInError').style.display = 'none';
document.getElementById('signin-modal').classList.add('active');
}

// NEW: Open Register Modal
function openRegisterModal() {
document.getElementById('registerForm').reset();
document.getElementById('registerError').style.display = 'none';
document.getElementById('register-modal').classList.add('active');
}

// Helper to toggle admin panel visibility
function updateAdminPanelVisibility(user, currentSection) {
const adminPanelContainer = document.getElementById('admin-panel-container');
const adminNavLink = document.getElementById('adminNavLink');

if (user && user.email) { // Check if user is logged in
adminNavLink.style.display = 'inline-block'; // Show admin link in navbar
if (currentSection === 'admin') {
adminPanelContainer.style.display = 'block'; // Show admin panel content if on admin section
} else {
adminPanelContainer.style.display = 'none'; // Hide if not on admin section
}
} else {
adminNavLink.style.display = 'none'; // Hide admin link
adminPanelContainer.style.display = 'none'; // Hide admin panel content
// If user was on admin section and logs out, redirect to home
if (currentSection === 'admin') {
showSection('home');
}
}
}

// NEW: Update Auth Controls in Navbar (with dropdown)
function updateAuthControls(user = null) {
const authControls = document.getElementById('authControls');

if (user) {
const username = user.email.split('@')[0];
authControls.innerHTML = `
<div class="user-profile-dropdown">
<button class="dropdown-toggle">Hello, ${username}</button>
<div class="dropdown-menu">
<a onclick="signOutUser()">Sign Out</a>
</div>
</div>
`;
// Update admin panel visibility immediately after auth controls
updateAdminPanelVisibility(user, currentActiveSection);

} else {
authControls.innerHTML = `
<button onclick="openSignInModal()">Sign In</button>
<button onclick="openRegisterModal()">Register</button>
`;
// Update admin panel visibility immediately after auth controls
updateAdminPanelVisibility(user, currentActiveSection);
}
}

// Handle Sign In form submission
document.getElementById('signInForm').addEventListener('submit', async (e) => {
e.preventDefault();
const email = document.getElementById('signInEmail').value;
const password = document.getElementById('signInPassword').value;
const signInError = document.getElementById('signInError');
signInError.style.display = 'none';

try {
const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
console.log('User signed in:', userCredential.user);
closeModal('signin-modal');
alert(`Welcome back, ${userCredential.user.email}! You are now signed in.`);
// onAuthStateChanged will handle updateAuthControls
} catch (error) {
console.error('Sign In error:', error.message);
let errorMessage = 'An unknown error occurred.';
if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
errorMessage = 'Invalid email or password.';
} else if (error.code === 'auth/invalid-email') {
errorMessage = 'Please enter a valid email address.';
}
signInError.textContent = errorMessage;
signInError.style.display = 'block';
}
});

// Handle Register form submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
e.preventDefault();
const email = document.getElementById('registerEmail').value;
const password = document.getElementById('registerPassword').value;
const registerError = document.getElementById('registerError');
registerError.style.display = 'none';

try {
const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
console.log('User registered:', userCredential.user);
closeModal('register-modal');
alert(`Welcome, ${userCredential.user.email}! You are now registered and signed in.`);
// onAuthStateChanged will handle updateAuthControls
} catch (error) {
console.error('Registration error:', error.message);
let errorMessage = 'An unknown error occurred.';
if (error.code === 'auth/email-already-in-use') {
errorMessage = 'This email is already in use. Try signing in.';
} else if (error.code === 'auth/invalid-email') {
errorMessage = 'Please enter a valid email address.';
} else if (error.code === 'auth/weak-password') {
errorMessage = 'Password should be at least 6 characters.';
}
registerError.textContent = errorMessage;
registerError.style.display = 'block';
}
});

// Check auth state changes (e.g., when page loads or user signs in/out)
window.onAuthStateChanged(window.auth, (user) => {
updateAuthControls(user);
// The admin panel visibility is handled within updateAuthControls now,
// which also calls updateAdminPanelVisibility.
});

// Function to handle sign out
async function signOutUser() {
try {
await window.signOut(window.auth);
alert("You have been signed out.");
} catch (error) {
console.error('Sign out error:', error.message);
alert('Error signing out: ' + error.message);
}
}
