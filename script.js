document.addEventListener('DOMContentLoaded', () => {
    const signInBtn = document.getElementById('signInBtn');
    const registerBtn = document.getElementById('registerBtn');
    const exploreEbooksBtn = document.getElementById('exploreEbooksBtn');

    signInBtn.addEventListener('click', () => {
        alert('Sign In button clicked!');
        // In a real app, you would redirect to a sign-in page or open a modal
        // window.location.href = 'signin.html';
    });

    registerBtn.addEventListener('click', () => {
        alert('Register button clicked!');
        // In a real app, you would redirect to a registration page or open a modal
        // window.location.href = 'register.html';
    });

    exploreEbooksBtn.addEventListener('click', () => {
        alert('Explore Ebooks button clicked!');
        // In a real app, you would redirect to the ebook listing page
        window.location.href = 'explore.html'; // We'll create this next!
    });
});
