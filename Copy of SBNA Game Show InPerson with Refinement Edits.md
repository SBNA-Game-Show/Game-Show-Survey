 **SBNA GAME SHOW:**  
**—------------------------------------------Manual/Offline—----------------------------------**  
**Use Case Scenarios:**  
**1\.	Admin Sends invitation for In-person game-show.  \- Manual Email**  
**2\.	Participants Signup to the web-application to confirm their participation. \- Email Response/Google Form**  
**3\.	Admin Splits players to form groups. Manual**  
**—---------------------------------Release 1---------------------------------------------**  
**4\.	Game Day**

* **Host signs in with pre-registered id and password \- Required (Gameshow Portal)**  
* **Team Leaders sign in with pre-registered id and password. \- Required (Gameshow Portal)**  
* **Welcome Screen is Displayed.**  
* **Features and Stories**  
* **Card Title:** Design Host Interface (Single Round) (Gameshow Portal) \[TBD : Single View or Dual view ?\]  
  * **Description:** Create a web interface for the host to display the current question and manually reveal answers and manage scores.  
  * **Labels:** Front-End, UI/UX  
  * **Assignees:** \[Assign Interns (2 groups of 5)\] \- *Scaled Assignment*  
  * **Due Date:** \[End of Week 6\]  
  * **Checklist:**  
    * \[ \] Display the current question.  
    * \[ \] UI elements to "reveal" ranked answers (initially manual).  
    * \[ \] Input fields or controls to manually update team scores.  
* **Card Title :** Integrate Survey Data with Host Interface \[Host to reveal survey response\]  
  * **Description :** Connect the host interface to the survey responses generated in Deliverable 1, allowing the host to select a question and have the ranked answers (initially the top 3\) be available to reveal.  
  * **Checklist / Stories**  
* \[ \] Implement API calls or data retrieval from Mongodb/dynamoDB for Questions and Scores .  
* \[ \] Allow the host to select a question from the database.  
* \[ \] Display the top ranked answers on the host interface (ready to be revealed).

**—--------------------------------------Release 1------------------------------**  
**5\.	Host introduces himself and the players and explains the game rules. \- Spike ? Video Rendering Options TBD . 	Need broadcast/multicast capability ?**  
**Features & Stories**   
**Not Defined**  
**—---------------------------------------Release 1---------------------------------**  
**6\.	ROUND 1 Begins** 

* **Host presents Teams with a question. \- Required (Gameshow Portal)**   
* **How do we assign order of Team ?**   
  * **Suggestion : Use a [Zat.am](http://Zat.am) game to ask each team to play one round to decide winner.**  
  * **OR Use first question from quiz to have both team answer and let the higher scoring team go first**  
* **Features & Stories**  
* **Card Title :** Design First Team Selection Round  
* **Description :** Opening Question Round to decide the team that will go first  
  	**Checklist / Stories**  
- [ ] SPIKE : Design Q\&A Process for 2 Team submission   
- [ ] Design Team Response and Scoring Process   
- [ ] Design Team Winner Announcement   
      **—------------------------------------------------------------------**  
* **Host reads question / Team confers within and when ready will hit “buzzer”**  
* **Features & Stories**  
* **Card Title:** Design Participant Interface (Single Question)  \[Assumption: Participants and Hosts share the same UI, Participants do not have to "interact" with the UI as they will speak their responses\]  
* SPIKE : How to capture Team Audio response into digital response in order to compare the answer to survey responses. Potential Gen AI Use case ?  
  * **Description:** Develop a web interface for participants to view the current question and a simple mechanism to "buzz in."  
  * **Labels:** Front-End, UI/UX  
  * **Assignees:** \[Assign Interns (2 groups of 5)\] \- *Scaled Assignment*  
  * **Due Date:** \[End of Week 7\]  
  * **Checklist:**  
    * \[ \] Display the current question.  
    * \[ \] Implement a "Buzz In" button or indicator.  
    * \[ \] Provide visual feedback when buzzed in (for the participant).  
  * **\[Not Doing for MVP : The first user from each team is given the opportunity to press the “buzzer”. A real time reaction determines which user pressed it first. The first user to press gets first guess at the question.\]**  
* **If the guess is correct, it is revealed on the board. \- Required (Gameshow Portal \- Scoreboard)**  
* **Features & Stories**  
* **Card Title:** Integrate Survey Data with Host Interface \[Host to reveal   
  * **Description:** Connect the host interface to the data generated in Deliverable 1, allowing the host to select a question and have the ranked answers (initially the top few) be available to reveal.  
  * **Labels:** Integration, Back-End, Front-End  
  * **Assignees:** \[Assign Interns (2 groups of 5)\] \- *Scaled Assignment*  
  * **Due Date:** \[End of Week 10\]  
  * **Checklist:**  
    * \[ \] Implement API calls (if applicable) or data retrieval from Google Sheets.  
    * \[ \] Allow the host to select a question from the database.  
    * \[ \] Display the top ranked answers on the host interface (ready to be revealed).  
* **Card Title:** Implement Basic Game Logic (Single Round)\[Precondition :: Team Response has been digitized from audio response\]  
  * **Description:** Add the core game logic for a single round, including handling correct/incorrect answers, updating scores, and revealing answers based on participant guesses.  
  * **Labels:** Logic, Back-End, Front-End  
  * **Assignees:** \[Assign Interns (2 groups of 5)\] \- *Scaled Assignment*  
  * **Due Date:** \[End of Week 11\]  
  * **Checklist:**  
    * \[ \] Logic for the host to mark answers as correct or incorrect.  
    * \[ \] Automatic score updates based on correct answers.  
    * \[ \] Mechanism for revealing correct answers after a team's turn.  
    * **\[Not Doing for MVP : If it is the number one answer, the team gets possession of the question.**  
    * **Not Doing for MVP : If the answer is not number one, the opposing team gets to guess.**  
      * **The team with the highest ranking answer gets possession of the question.**  
    * **Not Doing for MVP : If a team guesses incorrectly, possession goes to the opposing team\]**  
    * 

**Continue with the Next Question. First team finishes their questions and process repeated with Second Team**

* **\[Not Doing Individual Guessing for MVP : The team with possession of the question will have each member take a turn guessing, moving through the team of 5.\]**  
  * **Whether a member is right or wrong, they continue to guess at answers until they reach 3 WRONG answers.**   
    * **After 3 wrong answers, the opposing team has a chance to steal**  
    * **The stealing team is allowed to discuss among themselves what a remaining survey answer would be. They make a unified guess.**  
      * **If they are correct, they get all the points for that round.**  
      * **If they are incorrect, the original team gets the revealed points**

**Once the winning team for the round is decided, they collect the points, and round 2 begins with the same structure.**   
**6\. 	ROUND 2, 3, 4 BEGIN**

* **Same game flow as round 1, with points being totalled from all previous rounds.**

**—--------------------------------------------Release 2--------------------------------------------------------**  
**7\. 	LIGHTNING ROUND**

* **After the last round of open ended questions, the teams will face off with a lightning round, featuring multiple choice questions that will have 1 member of each team facing each other to see who answers the MOST, and who answers the FASTEST**  
* **Points are allocated accordingly, and the final winning team is announced**

**This is as similar to Family Feud as I can think of. If it is too convoluted, changes can be made.**

