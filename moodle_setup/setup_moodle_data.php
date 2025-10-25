<?php
/**
 * Unified Moodle Data Setup Script
 * 
 * This script reads a JSON configuration file and sets up:
 * - Users
 * - Courses (with sections)
 * - Enrollments
 * - Forums (discussion boards)
 * - Pages (informational content)
 * - URLs (external resources)
 * - Assignments
 * - Blocks (HTML, calendar, timeline, etc.)
 * 
 * Usage: Run from within Moodle container
 * php setup_moodle_data.php [path/to/moodle-data.json]
 */

// Define CLI_SCRIPT before including config.php
define('CLI_SCRIPT', true);

// Change to Moodle's directory
chdir('/var/www/html');

if (!file_exists('config.php')) {
    die("Error: This script must be run from within Moodle's directory\n");
}

// Include Moodle's configuration and libraries
require_once('config.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->libdir . '/enrollib.php');
require_once($CFG->dirroot . '/enrol/manual/locallib.php');
require_once($CFG->dirroot . '/blocks/moodleblock.class.php');
require_once($CFG->dirroot . '/mod/assign/lib.php');

// Get JSON file path from command line or use default
$jsonfile = $argc > 1 ? $argv[1] : '/tmp/moodle-data.json';

if (!file_exists($jsonfile)) {
    die("Error: JSON file not found: {$jsonfile}\n");
}

echo "Reading configuration from: {$jsonfile}\n";
$jsondata = file_get_contents($jsonfile);
$data = json_decode($jsondata, true);

if (!$data) {
    die("Error: Invalid JSON format\n");
}

// Statistics
$stats = [
    'users' => ['created' => 0, 'existing' => 0, 'errors' => 0],
    'courses' => ['created' => 0, 'existing' => 0, 'errors' => 0],
    'enrollments' => ['created' => 0, 'existing' => 0, 'errors' => 0],
    'assignments' => ['created' => 0, 'existing' => 0, 'errors' => 0],
    'forums' => ['created' => 0, 'existing' => 0, 'errors' => 0],
    'pages' => ['created' => 0, 'existing' => 0, 'errors' => 0],
    'urls' => ['created' => 0, 'existing' => 0, 'errors' => 0],
    'blocks' => ['created' => 0, 'existing' => 0, 'errors' => 0],
];

/**
 * Create or get existing user
 */
function create_user($userdata) {
    global $CFG, $DB;
    
    $username = trim($userdata['username']);
    
    // Check if user exists
    if ($existing = $DB->get_record('user', ['username' => $username])) {
        echo "  User exists: {$username} (ID: {$existing->id})\n";
        return ['id' => $existing->id, 'existing' => true];
    }
    
    $user = new stdClass();
    $user->username = $username;
    $user->firstname = trim($userdata['firstname']);
    $user->lastname = trim($userdata['lastname']);
    $user->email = trim($userdata['email']);
    $user->password = isset($userdata['password']) ? trim($userdata['password']) : '';
    $user->auth = isset($userdata['auth']) ? $userdata['auth'] : 'manual';
    $user->confirmed = 1;
    $user->mnethostid = $CFG->mnet_localhost_id;
    $user->lang = 'en';
    
    try {
        $userid = user_create_user($user, true, false);
        echo "  Created user: {$username} (ID: {$userid})\n";
        return ['id' => $userid, 'existing' => false];
    } catch (Exception $e) {
        echo "  Error creating user {$username}: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Create or get existing course
 */
function create_course_with_content($coursedata) {
    global $CFG, $DB;
    
    $shortname = trim($coursedata['shortname']);
    
    // Check if course exists
    if ($existing = $DB->get_record('course', ['shortname' => $shortname])) {
        echo "  Course exists: {$shortname} (ID: {$existing->id})\n";
        return ['id' => $existing->id, 'existing' => true, 'course' => $existing];
    }
    
    $course = new stdClass();
    $course->shortname = $shortname;
    $course->fullname = trim($coursedata['fullname']);
    $course->category = (int)$coursedata['category'];
    $course->summary = trim($coursedata['summary']);
    $course->idnumber = isset($coursedata['idnumber']) ? trim($coursedata['idnumber']) : '';
    $course->visible = isset($coursedata['visible']) ? (int)$coursedata['visible'] : 1;
    $course->format = isset($coursedata['format']) ? $coursedata['format'] : 'topics';
    $course->numsections = isset($coursedata['numsections']) ? (int)$coursedata['numsections'] : 0;
    $course->startdate = time();
    $course->enddate = 0;
    
    try {
        $newcourse = create_course($course);
        $courseid = is_object($newcourse) ? $newcourse->id : $newcourse;
        echo "  Created course: {$shortname} (ID: {$courseid})\n";
        
        // Reload course to get full object
        $newcourse = $DB->get_record('course', ['id' => $courseid]);
        return ['id' => $courseid, 'existing' => false, 'course' => $newcourse];
    } catch (Exception $e) {
        echo "  Error creating course {$shortname}: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Enroll user in course
 */
function enroll_user($courseid, $username, $roleshortname = 'student') {
    global $DB;
    
    // Get user
    $user = $DB->get_record('user', ['username' => $username]);
    if (!$user) {
        echo "    Error: User not found: {$username}\n";
        return false;
    }
    
    // Get course
    $course = $DB->get_record('course', ['id' => $courseid]);
    if (!$course) {
        echo "    Error: Course not found: {$courseid}\n";
        return false;
    }
    
    // Get role
    $role = $DB->get_record('role', ['shortname' => $roleshortname]);
    if (!$role) {
        echo "    Error: Role not found: {$roleshortname}\n";
        return false;
    }
    
    // Check if already enrolled
    $context = context_course::instance($courseid);
    if (is_enrolled($context, $user->id)) {
        echo "    User already enrolled: {$username}\n";
        return ['existing' => true];
    }
    
    // Get or create manual enrolment instance
    $enrol = $DB->get_record('enrol', ['courseid' => $courseid, 'enrol' => 'manual']);
    if (!$enrol) {
        $plugin = enrol_get_plugin('manual');
        if ($plugin) {
            $instanceid = $plugin->add_instance($course);
            $enrol = $DB->get_record('enrol', ['id' => $instanceid]);
        } else {
            echo "    Error: Manual enrolment plugin not available\n";
            return false;
        }
    }
    
    try {
        $plugin = enrol_get_plugin('manual');
        $plugin->enrol_user($enrol, $user->id, $role->id, 0, 0);
        echo "    Enrolled: {$username} as {$roleshortname}\n";
        return ['existing' => false];
    } catch (Exception $e) {
        echo "    Error enrolling {$username}: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Create assignment in course
 */
function create_assignment($courseid, $assigndata, $sectionnumber = 0) {
    global $DB, $CFG;
    
    $assignname = trim($assigndata['name']);
    
    // Check if assignment already exists
    $existing = $DB->get_records_sql(
        "SELECT cm.id, a.name 
         FROM {course_modules} cm
         JOIN {modules} m ON m.id = cm.module
         JOIN {assign} a ON a.id = cm.instance
         WHERE cm.course = ? AND m.name = 'assign' AND a.name = ?",
        [$courseid, $assignname]
    );
    
    if (!empty($existing)) {
        $existingid = reset($existing)->id;
        echo "    Assignment exists: {$assignname} (ID: {$existingid})\n";
        return ['existing' => true];
    }
    
    // Parse duedate if it's a relative time
    $duedate = 0;
    if (isset($assigndata['duedate'])) {
        if (is_numeric($assigndata['duedate'])) {
            $duedate = (int)$assigndata['duedate'];
        } else {
            $duedate = strtotime($assigndata['duedate']);
        }
    }
    
    try {
        // Start transaction
        $transaction = $DB->start_delegated_transaction();
        
        // Get the assign module
        $module = $DB->get_record('modules', ['name' => 'assign'], '*', MUST_EXIST);
        
        // Create assignment instance
        $assign = new stdClass();
        $assign->course = $courseid;
        $assign->name = $assignname;
        $assign->intro = isset($assigndata['intro']) ? $assigndata['intro'] : '';
        $assign->introformat = FORMAT_HTML;
        $assign->alwaysshowdescription = 0;
        $assign->submissiondrafts = 0;
        $assign->sendnotifications = 0;
        $assign->sendlatenotifications = 0;
        $assign->duedate = $duedate;
        $assign->cutoffdate = 0;
        $assign->gradingduedate = 0;
        $assign->allowsubmissionsfromdate = 0;
        $assign->grade = isset($assigndata['grade']) ? (int)$assigndata['grade'] : 100;
        $assign->timemodified = time();
        $assign->timecreated = time();
        $assign->teamsubmission = 0;
        $assign->requireallteammemberssubmit = 0;
        $assign->teamsubmissiongroupingid = 0;
        $assign->blindmarking = 0;
        $assign->revealidentities = 0;
        $assign->attemptreopenmethod = 'none';
        $assign->maxattempts = -1;
        $assign->markingworkflow = 0;
        $assign->markingallocation = 0;
        $assign->requiresubmissionstatement = 0;
        $assign->preventsubmissionnotingroup = 0;
        
        $assignid = $DB->insert_record('assign', $assign);
        
        // Get course section
        $section = $DB->get_record('course_sections', 
            ['course' => $courseid, 'section' => $sectionnumber], 
            '*', 
            MUST_EXIST
        );
        
        // Create course module
        $cm = new stdClass();
        $cm->course = $courseid;
        $cm->module = $module->id;
        $cm->instance = $assignid;
        $cm->section = $section->id;
        $cm->added = time();
        $cm->visible = 1;
        $cm->visibleoncoursepage = 1;
        $cm->groupmode = 0;
        $cm->groupingid = 0;
        $cm->completion = 0;
        
        $cmid = $DB->insert_record('course_modules', $cm);
        
        // Add to section sequence
        $sequence = $section->sequence;
        if (empty($sequence)) {
            $sequence = $cmid;
        } else {
            $sequence .= ',' . $cmid;
        }
        $DB->set_field('course_sections', 'sequence', $sequence, ['id' => $section->id]);
        
        // Create submission plugin records
        if (isset($assigndata['assignsubmission_onlinetext_enabled']) && $assigndata['assignsubmission_onlinetext_enabled']) {
            $plugin = new stdClass();
            $plugin->assignment = $assignid;
            $plugin->plugin = 'onlinetext';
            $plugin->subtype = 'assignsubmission';
            $plugin->name = 'enabled';
            $plugin->value = '1';
            $DB->insert_record('assign_plugin_config', $plugin);
        }
        
        if (isset($assigndata['assignsubmission_file_enabled']) && $assigndata['assignsubmission_file_enabled']) {
            $plugin = new stdClass();
            $plugin->assignment = $assignid;
            $plugin->plugin = 'file';
            $plugin->subtype = 'assignsubmission';
            $plugin->name = 'enabled';
            $plugin->value = '1';
            $DB->insert_record('assign_plugin_config', $plugin);
        }
        
        // Enable comments feedback by default
        $plugin = new stdClass();
        $plugin->assignment = $assignid;
        $plugin->plugin = 'comments';
        $plugin->subtype = 'assignfeedback';
        $plugin->name = 'enabled';
        $plugin->value = '1';
        $DB->insert_record('assign_plugin_config', $plugin);
        
        // Rebuild course cache
        rebuild_course_cache($courseid, true);
        
        // Commit transaction
        $transaction->allow_commit();
        
        echo "    Created assignment: {$assignname} [Section {$sectionnumber}] (ID: {$cmid})\n";
        return ['existing' => false];
    } catch (Exception $e) {
        echo "    Error creating assignment {$assignname}: " . $e->getMessage() . "\n";
        if (isset($transaction) && !$transaction->is_disposed()) {
            $transaction->rollback($e);
        }
        return false;
    }
}

/**
 * Create forum in course
 */
function create_forum($courseid, $forumdata, $sectionnumber = 0) {
    global $DB, $CFG;
    
    $forumname = trim($forumdata['name']);
    
    // Check if forum already exists
    $existing = $DB->get_records_sql(
        "SELECT cm.id, f.name 
         FROM {course_modules} cm
         JOIN {modules} m ON m.id = cm.module
         JOIN {forum} f ON f.id = cm.instance
         WHERE cm.course = ? AND m.name = 'forum' AND f.name = ?",
        [$courseid, $forumname]
    );
    
    if (!empty($existing)) {
        $existingid = reset($existing)->id;
        echo "    Forum exists: {$forumname} (ID: {$existingid})\n";
        return ['existing' => true];
    }
    
    $forumtype = isset($forumdata['type']) ? $forumdata['type'] : 'general';
    
    try {
        $transaction = $DB->start_delegated_transaction();
        
        // Get the forum module
        $module = $DB->get_record('modules', ['name' => 'forum'], '*', MUST_EXIST);
        
        // Create forum instance
        $forum = new stdClass();
        $forum->course = $courseid;
        $forum->type = $forumtype;
        $forum->name = $forumname;
        $forum->intro = isset($forumdata['intro']) ? $forumdata['intro'] : '';
        $forum->introformat = FORMAT_HTML;
        $forum->assessed = 0;
        $forum->assesstimestart = 0;
        $forum->assesstimefinish = 0;
        $forum->scale = 1;
        $forum->maxbytes = 0;
        $forum->maxattachments = 1;
        $forum->forcesubscribe = 1;
        $forum->trackingtype = 1;
        $forum->rsstype = 0;
        $forum->rssarticles = 0;
        $forum->timemodified = time();
        $forum->warnafter = 0;
        $forum->blockafter = 0;
        $forum->blockperiod = 0;
        $forum->completiondiscussions = 0;
        $forum->completionreplies = 0;
        $forum->completionposts = 0;
        
        $forumid = $DB->insert_record('forum', $forum);
        
        // Get course section
        $section = $DB->get_record('course_sections', 
            ['course' => $courseid, 'section' => $sectionnumber], 
            '*', 
            MUST_EXIST
        );
        
        // Create course module
        $cm = new stdClass();
        $cm->course = $courseid;
        $cm->module = $module->id;
        $cm->instance = $forumid;
        $cm->section = $section->id;
        $cm->added = time();
        $cm->visible = 1;
        $cm->visibleoncoursepage = 1;
        $cm->groupmode = 0;
        $cm->groupingid = 0;
        $cm->completion = 0;
        
        $cmid = $DB->insert_record('course_modules', $cm);
        
        // Add to section sequence
        $sequence = $section->sequence;
        if (empty($sequence)) {
            $sequence = $cmid;
        } else {
            $sequence .= ',' . $cmid;
        }
        $DB->set_field('course_sections', 'sequence', $sequence, ['id' => $section->id]);
        
        // Rebuild course cache
        rebuild_course_cache($courseid, true);
        
        $transaction->allow_commit();
        
        echo "    Created forum: {$forumname} [Section {$sectionnumber}] (ID: {$cmid})\n";
        return ['existing' => false];
    } catch (Exception $e) {
        echo "    Error creating forum {$forumname}: " . $e->getMessage() . "\n";
        if (isset($transaction) && !$transaction->is_disposed()) {
            $transaction->rollback($e);
        }
        return false;
    }
}

/**
 * Create page in course
 */
function create_page($courseid, $pagedata, $sectionnumber = 0) {
    global $DB, $CFG;
    
    $pagename = trim($pagedata['name']);
    
    // Check if page already exists
    $existing = $DB->get_records_sql(
        "SELECT cm.id, p.name 
         FROM {course_modules} cm
         JOIN {modules} m ON m.id = cm.module
         JOIN {page} p ON p.id = cm.instance
         WHERE cm.course = ? AND m.name = 'page' AND p.name = ?",
        [$courseid, $pagename]
    );
    
    if (!empty($existing)) {
        $existingid = reset($existing)->id;
        echo "    Page exists: {$pagename} (ID: {$existingid})\n";
        return ['existing' => true];
    }
    
    try {
        $transaction = $DB->start_delegated_transaction();
        
        // Get the page module
        $module = $DB->get_record('modules', ['name' => 'page'], '*', MUST_EXIST);
        
        // Create page instance
        $page = new stdClass();
        $page->course = $courseid;
        $page->name = $pagename;
        $page->intro = '';
        $page->introformat = FORMAT_HTML;
        $page->content = isset($pagedata['content']) ? $pagedata['content'] : '';
        $page->contentformat = FORMAT_HTML;
        $page->legacyfiles = 0;
        $page->legacyfileslast = null;
        $page->display = 5;
        $page->displayoptions = 'a:1:{s:12:"printheading";s:1:"1";}';
        $page->revision = 1;
        $page->timemodified = time();
        
        $pageid = $DB->insert_record('page', $page);
        
        // Get course section
        $section = $DB->get_record('course_sections', 
            ['course' => $courseid, 'section' => $sectionnumber], 
            '*', 
            MUST_EXIST
        );
        
        // Create course module
        $cm = new stdClass();
        $cm->course = $courseid;
        $cm->module = $module->id;
        $cm->instance = $pageid;
        $cm->section = $section->id;
        $cm->added = time();
        $cm->visible = 1;
        $cm->visibleoncoursepage = 1;
        $cm->groupmode = 0;
        $cm->groupingid = 0;
        $cm->completion = 0;
        
        $cmid = $DB->insert_record('course_modules', $cm);
        
        // Add to section sequence
        $sequence = $section->sequence;
        if (empty($sequence)) {
            $sequence = $cmid;
        } else {
            $sequence .= ',' . $cmid;
        }
        $DB->set_field('course_sections', 'sequence', $sequence, ['id' => $section->id]);
        
        // Rebuild course cache
        rebuild_course_cache($courseid, true);
        
        $transaction->allow_commit();
        
        echo "    Created page: {$pagename} [Section {$sectionnumber}] (ID: {$cmid})\n";
        return ['existing' => false];
    } catch (Exception $e) {
        echo "    Error creating page {$pagename}: " . $e->getMessage() . "\n";
        if (isset($transaction) && !$transaction->is_disposed()) {
            $transaction->rollback($e);
        }
        return false;
    }
}

/**
 * Create URL resource in course
 */
function create_url($courseid, $urldata, $sectionnumber = 0) {
    global $DB, $CFG;
    
    $urlname = trim($urldata['name']);
    
    // Check if URL already exists
    $existing = $DB->get_records_sql(
        "SELECT cm.id, u.name 
         FROM {course_modules} cm
         JOIN {modules} m ON m.id = cm.module
         JOIN {url} u ON u.id = cm.instance
         WHERE cm.course = ? AND m.name = 'url' AND u.name = ?",
        [$courseid, $urlname]
    );
    
    if (!empty($existing)) {
        $existingid = reset($existing)->id;
        echo "    URL exists: {$urlname} (ID: {$existingid})\n";
        return ['existing' => true];
    }
    
    try {
        $transaction = $DB->start_delegated_transaction();
        
        // Get the URL module
        $module = $DB->get_record('modules', ['name' => 'url'], '*', MUST_EXIST);
        
        // Create URL instance
        $url = new stdClass();
        $url->course = $courseid;
        $url->name = $urlname;
        $url->intro = isset($urldata['intro']) ? $urldata['intro'] : '';
        $url->introformat = FORMAT_HTML;
        $url->externalurl = isset($urldata['externalurl']) ? $urldata['externalurl'] : '';
        $url->display = 0;
        $url->displayoptions = 'a:1:{s:10:"printintro";i:1;}';
        $url->parameters = 'a:0:{}';
        $url->timemodified = time();
        
        $urlid = $DB->insert_record('url', $url);
        
        // Get course section
        $section = $DB->get_record('course_sections', 
            ['course' => $courseid, 'section' => $sectionnumber], 
            '*', 
            MUST_EXIST
        );
        
        // Create course module
        $cm = new stdClass();
        $cm->course = $courseid;
        $cm->module = $module->id;
        $cm->instance = $urlid;
        $cm->section = $section->id;
        $cm->added = time();
        $cm->visible = 1;
        $cm->visibleoncoursepage = 1;
        $cm->groupmode = 0;
        $cm->groupingid = 0;
        $cm->completion = 0;
        
        $cmid = $DB->insert_record('course_modules', $cm);
        
        // Add to section sequence
        $sequence = $section->sequence;
        if (empty($sequence)) {
            $sequence = $cmid;
        } else {
            $sequence .= ',' . $cmid;
        }
        $DB->set_field('course_sections', 'sequence', $sequence, ['id' => $section->id]);
        
        // Rebuild course cache
        rebuild_course_cache($courseid, true);
        
        $transaction->allow_commit();
        
        echo "    Created URL: {$urlname} [Section {$sectionnumber}] (ID: {$cmid})\n";
        return ['existing' => false];
    } catch (Exception $e) {
        echo "    Error creating URL {$urlname}: " . $e->getMessage() . "\n";
        if (isset($transaction) && !$transaction->is_disposed()) {
            $transaction->rollback($e);
        }
        return false;
    }
}

/**
 * Add block to course
 */
function add_block_to_course($courseid, $blockdata) {
    global $DB, $CFG;
    
    $blockname = $blockdata['blockname'];
    $region = isset($blockdata['region']) ? $blockdata['region'] : 'side-pre';
    $weight = isset($blockdata['weight']) ? (int)$blockdata['weight'] : 0;
    $title = isset($blockdata['title']) ? $blockdata['title'] : '';
    
    // Get course context
    $context = context_course::instance($courseid);
    
    // For HTML blocks with titles, check if a block with the same title exists
    if ($blockname === 'html' && !empty($title)) {
        $existing = $DB->get_records('block_instances', [
            'blockname' => $blockname,
            'parentcontextid' => $context->id
        ]);
        
        foreach ($existing as $block) {
            if (!empty($block->configdata)) {
                $config = unserialize(base64_decode($block->configdata));
                if (isset($config->title) && $config->title === $title) {
                    echo "    Block exists: {$blockname} '{$title}'\n";
                    return ['existing' => true];
                }
            }
        }
    }
    
    // Create block instance
    $blockinstance = new stdClass();
    $blockinstance->blockname = $blockname;
    $blockinstance->parentcontextid = $context->id;
    $blockinstance->showinsubcontexts = 0;
    $blockinstance->pagetypepattern = 'course-view-*';
    $blockinstance->defaultregion = $region;
    $blockinstance->defaultweight = $weight;
    $blockinstance->timecreated = time();
    $blockinstance->timemodified = time();
    
    // Configure HTML block content
    if ($blockname === 'html') {
        $config = new stdClass();
        $config->title = $title;
        $config->text = isset($blockdata['content']) ? $blockdata['content'] : '';
        $config->format = '1'; // HTML format
        $blockinstance->configdata = base64_encode(serialize($config));
    } else {
        $blockinstance->configdata = '';
    }
    
    try {
        $blockid = $DB->insert_record('block_instances', $blockinstance);
        
        // Add block position
        $blockposition = new stdClass();
        $blockposition->blockinstanceid = $blockid;
        $blockposition->contextid = $context->id;
        $blockposition->pagetype = 'course-view-*';
        $blockposition->subpage = '';
        $blockposition->visible = 1;
        $blockposition->region = $region;
        $blockposition->weight = $weight;
        
        $DB->insert_record('block_positions', $blockposition);
        
        $displayname = $blockname === 'html' && !empty($title) ? "{$blockname} '{$title}'" : $blockname;
        echo "    Added block: {$displayname} (ID: {$blockid})\n";
        return ['existing' => false];
    } catch (Exception $e) {
        echo "    Error adding block {$blockname}: " . $e->getMessage() . "\n";
        return false;
    }
}

// Process users
if (isset($data['users']) && is_array($data['users'])) {
    echo "\n=== Creating Users ===\n";
    foreach ($data['users'] as $userdata) {
        echo "Processing user: {$userdata['username']}\n";
        $result = create_user($userdata);
        if ($result) {
            if ($result['existing']) {
                $stats['users']['existing']++;
            } else {
                $stats['users']['created']++;
            }
        } else {
            $stats['users']['errors']++;
        }
    }
}

// Process courses with their content
if (isset($data['courses']) && is_array($data['courses'])) {
    echo "\n=== Creating Courses ===\n";
    foreach ($data['courses'] as $coursedata) {
        echo "Processing course: {$coursedata['shortname']}\n";
        $result = create_course_with_content($coursedata);
        
        if (!$result) {
            $stats['courses']['errors']++;
            continue;
        }
        
        if ($result['existing']) {
            $stats['courses']['existing']++;
        } else {
            $stats['courses']['created']++;
        }
        
        $courseid = $result['id'];
        
        // Process enrollments
        if (isset($coursedata['enrollments']) && is_array($coursedata['enrollments'])) {
            echo "  Processing enrollments:\n";
            foreach ($coursedata['enrollments'] as $enrollment) {
                $role = isset($enrollment['role']) ? $enrollment['role'] : 'student';
                $enrollresult = enroll_user($courseid, $enrollment['username'], $role);
                if ($enrollresult) {
                    if ($enrollresult['existing']) {
                        $stats['enrollments']['existing']++;
                    } else {
                        $stats['enrollments']['created']++;
                    }
                } else {
                    $stats['enrollments']['errors']++;
                }
            }
        }
        
        // Process sections and their content
        if (isset($coursedata['sections']) && is_array($coursedata['sections'])) {
            echo "  Processing sections:\n";
            foreach ($coursedata['sections'] as $sectiondata) {
                $sectionnumber = $sectiondata['section'];
                $sectionname = isset($sectiondata['name']) ? $sectiondata['name'] : '';
                
                echo "    Section {$sectionnumber}: {$sectionname}\n";
                
                // Update section name and summary if provided
                if (!empty($sectionname) || isset($sectiondata['summary'])) {
                    $section = $DB->get_record('course_sections', 
                        ['course' => $courseid, 'section' => $sectionnumber]
                    );
                    if ($section) {
                        if (!empty($sectionname)) {
                            $section->name = $sectionname;
                        }
                        if (isset($sectiondata['summary'])) {
                            $section->summary = $sectiondata['summary'];
                            $section->summaryformat = FORMAT_HTML;
                        }
                        $DB->update_record('course_sections', $section);
                    }
                }
                
                // Process forums in this section
                if (isset($sectiondata['forums']) && is_array($sectiondata['forums'])) {
                    foreach ($sectiondata['forums'] as $forumdata) {
                        $forumresult = create_forum($courseid, $forumdata, $sectionnumber);
                        if ($forumresult) {
                            if ($forumresult['existing']) {
                                $stats['forums']['existing']++;
                            } else {
                                $stats['forums']['created']++;
                            }
                        } else {
                            $stats['forums']['errors']++;
                        }
                    }
                }
                
                // Process pages in this section
                if (isset($sectiondata['pages']) && is_array($sectiondata['pages'])) {
                    foreach ($sectiondata['pages'] as $pagedata) {
                        $pageresult = create_page($courseid, $pagedata, $sectionnumber);
                        if ($pageresult) {
                            if ($pageresult['existing']) {
                                $stats['pages']['existing']++;
                            } else {
                                $stats['pages']['created']++;
                            }
                        } else {
                            $stats['pages']['errors']++;
                        }
                    }
                }
                
                // Process URLs in this section
                if (isset($sectiondata['urls']) && is_array($sectiondata['urls'])) {
                    foreach ($sectiondata['urls'] as $urldata) {
                        $urlresult = create_url($courseid, $urldata, $sectionnumber);
                        if ($urlresult) {
                            if ($urlresult['existing']) {
                                $stats['urls']['existing']++;
                            } else {
                                $stats['urls']['created']++;
                            }
                        } else {
                            $stats['urls']['errors']++;
                        }
                    }
                }
                
                // Process assignments in this section
                if (isset($sectiondata['assignments']) && is_array($sectiondata['assignments'])) {
                    foreach ($sectiondata['assignments'] as $assigndata) {
                        $assignresult = create_assignment($courseid, $assigndata, $sectionnumber);
                        if ($assignresult) {
                            if ($assignresult['existing']) {
                                $stats['assignments']['existing']++;
                            } else {
                                $stats['assignments']['created']++;
                            }
                        } else {
                            $stats['assignments']['errors']++;
                        }
                    }
                }
            }
        }
        
        // Process blocks (blocks are course-wide, not section-specific)
        if (isset($coursedata['blocks']) && is_array($coursedata['blocks'])) {
            echo "  Processing blocks:\n";
            foreach ($coursedata['blocks'] as $blockdata) {
                $blockresult = add_block_to_course($courseid, $blockdata);
                if ($blockresult) {
                    if ($blockresult['existing']) {
                        $stats['blocks']['existing']++;
                    } else {
                        $stats['blocks']['created']++;
                    }
                } else {
                    $stats['blocks']['errors']++;
                }
            }
        }
    }
}

// Print summary
echo "\n=== Setup Summary ===\n";
foreach ($stats as $type => $counts) {
    $total = $counts['created'] + $counts['existing'];
    echo ucfirst($type) . ": {$counts['created']} created, {$counts['existing']} existing, {$counts['errors']} errors\n";
}

$total_errors = array_sum(array_column($stats, 'errors'));
exit($total_errors > 0 ? 1 : 0);
?>

