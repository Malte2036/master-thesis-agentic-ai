<?php
/**
 * Custom script to set up web services in Moodle
 * This script should be run from within the Moodle container
 * 
 * Based on: https://docs.moodle.org/en/Using_web_services
 */

// Define CLI_SCRIPT before including config.php (Moodle requirement)
define('CLI_SCRIPT', true);

// Change to Moodle's directory
chdir('/var/www/html');

// Ensure we're running from Moodle's directory
if (!file_exists('config.php')) {
    die("Error: This script must be run from within Moodle's directory\n");
}

// Include Moodle's configuration and libraries
require_once('config.php');
require_once($CFG->dirroot . '/webservice/lib.php');
require_once($CFG->dirroot . '/lib/externallib.php');

echo "========================================\n";
echo "Moodle Web Services Setup Script\n";
echo "========================================\n\n";

// Step 1: Enable web services
echo "Step 1: Enabling web services...\n";
set_config('enablewebservices', 1);
// Verify it was set
$enabled = get_config('core', 'enablewebservices');
if ($enabled) {
    echo "✓ Web services enabled (verified: $enabled)\n\n";
} else {
    echo "✗ FAILED to enable web services!\n\n";
    exit(1);
}

// Step 2: Enable REST protocol
echo "Step 2: Enabling REST protocol...\n";
$availableprotocols = core_component::get_plugin_list('webservice');
if (array_key_exists('rest', $availableprotocols)) {
    // Set REST as an active protocol
    set_config('webserviceprotocols', 'rest');
    // Verify it was set
    $protocols = get_config('core', 'webserviceprotocols');
    if (strpos($protocols, 'rest') !== false) {
        echo "✓ REST protocol enabled (verified: $protocols)\n\n";
    } else {
        echo "✗ FAILED to enable REST protocol!\n\n";
        exit(1);
    }
} else {
    echo "✗ REST protocol not available\n\n";
    exit(1);
}

// Step 3: Enable web service documentation
echo "Step 3: Enabling web service documentation...\n";
set_config('enablewsdocumentation', 1);
echo "✓ Web service documentation enabled\n\n";

// Step 4: Create custom external service
echo "Step 4: Creating custom external service...\n";
$webservicemanager = new webservice();

$servicename = 'Custom REST API';
$serviceshortname = 'custom_rest_api';

// Check if service already exists
$existing_service = $DB->get_record('external_services', array('name' => $servicename));
if (!$existing_service) {
    $service = new stdClass();
    $service->name = $servicename;
    $service->shortname = $serviceshortname;
    $service->enabled = 1;
    $service->restrictedusers = 0; // Allow all users with appropriate permissions
    $service->downloadfiles = 1;
    $service->uploadfiles = 1;
    $service->timecreated = time();
    $service->timemodified = time();
    
    $serviceid = $DB->insert_record('external_services', $service);
    echo "✓ Created service: $servicename (ID: $serviceid)\n\n";
} else {
    $serviceid = $existing_service->id;
    echo "✓ Service already exists: $servicename (ID: $serviceid)\n\n";
}

// Step 5: Add functions to the service
echo "Step 5: Adding functions to the service...\n";

// List of functions from README.md
$functions = array(
    'mod_assign_get_assignments',
    'core_course_get_courses',
    'core_course_get_contents',
    'core_enrol_get_users_courses',
    'core_user_get_users',
    'core_webservice_get_site_info',
    'core_course_search_courses',
    'mod_page_get_pages_by_courses',
);

foreach ($functions as $functionname) {
    // Check if function exists
    $function = $DB->get_record('external_functions', array('name' => $functionname));
    if (!$function) {
        echo "  ✗ Function not found: $functionname\n";
        continue;
    }
    
    // Check if function is already added to service
    $existing = $DB->get_record('external_services_functions', array(
        'externalserviceid' => $serviceid,
        'functionname' => $functionname
    ));
    
    if (!$existing) {
        $service_function = new stdClass();
        $service_function->externalserviceid = $serviceid;
        $service_function->functionname = $functionname;
        
        try {
            $DB->insert_record('external_services_functions', $service_function);
            echo "  ✓ Added function: $functionname\n";
        } catch (Exception $e) {
            echo "  ✗ Error adding function $functionname: " . $e->getMessage() . "\n";
        }
    } else {
        echo "  ○ Function already added: $functionname\n";
    }
}
echo "\n";

// Step 6: Assign capabilities to roles
echo "Step 6: Assigning web service capabilities...\n";

// Get the authenticated user role
$authrole = $DB->get_record('role', array('shortname' => 'user'));
if (!$authrole) {
    echo "  ✗ Authenticated user role not found\n";
} else {
    $systemcontext = context_system::instance();
    
    // Capabilities to assign
    $capabilities = array(
        'moodle/webservice:createtoken' => CAP_ALLOW,
        'webservice/rest:use' => CAP_ALLOW,
    );
    
    foreach ($capabilities as $capability => $permission) {
        // Check if capability exists
        if (!$DB->record_exists('capabilities', array('name' => $capability))) {
            echo "  ✗ Capability not found: $capability\n";
            continue;
        }
        
        // Check if already assigned
        $existing = $DB->get_record('role_capabilities', array(
            'roleid' => $authrole->id,
            'capability' => $capability,
            'contextid' => $systemcontext->id
        ));
        
        if (!$existing) {
            try {
                assign_capability($capability, $permission, $authrole->id, $systemcontext->id, true);
                echo "  ✓ Assigned capability: $capability to role: {$authrole->shortname}\n";
            } catch (Exception $e) {
                echo "  ✗ Error assigning capability $capability: " . $e->getMessage() . "\n";
            }
        } else {
            echo "  ○ Capability already assigned: $capability\n";
        }
    }
}
echo "\n";


// Step 7: Final verification
echo "Step 7: Final verification of settings...\n";
$ws_enabled = get_config('core', 'enablewebservices');
$protocols = get_config('core', 'webserviceprotocols');
$rest_enabled = (strpos($protocols, 'rest') !== false);
echo "  - Web Services Enabled: " . ($ws_enabled ? 'YES' : 'NO') . "\n";
echo "  - REST Protocol Enabled: " . ($rest_enabled ? 'YES' : 'NO') . " (protocols: $protocols)\n";

if (!$ws_enabled || !$rest_enabled) {
    echo "\n✗ CRITICAL: Web services or REST protocol not properly enabled!\n";
    echo "This will cause 403 errors when accessing the API.\n\n";
    exit(1);
}
echo "✓ All settings verified successfully\n\n";

// Step 9: Display summary
echo "========================================\n";
echo "Web Services Setup Complete!\n";
echo "========================================\n\n";

echo "Configuration Summary:\n";
echo "- Web Services: Enabled (verified)\n";
echo "- REST Protocol: Enabled (verified)\n";
echo "- Service Name: $servicename\n";
echo "- Service ID: $serviceid\n";
echo "- Functions Added: " . count($functions) . "\n";
echo "\n";

echo "API Endpoint:\n";
echo "- URL: http://localhost:8080/webservice/rest/server.php\n";
echo "\n";

echo "To use the API:\n";
echo "1. Get your token from: http://localhost:8080/user/security.php\n";
echo "2. Make requests to: http://localhost:8080/webservice/rest/server.php\n";
echo "3. Include parameters: wstoken=YOUR_TOKEN&wsfunction=FUNCTION_NAME&moodlewsrestformat=json\n";
echo "\n";

echo "Example API call:\n";
echo "curl -X POST 'http://localhost:8080/webservice/rest/server.php' \\\n";
echo "  -d 'wstoken=YOUR_TOKEN' \\\n";
echo "  -d 'wsfunction=core_webservice_get_site_info' \\\n";
echo "  -d 'moodlewsrestformat=json'\n";
echo "\n";

// Display all tokens
echo "Available Tokens:\n";
$tokens = $DB->get_records_sql(
    "SELECT t.token, u.username, s.name as servicename
     FROM {external_tokens} t
     JOIN {user} u ON t.userid = u.id
     JOIN {external_services} s ON t.externalserviceid = s.id
     WHERE s.id = ?
     ORDER BY u.username",
    array($serviceid)
);

foreach ($tokens as $token) {
    echo "- User: {$token->username}, Service: {$token->servicename}\n";
    echo "  Token: {$token->token}\n";
}
echo "\n";

exit(0);
?>

