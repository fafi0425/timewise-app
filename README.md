# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Running the Application

To get this project up and running on your local machine for development and testing, please follow these steps.

### Prerequisites

Make sure you have Node.js (version 18 or higher) and npm installed on your system.

### 1. Install Dependencies

First, open your terminal, navigate to the project's root directory, and run the following command to install all the required packages:

```bash
npm install
```

### 2. Set Up Environment Variables

The application uses Firebase services, which require API keys to function correctly.

1.  Create a new file named `.env` in the root of your project.
2.  Add the following line to the `.env` file, replacing `YOUR_GEMINI_API_KEY` with your actual Gemini API key obtained from Google AI Studio.

```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

This key is necessary for the AI-powered features like overbreak analysis to work.

### 3. Run the Development Servers

This application requires two separate processes to run concurrently in two separate terminals:

**Terminal 1: Start the Next.js App**

This command starts the main web application.

```bash
npm run dev
```

**Terminal 2: Start the Genkit AI Flows**

This command starts the backend AI service that handles tasks like overbreak detection. The `--watch` flag will automatically restart the service when you make changes to the AI flow files.

```bash
npm run genkit:watch
```

### 4. Access the Application

Once both servers are running, you can access the application by opening your web browser and navigating to:

[http://localhost:9002](http://localhost:9002)

You can log in with the default credentials:
*   **Admin:** `admin123@gmail.com` / `sigma88`
*   **Employee:** `user123@gmail.com` / `terra123`
