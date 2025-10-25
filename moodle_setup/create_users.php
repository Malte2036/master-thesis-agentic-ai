<?php
/**
 * Custom script to create users from CSV using Moodle's core API
 * This script should be run from within the Moodle container
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
require_once($CFG->libdir . '/csvlib.class.php');
require_once($CFG->dirroot . '/user/lib.php');

// Function to create a user
function create_user_from_csv($data) {
    global $CFG, $DB;
    
    $user = new stdClass();
    $user->username = trim($data['username']);
    $user->firstname = trim($data['firstname']);
    $user->lastname = trim($data['lastname']);
    $user->email = trim($data['email']);
    $user->password = trim($data['password']);
    $user->auth = 'manual';
    $user->confirmed = 1;
    $user->mnethostid = $CFG->mnet_localhost_id;
    $user->lang = 'en';
    
    // Validate required fields
    if (empty($user->username) || empty($user->firstname) || empty($user->lastname) || empty($user->email)) {
        echo "Error: Username, firstname, lastname, and email are required\n";
        return false;
    }
    
    // Check if user already exists
    if ($existing = $DB->get_record('user', array('username' => $user->username))) {
        $existing_id = $existing->id;
        echo "User already exists: " . $user->username . " (ID: " . $existing_id . ")\n";
        return $existing_id;
    }
    
    // Check if email already exists
    if ($existing = $DB->get_record('user', array('email' => $user->email))) {
        $existing_id = $existing->id;
        echo "User with email already exists: " . $user->email . " (ID: " . $existing_id . ")\n";
        return $existing_id;
    }
    
    try {
        $userid = user_create_user($user, true, false);
        echo "Created user: " . $user->username . " (ID: " . $userid . ")\n";
        return $userid;
    } catch (Exception $e) {
        echo "Error creating user " . $user->username . ": " . $e->getMessage() . "\n";
        return false;
    }
}

// Main execution
$csvfile = '/tmp/users.csv';

if (!file_exists($csvfile)) {
    echo "CSV file not found: " . $csvfile . "\n";
    exit(1);
}

echo "Reading users from: " . $csvfile . "\n";

// Read CSV file
$csvdata = array();
if (($handle = fopen($csvfile, "r")) !== FALSE) {
    $header = fgetcsv($handle, 1000, ",");
    if (!$header) {
        echo "Error: Could not read CSV header\n";
        exit(1);
    }
    
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        if (count($data) == count($header)) {
            $csvdata[] = array_combine($header, $data);
        }
    }
    fclose($handle);
} else {
    echo "Error: Could not open CSV file\n";
    exit(1);
}

if (empty($csvdata)) {
    echo "No user data found in CSV file\n";
    exit(0);
}

echo "Found " . count($csvdata) . " users to create\n";

// Create users
$created = 0;
$errors = 0;

foreach ($csvdata as $userdata) {
    echo "Processing user: " . $userdata['username'] . "\n";
    if (create_user_from_csv($userdata)) {
        $created++;
    } else {
        $errors++;
    }
}

echo "User creation complete: " . $created . " created, " . $errors . " errors\n";
exit($errors > 0 ? 1 : 0);
?>
