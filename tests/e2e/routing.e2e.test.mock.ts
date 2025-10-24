export const mockUserInfo = {
  userid: 90,
  username: 'annika.schmidt@example.com',
  firstname: 'Annika',
  lastname: 'Schmidt',
  siteurl: 'https://example.com',
  userpictureurl: 'https://example.com/user.png',
  userlang: 'de',
};

export const mockAssignments = {
  courses: [
    {
      id: 183823,
      fullname: 'Data Mining WS25',
      assignments: [
        {
          id: 323,
          course: 183823,
          name: 'What is the meaning of life?',
          duedate: 1734854400,
          intro: 'Describe in your words what the meaning of life is.',
        },
        {
          id: 324,
          course: 183823,
          name: 'Machine Learning Assignment',
          duedate: 1734940800,
          intro:
            'Write a report about the impact of machine learning on society.',
        },
      ],
    },
    {
      id: 183824,
      fullname: 'Software Engineering WS25',
      assignments: [
        {
          id: 325,
          course: 183824,
          name: 'Design Patterns Exercise',
          duedate: 1735027200,
          intro:
            'You need to implement the Singleton pattern in the given Java project.',
        },
      ],
    },
  ],
};
