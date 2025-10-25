<?php
/**
 * Custom script to create courses from CSV using Moodle's core API
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
require_once($CFG->dirroot . '/course/lib.php');

// Function to create a course
function create_course_from_csv($data) {
    global $CFG, $DB;
    
    $course = new stdClass();
    $course->shortname = trim($data['shortname']);
    $course->fullname = trim($data['fullname']);
    $course->category = (int)$data['category'];
    $course->summary = trim($data['summary']);
    $course->idnumber = trim($data['idnumber']);
    $course->visible = (int)$data['visible'];
    $course->format = 'topics'; // Default format
    $course->numsections = 0;
    $course->startdate = time();
    $course->enddate = 0;
    
    // Validate required fields
    if (empty($course->shortname) || empty($course->fullname)) {
        echo "Error: Course shortname and fullname are required\n";
        return false;
    }
    
    // Check if course already exists
    if ($existing = $DB->get_record('course', array('shortname' => $course->shortname))) {
        $existing_id = $existing->id;
        echo "Course already exists: " . $course->shortname . " (ID: " . $existing_id . ")\n";
        return $existing_id;
    }
    
    try {
        $newcourse = create_course($course);
        // create_course returns the full course object, not just the ID
        if (is_object($newcourse) && isset($newcourse->id)) {
            $courseid = $newcourse->id;
        } else {
            $courseid = $newcourse; // In case it's just an ID
        }
        echo "Created course: " . $course->shortname . " (ID: " . $courseid . ")\n";
        return $courseid;
    } catch (Exception $e) {
        echo "Error creating course " . $course->shortname . ": " . $e->getMessage() . "\n";
        return false;
    }
}

// Main execution
$csvfile = '/tmp/courses.csv';

if (!file_exists($csvfile)) {
    echo "CSV file not found: {$csvfile}\n";
    exit(1);
}

echo "Reading courses from: {$csvfile}\n";

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
    echo "No course data found in CSV file\n";
    exit(0);
}

echo "Found " . count($csvdata) . " courses to create\n";

// Create courses
$created = 0;
$errors = 0;

foreach ($csvdata as $coursedata) {
    echo "Processing course: " . $coursedata['shortname'] . "\n";
    if (create_course_from_csv($coursedata)) {
        $created++;
    } else {
        $errors++;
    }
}

echo "Course creation complete: " . $created . " created, " . $errors . " errors\n";
exit($errors > 0 ? 1 : 0);
?>
