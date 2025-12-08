// ===================================================================
// ROLE-BASED ACCESS CONTROL SYSTEM
// Restricts access to pages based on user role
// ===================================================================

/**
 * PAGE ACCESS RULES
 * Define which roles can access which pages
 */
const PAGE_ACCESS = {
    // Admin & Supervisor - Full Access
    'admin-dashboard.html': ['admin', 'manager', 'supervisor'],
    'admin-analytics.html': ['admin', 'manager', 'supervisor'],
    'admin-reports.html': ['admin', 'manager', 'supervisor'],
    'admin-settings.html': ['admin'], // Only admin
    
    // Reservations
    'admin-reservations.html': ['admin', 'manager', 'supervisor', 'front_desk'],
    'admin-reservations-calendar.html': ['admin', 'manager', 'supervisor', 'front_desk'],
    
    // Guests
    'admin-guests.html': ['admin', 'manager', 'supervisor', 'front_desk'],
    
    // Rooms
    'admin-rooms.html': ['admin', 'manager', 'supervisor', 'front_desk', 'housekeeping'],
    
    // Housekeeping
    'admin-housekeeping.html': ['admin', 'manager', 'supervisor', 'housekeeping'],
    
    // Restaurant & Bar
    'admin-menu.html': ['admin', 'manager', 'supervisor', 'restaurant'],
    'admin-pos.html': ['admin', 'manager', 'supervisor', 'restaurant'],
    
    // Communications
    'admin-communications.html': ['admin', 'manager', 'supervisor', 'front_desk'],
    'admin-sms.html': ['admin', 'manager', 'supervisor', 'front_desk'],
    'admin-whatsapp.html': ['admin', 'manager', 'supervisor', 'front_desk'],
    
    // Invoices
    'admin-invoices.html': ['admin', 'manager', 'supervisor', 'front_desk'],
    
    // Maintenance
    'admin-maintenance.html': ['admin', 'manager', 'supervisor', 'housekeeping'],
};

/**
 * MENU ITEMS BY ROLE
 * Define which menu items each role should see
 */
const ROLE_MENUS = {
    'admin': 'all', // Admin sees everything
    'manager': 'all', // Manager sees everything
    'supervisor': 'all', // Supervisor sees everything
    
    'front_desk': [
        'admin-dashboard.html',
        'admin-reservations.html',
        'admin-reservations-calendar.html',
        'admin-guests.html',
        'admin-rooms.html',
        'admin-invoices.html',
        'admin-communications.html',
        'admin-sms.html',
        'admin-whatsapp.html'
    ],
    
    'restaurant': [
        'admin-dashboard.html',
        'admin-menu.html',
        'admin-pos.html',
        'admin-analytics.html'
    ],
    
    'housekeeping': [
        'admin-dashboard.html',
        'admin-housekeeping.html',
        'admin-rooms.html',
        'admin-maintenance.html'
    ]
};

/**
 * Check if current user has access to current page
 */
function checkPageAccess() {
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        console.warn('⚠️ No user logged in - redirecting to login');
        window.location.href = 'admin-login.html';
        return false;
    }
    
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop();
    
    // Login page is always accessible
    if (currentPage === 'admin-login.html') {
        return true;
    }
    
    // Check if page has access restrictions
    const allowedRoles = PAGE_ACCESS[currentPage];
    
    if (!allowedRoles) {
        // Page not in list - allow by default (for new pages)
        console.log('ℹ️ Page not in access list - allowing access');
        return true;
    }
    
    // Check if user's role is allowed
    if (allowedRoles.includes(currentUser.role)) {
        console.log('✅ Access granted:', currentPage, 'for role:', currentUser.role);
        return true;
    }
    
    // Access denied!
    console.warn('❌ Access denied:', currentPage, 'for role:', currentUser.role);
    alert(`Access Denied!\n\nYou don't have permission to access this page.\n\nRole: ${currentUser.role}\nPage: ${currentPage}`);
    
    // Log out and redirect to login page
    localStorage.removeItem('hms_user');
    window.location.href = 'admin-login.html';
    return false;
}

/**
 * Filter menu items based on user role
 */
function filterMenuByRole() {
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        return;
    }
    
    const userRole = currentUser.role;
    const allowedPages = ROLE_MENUS[userRole];
    
    // If role has access to all, don't filter
    if (allowedPages === 'all') {
        console.log('✅ Role has full access - showing all menu items');
        return;
    }
    
    // If role not in ROLE_MENUS, don't filter (allow all by default)
    if (!allowedPages) {
        console.log('⚠️ Role not in ROLE_MENUS - showing all menu items by default');
        return;
    }
    
    // Find all menu links
    const menuLinks = document.querySelectorAll('.sidebar a, .menu a, nav a, .menu-item a');
    
    let hiddenCount = 0;
    
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Get just the filename
        const filename = href.split('/').pop().split('?')[0]; // Remove query params too
        
        // Skip empty hrefs or anchors
        if (!filename || filename === '#') return;
        
        // Check if this page is in PAGE_ACCESS (has restrictions)
        const pageHasRestrictions = PAGE_ACCESS[filename];
        
        if (!pageHasRestrictions) {
            // Page not in access list - allow by default
            return;
        }
        
        // Check if user's role is allowed for this page
        const userCanAccess = pageHasRestrictions.includes(userRole);
        
        if (!userCanAccess) {
            // User cannot access - hide this menu item
            link.style.display = 'none';
            
            // Also hide parent li if it exists
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.style.display = 'none';
            }
            
            // Hide parent menu-item if it exists
            const parentMenuItem = link.closest('.menu-item');
            if (parentMenuItem) {
                parentMenuItem.style.display = 'none';
            }
            
            hiddenCount++;
            console.log('🚫 Hiding menu item:', filename, 'for role:', userRole);
        }
    });
    
    console.log('✅ Menu filtered for role:', userRole, '- Hidden', hiddenCount, 'items');
}

/**
 * Initialize access control on page load
 */
function initializeAccessControl() {
    console.log('🔐 Initializing role-based access control...');
    
    // Check page access
    const hasAccess = checkPageAccess();
    
    if (hasAccess) {
        // Filter menu items
        filterMenuByRole();
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializeAccessControl);

// Also run immediately if DOM already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAccessControl);
} else {
    initializeAccessControl();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkPageAccess, filterMenuByRole };
}