Main Branch


## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB instance (local or cloud)

### Installation

1. **Clone the repository and switch to desired folder/branch**

   ```sh
   git clone <repo-url>
   cd Game-Show-Survey
   ```

2. **Install dependencies for desired folder:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**

   Ensure a `.env` exists within the folder you are working in. 

   Backend `.env.` should look like: 

   ```
   PORT=8000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>
   CORS_ORIGIN=*
   API_KEY=your_api_key_here
   ```

   Frontend `.env` should look like:

   ```
   REACT_APP_API_KEY=your_api_key_here
   ```

   Adjust values as needed.

4. **Start the server:**
   ```sh
   npm run dev
   ```
   or
   ```sh
   node src/index.js
   ```

---
