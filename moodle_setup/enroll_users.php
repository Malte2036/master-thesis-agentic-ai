<?php
/**
 * Custom script to enroll users in courses from CSV using Moodle's core API
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
require_once($CFG->libdir . '/enrollib.php');
require_once($CFG->dirroot . '/enrol/manual/locallib.php');

// Function to enroll a user in a course
function enroll_user_in_course($data) {
    global $CFG, $DB;
    
    $username = trim($data['username']);
    $courseshortname = trim($data['course_shortname']);
    $roleshortname = isset($data['role']) ? trim($data['role']) : 'student';
    
    // Validate required fields
    if (empty($username) || empty($courseshortname)) {
        echo "Error: Username and course_shortname are required\n";
        return false;
    }
    
    // Get user
    $user = $DB->get_record('user', array('username' => $username));
    if (!$user) {
        echo "Error: User not found: " . $username . "\n";
        return false;
    }
    
    // Get course
    $course = $DB->get_record('course', array('shortname' => $courseshortname));
    if (!$course) {
        echo "Error: Course not found: " . $courseshortname . "\n";
        return false;
    }
    
    // Get role
    $role = $DB->get_record('role', array('shortname' => $roleshortname));
    if (!$role) {
        echo "Error: Role not found: " . $roleshortname . "\n";
        return false;
    }
    
    // Get manual enrolment plugin instance
    $enrol = $DB->get_record('enrol', array('courseid' => $course->id, 'enrol' => 'manual'));
    if (!$enrol) {
        // Create manual enrolment instance if it doesn't exist
        $plugin = enrol_get_plugin('manual');
        if ($plugin) {
            $instanceid = $plugin->add_instance($course);
            $enrol = $DB->get_record('enrol', array('id' => $instanceid));
        } else {
            echo "Error: Manual enrolment plugin not available\n";
            return false;
        }
    }
    
    // Check if already enrolled
    $context = context_course::instance($course->id);
    if (is_enrolled($context, $user->id)) {
        echo "User already enrolled: " . $username . " in " . $courseshortname . "\n";
        return true;
    }
    
    try {
        // Enrol user
        $plugin = enrol_get_plugin('manual');
        $plugin->enrol_user($enrol, $user->id, $role->id, 0, 0);
        echo "Enrolled user: " . $username . " in course: " . $courseshortname . " as " . $roleshortname . "\n";
        return true;
    } catch (Exception $e) {
        echo "Error enrolling user " . $username . ": " . $e->getMessage() . "\n";
        return false;
    }
}

// Main execution
$csvfile = '/tmp/enrollments.csv';

if (!file_exists($csvfile)) {
    echo "CSV file not found: " . $csvfile . "\n";
    exit(1);
}

echo "Reading enrollments from: " . $csvfile . "\n";

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
    echo "No enrollment data found in CSV file\n";
    exit(0);
}

echo "Found " . count($csvdata) . " enrollments to process\n";

// Process enrollments
$enrolled = 0;
$errors = 0;

foreach ($csvdata as $enrollmentdata) {
    echo "Processing enrollment: " . $enrollmentdata['username'] . " -> " . $enrollmentdata['course_shortname'] . "\n";
    if (enroll_user_in_course($enrollmentdata)) {
        $enrolled++;
    } else {
        $errors++;
    }
}

echo "Enrollment complete: " . $enrolled . " enrolled, " . $errors . " errors\n";
exit($errors > 0 ? 1 : 0);
?>
