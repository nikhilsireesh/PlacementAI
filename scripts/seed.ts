/**
 * Seed script — populates the database with reference data (departments,
 * job roles + skill weights, skills, assessments, practice sets, learning
 * resources) and realistic demo data (a flagship demo student "Arjun Kumar",
 * a faculty account, and ~23 additional students with varied readiness
 * profiles so the faculty dashboard is visually meaningful).
 *
 * Run with: npm run db:seed
 */
import { PrismaClient, SkillCategory, QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

// ── Reference data ──────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "ECE", name: "Electronics & Communication Engineering" },
  { code: "EEE", name: "Electrical & Electronics Engineering" },
];

const SKILLS: { name: string; category: SkillCategory }[] = [
  { name: "Coding", category: "CODING" },
  { name: "Aptitude", category: "APTITUDE" },
  { name: "Technical", category: "TECHNICAL" },
  { name: "Communication", category: "COMMUNICATION" },
  { name: "Interview", category: "INTERVIEW" },
  { name: "Resume", category: "RESUME" },
  { name: "Python", category: "ROLE_SPECIFIC" },
  { name: "SQL", category: "ROLE_SPECIFIC" },
  { name: "Frontend Development", category: "ROLE_SPECIFIC" },
  { name: "QA Testing", category: "ROLE_SPECIFIC" },
];

const JOB_ROLES: {
  name: string;
  description: string;
  weights: { skill: string; weight: number; target: number }[];
}[] = [
  {
    name: "Software Developer",
    description: "Builds and maintains software applications; strong emphasis on coding and CS fundamentals.",
    weights: [
      { skill: "Coding", weight: 0.3, target: 75 },
      { skill: "Technical", weight: 0.25, target: 70 },
      { skill: "Interview", weight: 0.2, target: 70 },
      { skill: "Aptitude", weight: 0.15, target: 70 },
      { skill: "Communication", weight: 0.1, target: 65 },
    ],
  },
  {
    name: "Data Analyst",
    description: "Analyzes data to drive business decisions using Python, SQL, and statistical reasoning.",
    weights: [
      { skill: "SQL", weight: 0.25, target: 75 },
      { skill: "Python", weight: 0.2, target: 70 },
      { skill: "Aptitude", weight: 0.2, target: 70 },
      { skill: "Communication", weight: 0.15, target: 65 },
      { skill: "Interview", weight: 0.1, target: 65 },
      { skill: "Resume", weight: 0.1, target: 60 },
    ],
  },
  {
    name: "Frontend Developer",
    description: "Builds user-facing web interfaces with HTML, CSS, JavaScript, and modern frameworks.",
    weights: [
      { skill: "Frontend Development", weight: 0.3, target: 75 },
      { skill: "Coding", weight: 0.2, target: 70 },
      { skill: "Technical", weight: 0.2, target: 65 },
      { skill: "Interview", weight: 0.15, target: 65 },
      { skill: "Communication", weight: 0.15, target: 65 },
    ],
  },
  {
    name: "QA Engineer",
    description: "Ensures software quality through manual and automated testing.",
    weights: [
      { skill: "QA Testing", weight: 0.3, target: 75 },
      { skill: "Technical", weight: 0.2, target: 65 },
      { skill: "Coding", weight: 0.15, target: 60 },
      { skill: "Aptitude", weight: 0.15, target: 65 },
      { skill: "Interview", weight: 0.1, target: 65 },
      { skill: "Communication", weight: 0.1, target: 65 },
    ],
  },
  {
    name: "Backend Developer",
    description: "Builds server-side logic, APIs, and databases powering applications.",
    weights: [
      { skill: "Coding", weight: 0.35, target: 75 },
      { skill: "Technical", weight: 0.25, target: 70 },
      { skill: "Interview", weight: 0.2, target: 70 },
      { skill: "Aptitude", weight: 0.1, target: 65 },
      { skill: "Communication", weight: 0.1, target: 60 },
    ],
  },
  {
    name: "HR",
    description: "Manages recruitment, onboarding, and people operations.",
    weights: [
      { skill: "Communication", weight: 0.3, target: 75 },
      { skill: "Interview", weight: 0.25, target: 70 },
      { skill: "Resume", weight: 0.2, target: 65 },
      { skill: "Aptitude", weight: 0.15, target: 60 },
      { skill: "Technical", weight: 0.1, target: 55 },
    ],
  },
];

// ── Question banks ───────────────────────────────────────────────────────────

interface SeedQuestion {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  marks?: number;
  difficulty?: string;
  topic?: string;
}

interface SeedAssessment {
  title: string;
  skill: string;
  category: SkillCategory;
  difficulty: string;
  timeLimitMinutes: number;
  isPractice: boolean;
  topic?: string;
  questions: SeedQuestion[];
}

const ASSESSMENTS: SeedAssessment[] = [
  {
    title: "Coding Fundamentals Assessment",
    skill: "Coding",
    category: "CODING",
    difficulty: "MEDIUM",
    timeLimitMinutes: 20,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "What is the time complexity of binary search on a sorted array of n elements?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctAnswer: "O(log n)", explanation: "Binary search halves the search space each step, giving O(log n).", topic: "Algorithms" },
      { type: "MCQ", text: "Which data structure uses LIFO (Last In First Out) order?", options: ["Queue", "Stack", "Linked List", "Array"], correctAnswer: "Stack", explanation: "A stack pushes/pops from the same end, giving Last-In-First-Out order.", topic: "Data Structures" },
      { type: "CODE_OUTPUT", text: "What is printed by: console.log(2 ** 3);", correctAnswer: "8", explanation: "The exponentiation operator ** computes 2 to the power 3 = 8.", topic: "Fundamentals" },
      { type: "MCQ", text: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correctAnswer: "Merge Sort", explanation: "Merge Sort runs in O(n log n) on average, better than the O(n^2) options.", topic: "Sorting" },
      { type: "MCQ", text: "What does recursion require to avoid infinite calls?", options: ["A loop", "A base case", "A global variable", "A pointer"], correctAnswer: "A base case", explanation: "A base case stops the recursive calls from continuing indefinitely.", topic: "Recursion" },
    ],
  },
  {
    title: "Aptitude Assessment",
    skill: "Aptitude",
    category: "APTITUDE",
    difficulty: "MEDIUM",
    timeLimitMinutes: 20,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "A train travels 60 km in 45 minutes. What is its speed in km/h?", options: ["60", "80", "90", "100"], correctAnswer: "80", explanation: "60 km / 0.75 h = 80 km/h.", topic: "Speed & Time" },
      { type: "MCQ", text: "Find the next number in the series: 2, 6, 12, 20, 30, ?", options: ["36", "40", "42", "45"], correctAnswer: "42", explanation: "Differences increase by 2 each time (n(n+1) pattern): next difference is 12, giving 42.", topic: "Number Series" },
      { type: "MCQ", text: "A shopkeeper marks up goods by 20% and gives a 10% discount. What is the net profit percentage?", options: ["8%", "10%", "12%", "20%"], correctAnswer: "8%", explanation: "1.20 × 0.90 = 1.08, i.e. an 8% net profit.", topic: "Profit & Loss" },
      { type: "MCQ", text: "If the probability of an event is 0.25, what are the odds against it?", options: ["1:3", "3:1", "1:4", "4:1"], correctAnswer: "3:1", explanation: "Odds against = (1 - p)/p = 0.75/0.25 = 3:1.", topic: "Probability" },
      { type: "MCQ", text: "A can finish a job in 10 days, B in 15 days. Working together, how many days will they take?", options: ["5", "6", "7", "8"], correctAnswer: "6", explanation: "Combined rate = 1/10 + 1/15 = 1/6, so 6 days.", topic: "Time & Work" },
    ],
  },
  {
    title: "Technical Fundamentals Assessment",
    skill: "Technical",
    category: "TECHNICAL",
    difficulty: "MEDIUM",
    timeLimitMinutes: 20,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "Which OOP principle allows a subclass to provide its own implementation of a method from its parent class?", options: ["Encapsulation", "Abstraction", "Polymorphism (Overriding)", "Inheritance"], correctAnswer: "Polymorphism (Overriding)", explanation: "Method overriding is a form of runtime polymorphism.", topic: "OOP" },
      { type: "MCQ", text: "What is normalization in database design primarily used for?", options: ["Increasing redundancy", "Reducing data redundancy and improving integrity", "Encrypting data", "Speeding up all queries"], correctAnswer: "Reducing data redundancy and improving integrity", explanation: "Normalization organizes columns/tables to minimize redundancy.", topic: "DBMS" },
      { type: "MCQ", text: "Which OS concept allows multiple processes to appear to run concurrently on one CPU core?", options: ["Multithreading", "Time-slicing / context switching", "Paging", "Caching"], correctAnswer: "Time-slicing / context switching", explanation: "The OS rapidly switches the CPU between processes.", topic: "Operating Systems" },
      { type: "MCQ", text: "In networking, what does DNS primarily do?", options: ["Encrypts traffic", "Translates domain names to IP addresses", "Assigns MAC addresses", "Compresses packets"], correctAnswer: "Translates domain names to IP addresses", explanation: "DNS resolves human-readable names to IP addresses.", topic: "Networks" },
      { type: "MCQ", text: "Which of these is NOT one of the four pillars of OOP?", options: ["Encapsulation", "Polymorphism", "Compilation", "Abstraction"], correctAnswer: "Compilation", explanation: "The four pillars are Encapsulation, Abstraction, Inheritance, and Polymorphism.", topic: "OOP" },
    ],
  },
  {
    title: "Communication Assessment",
    skill: "Communication",
    category: "COMMUNICATION",
    difficulty: "MEDIUM",
    timeLimitMinutes: 15,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "You disagree with a teammate's approach during a group project. What is the most professional response?", options: ["Ignore them and do it your way", "Publicly criticize them", "Explain your concerns privately and propose an alternative", "Escalate immediately"], correctAnswer: "Explain your concerns privately and propose an alternative", explanation: "Private, constructive feedback preserves the relationship and is more persuasive.", topic: "Group Discussion" },
      { type: "MCQ", text: "Which is the best way to start a formal email to a recruiter?", options: ["Hey,", "Yo,", "Dear Ms. Sharma,", "To whomever"], correctAnswer: "Dear Ms. Sharma,", explanation: "Formal salutations are expected in professional correspondence.", topic: "Email Etiquette" },
      { type: "MCQ", text: "In a group discussion, what best demonstrates leadership?", options: ["Speaking the loudest", "Summarizing points and including quieter members", "Dominating all the talk time", "Staying silent"], correctAnswer: "Summarizing points and including quieter members", explanation: "Good facilitation and inclusion are stronger signals than volume.", topic: "Group Discussion" },
      { type: "MCQ", text: "What is the STAR method used for?", options: ["Coding interviews", "Structuring behavioral interview answers", "Writing resumes", "Time management"], correctAnswer: "Structuring behavioral interview answers", explanation: "STAR = Situation, Task, Action, Result.", topic: "Structured Speaking" },
      { type: "MCQ", text: "Active listening in an interview includes:", options: ["Interrupting to share your view", "Nodding, paraphrasing, and asking clarifying questions", "Looking at your phone", "Preparing your next answer while they speak"], correctAnswer: "Nodding, paraphrasing, and asking clarifying questions", explanation: "Active listening signals engagement and comprehension.", topic: "Storytelling in Interviews" },
    ],
  },
  {
    title: "Interview Readiness Assessment",
    skill: "Interview",
    category: "INTERVIEW",
    difficulty: "MEDIUM",
    timeLimitMinutes: 15,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "What is the primary goal of the 'Tell me about yourself' question?", options: ["Test your memory", "Get a concise, relevant summary of your background", "Test your typing speed", "See if you can improvise"], correctAnswer: "Get a concise, relevant summary of your background", explanation: "It's an icebreaker meant to frame the rest of the interview.", topic: "Behavioral Questions" },
      { type: "MCQ", text: "When you don't know the answer to a technical question, you should:", options: ["Make something up confidently", "Stay silent", "Explain your thought process and reasoning honestly", "Change the subject"], correctAnswer: "Explain your thought process and reasoning honestly", explanation: "Interviewers value structured thinking over guessing.", topic: "Technical Whiteboarding" },
      { type: "MCQ", text: "Which is a strong closing question to ask the interviewer?", options: ["What does your company do?", "What does success look like in this role in the first 6 months?", "Can I leave early on Fridays?", "Nothing, just leave"], correctAnswer: "What does success look like in this role in the first 6 months?", explanation: "It shows genuine interest in performing well.", topic: "STAR Method" },
      { type: "MCQ", text: "Behavioral interview questions primarily assess:", options: ["Your GPA", "Past behavior as a predictor of future performance", "Typing speed", "Your handwriting"], correctAnswer: "Past behavior as a predictor of future performance", explanation: "This is the core premise of behavioral interviewing.", topic: "Behavioral Questions" },
      { type: "MCQ", text: "What should you research before a job interview?", options: ["Nothing, be spontaneous", "The company, role, and interviewer if possible", "Only the salary", "Only public reviews"], correctAnswer: "The company, role, and interviewer if possible", explanation: "Preparation signals genuine interest and improves your answers.", topic: "Behavioral Questions" },
    ],
  },
  {
    title: "Python Fundamentals Assessment",
    skill: "Python",
    category: "ROLE_SPECIFIC",
    difficulty: "MEDIUM",
    timeLimitMinutes: 20,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "Which keyword is used to define a function in Python?", options: ["func", "def", "function", "lambda"], correctAnswer: "def", explanation: "Functions are defined with the `def` keyword.", topic: "Functions" },
      { type: "CODE_OUTPUT", text: "What is printed by: print(type([]))", correctAnswer: "<class 'list'>", explanation: "An empty pair of square brackets creates a list.", topic: "Data Types" },
      { type: "MCQ", text: "Which library is most associated with tabular data manipulation in Python?", options: ["NumPy", "Pandas", "Matplotlib", "Flask"], correctAnswer: "Pandas", explanation: "Pandas provides DataFrame structures for tabular data.", topic: "Pandas Basics" },
      { type: "MCQ", text: "What does len() return for a string?", options: ["Its memory address", "The number of characters", "Its data type", "Its ASCII value"], correctAnswer: "The number of characters", explanation: "len() returns the count of characters in a string.", topic: "Data Types" },
      { type: "MCQ", text: "Which statement correctly opens a file for reading in Python?", options: ["open('file.txt','w')", "open('file.txt','r')", "read('file.txt')", "file.open('r')"], correctAnswer: "open('file.txt','r')", explanation: "'r' mode opens a file for reading.", topic: "File Handling" },
    ],
  },
  {
    title: "SQL Fundamentals Assessment",
    skill: "SQL",
    category: "ROLE_SPECIFIC",
    difficulty: "MEDIUM",
    timeLimitMinutes: 20,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "Which SQL clause filters groups after a GROUP BY?", options: ["WHERE", "HAVING", "FILTER", "ORDER BY"], correctAnswer: "HAVING", explanation: "HAVING filters aggregated groups; WHERE filters rows before grouping.", topic: "Aggregations" },
      { type: "MCQ", text: "Which JOIN returns all rows from the left table and matched rows from the right table?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "CROSS JOIN"], correctAnswer: "LEFT JOIN", explanation: "LEFT JOIN keeps all left-table rows, filling unmatched right columns with NULL.", topic: "Joins" },
      { type: "MCQ", text: "What does the SQL DISTINCT keyword do?", options: ["Sorts results", "Removes duplicate rows", "Deletes a table", "Creates an index"], correctAnswer: "Removes duplicate rows", explanation: "DISTINCT collapses duplicate rows in the result set.", topic: "Aggregations" },
      { type: "MCQ", text: "Which function returns the number of rows in a result set?", options: ["SUM()", "COUNT()", "AVG()", "TOTAL()"], correctAnswer: "COUNT()", explanation: "COUNT() counts matching rows.", topic: "Aggregations" },
      { type: "MCQ", text: "A subquery is:", options: ["A query inside another query", "A backup query", "A query with no WHERE clause", "An invalid query"], correctAnswer: "A query inside another query", explanation: "Subqueries are nested inside a SELECT/WHERE/FROM clause.", topic: "Subqueries" },
    ],
  },
  {
    title: "Frontend Development Assessment",
    skill: "Frontend Development",
    category: "ROLE_SPECIFIC",
    difficulty: "MEDIUM",
    timeLimitMinutes: 20,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "Which HTML tag is used to link an external CSS file?", options: ["<style>", "<link>", "<script>", "<css>"], correctAnswer: "<link>", explanation: "<link rel=\"stylesheet\"> loads external CSS.", topic: "HTML" },
      { type: "MCQ", text: "In CSS, which property controls space between a border and its content?", options: ["margin", "padding", "spacing", "gap"], correctAnswer: "padding", explanation: "Padding is the inner spacing inside the border.", topic: "CSS" },
      { type: "MCQ", text: "In React, how is data typically passed from a parent to a child component?", options: ["state", "props", "refs", "context only"], correctAnswer: "props", explanation: "Props flow data down the component tree.", topic: "React" },
      { type: "MCQ", text: "Which JavaScript method selects an element by its id?", options: ["document.querySelectorId()", "document.getElementById()", "document.getElement()", "document.selectById()"], correctAnswer: "document.getElementById()", explanation: "getElementById() is the standard DOM API for this.", topic: "JavaScript" },
      { type: "MCQ", text: "What does 'responsive design' primarily refer to?", options: ["Fast server response times", "Layouts that adapt to different screen sizes", "Using only JavaScript", "SEO optimization"], correctAnswer: "Layouts that adapt to different screen sizes", explanation: "Responsive design adapts layout to viewport size.", topic: "CSS" },
    ],
  },
  {
    title: "QA Testing Fundamentals",
    skill: "QA Testing",
    category: "ROLE_SPECIFIC",
    difficulty: "MEDIUM",
    timeLimitMinutes: 20,
    isPractice: false,
    questions: [
      { type: "MCQ", text: "What is the main purpose of regression testing?", options: ["Testing new features only", "Ensuring existing functionality still works after changes", "Testing UI colors", "Testing server hardware"], correctAnswer: "Ensuring existing functionality still works after changes", explanation: "Regression tests catch unintended side effects of changes.", topic: "Testing Fundamentals" },
      { type: "MCQ", text: "What is a 'test case'?", options: ["A physical box for testing devices", "A documented set of steps and expected results to verify functionality", "A bug report", "A type of database"], correctAnswer: "A documented set of steps and expected results to verify functionality", explanation: "Test cases define inputs, steps, and expected outcomes.", topic: "Test Design" },
      { type: "MCQ", text: "Black-box testing focuses on:", options: ["Internal code structure", "Input/output behavior without knowledge of internal code", "Only performance metrics", "Database schema"], correctAnswer: "Input/output behavior without knowledge of internal code", explanation: "Black-box testing treats the system as a closed box.", topic: "Testing Fundamentals" },
      { type: "MCQ", text: "What is the purpose of a bug tracking tool like Jira?", options: ["Writing code", "Logging, tracking, and managing defects", "Compiling code", "Hosting websites"], correctAnswer: "Logging, tracking, and managing defects", explanation: "Bug trackers manage the defect lifecycle.", topic: "Tools" },
      { type: "MCQ", text: "What does API testing primarily validate?", options: ["Only the visual UI", "The business logic, data responses, and reliability of an API", "The color scheme", "The backup schedule"], correctAnswer: "The business logic, data responses, and reliability of an API", explanation: "API testing checks endpoints independent of the UI.", topic: "API Testing" },
    ],
  },
  // ── Practice sets ─────────────────────────────────────────────────────────
  {
    title: "Arrays & Strings Practice",
    skill: "Coding",
    category: "CODING",
    difficulty: "EASY",
    timeLimitMinutes: 15,
    isPractice: true,
    topic: "Arrays",
    questions: [
      { type: "MCQ", text: "What is the time complexity of accessing an element by index in an array?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correctAnswer: "O(1)", explanation: "Arrays support direct indexed access.", marks: 1, topic: "Arrays" },
      { type: "CODE_OUTPUT", text: "What is printed by: print('hello'[::-1])  (Python)", correctAnswer: "olleh", explanation: "The [::-1] slice reverses a string.", marks: 1, topic: "Strings" },
      { type: "MCQ", text: "The classic 'Two Sum' problem is typically solved most efficiently using:", options: ["Brute force O(n^2)", "A hash map for O(n) lookup", "Sorting only", "Recursion only"], correctAnswer: "A hash map for O(n) lookup", explanation: "A hash map lets you check complements in O(1) average time.", marks: 1, topic: "Arrays" },
      { type: "MCQ", text: "What is the time complexity of inserting an element at the beginning of an array?", options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"], correctAnswer: "O(n)", explanation: "All existing elements must shift by one position.", marks: 1, topic: "Arrays" },
      { type: "MCQ", text: "Which technique efficiently finds a subarray with a given sum of contiguous elements?", options: ["Sliding window", "Bubble sort", "Binary search only", "Linked list traversal"], correctAnswer: "Sliding window", explanation: "Sliding window avoids recomputing sums from scratch.", marks: 1, topic: "Arrays" },
    ],
  },
  {
    title: "Recursion Practice",
    skill: "Coding",
    category: "CODING",
    difficulty: "MEDIUM",
    timeLimitMinutes: 10,
    isPractice: true,
    topic: "Recursion",
    questions: [
      { type: "CODE_OUTPUT", text: "factorial(n) = n<=1 ? 1 : n*factorial(n-1). What does factorial(3) return?", correctAnswer: "6", explanation: "3 × 2 × 1 = 6.", marks: 1, topic: "Recursion" },
      { type: "MCQ", text: "What must every correct recursive function have?", options: ["A loop", "A base case", "Global variables", "Multiple return types"], correctAnswer: "A base case", explanation: "The base case stops the recursion.", marks: 1, topic: "Recursion" },
      { type: "MCQ", text: "What is a risk of recursion without a proper base case?", options: ["Faster execution", "Stack overflow (infinite recursion)", "Better memory usage", "Nothing, it's always safe"], correctAnswer: "Stack overflow (infinite recursion)", explanation: "Each call adds a stack frame; without a base case this never stops.", marks: 1, topic: "Recursion" },
    ],
  },
  {
    title: "Aptitude Quick Practice",
    skill: "Aptitude",
    category: "APTITUDE",
    difficulty: "EASY",
    timeLimitMinutes: 15,
    isPractice: true,
    topic: "Quantitative Reasoning",
    questions: [
      { type: "MCQ", text: "A car covers 150 km in 3 hours. What is its average speed?", options: ["40", "45", "50", "55"], correctAnswer: "50", explanation: "150 / 3 = 50 km/h.", marks: 1 },
      { type: "MCQ", text: "Next number: 3, 9, 27, 81, ?", options: ["162", "200", "243", "250"], correctAnswer: "243", explanation: "Each term multiplies by 3: 81 × 3 = 243.", marks: 1, topic: "Number Series" },
      { type: "MCQ", text: "20% of 250 is?", options: ["40", "45", "50", "60"], correctAnswer: "50", explanation: "0.20 × 250 = 50.", marks: 1 },
      { type: "MCQ", text: "If 5 workers finish a task in 12 days, how many days will 10 workers take (same rate)?", options: ["3", "6", "8", "10"], correctAnswer: "6", explanation: "Double the workers halves the time: 12 / 2 = 6.", marks: 1, topic: "Time & Work" },
      { type: "MCQ", text: "The ratio 4:5 is equivalent to?", options: ["8:10", "4:10", "5:8", "10:8"], correctAnswer: "8:10", explanation: "Multiplying both terms by 2 preserves the ratio.", marks: 1 },
    ],
  },
  {
    title: "OOP & DBMS Practice",
    skill: "Technical",
    category: "TECHNICAL",
    difficulty: "EASY",
    timeLimitMinutes: 15,
    isPractice: true,
    topic: "OOP Principles",
    questions: [
      { type: "MCQ", text: "Which OOP concept hides internal implementation details behind access modifiers?", options: ["Inheritance", "Encapsulation", "Polymorphism", "Abstraction"], correctAnswer: "Encapsulation", explanation: "Encapsulation bundles data and restricts direct access to it.", marks: 1, topic: "OOP Principles" },
      { type: "MCQ", text: "A primary key in a database must be:", options: ["Unique and not null", "Always a string", "Always auto-incremented", "Nullable"], correctAnswer: "Unique and not null", explanation: "Primary keys uniquely identify each row and cannot be null.", marks: 1, topic: "DBMS Fundamentals" },
      { type: "MCQ", text: "What does polymorphism allow?", options: ["One interface, multiple implementations", "Only single inheritance", "Hiding all data", "No method overriding"], correctAnswer: "One interface, multiple implementations", explanation: "Polymorphism lets the same interface behave differently by type.", marks: 1, topic: "OOP Principles" },
      { type: "MCQ", text: "A foreign key is used to:", options: ["Encrypt a column", "Link two tables together", "Delete duplicate rows", "Automatically speed up all queries"], correctAnswer: "Link two tables together", explanation: "Foreign keys enforce relationships between tables.", marks: 1, topic: "DBMS Fundamentals" },
      { type: "MCQ", text: "Which of these directly supports multiple inheritance?", options: ["Java classes", "Python classes", "C classes", "SQL tables"], correctAnswer: "Python classes", explanation: "Python allows a class to inherit from multiple base classes.", marks: 1, topic: "OOP Principles" },
    ],
  },
  {
    title: "Python Practice",
    skill: "Python",
    category: "ROLE_SPECIFIC",
    difficulty: "EASY",
    timeLimitMinutes: 15,
    isPractice: true,
    topic: "Data Types",
    questions: [
      { type: "CODE_OUTPUT", text: "What is printed by: print(3 + 2 * 2)", correctAnswer: "7", explanation: "Multiplication has higher precedence: 2*2=4, then 3+4=7.", marks: 1 },
      { type: "MCQ", text: "Which data type is immutable in Python?", options: ["list", "dict", "tuple", "set"], correctAnswer: "tuple", explanation: "Tuples cannot be modified after creation.", marks: 1, topic: "Data Types" },
      { type: "MCQ", text: "What does 'pip' do in Python?", options: ["A loop keyword", "Python's package installer", "A data type", "A testing framework"], correctAnswer: "Python's package installer", explanation: "pip installs packages from PyPI.", marks: 1 },
      { type: "CODE_OUTPUT", text: "What is printed by: print(len('placement'))", correctAnswer: "9", explanation: "'placement' has 9 characters.", marks: 1 },
      { type: "MCQ", text: "Which of these creates a list comprehension?", options: ["[x for x in range(5)]", "for x in range(5): x", "list(range(5)).comp()", "{x for x in range(5)}.list()"], correctAnswer: "[x for x in range(5)]", explanation: "List comprehensions use [expr for item in iterable].", marks: 1 },
    ],
  },
  {
    title: "SQL Joins Practice",
    skill: "SQL",
    category: "ROLE_SPECIFIC",
    difficulty: "EASY",
    timeLimitMinutes: 15,
    isPractice: true,
    topic: "Joins",
    questions: [
      { type: "MCQ", text: "Which JOIN returns only matching rows from both tables?", options: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"], correctAnswer: "INNER JOIN", explanation: "INNER JOIN keeps only rows with a match on both sides.", marks: 1, topic: "Joins" },
      { type: "MCQ", text: "Which JOIN returns all rows from both tables, matched or not?", options: ["INNER JOIN", "FULL OUTER JOIN", "LEFT JOIN", "RIGHT JOIN"], correctAnswer: "FULL OUTER JOIN", explanation: "FULL OUTER JOIN keeps unmatched rows from both sides, filled with NULLs.", marks: 1, topic: "Joins" },
      { type: "MCQ", text: "A self-join is used to:", options: ["Join a table to itself", "Join two databases", "Delete a table", "Create an index"], correctAnswer: "Join a table to itself", explanation: "Self-joins compare rows within the same table.", marks: 1, topic: "Joins" },
      { type: "MCQ", text: "GROUP BY is typically used with:", options: ["Aggregate functions like COUNT/SUM/AVG", "DELETE statements only", "CREATE TABLE", "DROP TABLE"], correctAnswer: "Aggregate functions like COUNT/SUM/AVG", explanation: "GROUP BY buckets rows for aggregate calculations.", marks: 1, topic: "Aggregations" },
      { type: "MCQ", text: "What does a CROSS JOIN produce?", options: ["The Cartesian product of two tables", "Only matching rows", "No rows", "A single row"], correctAnswer: "The Cartesian product of two tables", explanation: "CROSS JOIN pairs every row of one table with every row of the other.", marks: 1, topic: "Joins" },
    ],
  },
];

// ── Learning resources ───────────────────────────────────────────────────────

const RESOURCES: {
  title: string;
  skill: string;
  difficulty: string;
  estimatedMinutes: number;
  url: string;
  description: string;
  resourceType: "ARTICLE" | "VIDEO" | "PRACTICE_SET" | "DOCUMENTATION" | "COURSE";
}[] = [
  { title: "Array Data Structure Guide", skill: "Coding", difficulty: "EASY", estimatedMinutes: 15, url: "https://www.geeksforgeeks.org/array-data-structure/", description: "A concise reference on array operations and complexity.", resourceType: "ARTICLE" },
  { title: "Recursion Explained (freeCodeCamp)", skill: "Coding", difficulty: "MEDIUM", estimatedMinutes: 20, url: "https://www.youtube.com/watch?v=Mv9NEXX1VHc", description: "A visual walkthrough of how recursion works.", resourceType: "VIDEO" },
  { title: "freeCodeCamp: Coding Interview Prep", skill: "Coding", difficulty: "MEDIUM", estimatedMinutes: 240, url: "https://www.freecodecamp.org/learn/coding-interview-prep/", description: "Free, self-paced DSA and interview-prep curriculum.", resourceType: "COURSE" },
  { title: "IndiaBix Quantitative Aptitude", skill: "Aptitude", difficulty: "MEDIUM", estimatedMinutes: 30, url: "https://www.indiabix.com/aptitude/questions-and-answers/", description: "Free practice questions across all major aptitude topics.", resourceType: "PRACTICE_SET" },
  { title: "IndiaBix Logical Reasoning", skill: "Aptitude", difficulty: "EASY", estimatedMinutes: 20, url: "https://www.indiabix.com/logical-reasoning/questions-and-answers/", description: "Practice sets for logical and analytical reasoning.", resourceType: "PRACTICE_SET" },
  { title: "OOP Concepts Explained", skill: "Technical", difficulty: "EASY", estimatedMinutes: 15, url: "https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/", description: "A beginner-friendly overview of OOP principles.", resourceType: "ARTICLE" },
  { title: "Database Normalization Guide", skill: "Technical", difficulty: "MEDIUM", estimatedMinutes: 20, url: "https://www.geeksforgeeks.org/normal-forms-in-dbms/", description: "1NF through BCNF explained with examples.", resourceType: "ARTICLE" },
  { title: "Operating Systems Basics", skill: "Technical", difficulty: "MEDIUM", estimatedMinutes: 25, url: "https://www.geeksforgeeks.org/operating-systems/", description: "Core OS concepts: processes, threads, scheduling, memory.", resourceType: "ARTICLE" },
  { title: "Effective Communication Skills", skill: "Communication", difficulty: "EASY", estimatedMinutes: 15, url: "https://www.mindtools.com/CommSkll/CommunicationIntro.htm", description: "Foundational communication techniques for the workplace.", resourceType: "ARTICLE" },
  { title: "The STAR Interview Method", skill: "Interview", difficulty: "EASY", estimatedMinutes: 10, url: "https://www.themuse.com/advice/star-interview-method", description: "How to structure behavioral interview answers.", resourceType: "ARTICLE" },
  { title: "Common Interview Questions Guide", skill: "Interview", difficulty: "MEDIUM", estimatedMinutes: 30, url: "https://www.glassdoor.com/blog/guide/common-interview-questions/", description: "A practice list of frequently asked interview questions.", resourceType: "PRACTICE_SET" },
  { title: "Resume Writing Tips for Freshers", skill: "Resume", difficulty: "EASY", estimatedMinutes: 15, url: "https://www.naukri.com/campus/resume-writing-tips-for-freshers", description: "Practical resume advice for first-time job seekers.", resourceType: "ARTICLE" },
  { title: "Python for Everybody", skill: "Python", difficulty: "MEDIUM", estimatedMinutes: 300, url: "https://www.py4e.com/", description: "A free, complete introductory Python course.", resourceType: "COURSE" },
  { title: "W3Schools SQL Tutorial", skill: "SQL", difficulty: "EASY", estimatedMinutes: 30, url: "https://www.w3schools.com/sql/", description: "An interactive reference for SQL syntax and practice.", resourceType: "DOCUMENTATION" },
  { title: "MDN Web Docs: Learn Web Development", skill: "Frontend Development", difficulty: "MEDIUM", estimatedMinutes: 60, url: "https://developer.mozilla.org/en-US/docs/Learn", description: "Mozilla's free, comprehensive front-end curriculum.", resourceType: "DOCUMENTATION" },
  { title: "Software Testing Fundamentals", skill: "QA Testing", difficulty: "EASY", estimatedMinutes: 20, url: "https://www.guru99.com/software-testing.html", description: "An introduction to manual and automated testing concepts.", resourceType: "ARTICLE" },
];

// ── Demo student roster ──────────────────────────────────────────────────────

type Archetype = "high_primary_low_comm" | "low_primary_high_comm" | "low_aptitude_high_technical" | "balanced" | "strong_overall" | "weak_overall";

interface StudentSeed {
  name: string;
  rollSuffix: string;
  deptCode: string;
  year: number;
  cgpa: number;
  roleName: string;
  archetype: Archetype;
}

const STUDENT_ROSTER: StudentSeed[] = [
  { name: "Priya Sharma", rollSuffix: "002", deptCode: "CSE", year: 3, cgpa: 8.9, roleName: "Software Developer", archetype: "low_primary_high_comm" },
  { name: "Rahul Verma", rollSuffix: "003", deptCode: "CSE", year: 4, cgpa: 7.4, roleName: "Software Developer", archetype: "high_primary_low_comm" },
  { name: "Ananya Iyer", rollSuffix: "004", deptCode: "CSE", year: 3, cgpa: 9.2, roleName: "Data Analyst", archetype: "strong_overall" },
  { name: "Vikram Singh", rollSuffix: "005", deptCode: "CSE", year: 2, cgpa: 6.5, roleName: "Software Developer", archetype: "weak_overall" },
  { name: "Sneha Reddy", rollSuffix: "006", deptCode: "ECE", year: 3, cgpa: 8.1, roleName: "QA Engineer", archetype: "balanced" },
  { name: "Karthik Nair", rollSuffix: "007", deptCode: "ECE", year: 4, cgpa: 7.8, roleName: "Frontend Developer", archetype: "low_aptitude_high_technical" },
  { name: "Divya Menon", rollSuffix: "008", deptCode: "CSE", year: 3, cgpa: 8.6, roleName: "Data Analyst", archetype: "high_primary_low_comm" },
  { name: "Aditya Kapoor", rollSuffix: "009", deptCode: "CSE", year: 2, cgpa: 7.0, roleName: "Backend Developer", archetype: "weak_overall" },
  { name: "Ishita Gupta", rollSuffix: "010", deptCode: "EEE", year: 3, cgpa: 8.3, roleName: "HR", archetype: "low_primary_high_comm" },
  { name: "Rohan Malhotra", rollSuffix: "011", deptCode: "CSE", year: 4, cgpa: 8.8, roleName: "Software Developer", archetype: "strong_overall" },
  { name: "Kavya Pillai", rollSuffix: "012", deptCode: "ECE", year: 3, cgpa: 7.6, roleName: "QA Engineer", archetype: "balanced" },
  { name: "Arjun Rao", rollSuffix: "013", deptCode: "CSE", year: 2, cgpa: 6.9, roleName: "Frontend Developer", archetype: "low_aptitude_high_technical" },
  { name: "Meera Krishnan", rollSuffix: "014", deptCode: "CSE", year: 3, cgpa: 9.0, roleName: "Data Analyst", archetype: "strong_overall" },
  { name: "Siddharth Joshi", rollSuffix: "015", deptCode: "EEE", year: 4, cgpa: 7.2, roleName: "Backend Developer", archetype: "high_primary_low_comm" },
  { name: "Tanvi Deshpande", rollSuffix: "016", deptCode: "CSE", year: 2, cgpa: 8.0, roleName: "Software Developer", archetype: "balanced" },
  { name: "Nikhil Chawla", rollSuffix: "017", deptCode: "CSE", year: 3, cgpa: 6.2, roleName: "Software Developer", archetype: "weak_overall" },
  { name: "Pooja Bhatt", rollSuffix: "018", deptCode: "ECE", year: 4, cgpa: 8.4, roleName: "HR", archetype: "strong_overall" },
  { name: "Manish Kumar", rollSuffix: "019", deptCode: "CSE", year: 3, cgpa: 7.5, roleName: "Backend Developer", archetype: "low_aptitude_high_technical" },
  { name: "Sanya Kapoor", rollSuffix: "020", deptCode: "EEE", year: 2, cgpa: 7.9, roleName: "QA Engineer", archetype: "low_primary_high_comm" },
  { name: "Devansh Pandey", rollSuffix: "021", deptCode: "CSE", year: 4, cgpa: 8.7, roleName: "Frontend Developer", archetype: "strong_overall" },
  { name: "Ritika Saxena", rollSuffix: "022", deptCode: "CSE", year: 3, cgpa: 6.8, roleName: "Data Analyst", archetype: "weak_overall" },
  { name: "Aman Tripathi", rollSuffix: "023", deptCode: "ECE", year: 2, cgpa: 7.3, roleName: "Software Developer", archetype: "balanced" },
  { name: "Neha Agarwal", rollSuffix: "024", deptCode: "CSE", year: 3, cgpa: 8.5, roleName: "HR", archetype: "balanced" },
];

const PRIMARY_SKILL_BY_ROLE: Record<string, string> = {
  "Software Developer": "Coding",
  "Backend Developer": "Coding",
  "Frontend Developer": "Frontend Development",
  "QA Engineer": "QA Testing",
  "Data Analyst": "SQL",
  HR: "Communication",
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scoreForSkill(archetype: Archetype, skillName: string, primarySkill: string): number {
  const isPrimary = skillName === primarySkill;
  const isCommunication = skillName === "Communication";
  switch (archetype) {
    case "strong_overall":
      return randInt(78, 92);
    case "weak_overall":
      return randInt(32, 52);
    case "high_primary_low_comm":
      if (isPrimary) return randInt(80, 93);
      if (isCommunication) return randInt(32, 48);
      return randInt(55, 70);
    case "low_primary_high_comm":
      if (isPrimary) return randInt(28, 46);
      if (isCommunication) return randInt(80, 93);
      return randInt(55, 70);
    case "low_aptitude_high_technical":
      if (skillName === "Aptitude") return randInt(30, 48);
      if (skillName === "Technical") return randInt(80, 92);
      return randInt(55, 70);
    case "balanced":
    default:
      return randInt(58, 72);
  }
}

async function main() {
  console.log("Seeding database…");

  // ── Departments ──
  const departments = new Map<string, string>();
  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      create: d,
      update: { name: d.name },
    });
    departments.set(d.code, dept.id);
  }

  // ── Skills ──
  const skills = new Map<string, string>();
  for (const s of SKILLS) {
    const skill = await prisma.skill.upsert({
      where: { name: s.name },
      create: s,
      update: { category: s.category },
    });
    skills.set(s.name, skill.id);
  }

  // ── Job roles + weights ──
  const jobRoles = new Map<string, string>();
  for (const r of JOB_ROLES) {
    const role = await prisma.jobRole.upsert({
      where: { name: r.name },
      create: { name: r.name, description: r.description },
      update: { description: r.description },
    });
    jobRoles.set(r.name, role.id);

    for (const w of r.weights) {
      const skillId = skills.get(w.skill)!;
      await prisma.jobRoleSkill.upsert({
        where: { jobRoleId_skillId: { jobRoleId: role.id, skillId } },
        create: { jobRoleId: role.id, skillId, weight: w.weight, minimumTarget: w.target },
        update: { weight: w.weight, minimumTarget: w.target },
      });
    }
  }

  // ── Assessments + questions ──
  const assessmentIds = new Map<string, string>(); // title -> id
  for (const a of ASSESSMENTS) {
    const skillId = skills.get(a.skill)!;
    const totalMarks = a.questions.reduce((sum, q) => sum + (q.marks ?? 1), 0);

    let assessment = await prisma.assessment.findFirst({ where: { title: a.title } });
    if (!assessment) {
      assessment = await prisma.assessment.create({
        data: {
          title: a.title,
          category: a.category,
          skillId,
          difficulty: a.difficulty,
          timeLimitMinutes: a.timeLimitMinutes,
          totalMarks,
          isPractice: a.isPractice,
          topic: a.topic,
        },
      });
      for (const q of a.questions) {
        await prisma.question.create({
          data: {
            assessmentId: assessment.id,
            skillId,
            type: q.type,
            text: q.text,
            options: q.options ?? undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            marks: q.marks ?? 1,
            difficulty: q.difficulty ?? a.difficulty,
            topic: q.topic ?? a.topic,
          },
        });
      }
    }
    assessmentIds.set(a.title, assessment.id);
  }

  // ── Learning resources ──
  for (const r of RESOURCES) {
    const skillId = skills.get(r.skill)!;
    const existing = await prisma.learningResource.findFirst({ where: { title: r.title } });
    if (!existing) {
      await prisma.learningResource.create({
        data: {
          title: r.title,
          skillId,
          difficulty: r.difficulty,
          estimatedMinutes: r.estimatedMinutes,
          url: r.url,
          description: r.description,
          resourceType: r.resourceType,
        },
      });
    }
  }

  // ── Faculty demo account ──
  const facultyPassword = await hash("faculty123");
  const facultyUser = await prisma.user.upsert({
    where: { email: "faculty@demo.com" },
    create: {
      name: "Dr. Meera Nair",
      email: "faculty@demo.com",
      passwordHash: facultyPassword,
      role: "FACULTY",
    },
    update: {},
  });
  await prisma.faculty.upsert({
    where: { userId: facultyUser.id },
    create: { userId: facultyUser.id, departmentId: departments.get("CSE"), title: "Placement Officer" },
    update: {},
  });

  // ── Flagship demo student: Arjun Kumar ──
  const studentPassword = await hash("student123");
  const softwareDevRoleId = jobRoles.get("Software Developer")!;

  const arjunUser = await prisma.user.upsert({
    where: { email: "student@demo.com" },
    create: { name: "Arjun Kumar", email: "student@demo.com", passwordHash: studentPassword, role: "STUDENT" },
    update: {},
  });
  const arjun = await prisma.student.upsert({
    where: { userId: arjunUser.id },
    create: {
      userId: arjunUser.id,
      rollNumber: "CSE2023001",
      departmentId: departments.get("CSE")!,
      year: 3,
      semester: 5,
      cgpa: 7.8,
      preferredRoleId: softwareDevRoleId,
      profileCompletion: 100,
    },
    update: { preferredRoleId: softwareDevRoleId, profileCompletion: 100 },
  });

  const arjunScores: Record<string, { current: number; previous: number; dataPoints: number }> = {
    Coding: { current: 48, previous: 52, dataPoints: 4 },
    Aptitude: { current: 82, previous: 78, dataPoints: 3 },
    Technical: { current: 61, previous: 58, dataPoints: 3 },
    Communication: { current: 76, previous: 74, dataPoints: 3 },
    Interview: { current: 51, previous: 55, dataPoints: 2 },
  };
  for (const [skillName, s] of Object.entries(arjunScores)) {
    await prisma.studentSkill.upsert({
      where: { studentId_skillId: { studentId: arjun.id, skillId: skills.get(skillName)! } },
      create: {
        studentId: arjun.id,
        skillId: skills.get(skillName)!,
        currentScore: s.current,
        previousScore: s.previous,
        dataPoints: s.dataPoints,
        lastAssessedAt: new Date(),
      },
      update: { currentScore: s.current, previousScore: s.previous, dataPoints: s.dataPoints },
    });
  }

  // Historical readiness snapshots + coding progress trend for Arjun's Progress page.
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const readinessHistory = [
    { score: 52.0, confidence: 45, daysAgo: 35 },
    { score: 58.4, confidence: 55, daysAgo: 24 },
    { score: 61.2, confidence: 65, daysAgo: 12 },
  ];
  for (const h of readinessHistory) {
    await prisma.readinessSnapshot.create({
      data: {
        studentId: arjun.id,
        score: h.score,
        confidence: h.confidence,
        breakdown: {},
        createdAt: new Date(now - h.daysAgo * day),
      },
    });
  }
  const codingHistory = [
    { score: 40, daysAgo: 35 },
    { score: 44, daysAgo: 24 },
    { score: 52, daysAgo: 12 },
    { score: 48, daysAgo: 1 },
  ];
  for (const c of codingHistory) {
    await prisma.progressRecord.create({
      data: {
        studentId: arjun.id,
        skillId: skills.get("Coding"),
        score: c.score,
        source: "assessment",
        recordedAt: new Date(now - c.daysAgo * day),
      },
    });
  }

  // A couple of real, gradeable assessment attempts for Arjun so the demo
  // flow ("submit → skill updates → readiness recalculates") is genuine.
  const codingAssessment = await prisma.assessment.findFirst({
    where: { title: "Coding Fundamentals Assessment" },
    include: { questions: true },
  });
  if (codingAssessment) {
    const existingAttempt = await prisma.assessmentAttempt.findFirst({
      where: { studentId: arjun.id, assessmentId: codingAssessment.id },
    });
    if (!existingAttempt) {
      const attempt = await prisma.assessmentAttempt.create({
        data: {
          studentId: arjun.id,
          assessmentId: codingAssessment.id,
          submittedAt: new Date(now - 12 * day),
          rawScore: 2,
          totalMarks: codingAssessment.totalMarks,
          percentage: 40,
          previousPercentage: null,
          improvementPct: null,
        },
      });
      for (const [i, q] of codingAssessment.questions.entries()) {
        const isCorrect = i < 2; // first two correct, rest wrong -> matches ~40%
        await prisma.assessmentAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: q.id,
            answerText: isCorrect ? q.correctAnswer : "N/A",
            isCorrect,
            marksAwarded: isCorrect ? q.marks : 0,
          },
        });
      }
    }
  }

  // A completed recommendation with feedback, to demonstrate the
  // recommendation-effectiveness / feedback loop.
  await prisma.recommendation.create({
    data: {
      studentId: arjun.id,
      primaryGap: "Coding",
      secondaryGap: "Interview",
      reason:
        "Coding is your largest role-weighted skill gap for Software Developer (currently 48% vs a target of 75%) and has remained below target across your last two assessments.",
      nextBestAction: "Complete a focused Coding practice session: 5 Arrays questions, 3 Strings questions, and 1 timed problem.",
      practiceType: "coding_practice",
      estimatedMinutes: 30,
      priority: "HIGH",
      learningTopics: ["Arrays", "Strings", "Recursion"],
      successMetric: "Raise Coding from 48% toward 75% on your next assessment.",
      source: "FALLBACK",
      status: "COMPLETED",
      skillScoreBefore: 40,
      skillScoreAfter: 48,
      feedbackRating: 4,
      feedbackComment: "The array questions were a good warm-up before the timed problem.",
      createdAt: new Date(now - 10 * day),
      completedAt: new Date(now - 9 * day),
    },
  });

  await prisma.studentBadge.upsert({
    where: { studentId_code: { studentId: arjun.id, code: "FIRST_ASSESSMENT" } },
    create: { studentId: arjun.id, code: "FIRST_ASSESSMENT", title: "First Assessment" },
    update: {},
  });

  console.log("Seeded flagship demo student: student@demo.com / student123 (Arjun Kumar)");
  console.log("Seeded faculty demo account: faculty@demo.com / faculty123 (Dr. Meera Nair)");

  // ── Additional roster for a meaningful faculty dashboard ──
  for (const s of STUDENT_ROSTER) {
    const email = `${s.name.toLowerCase().replace(/\s+/g, ".")}@demo.college.edu`;
    const user = await prisma.user.upsert({
      where: { email },
      create: { name: s.name, email, passwordHash: studentPassword, role: "STUDENT" },
      update: {},
    });
    const roleId = jobRoles.get(s.roleName)!;
    const student = await prisma.student.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        rollNumber: `${s.deptCode}2023${s.rollSuffix}`,
        departmentId: departments.get(s.deptCode)!,
        year: s.year,
        semester: s.year * 2 - randInt(0, 1),
        cgpa: s.cgpa,
        preferredRoleId: roleId,
        profileCompletion: randInt(70, 100),
      },
      update: { preferredRoleId: roleId },
    });

    const roleWeights = JOB_ROLES.find((r) => r.name === s.roleName)!.weights;
    const primarySkill = PRIMARY_SKILL_BY_ROLE[s.roleName];

    for (const w of roleWeights) {
      const current = scoreForSkill(s.archetype, w.skill, primarySkill);
      const trendDelta = randInt(-8, 8);
      const previous = Math.max(0, Math.min(100, current - trendDelta));
      await prisma.studentSkill.upsert({
        where: { studentId_skillId: { studentId: student.id, skillId: skills.get(w.skill)! } },
        create: {
          studentId: student.id,
          skillId: skills.get(w.skill)!,
          currentScore: current,
          previousScore: previous,
          dataPoints: randInt(2, 5),
          lastAssessedAt: new Date(now - randInt(1, 30) * day),
        },
        update: { currentScore: current, previousScore: previous },
      });
    }

    // A readiness snapshot so this student contributes to progress-over-time
    // aggregates too, without needing a live assessment attempt.
    await prisma.progressRecord.create({
      data: { studentId: student.id, score: randInt(45, 90), source: "readiness", recordedAt: new Date(now - randInt(1, 20) * day) },
    });
  }

  console.log(`Seeded ${STUDENT_ROSTER.length} additional students across ${DEPARTMENTS.length} departments.`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
