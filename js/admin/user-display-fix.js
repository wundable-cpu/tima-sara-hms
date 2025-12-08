// ===================================================================
// DYNAMIC USER DISPLAY - Shows Logged-in User's Name & Role
// Add this to ALL admin pages (or to admin-script.js)
// ===================================================================

/**
 * Updates user display elements with logged-in user's info
 * Call this when page loads
 */
function updateUserDisplay() {
    // Get logged-in user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        console.warn('⚠️ No user logged in');
        window.location.href = 'admin-login.html';
        return;
    }
    
    console.log('👤 Current user:', currentUser);
    
    // Format role for display (convert front_desk to Front Desk)
    const roleFormatted = currentUser.role
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // ============================================
    // UPDATE ALL POSSIBLE USER DISPLAY ELEMENTS
    // ============================================
    
    // 1. User name only (e.g., in header)
    const userNameElements = document.querySelectorAll('.user-name, #user-name, #userName');
    userNameElements.forEach(el => {
        el.textContent = currentUser.full_name || currentUser.name;
    });
    
    // 2. Welcome message (e.g., "Welcome Winner Gafli")
    const welcomeElements = document.querySelectorAll('.welcome-user, #welcome-user, #welcomeUser');
    welcomeElements.forEach(el => {
        el.textContent = `Welcome ${currentUser.full_name || currentUser.name}`;
    });
    
    // 3. Name with role (e.g., "Winner Gafli (Manager)")
    const nameRoleElements = document.querySelectorAll('.user-name-role, #user-name-role');
    nameRoleElements.forEach(el => {
        el.textContent = `${currentUser.full_name || currentUser.name} (${roleFormatted})`;
    });
    
    // 4. Role only
    const roleElements = document.querySelectorAll('.user-role, #user-role, #userRole');
    roleElements.forEach(el => {
        el.textContent = roleFormatted;
    });
    
    // 5. Email
    const emailElements = document.querySelectorAll('.user-email, #user-email, #userEmail');
    emailElements.forEach(el => {
        el.textContent = currentUser.email;
    });
    
    // 6. Phone (if exists)
    if (currentUser.phone) {
        const phoneElements = document.querySelectorAll('.user-phone, #user-phone');
        phoneElements.forEach(el => {
            el.textContent = currentUser.phone;
        });
    }
    
    // 7. Profile initials (for avatar circles)
    const initialsElements = document.querySelectorAll('.user-initials, #user-initials');
    initialsElements.forEach(el => {
        const name = currentUser.full_name || currentUser.name;
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        el.textContent = initials;
    });
    
    console.log('✅ User display updated:', currentUser.full_name || currentUser.name, `(${roleFormatted})`);
}

/**
 * Initialize user display on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 Initializing user display...');
    updateUserDisplay();
});

// Also update immediately if script loads after DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUserDisplay);
} else {
    updateUserDisplay();
}