# ♻️ ReLoop — Smarter Waste Identification & Disposal

**ReLoop** is a waste-management application that helps people identify waste, understand how to dispose of it responsibly, and discover collection points.

By combining image-based waste classification with actionable disposal recommendations, ReLoop aims to make responsible waste management easier and more accessible.

## 🌍 The Problem

Improper waste disposal contributes to environmental pollution and makes it harder to recover recyclable materials. People may not know whether an item belongs in general waste, recycling, or a specialized collection stream such as electronic waste.

## 💡 Our Solution

ReLoop allows users to upload an image of waste, receive a predicted category, and view guidance on responsible disposal.

The goal is to connect **waste identification with practical next steps** rather than leaving users to figure out disposal on their own.

## ✨ Features

* **Waste Scanner:** Upload an image to analyze a waste item.
* **Image Classification:** Uses a pretrained machine-learning model to predict the waste category.
* **Disposal Guidance:** Provides recommendations based on the predicted category.
* **Collection Points:** Interface for exploring waste collection locations.
* **Waste Dashboard:** Presents waste-management information in an interactive interface.
* **Waste Hotspots:** Interface for exploring waste-related hotspot information.

*Classification results are model predictions and may not always be accurate. Users should verify disposal requirements with their local waste-management authorities.*

## 🛠️ Technology Stack

| Technology                | Purpose                                |
| ------------------------- | -------------------------------------- |
| React                     | Frontend user interface                |
| Vite                      | Frontend development and build tooling |
| Python                    | Backend programming language           |
| FastAPI                   | Backend API                            |
| PyTorch                   | Machine-learning inference             |
| Hugging Face Transformers | Pretrained image-classification model  |
| Pillow                    | Image processing                       |
| Docker                    | Containerization and deployment setup  |

## 🏗️ How It Works

```text
             User uploads waste image
                       |
                       v
               React Frontend
                       |
                       v
                FastAPI Backend
                       |
                       v
          Pretrained Classification Model
                       |
                       v
             Predicted Waste Category
                       |
                       v
             Disposal Recommendations
                       |
                       v
              Results shown to user
```

1. The user uploads an image through the frontend.
2. The frontend sends the image to the backend API.
3. The backend processes the image using the classification model.
4. The model returns a predicted waste category and confidence score.
5. The application presents the prediction and corresponding disposal guidance.

## 🚀 Run ReLoop Locally

### Prerequisites

* Python 3.13
* Node.js and npm
* Git

### 1. Clone the repository

```bash
git clone https://github.com/OMKHEDIKAR23/ReLoop.git
cd ReLoop
```

### 2. Start the backend

Open a terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend should start at:

`http://127.0.0.1:8000`

If enabled by the application, interactive API documentation is available at:

`http://127.0.0.1:8000/docs`

### 3. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173`

Keep both terminals running while using the application.

## 📁 Project Structure

```text
ReLoop/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   └── services/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── compose.yaml
└── README.md
```

## 🌱 Environmental Impact

ReLoop aims to encourage more responsible waste disposal by making waste identification and disposal guidance easier to access.

Potential future improvements include connecting users with verified collection facilities, expanding classification coverage, and integrating reliable local waste-management data.

## ☁️ AWS Integration

ReLoop's current application uses React, FastAPI, and a pretrained image-classification model.

AWS services or AWS open-source technologies will be documented here when they are actually integrated into the project. Creating an AWS account alone does not constitute AWS integration.

## 🔮 Future Improvements

* Connect users with verified local collection points.
* Improve classification coverage and reliability.
* Incorporate location-specific disposal guidance.
* Add reliable waste-management data and analytics.
* Deploy the application for public access.

## 👨‍💻 Project Information

**Project:** ReLoop
**Category:** Environmental Sustainability
**Repository:** https://github.com/OMKHEDIKAR23/ReLoop

Developed as a student hackathon project focused on making responsible waste disposal more accessible.
