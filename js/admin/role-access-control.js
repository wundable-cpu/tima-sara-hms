// ===================================================================
// ROLE-BASED ACCESS CONTROL SYSTEM - DEBUG VERSION
// Restricts access to pages based on user role
// ===================================================================

console.log('🔐 ROLE ACCESS CONTROL LOADED');

/**
 * PAGE ACCESS RULES
 * Define which roles can access which pages
 */
const PAGE_ACCESS = {
    // Admin & Supervisor - Full Access
    'admin-dashboard.html': ['admin', 'manager', 'supervisor', 'front_desk', 'restaurant', 'housekeeping'],
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
 * Check if current user has access to current page
 */
function checkPageAccess() {
    console.log('🔍 === CHECKING PAGE ACCESS ===');
    
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        console.warn('⚠️ No user logged in - redirecting to login');
        window.location.href = 'admin-login.html';
        return false;
    }
    
    console.log('👤 Current user:', currentUser.name, '| Role:', currentUser.role);
    
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop();
    console.log('📄 Current page:', currentPage);
    
    // Login page is always accessible
    if (currentPage === 'admin-login.html') {
        console.log('✅ Login page - access granted');
        return true;
    }
    
    // Check if page has access restrictions
    const allowedRoles = PAGE_ACCESS[currentPage];
    console.log('🔐 Page restrictions:', allowedRoles || 'None (unrestricted)');
    
    if (!allowedRoles) {
        // Page not in list - allow by default (for new pages)
        console.log('ℹ️ Page not in access list - allowing access by default');
        return true;
    }
    
    // Check if user's role is allowed
    const hasAccess = allowedRoles.includes(currentUser.role);
    console.log('🎯 User role in allowed list?', hasAccess);
    
    if (hasAccess) {
        console.log('✅ ACCESS GRANTED:', currentPage, 'for role:', currentUser.role);
        return true;
    }
    
    // Access denied!
    console.warn('❌ ACCESS DENIED:', currentPage, 'for role:', currentUser.role);
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
    console.log('🔍 === FILTERING MENU ===');
    
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        console.log('⚠️ No user - skipping menu filter');
        return;
    }
    
    const userRole = currentUser.role;
    console.log('👤 Filtering menu for role:', userRole);
    
    // Admin, Manager, Supervisor see everything
    if (userRole === 'admin' || userRole === 'manager' || userRole === 'supervisor') {
        console.log('✅ FULL ACCESS ROLE - Showing all menu items');
        console.log('   (Admin, Manager, Supervisor see everything)');
        return;
    }
    
    console.log('🔒 LIMITED ACCESS ROLE - Filtering menu...');
    
    // Find all menu links with multiple selectors
    const selectors = [
        '.sidebar a',
        '.menu a', 
        'nav a', 
        '.menu-item a',
        '.nav-link',
        '.sidebar-link',
        'aside a'
    ];
    
    const allLinks = document.querySelectorAll(selectors.join(', '));
    console.log('📋 Total menu links found:', allLinks.length);
    
    if (allLinks.length === 0) {
        console.warn('⚠️ NO MENU LINKS FOUND! Check your HTML selectors.');
        console.log('💡 Try inspecting your menu HTML and updating selectors.');
        return;
    }
    
    let totalLinks = 0;
    let hiddenLinks = 0;
    let visibleLinks = 0;
    
    allLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (!href) {
            console.log(`   Link ${index + 1}: No href - skipping`);
            return;
        }
        
        totalLinks++;
        
        // Get just the filename
        const filename = href.split('/').pop().split('?')[0].split('#')[0];
        
        // Skip empty hrefs or anchors
        if (!filename || filename === '#' || filename === '') {
            console.log(`   Link ${index + 1}: Empty/anchor link - skipping`);
            return;
        }
        
        // Check if this page has restrictions
        const pageHasRestrictions = PAGE_ACCESS[filename];
        
        if (!pageHasRestrictions) {
            // No restrictions - show it
            console.log(`   Link ${index + 1}: ${filename} - NO RESTRICTIONS (visible)`);
            visibleLinks++;
            return;
        }
        
        // Check if user can access this page
        const userCanAccess = pageHasRestrictions.includes(userRole);
        
        if (userCanAccess) {
            console.log(`   Link ${index + 1}: ${filename} - ALLOWED (visible)`);
            visibleLinks++;
        } else {
            console.log(`   Link ${index + 1}: ${filename} - DENIED (hiding)`);
            
            // Hide the link
            link.style.display = 'none';
            
            // Hide parent elements
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.style.display = 'none';
            }
            
            const parentMenuItem = link.closest('.menu-item');
            if (parentMenuItem) {
                parentMenuItem.style.display = 'none';
            }
            
            hiddenLinks++;
        }
    });
    
    console.log('📊 MENU FILTERING SUMMARY:');
    console.log('   Total links processed:', totalLinks);
    console.log('   Visible links:', visibleLinks);
    console.log('   Hidden links:', hiddenLinks);
    console.log('✅ Menu filtering complete');
}

/**
 * Initialize access control on page load
 */
function initializeAccessControl() {
    console.log('🚀 === INITIALIZING ACCESS CONTROL ===');
    
    // Check page access first
    const hasAccess = checkPageAccess();
    
    if (hasAccess) {
        // Wait a moment for menu to load, then filter
        setTimeout(() => {
            filterMenuByRole();
        }, 100);
    }
    
    console.log('✅ Access control initialization complete');
    console.log('═══════════════════════════════════════\n');
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializeAccessControl);

// Also run immediately if DOM already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAccessControl);
} else {
    initializeAccessControl();
}