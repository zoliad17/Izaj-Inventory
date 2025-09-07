#!/usr/bin/env node

/**
 * Quick Super Admin Creation Script
 * 
 * This script creates a super admin user with default credentials.
 * Usage: node create-superadmin-quick.js
 */

const bcrypt = require('bcrypt');
const { supabase } = require('../supabase.node.js');

// Default super admin credentials
const DEFAULT_CREDENTIALS = {
    name: 'Super Admin',
    email: 'admin@izaj.com',
    contact: null, // Contact can be null
    password: 'Admin123!@#'
};

async function createQuickSuperAdmin() {
    console.log('\n🚀 Creating Super Admin with Default Credentials\n');

    try {
        const { name, email, contact, password } = DEFAULT_CREDENTIALS;

        // Check if user already exists
        console.log('🔍 Checking if super admin already exists...');
        const { data: existingUser, error: checkError } = await supabase
            .from('user')
            .select('user_id, email')
            .eq('email', email)
            .maybeSingle();

        if (checkError) {
            console.log('❌ Error checking existing user:', checkError.message);
            process.exit(1);
        }

        if (existingUser) {
            console.log('✅ Super admin already exists!');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
            console.log(`   Contact: ${contact || 'Not provided'}`);
            console.log('\n🎉 You can log in with these credentials!');
            return;
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create super admin user
        console.log('👤 Creating super admin user...');
        const { data: newUser, error: createError } = await supabase
            .from('user')
            .insert([{
                name: name,
                email: email,
                password: hashedPassword,
                contact: contact,
                role_id: 1, // Super Admin role
                branch_id: null, // Super admin doesn't belong to a specific branch
                status: 'Active',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (createError) {
            console.log('❌ Error creating user:', createError.message);
            process.exit(1);
        }

        // Log the creation in audit logs
        console.log('📝 Logging creation in audit logs...');
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert([{
                user_id: newUser.user_id,
                action: 'USER_CREATED',
                description: `Super admin user ${newUser.name} (${newUser.email}) created via quick script`,
                entity_type: 'user',
                entity_id: newUser.user_id,
                metadata: {
                    created_by: 'system',
                    creation_method: 'quick_script',
                    user_role: 'Super Admin'
                },
                timestamp: new Date().toISOString()
            }]);

        if (auditError) {
            console.log('⚠️  Warning: Could not log creation in audit logs:', auditError.message);
        }

        console.log('\n✅ Super Admin created successfully!');
        console.log('📋 Default Credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Name: ${name}`);
        console.log(`   Contact: ${contact || 'Not provided'}`);
        console.log(`   Role: Super Admin`);
        console.log(`   Status: Active`);

        console.log('\n🎉 You can now log in with these credentials!');
        console.log('⚠️  IMPORTANT: Change the password after first login for security!');

    } catch (error) {
        console.log('❌ An error occurred:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    createQuickSuperAdmin();
}

module.exports = { createQuickSuperAdmin };
