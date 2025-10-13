export const mockUserInfo = {
  userid: 1,
  username: 'hans.muster@test.com',
  firstname: 'Hans',
  lastname: 'Muster',
  siteurl: 'https://test.com',
  userpictureurl: 'https://test.com/user.png',
  userlang: 'en',
};

export const mockEnrolledCourses = [
  {
    id: 103,
    fullname: 'UX Design for eHealth Apps',
    categoryname: 'User Experience',
    shortname: 'UX-EHEALTH',
    summary:
      'Design intuitive, accessible, and secure interfaces for digital health platforms. Focus on patient engagement, accessibility, and trust.',
    contacts: [{ id: 4, fullname: 'Angelika Musterfrau' }],
    startdate: 1718121600,
    enddate: 1720473600,
    visible: 1,
    isfavourite: false,
    hidden: false,
    assignments: [
      {
        id: 89,
        course: 103,
        nosubmissions: 0,
        submissiondrafts: 0,
        duedate: 1718121600,
        allowsubmissionsfromdate: 1718121600,
        grade: 0,
        timemodified: 1718121600,
        completionsubmit: 0,
        cutoffdate: 1718121600,
        gradingduedate: 1718121600,
        teamsubmission: 0,
        requireallteammemberssubmit: 0,
        teamsubmissiongroupingid: 0,
        maxattempts: 0,
        intro: '',
        timelimit: 0,
        name: 'Write an essay about the future of digital health',
      },
    ],
  },
  {
    id: 104,
    shortname: 'CHEM101',
    fullname: 'General Chemistry I',
    categoryname: 'Science',
    summary: 'An introductory course to general chemistry.',
    contacts: [{ id: 9, fullname: 'John Doe' }],
    startdate: 1675209600, // 2023-02-01
    enddate: 1675209600 + 15 * 7 * 24 * 3600,
    visible: 1,
    isfavourite: false,
    hidden: false,
    assignments: [
      {
        id: 12,
        course: 104,
        nosubmissions: 0,
        submissiondrafts: 0,
        duedate: 1676419200, // 2023-02-15
        allowsubmissionsfromdate: 1675209600, // 2023-02-01
        grade: 0,
        timemodified: 1675209600,
        completionsubmit: 0,
        cutoffdate: 1676419200, // 2023-02-15
        gradingduedate: 1677024000, // 2023-02-22
        teamsubmission: 0,
        requireallteammemberssubmit: 0,
        teamsubmissiongroupingid: 0,
        maxattempts: 0,
        intro: '',
        timelimit: 0,
        name: 'Prepare for the exam',
      },
    ],
  },
];

export const mockCourseSearchCoursesResponseDigitalHealth = {
  total: 1,
  courses: mockEnrolledCourses,
};

export const mockAssignments = {
  courses: mockEnrolledCourses,
};
