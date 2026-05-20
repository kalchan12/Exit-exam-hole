-- SQL Script to insert Exit Exam 2018 (Mid Semester) questions
-- Run this in Supabase Dashboard → SQL Editor

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q1', 'Consider the following CSS snippet:

```css
nav ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
}
```

What problem does this solve when creating a navigation bar?', '["Removes bullet points and default spacing, allowing custom layout","Aligns the navbar to the right of the page","Adds hover effects to list items","Converts the list into a dropdown menu"]'::jsonb, 'Removes bullet points and default spacing, allowing custom layout.', 'Removes bullet points and default spacing, allowing custom layout.', 'Web Development', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q2', 'Which AI approach most directly supports understanding biological intelligence behavior as a scientific goal?', '["Weak AI","Applied AI","Cognitive AI","Strong AI"]'::jsonb, 'Cognitive AI', 'Cognitive AI focuses on understanding and modeling human thought processes.', 'Artificial Intelligence', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q3', 'In client-server database architecture, what is the primary role of the server?', '["Provide the GUI for end users","Initiate all network connections and poll clients for updates","Store and manage shared data, enforce ACID properties, and process client requests","Cache all user sessions locally for offline access"]'::jsonb, 'Store and manage shared data, enforce ACID properties, and process client requests.', 'The server in a client-server architecture manages data storage, processing queries, and enforcing constraints like ACID properties.', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q4', 'Which automaton is powerful enough to recognize the language L = {aⁿbⁿcⁿ | n ≥ 1}?', '["DFA","Linear Bounded Automaton (LBA)","NFA","Pushdown Automaton (PDA)"]'::jsonb, 'Linear Bounded Automaton (LBA)', 'Context-sensitive languages like {aⁿbⁿcⁿ | n ≥ 1} are recognized by Linear Bounded Automata (LBA).', 'Automata Theory', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q5', 'In two-phase locking (2PL), during which phase may a transaction acquire locks but not release any?', '["Growing phase","Commit phase","Validation phase","Shrinking phase"]'::jsonb, 'Growing phase', 'In 2PL, the growing phase allows acquiring new locks but prevents releasing any locks.', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q6', 'To extend the connectivity of processor bus we use:', '["SCSI","PCI","Controllers","Multi bus"]'::jsonb, 'Multi bus', 'Multiple buses (Multi bus) architectures are used to extend processor bus connectivity.', 'Computer Architecture', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q7', 'Combinational circuit differ from sequential circuit primarily because', '["Combinational circuit cannot be built using logic circuit","The output of combinational circuit depends only on the present input, not on past output.","Sequential circuit have no feedback while combinational circuit do","The combinational circuit requires clock signal, but sequential circuit do not"]'::jsonb, 'The output of combinational circuit depends only on the present input, not on past output.', 'Combinational circuits have no memory components; their output is strictly a function of the current input.', 'Digital Logic', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q8', 'Why is Greedy Best-First Search not guaranteed to be optimal or complete?', '["It ignores path cost g(n) and relies only on h(n)","It always chooses the shallowest node","It expands nodes in FIFO order","It requires full knowledge of the goal state in advance"]'::jsonb, 'It ignores path cost g(n) and relies only on h(n).', 'Greedy search only looks at the heuristic h(n) and ignores the cost g(n) accumulated so far, which can lead it down sub-optimal paths or infinite loops.', 'Artificial Intelligence', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q9', 'From the following statement which is correct about this pointer in c++?', '["This pointer passed as hidden argument in all non-static variables of the class.","This pointer passed as hidden argument in all static variables of the class.","This pointer passed as hidden argument in all static function of the class.","This pointer passed as hidden argument in all function of the class."]'::jsonb, 'This pointer passed as hidden argument in all non-static variables of the class.', 'The ''this'' pointer is implicitly passed to non-static member functions, representing the instance calling the method.', 'Programming', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q10', 'In class diagram, if class Car has solid diamond points to class Engine, what does this indicates?', '["Car uses Engine temporarily","Engine can exist independently of the Car","Engine is the part of Car and cannot exist without it","Car inherits from Engine"]'::jsonb, 'Engine is the part of Car and cannot exist without it.', 'A solid diamond represents Composition, meaning the part (Engine) cannot exist independently of the whole (Car).', 'Software Engineering', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q11', 'The amount of time the algorithm takes on the smallest possible set of inputs is called_____', '["Average time","Small time","Worst time","Best time"]'::jsonb, 'Best time', 'Best time', 'Algorithms', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q12', 'For a weak entity set to be meaningful, it must be associated with another entity set, called the', '["Identifying set","Strong entity set","Neighbor set","Owner set"]'::jsonb, 'Strong entity set', 'Strong entity set', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q13', 'Which one of the following is not the application level service?', '["Proxies and agents","Installing a new service","E-mail configuration","Quality of service"]'::jsonb, 'Installing a new service', 'Installing a new service', 'Networking', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q14', 'A language that allows the DBA or user to describe and name the entities, attributes, and relationships required for the application is__________', '["Transaction control language (TCL)","Data control language (DCL)","Data Manipulation Language (DML)","Data Definition Language (DDL)"]'::jsonb, 'Data Definition Language (DDL)', 'Data Definition Language (DDL)', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q15', 'Which one of the following is linear data structure?', '["Tree","Array","Queue","Linked list"]'::jsonb, 'Array', 'Array', 'Data Structures', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q16', 'What is the main purpose of syntax-directed translation in a compiler?', '["To interleave semantic analysis with syntax analysis using attributes attached to grammar symbols","To generate optimized machine code directly","To tokenize the source code","To replace the parser with a finite automaton"]'::jsonb, 'To interleave semantic analysis with syntax analysis using attributes attached to grammar symbols.', 'To interleave semantic analysis with syntax analysis using attributes attached to grammar symbols.', 'Compiler Design', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q17', 'What will be the output of the following program segment?

```java
public class Calculation {
    public static void main(String[] args) {
        int sum = 0;
        for(int j = 1; j<=10; j++) {
            sum = sum + j;
        }
        System.out.println(+sum);
    }
}
```', '["55","44","33","66"]'::jsonb, '55', '55', 'Programming', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q18', 'Which keyword is used in Java to create a subclass that inherits from a superclass?', '["Inherits","Superclass","Extends","Implements"]'::jsonb, 'Extends', 'Extends', 'Programming', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q19', 'What is the output of the following C++ code fragment?

```cpp
int a = 6, b = 8;
int x = 2, y = 4;
int c(x > y ? (a--, x) : (b--, y));
cout << "a=" << a;
cout << " b=" << b;
cout << " c=" << c;
```', '["a=6 b=5 c=4","a=6 b=7 c=5","a=8 b=6 c=5","a=6 b=7 c=4"]'::jsonb, 'a=6 b=7 c=4', 'a=6 b=7 c=4', 'Programming', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q20', '___________is a collection of related fields that can be treated as a unit by some application program.', '["Rows","Field","Record","Database"]'::jsonb, 'Record', 'Record', 'Database', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q21', 'Straight directed translation uses:', '["Purely lexical rules","Backtracking algorithms","Grammar without attributes","Grammar with sematic rule"]'::jsonb, 'Grammar with semantic rule', 'Grammar with semantic rule', 'Compiler Design', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q22', 'Which one of the following is the first operation or step in CPU instruction cycle?', '["Executing the instruction","Handling interrupt","Decoding the instruction","Fetching the instruction"]'::jsonb, 'Fetching the instruction', 'Fetching the instruction', 'Computer Architecture', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q23', 'Which search strategy tries to expand the node that is closest to the goal, on the grounds that this is likely to lead to a solution quickly; Thus, it evaluates nodes by using just the heuristic function: f ( n) = h ( n).', '["Uniform-cost search","Greedy best-first search","Depth-first search","A* search"]'::jsonb, 'Greedy best-first search', 'Greedy best-first search', 'Artificial Intelligence', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q24', 'Which one of the following is a top-down parser without backtracking?', '["LR parser","Brute force parser","Operator precedence parser","Predictive parser"]'::jsonb, 'Predictive parser', 'Predictive parser', 'Compiler Design', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q25', 'How many layers are there in OSI reference model?', '["7","6","5","4"]'::jsonb, '7', '7', 'Networking', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q26', 'Which one of the following is a computer structural component that provides for communication among CPU, main memory and I/O?', '["System unit","Computer network","CPU","System interconnection"]'::jsonb, 'System interconnection', 'System interconnection', 'Computer Architecture', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q27', 'Assume that we are able to specify that Mr. Getahun can view the database record, but cannot change the value of the record. Which security management technique was used in this scenario?', '["Access Control","Availability","Non-repudiation","Integrity"]'::jsonb, 'Access Control', 'Access Control', 'Security', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q28', 'Suppose, a developer proposes using deferred update with no checkpoints in a hightransaction OLTP system. What is the most serious drawback?', '["Log scans become prohibitively expensive after long uptime","Increased disk I/O due to frequent page copying","Shared locks cannot be used","View serializability cannot be ensured"]'::jsonb, 'Log scans become prohibitively expensive after long uptime.', 'Log scans become prohibitively expensive after long uptime.', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q29', 'Which one of the following function of operating system is categorized under process management?', '["Allocates the device in the efficient way","De-allocates the resources.","Allocates the memory when the process requests it to do so.","Allocates the processor (CPU) to a process"]'::jsonb, 'Allocates the processor (CPU) to a process.', 'Allocates the processor (CPU) to a process.', 'Operating Systems', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q30', 'Which of the following statements is TRUE?', '["Every regular language is context-free.","Every context-free language is regular.","Every context-sensitive language is regular.","Every recursively enumerable language is recursive"]'::jsonb, 'Every regular language is context-free.', 'Every regular language is context-free.', 'Automata Theory', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q31', '____________ is a data transfer method in computer organization and architecture that allows an I/O device to transfer data directly to or from memory without the involvement of the CPU.', '["Asynchronous data transfer","Direct Memory Access (DMA)","Interrupt-driven transfer","Programmed I/O transfer"]'::jsonb, 'Direct Memory Access (DMA)', 'Direct Memory Access (DMA)', 'Computer Architecture', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q32', 'Which one of the following php method is used to retrieve the information from the form control through the parameters sent in the URL?', '["$_REQUEST[]","$_POST[]","$_GET[]","isset()"]'::jsonb, '$_GET[]', '$_GET[]', 'Web Development', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q33', 'Which statement is NOT true about digital signature?', '["Digital signature is not encryption algorithm","In digital signature Sender encrypts message with its private key","In digital signature Sender encrypts message with its public key","Digital signature provides authentication services"]'::jsonb, 'In digital signature, Sender encrypts message with its public key.', 'In digital signature, Sender encrypts message with its public key.', 'Security', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q34', 'Which one of the following ip address class uses first two octets for network addresses and last two for host addressing?', '["Class C","Class D","Class A","Class B"]'::jsonb, 'Class B', 'Class B', 'Networking', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q35', 'Which of the following best defines a heuristic in the context of AI search?', '["A function that estimates how close a state is to the goal","A guaranteed optimal path to the goal","A method that always avoids revisiting states","A brute-force enumeration of all possible states"]'::jsonb, 'A function that estimates how close a state is to the goal.', 'A function that estimates how close a state is to the goal.', 'Artificial Intelligence', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q36', 'Which one of the following party performs the technical evaluation work, using the evidence supplied by the developers, and additional testing of the product, to confirm that it satisfies the functional and assurance requirements specified in the security target?', '["Evaluator","Certifier","Sponsor","Developer"]'::jsonb, 'Evaluator', 'Evaluator', 'Software Engineering', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q37', 'Assume that you have a huge company like university; bank industry, etc. have their own data center to store and control the different type of the data. Which type of RAID technology is the most preferable to use?', '["RAID level 3","RAID level1","RAID level 2","RAID level 0"]'::jsonb, 'RAID level 1', 'RAID level 1', 'Computer Architecture', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q38', 'Which analysis technique is INAPPROPRIATE for determining the lower bound of comparison-based sorting, and why?', '["Decision tree model — because it assumes only array indexing is allowed","Recurrence relations — because sorting isn’t naturally recursive","Asymptotic analysis — because it ignores constants","Decision tree model — because it gives an information-theoretic lower bound of Ω(nlogn)"]'::jsonb, 'Recurrence relations — because sorting isn’t naturally recursive.', 'Recurrence relations — because sorting isn’t naturally recursive.', 'Algorithms', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q39', 'In CSS, which property is used to change the text color of an element?', '["text-color","font-color","color","Foreground"]'::jsonb, 'color', 'color', 'Web Development', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q40', 'From the flowing function which one is used to create the table', '["CREATE table_name (column_name, column type);","CREATE table_name (column_type, column name);","CREATE TABLE table_name (column_name, column type);","CREATE TABLE table_name (column_type, column name);"]'::jsonb, 'CREATE TABLE table_name (column_name, column type);', 'CREATE TABLE table_name (column_name, column type);', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q41', 'What is the primary function of an operating system?', '["To connect to the internet","To create documents and spreadsheets","To design computer hardware","To act as an intermediary between users and computer hardware"]'::jsonb, 'To act as an intermediary between users and computer hardware.', 'To act as an intermediary between users and computer hardware.', 'Operating Systems', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q42', 'How much time units or T( n) taken to compute the following piece of code?

```cpp
int total(int n) {
    int sum = 0;
    for (int i = 1; i <= n; i++)
        sum = sum + 1;
    return sum;
}
```', '["5n+5","4n2+4","6n+2","4n+4"]'::jsonb, '6n+2', '6n+2', 'Algorithms', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q43', 'An object oriented principle that contains information in an object, exposing only selected information is____________.', '["Abstraction","Inheritance","Polymorphism","Encapsulation"]'::jsonb, 'Encapsulation', 'Encapsulation', 'Programming', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q44', 'Stack is follows ____policy:', '["LIFO","FIFO","FILO","FCFS"]'::jsonb, 'LIFO', 'LIFO', 'Data Structures', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q45', 'From the following alternatives which one is FALSE about database system?', '["It is very difficult to protect a file under the system","In database system the user is not required to write the procedures","In database system, DBMS provides a good protection mechanism.","It contains a wide variety of sophisticated techniques to store and retrieve the data."]'::jsonb, 'It is very difficult to protect a file under the system.', 'It is very difficult to protect a file under the system.', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q46', 'Which one of the following is categorized under Log based Recovery Techniques in database?', '["Recovery in Multi-database Systems","ARIES Recovery Algorithm","Shadow Paging Technique","Deferred Database Modification"]'::jsonb, 'ARIES Recovery Algorithm', 'ARIES Recovery Algorithm', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q47', 'What is the first step to convert context free grammar (CFG) into Greibach Normal Form (GNF)?', '["Convert the grammar into CNF","If any production rule in the grammar is not in GNF form, convert it.","Convert the grammar into GNF","If the grammar exists left recursion, eliminate it."]'::jsonb, 'If the grammar exists left recursion, eliminate it.', 'If the grammar exists left recursion, eliminate it.', 'Automata Theory', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q48', 'A user installs a new printer. The OS automatically detects and configures it. This is an example of:', '["Plug-and-play functionality","Manual driver installation","Manual hardware management","Resource allocation"]'::jsonb, 'Plug-and-play functionality', 'Plug-and-play functionality', 'Operating Systems', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q49', 'Which of the following is NOT property of an algorithm?', '["Finiteness","Definiteness","Correctness","Platform dependence"]'::jsonb, 'Platform dependence', 'Platform dependence', 'Algorithms', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q50', 'Which Redundant Array of Independent Disks (RAID) is known by striping with parity and fault tolerance?', '["RAID 2","RAID 1","RAID 5","RAID 0"]'::jsonb, 'RAID 5', 'RAID 5', 'Computer Architecture', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q51', 'Assume that you are computer science expert and you need to develop large programs within short period of time. Finally, you have planned to provide portable program to the concerned body. Which type of programming language is preferable for the above scenario?', '["Low level","Machine level","High level","Assembly"]'::jsonb, 'High level', 'High level', 'Programming', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q52', 'Which type of heuristic search strategy that evaluates nodes by combining g ( n), the cost to reach the node, and h ( n.), the cost to get from the node to the goal: f ( n) = g ( n) + h ( n) Since g( n) gives the path cost from the start node to node n, and h( n) is the estimated cost of the cheapest path from n to the goal, we have f ( n) = estimated cost of the cheapest solution through n ?', '["A* search","Greedy Best-First Search","Uniform-cost search","Depth-first search"]'::jsonb, 'A* search', 'A* search', 'Artificial Intelligence', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q53', 'If input is “a” is for syntax tree, which function is used to create tree?', '["mknode(num, value)","mkleaf(num, value)","mkleaf(id, entry)","mknode(op, left, right)"]'::jsonb, 'mknode(op, left, right)', 'mknode(op, left, right)', 'Compiler Design', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q54', 'Suppose Mr. Negesa might act as Mr. Dereje and send message to Registrar X, the registrar might be lead to believe that message indeed come from Mr. Dereje. What types of attack Mr. Negesa has committed?', '["Denial of service","Modification of message","Masquerade","Replay"]'::jsonb, 'Masquerade', 'Masquerade', 'Security', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q55', 'From the following statement which one is disadvantage of waterfall model?', '["model is simple and easy to understand and use","It is easy manage due to the rigidity of the model","Not suitable for projects where requirements are at a moderate to high risk of changing","In this model phases are processed and completed one at a time"]'::jsonb, 'Not suitable for projects where requirements are at a moderate to high risk of changing.', 'Not suitable for projects where requirements are at a moderate to high risk of changing.', 'Software Engineering', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q56', 'Consider a directed line(->) from the relationship set advisor to both entity sets instructor and student. This indicates _________ cardinality', '["Many to one","Many to many","One to one","One to many"]'::jsonb, 'Many to one', 'Many to one', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q57', 'In a system, resources cannot be forcibly taken from processes; they must be released voluntarily. Which deadlock condition does this represent?', '["No Preemption","Hold and Wait","Mutual Exclusion","Circular Wait"]'::jsonb, 'No Preemption', 'No Preemption', 'Operating Systems', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q58', 'Which statement is WRONGLY described about code generation?', '["Code generation can be considered as the start phase of compilation","The target program is the output of the code generator","The code generation phase needs complete error-free intermediate code as an input requires","It used to produce the target code for three-address statements."]'::jsonb, 'Code generation can be considered as the start phase of compilation.', 'Code generation can be considered as the start phase of compilation.', 'Compiler Design', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q59', '____________is a service that allows organizations and individuals to post a website or a web page onto the Internet.', '["Web hosting","Internet service provider","Web client","Domain name registration"]'::jsonb, 'Web hosting', 'Web hosting', 'Web Development', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q60', 'In singly linked list, the node contains', '["Data and index","Data and one pointer ( the next node)","Only data","Data and two pointers"]'::jsonb, 'Data and one pointer (the next node)', 'Data and one pointer (the next node)', 'Data Structures', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q61', 'Which of the following statement is non-functional requirement?', '["The system allow user to generate PDF report.","The system respond to user’s request within 2 second under normal load","The system allow user to store data on relational database","The system allow user to submit emergency report"]'::jsonb, 'The system respond to user’s request within 2 seconds under normal load.', 'The system respond to user’s request within 2 seconds under normal load.', 'Software Engineering', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q62', 'In object design, what does the contract typically includes?', '["The class diagram and sequence diagram","Project budget and timeline","Invariants, preconditions, post conditions","The use case names and actors role"]'::jsonb, 'Invariants, preconditions, post conditions.', 'Invariants, preconditions, post conditions.', 'Software Engineering', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q63', 'Which of the following OSI layers is NOT correctly matched to its corresponding data Units (PDU)?', '["Application layer ---> Data","Transport layer ---> Segment","Physical layer ---> Bit","Network layer ---> Frame"]'::jsonb, 'Network layer ---> Frame.', 'Network layer ---> Frame.', 'Networking', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q64', 'Which data structure follows LIFO principle?', '["Graphs","Queues","Stacks","Trees"]'::jsonb, 'Stacks', 'Stacks', 'Data Structures', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q65', 'Consider the following code snippet

```java
class Animal { void sound() { System.out.println("Animal sound"); } }
class Dog extends Animal { void sound() { System.out.println("Bark!"); } }
```

Which OOP concept is illustrated when Dog provides its own version of sound?', '["Method overriding","Method overloading","Abstraction","Encapsulation"]'::jsonb, 'Method overriding', 'Method overriding', 'Programming', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q66', 'Which type of grammar is used to generate all possible patterns of strings in a given formal language?', '["Context-free","Context-sensitive","Recursively enumerable","Regular"]'::jsonb, 'Recursively enumerable', 'Recursively enumerable', 'Automata Theory', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q67', 'Which tool is used to troubleshoot the network connectivity?', '["Ipconfig","Ping","Encryption","Firewall"]'::jsonb, 'Ping', 'Ping', 'Networking', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q68', 'The time complexity for binary search is__________', '["O(n*log(n )2)","O(n2)","O( n)","O(logn)"]'::jsonb, 'O(log n)', 'O(log n)', 'Algorithms', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q69', 'Which type of access specifier is accessible within the same package or subclasses in a different package?', '["Public","Default","Private","Protected"]'::jsonb, 'Protected', 'Protected', 'Programming', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q70', 'What is the basic goal of Normalization?', '["To decrease data integrity","To reduce redundancy","To maximize transitive dependency","To increase dependency"]'::jsonb, 'To reduce redundancy', 'To reduce redundancy', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q71', 'Which protocol is mostly used for communication between client and server in a web application?', '["FTP","SMTP","HTTP","SSH"]'::jsonb, 'HTTP', 'HTTP', 'Web Development', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q72', 'Which of the following layers is responsible for encryption, translation and compression?', '["Presentation layer","Data link layer","Transport layer","Network layer"]'::jsonb, 'Presentation layer', 'Presentation layer', 'Networking', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q73', 'What is the extension of JavaScript file?', '[".javaS",".JS",".java","CSS"]'::jsonb, '.JS', '.JS', 'Web Development', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q74', 'Why is perception still a challenge for AI—even though systems can recognize faces?', '["Because perception is unrelated to reasoning","Because AI lacks actuators","Because perception requires common-sense knowledge and robust natural language understanding in open ended worlds","Because sensors are too expensive"]'::jsonb, 'Because perception requires common-sense knowledge and robust natural language understanding in open ended worlds.', 'Because perception requires common-sense knowledge and robust natural language understanding in open ended worlds.', 'Artificial Intelligence', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q75', 'Which service used to translate domain names to ip address?', '["HTTPS","DHCP","HTTP","DNS"]'::jsonb, 'DNS', 'DNS', 'Networking', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q76', 'Which one of following monitors incoming and outgoing network traffic and decides whether to allow or block specific traffic based on a defined set of security rules?', '["Intrusion detection system (IDS)","Proxy server","Virtual Private network","Firewall"]'::jsonb, 'Firewall', 'Firewall', 'Security', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q77', 'Consider attributes ID, CITY and NAME. Which one of this can be considered as a super key?', '["NAME","ID","CITY","CITY, ID"]'::jsonb, 'CITY, ID', 'CITY, ID', 'Database', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q78', 'You want to ensure that a method calculateTax() in class Employee cannot be overridden by any subclass. What declaration achieves this?', '["Abstract double calculateTax();","Final double calculateTax(){…}","Private double calculateTax(){…}","Static double calculateTax(){…}"]'::jsonb, 'Final double calculateTax(){…}', 'Final double calculateTax(){…}', 'Programming', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q79', 'Which one of the following identifier name is INVALID in C++ programming language?', '["delete","for_cpp","jan2025","Hello"]'::jsonb, 'delete', 'delete', 'Programming', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q80', 'Which one of the following UML building block that defines the static part of the model and represents physical and conceptual elements?', '["Structural things","Behavioral things","An notational things","Grouping things"]'::jsonb, 'Structural things', 'Structural things', 'Software Engineering', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q81', 'Which scenario is best suited for UDP rather than TCP protocol?', '["Live video streaming","Email transmission","Downloading the files","Database update"]'::jsonb, 'Live video streaming', 'Live video streaming', 'Networking', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q82', 'Which type of transparency in distributed database system distributes a relation into sub relations where each sub relation is defined by a subset of the columns of the original relation?', '["Replication","Location","Horizontal","Vertical"]'::jsonb, 'Vertical', 'Vertical', 'Database', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q83', 'In which of the following Learning methods an agent receives feedback in the form of rewards or penalties to maximize cumulative reward?', '["Supervised learning","Reinforcement learning","Semi-supervised learning","Unsupervised learning"]'::jsonb, 'Reinforcement learning', 'Reinforcement learning', 'Artificial Intelligence', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q84', 'After deploying a new software system, users reports that the system slows during peak hour. Which software quality attribute primarily affected?', '["Maintainability","Performance","Reliability","Usability"]'::jsonb, 'Performance', 'Performance', 'Software Engineering', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q85', 'Which one of the following is WRONGLY stated about an importance of security policy?', '["To help minimize risk.","To ensure the confidentiality, integrity and availability of data.","To coordinate and enforce a security program across an organization.","To use the system in a passive way"]'::jsonb, 'To use the system in a passive way.', 'To use the system in a passive way.', 'Security', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q86', 'Which of the following is NOT a task of the lexical analyzer?', '["Generating parse trees","Correlating errors with line numbers","Entering identifiers into the symbol table","Stripping whitespace and comments"]'::jsonb, 'Generating parse trees', 'Generating parse trees', 'Compiler Design', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q87', 'Which sorting algorithm compares each pair of adjacent elements from the beginning of an array and, if they are in reversed order, swaps them; if at least one swaps has been done, repeat step 1.', '["Insertion sort","Bubble sort","Selection sort","Shell sort"]'::jsonb, 'Bubble sort', 'Bubble sort', 'Algorithms', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q88', 'Which one of the following computer security goal prevents the disclosure of sensitive information to unauthorized users or systems on computer networks?', '["Confidentiality","Integrity","Cyberspace","Availability"]'::jsonb, 'Confidentiality', 'Confidentiality', 'Security', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q89', 'Assume that you have IPv4 addresses in binary notation 11000001 10000011 00011011 11111111 and you are requested to change into dotted decimal notation. What is the equivalent IP address in decimal dotted notation?', '["192.174.27.255","192.134.67.254","193.130.28.254","193.131.27.255"]'::jsonb, '193.131.27.255', '193.131.27.255', 'Networking', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q90', 'ou have given that Grammar G1 −({S, A, B}, {a, b}, S, {S → AB, A → a, B → b}). Which one is terminal symbol in the give?', '["a,b","S","S → AB, A → a, B → b","S,A,B"]'::jsonb, 'a, b', 'a, b', 'Automata Theory', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q91', 'Among the following one is NOT the application of queue in the real world.', '["It is used in operating systems for handling interrupts.","It is used to maintain the play list in media players in order","It is used in Depth First search","It is widely used as waiting lists for a single shared resource"]'::jsonb, 'It is used in Depth First search.', 'It is used in Depth First search.', 'Data Structures', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q92', 'Which one of the following is disadvantage of circuit switching?', '["Predictable performance","Low latency","Guaranteed bandwidth","Limited scalability"]'::jsonb, 'Limited scalability', 'Limited scalability', 'Networking', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q93', 'A developer stores user login status in both
$_SESSION[''user_id''] on the server
document.cookie = "logged_in=1" on the client
An attacker tampers with cookies to set logged_in=1 without authenticating. Which statement is the most accurate?', '["The system is vulnerable — cookie-only checks bypass server session validation","The system is secure — session data cannot be forged without the server-side secret","The system is vulnerable only if session_id is exposed","The system is secure if HTTPS is used,"]'::jsonb, 'The system is vulnerable — cookie-only checks bypass server session validation.', 'The system is vulnerable — cookie-only checks bypass server session validation.', 'Security', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q94', 'The language L = {wwᴿ | w ∈ {a, b}*} (even-length palindromes) is:', '["Regular","Non-deterministic CFL but not deterministic","Deterministic CFL","Context-sensitive but not context-free"]'::jsonb, 'Non-deterministic CFL but not deterministic', 'Non-deterministic CFL but not deterministic', 'Automata Theory', 'hard', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q95', '______________is one of the candidate keys chosen by the database designer to uniquely identify the entity set.', '["Super key","Candidate key","Social security key","Primary key"]'::jsonb, 'Primary key', 'Primary key', 'Database', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q96', 'Which of the following statement about function overloading is TRUE?', '["Overload function have same name but different parameters/type","Overload function is not supported","Overload function must have different return type","Overload function must have the same number of parameters"]'::jsonb, 'Overload function have same name but different parameters/type.', 'Overload function have same name but different parameters/type.', 'Programming', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q97', 'How does an operating system improve efficiency in a multi-user environment?', '["By allowing only one user to access the system at a time","By disabling all background services","By using time-sharing and process scheduling to allocate CPU time fairly among users and processes","By requiring manual intervention for each task"]'::jsonb, 'By using time-sharing and process scheduling to allocate CPU time fairly among users and processes.', 'By using time-sharing and process scheduling to allocate CPU time fairly among users and processes.', 'Operating Systems', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q98', 'Which one of the following is not feature of dynamic web page?', '["Contents can be generated on-the-fly","Changing content or lively","Contain the same prebuilt content each time the page is loaded","Ability to connect to a database"]'::jsonb, 'Contain the same prebuilt content each time the page is loaded.', 'Contain the same prebuilt content each time the page is loaded.', 'Web Development', 'easy', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q99', 'Why should form <input> elements include an associated <label> with the for attribute?', '["It enables offline form storage","It encrypts user data","It increases form submission speed","It improves accessibility: screen readers announce the label when the input is focused"]'::jsonb, 'It improves accessibility: screen readers announce the label when the input is focused.', 'It improves accessibility: screen readers announce the label when the input is focused.', 'Web Development', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

INSERT INTO public.questions (id, question, options, answer, explanation, topic, difficulty, source)
VALUES ('exit-2018-mid-q100', 'What is the name of the logic gate based on the following graphical symbol?

![NAND Gate](/assets/q100_nand_gate.png)', '["XOR","NOR","NAND","AND"]'::jsonb, 'NAND', 'The graphical symbol with a D-shape and a small circle (inversion bubble) at the output represents a NAND gate.', 'Digital Logic', 'medium', 'Exit Exam 2018 (Mid Semester)')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  source = EXCLUDED.source;

