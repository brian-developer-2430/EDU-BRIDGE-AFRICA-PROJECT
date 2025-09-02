# EduBridge Africa - ReadMe

## Overview
EduBridge Africa is an innovative educational platform designed to bridge educational gaps across Africa through AI-powered learning, local content in native languages, and community-driven education that works even offline.

## Features
- **AI-Powered Learning**: Personalized learning paths adapted to individual pace and learning style
- **Local Language Support**: Content available in native languages with cultural context
- **Offline-First Learning**: Download content for learning without internet connection
- **Community Learning**: Study groups and peer mentoring
- **Career Pathways**: Skills-based training aligned with African job markets
- **Recognized Certifications**: Industry-recognized certificates
- **Teacher Dashboard**: Tools for educators to manage classes and track progress

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **Icons**: Lucide Icons
- **Payment Integration**: IntaSend for African payment methods

## Firebase Services Used
- Firebase Authentication
- Cloud Firestore
- Firebase Analytics
- Realtime Database

## Installation & Setup

1. **Clone or download the project files**
   - Ensure you have all HTML, CSS, and JavaScript files

2. **Set up Firebase Project**
   - Create a new project at [Firebase Console](https://console.firebase.google.com/)
   - Copy your Firebase configuration and replace the existing one in the HTML file:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project.firebaseio.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id",
     measurementId: "your-measurement-id"
   };
   ```

3. **Enable Authentication Methods**
   - In Firebase Console, enable Email/Password authentication

4. **Set up Firestore Database**
   - Create a new Firestore database with appropriate security rules

5. **Set up Payment Integration**
   - Register with IntaSend for payment processing
   - Configure webhooks for payment confirmation

6. **Deploy the Application**
   

## File Structure
```
edubridge-africa/
├── index.html          # Main HTML file
├── style.css           # Stylesheet
├── script.js           # Main JavaScript functionality
└── README.md           # This file
```

## Usage

1. **For Students**:
   - Sign up for a student account
   - Complete the learning personalization quiz
   - Choose a subscription plan
   - Start learning with personalized content

2. **For Teachers**:
   - Sign up for a teacher account
   - Upgrade to Teacher plan
   - Access student management tools
   - Create customized content

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing
We welcome contributions to improve EduBridge Africa. Please ensure your code follows the existing style and includes appropriate comments.

## License
This project is proprietary software. All rights reserved.

## Support
For technical support or questions, please contact our development team.

## Future Enhancements
- Mobile app development
- Additional African language support
- Expanded curriculum subjects
- Enhanced offline capabilities
- Integration with more African payment providers

---

*EduBridge Africa - Transforming education across the African continent*
