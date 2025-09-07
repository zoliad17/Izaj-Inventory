const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchema() {
    try {
        console.log('Reading schema file...');
        const schemaPath = path.join(__dirname, '../../../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema to database...');

        // Split the schema into individual statements
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    const { error } = await supabase.rpc('exec_sql', { sql: statement });
                    if (error) {
                        console.warn(`Warning on statement ${i + 1}:`, error.message);
                    }
                } catch (err) {
                    console.warn(`Warning on statement ${i + 1}:`, err.message);
                }
            }
        }

        console.log('Schema application completed!');

        // Test the views
        console.log('Testing audit trail view...');
        const { data: auditData, error: auditError } = await supabase
            .from('audit_trail_overview')
            .select('*')
            .limit(1);

        if (auditError) {
            console.error('Audit trail view test failed:', auditError.message);
        } else {
            console.log('Audit trail view is working!');
        }

    } catch (error) {
        console.error('Error applying schema:', error);
        process.exit(1);
    }
}

applySchema();
