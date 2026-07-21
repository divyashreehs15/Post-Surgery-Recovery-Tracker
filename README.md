# 🏥 Post-Surgery Recovery Tracker

An AI-powered healthcare application that helps patients and doctors monitor post-surgery recovery remotely. The system allows patients to log their daily health status while enabling doctors to monitor recovery progress through dashboards, risk prediction models, and wound image analysis.

---

## 📖 Overview

Post-surgical patients often recover at home with limited medical supervision. Delayed identification of complications such as infections, abnormal pain, or poor wound healing can lead to serious health risks.

The **Post-Surgery Recovery Tracker** provides a centralized platform where:

- Patients record daily recovery information.
- Doctors monitor patient progress remotely.
- AI models estimate recovery and risk levels.
- Computer vision analyzes wound images for possible infection.
- Appointment scheduling and medication reminders improve follow-up care.

---

# ✨ Features

## 👤 Patient Module

- Secure Login
- Daily Recovery Log
- Pain Level Tracking
- Mobility Tracking
- Sleep Monitoring
- Medication Tracking
- Wound Image Upload
- Appointment Scheduling
- Recovery Dashboard

---

## 👨‍⚕️ Doctor Module

- Secure Login
- Assigned Patient Dashboard
- View Daily Logs
- Monitor Recovery Progress
- AI Risk Prediction
- Wound Image Analysis
- Recovery Trend Charts
- Appointment Management
- Upload Reports and medications
- Set alerts for daily medications and appointments
---

## 👨‍💼 Admin Module

- User Management
- Role-Based Access Control
- Patient-Doctor Assignment
- System Administration

---

# 🤖 AI Features

### Recovery Prediction

Machine Learning model predicts patient recovery based on:

- Pain Score
- Mobility
- Sleep Quality
- Medication Adherence
- Wound Condition
- Daily Symptoms

---

### Wound Image Analysis

Computer Vision (OpenCV) analyzes uploaded wound images for:

- Redness
- Yellow Discharge (Pus)
- Necrosis
- Infection Probability

---

### Risk Assessment

The ML model estimates:

- Low Risk
- Medium Risk
- High Risk

based on patient health logs.

---

# 🏗️ System Architecture

```
                React Frontend
                      │
         REST APIs (JWT Authentication)
                      │
        Node.js + Express Backend
                      │
        MongoDB Database (Mongoose)
                      │
      FastAPI ML Service (Python)
             │               │
     Scikit-Learn      OpenCV Analysis
```

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide React

---

## Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication
- Nodemailer
- Multer

---

## AI / ML

- Python
- FastAPI
- OpenCV
- NumPy
- Scikit-learn

---

# 📂 Project Structure

```
Post-Surgery-Recovery-Tracker
│
├── Backend
│   ├── src
│   │   ├── controllers
│   │   ├── models
│   │   ├── routes
│   │   ├── middlewares
│   │   └── app.ts
│   └── package.json
│
├── Frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── pages
│   │   └── App.tsx
│   └── package.json
│
├── ML-services
│   ├── main.py
│   ├── ml_service.py
│   ├── recovery_model.pkl
│   └── risk_model.pkl
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/divyashreehs15/Post-Surgery-Recovery-Tracker.git

cd Post-Surgery-Recovery-Tracker
```

---

## Backend

```bash
cd Backend

npm install

npm run dev
```

Create a `.env` file:

```env
PORT=5000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_secret_key

UPLOAD_DIR=uploads
```

---

## Frontend

```bash
cd Frontend

npm install

npm run dev
```

---

## ML Service

```bash
cd ML-services

pip install -r requirements.txt

uvicorn main:app --reload
```

---

# 🔄 Workflow

1. Patient logs into the application.
2. Daily health metrics are recorded.
3. Wound image is uploaded.
4. Backend stores patient data in MongoDB.
5. ML Service processes health logs.
6. OpenCV analyzes wound image.
7. Recovery and Risk Score are generated.
8. Doctor views patient dashboard and AI insights.

---

# 🔐 Authentication

- JWT Authentication
- Password Hashing
- Role-Based Authorization

Roles:

- Admin
- Doctor
- Patient

---

# 📊 Future Enhancements

- SMS Notifications
- Video Consultation
- Wearable Device Integration
- Hospital Information System Integration
- AI Chatbot
- Mobile Application
- Cloud Deployment
- Multi-language Support

---

# 👩‍💻 Author

**Divya Shree**

Computer Science Engineering Student

GitHub: https://github.com/divyashreehs15

---

# 📜 License

This project is intended for educational and learning purposes.
