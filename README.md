# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Running the Application Locally

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


## Deploying to Firebase

Follow these steps to deploy your application to Firebase Hosting.

### Prerequisites

1.  **Install Firebase CLI:** If you don't have it, install the Firebase Command Line Interface globally.
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase:** Log in to your Google account.
    ```bash
    firebase login
    ```

3.  **Initialize Firebase:** If you haven't already, you need to connect your local project to your Firebase project.
    ```bash
    firebase init
    ```
    - Select **Hosting: Configure and deploy Firebase Hosting sites**.
    - Select **Use an existing project** and choose your Firebase project from the list.
    - When asked for your public directory, just press **Enter** (the `firebase.json` I added handles this).
    - When asked to configure as a single-page app, enter **No**.
    - When asked about automatic builds and deploys with GitHub, enter **No** for now.

### Step 1: Set Environment Variables for Production

Your production app needs the Gemini API key to work. You must set this up as a secret in Firebase.

1.  Run the following command. Replace `YOUR_GEMINI_API_KEY` with your actual key.
    ```bash
    firebase apphosting:secrets:set GEMINI_API_KEY
    ```
2.  When prompted, paste your API key and press Enter. This securely stores your key for your deployed application.

### Step 2: Build Your Project for Production

Run the standard build command to create an optimized, production-ready version of your Next.js app.

```bash
npm run build
```

### Step 3: Deploy to Firebase

This single command will deploy your Next.js application to Firebase Hosting and update your Firestore security rules simultaneously.

```bash
firebase deploy
```

After the command finishes, the CLI will provide you with your public Hosting URL. Congratulations, your application is live!
