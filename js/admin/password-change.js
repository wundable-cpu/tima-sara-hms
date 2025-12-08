// ===================================================================
// PASSWORD CHANGE SYSTEM
// Allows users to change their password
// ===================================================================

/**
 * Show password change modal
 */
function showPasswordChangeModal() {
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    // Create modal HTML
    const modalHTML = `
        <div id="password-change-modal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Change Password</h2>
                    <span class="close" onclick="closePasswordModal()">&times;</span>
                </div>
                
                <div class="modal-body">
                    <form id="password-change-form" onsubmit="handlePasswordChange(event)">
                        <div class="form-group">
                            <label>Current User:</label>
                            <input type="text" value="${currentUser.full_name || currentUser.name}" disabled>
                            <small>${currentUser.email}</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="current-password">Current Password *</label>
                            <input type="password" id="current-password" required 
                                   placeholder="Enter your current password">
                        </div>
                        
                        <div class="form-group">
                            <label for="new-password">New Password *</label>
                            <input type="password" id="new-password" required 
                                   minlength="6" placeholder="At least 6 characters">
                            <small>Password must be at least 6 characters</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirm-password">Confirm New Password *</label>
                            <input type="password" id="confirm-password" required 
                                   placeholder="Re-enter new password">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-key"></i> Change Password
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="closePasswordModal()">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Close password change modal
 */
function closePasswordModal() {
    const modal = document.getElementById('password-change-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Handle password change form submission
 */
async function handlePasswordChange(event) {
    event.preventDefault();
    
    const currentUser = JSON.parse(localStorage.getItem('hms_user'));
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    if (newPassword !== confirmPassword) {
        alert('Error: New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Error: Password must be at least 6 characters!');
        return;
    }
    
    if (newPassword === currentPassword) {
        alert('Error: New password must be different from current password!');
        return;
    }
    
    try {
        // Get Supabase client
        if (!supabaseClient) {
            supabaseClient = await getSupabaseClient();
        }
        
        // Verify current password
        const { data: user, error: verifyError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('email', currentUser.email)
            .single();
        
        if (verifyError || !user) {
            throw new Error('User not found');
        }
        
        if (user.password !== currentPassword) {
            throw new Error('Current password is incorrect!');
        }
        
        // Update password
        const { error: updateError } = await supabaseClient
            .from('admin_users')
            .update({ password: newPassword })
            .eq('email', currentUser.email);
        
        if (updateError) {
            throw updateError;
        }
        
        // Success!
        alert('✅ Password changed successfully!\n\nPlease log in again with your new password.');
        
        // Close modal
        closePasswordModal();
        
        // Log out and redirect to login
        localStorage.removeItem('hms_user');
        window.location.href = 'admin-login.html';
        
    } catch (error) {
        console.error('Password change error:', error);
        alert('Error changing password: ' + error.message);
    }
}

/**
 * Add "Change Password" button to user menu/profile
 */
function addPasswordChangeButton() {
    // Look for user menu or settings area
    const userMenus = document.querySelectorAll('.user-menu, .user-dropdown, .profile-menu');
    
    userMenus.forEach(menu => {
        // Check if button already exists
        if (menu.querySelector('.change-password-btn')) {
            return;
        }
        
        // Add change password button
        const button = document.createElement('button');
        button.className = 'change-password-btn';
        button.innerHTML = '<i class="fas fa-key"></i> Change Password';
        button.onclick = showPasswordChangeModal;
        
        menu.appendChild(button);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    addPasswordChangeButton();
});

// Make functions globally available
window.showPasswordChangeModal = showPasswordChangeModal;
window.closePasswordModal = closePasswordModal;
window.handlePasswordChange = handlePasswordChange;