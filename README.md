# 🖥️ Code Editor with Terminal

A full-stack web-based code editor with terminal functionality, allowing users to write, compile, and execute code in multiple programming languages (e.g., Python, C, C++, Java) directly in the browser.

## 📁 Project Structure

code-editor/
├── backend/
│ ├── server.js
│ ├── .env
│ ├── routes/
│ │ └── execute.js
│ ├── utils/
│ │ └── codeRunner.js
│ └── temp/
├── frontend/
│ ├── .env
│ ├── .env.local
│ ├── src/
│ │ ├── App.js
│ │ ├── index.js
│ │ ├── components/
│ │ │ ├── CodeEditor.js
│ │ │ ├── Terminal.js
│ │ │ └── Sidebar.js
│ │ └── styles/
│ │ └── App.css
└── README.md



---

## 🚀 Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/code-editor.git
cd code-editor
2. Backend Setup

cd backend
npm install
npm run dev
Runs on http://localhost:5000

3. Frontend Setup

cd ../frontend
npm install
npm start
Runs on http://localhost:3000

🌐 Environment Configuration
Backend .env

PORT=5000
NODE_ENV=development
Frontend .env.local

REACT_APP_API_URL=http://localhost:5000
Frontend .env (for production)

REACT_APP_API_URL=https://your-backend-url.onrender.com
☁️ Deployment
Backend on Render
Create new Web Service

Connect GitHub repo

Set Build Command: npm install

Set Start Command: npm start

Add environment variable: NODE_ENV=production

Frontend on Vercel

cd frontend
npm run build
vercel --prod
Alternatively, use GitHub + Vercel integration

🧪 Testing API (Example)

curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"Hello World!\")", "language":"python", "input":""}'
⚠️ Troubleshooting
Make sure Python/Java/gcc are installed on deployment server.

Set correct CORS policy in server.js.

Match frontend and backend URLs in env files.