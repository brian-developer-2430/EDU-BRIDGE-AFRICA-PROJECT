//  <!-- Firebase Configuration and Integration -->
    
        // // Firebase configuration
        // const firebaseConfig = {
        //     apiKey: "AIzaSyDmV5M9IvedoODV1rWE6WZy6d-icOXcWGQ",
        //     authDomain: "edu-bridge-ai.firebaseapp.com",
        //     databaseURL: "https://edu-bridge-ai-default-rtdb.firebaseio.com",
        //     projectId: "edu-bridge-ai",
        //     storageBucket: "edu-bridge-ai.firebasestorage.app",
        //     messagingSenderId: "632925487014",
        //     appId: "1:632925487014:web:64816784c57e693ba21967",
        //     measurementId: "G-8DWD84TJ4L"
        // };

        // // Initialize Firebase
        // const app = firebase.initializeApp(firebaseConfig);
        // const auth = firebase.auth();
        // const db = firebase.firestore();
        // const analytics = firebase.analytics();
        // const rtdb = firebase.database();

        // // Authentication state observer
        // auth.onAuthStateChanged((user) => {
        //     if (user) {
        //         console.log("User signed in:", user.email);
        //         showUserProfile(user);
        //         loadUserData(user.uid);
        //     } else {
        //         console.log("User signed out");
        //         showAuthButtons();
        //     }
        // });

        // Show user profile when logged in
        function showUserProfile(user) {
            const loginBtn = document.getElementById('loginBtn');
            const signupBtn = document.getElementById('signupBtn');
            const userProfile = document.getElementById('userProfile');
            const username = document.getElementById('username');
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            if (userProfile) {
                userProfile.classList.remove('hidden');
                if (username) username.textContent = user.displayName || user.email.split('@')[0];
            }
        }

        // Show auth buttons when logged out
        function showAuthButtons() {
            const loginBtn = document.getElementById('loginBtn');
            const signupBtn = document.getElementById('signupBtn');
            const userProfile = document.getElementById('userProfile');
            
            if (loginBtn) loginBtn.style.display = 'block';
            if (signupBtn) signupBtn.style.display = 'block';
            if (userProfile) userProfile.classList.add('hidden');
        }

        // Sign up function
        async function signUpUser(email, password, name, country, userType) {
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                await user.updateProfile({
                    displayName: name
                });
                
                await db.collection('users').doc(user.uid).set({
                    name: name,
                    email: email,
                    country: country,
                    userType: userType,
                    subscriptionPlan: 'free',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showNotification('Account created successfully! Welcome to EduBridge Africa.', 'success');
                closeModal('signupModal');
                
                return user;
            } catch (error) {
                console.error('Sign up error:', error);
                showNotification('Error creating account: ' + error.message, 'error');
                throw error;
            }
        }

        // Sign in function
        async function signInUser(email, password) {
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                await db.collection('users').doc(user.uid).update({
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showNotification('Welcome back to EduBridge Africa!', 'success');
                closeModal('loginModal');
                
                return user;
            } catch (error) {
                console.error('Sign in error:', error);
                showNotification('Error signing in: ' + error.message, 'error');
                throw error;
            }
        }

        // Sign out function
        async function signOutUser() {
            try {
                await auth.signOut();
                showNotification('Signed out successfully', 'success');
                window.location.reload();
            } catch (error) {
                console.error('Sign out error:', error);
                showNotification('Error signing out', 'error');
            }
        }

        // Load user data from Firestore
        async function loadUserData(userId) {
            try {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    updateSubscriptionStatus(userData.subscriptionPlan);
                    loadUserLearningPaths(userId);
                    
                    analytics.logEvent('user_engagement', {
                        engagement_time_msec: 1000
                    });
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        }

        // Update subscription status in UI
        function updateSubscriptionStatus(plan) {
            const subscriptionBadge = document.getElementById('subscriptionBadge');
            if (subscriptionBadge) {
                if (plan && plan !== 'free') {
                    subscriptionBadge.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
                    subscriptionBadge.classList.remove('hidden');
                } else {
                    subscriptionBadge.classList.add('hidden');
                }
            }
        }

        // Save learning progress
        async function saveLearningProgress(userId, courseId, progress) {
            try {
                await db.collection('userProgress').doc(`${userId}_${courseId}`).set({
                    userId: userId,
                    courseId: courseId,
                    progress: progress,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error('Error saving progress:', error);
            }
        }

        // Save personalization preferences
        async function savePersonalizationData(userId, preferences) {
            try {
                await db.collection('users').doc(userId).update({
                    learningPreferences: preferences,
                    personalizationCompleted: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showNotification('Learning preferences saved!', 'success');
            } catch (error) {
                console.error('Error saving preferences:', error);
                showNotification('Error saving preferences', 'error');
            }
        }

        // Load user learning paths
        async function loadUserLearningPaths(userId) {
            try {
                const progressQuery = await db.collection('userProgress')
                    .where('userId', '==', userId)
                    .get();
                
                const learningPaths = [];
                progressQuery.forEach((doc) => {
                    learningPaths.push(doc.data());
                });
                
                displayLearningPaths(learningPaths);
            } catch (error) {
                console.error('Error loading learning paths:', error);
            }
        }

        // Handle subscription upgrade
        async function upgradeSubscription(userId, plan, paymentData) {
            try {
                await db.collection('users').doc(userId).update({
                    subscriptionPlan: plan,
                    subscriptionStartDate: firebase.firestore.FieldValue.serverTimestamp(),
                    paymentHistory: firebase.firestore.FieldValue.arrayUnion(paymentData)
                });
                
                analytics.logEvent('purchase', {
                    transaction_id: paymentData.transactionId,
                    value: paymentData.amount,
                    currency: 'USD',
                    items: [{
                        item_id: plan,
                        item_name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
                        price: paymentData.amount,
                        quantity: 1
                    }]
                });
                
                updateSubscriptionStatus(plan);
                showNotification('Subscription upgraded successfully!', 'success');
            } catch (error) {
                console.error('Error upgrading subscription:', error);
                showNotification('Error upgrading subscription', 'error');
            }
        }

        // Utility functions
        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            const notificationText = document.getElementById('notificationText');
            
            if (notification && notificationText) {
                notificationText.textContent = message;
                notification.className = `notification ${type}`;
                notification.classList.remove('hidden');
                
                setTimeout(() => {
                    notification.classList.add('hidden');
                }, 4000);
            }
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
            }
        }

        function displayLearningPaths(paths) {
            const learningPathsContainer = document.getElementById('learningPaths');
            if (learningPathsContainer && paths.length > 0) {
                learningPathsContainer.innerHTML = paths.map(path => `
                    <div class="learning-path-card">
                        <h3>${path.courseId}</h3>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${path.progress}%"></div>
                        </div>
                        <span>${path.progress}% Complete</span>
                    </div>
                `).join('');
            }
        }

        console.log('Firebase initialized successfully');
    

    // <!-- Main JavaScript File -->
    
        // DOM Content Loaded Event
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Initialize the chatbot HERE
         window.eduBridgeBot = new EduBridgeChatbot();

            // Login Form Handler
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('loginEmail').value;
                    const password = document.getElementById('loginPassword').value;
                    
                    showLoadingOverlay();
                    
                    try {
                        await signInUser(email, password);
                    } catch (error) {
                        // Error handling is done in signInUser function
                    } finally {
                        hideLoadingOverlay();
                    }
                });
            }

            // Signup Form Handler
            const signupForm = document.getElementById('signupForm');
            if (signupForm) {
                signupForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const name = document.getElementById('signupName').value;
                    const email = document.getElementById('signupEmail').value;
                    const password = document.getElementById('signupPassword').value;
                    const country = document.getElementById('signupCountry').value;
                    const userType = document.getElementById('userType').value;
                    
                    showLoadingOverlay();
                    
                    try {
                        await signUpUser(email, password, name, country, userType);
                    } catch (error) {
                        // Error handling is done in signUpUser function
                    } finally {
                        hideLoadingOverlay();
                    }
                });
            }

            // Logout Handler
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await signOutUser();
                });
            }

            // Personalization Form Handler
            const personalizationForm = document.getElementById('personalizationForm');
            if (personalizationForm) {
                personalizationForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const user = auth.currentUser;
                    if (!user) {
                        showNotification('Please sign in to save your preferences', 'error');
                        return;
                    }
                    
                    const preferences = {
                        subjectInterest: document.getElementById('subjectInterest').value,
                        currentLevel: document.getElementById('currentLevel').value,
                        learningStyle: document.getElementById('learningStyle').value,
                        connectivity: document.getElementById('connectivity').value,
                        learningGoals: document.getElementById('learningGoals').value
                    };
                    
                    showLoadingOverlay();
                    
                    try {
                        await savePersonalizationData(user.uid, preferences);
                        closeModal('personalizationModal');
                        generateLearningPath(preferences);
                    } catch (error) {
                        // Error handled in savePersonalizationData
                    } finally {
                        hideLoadingOverlay();
                    }
                });
            }

            // Payment Form Handler
            const paymentForm = document.getElementById('paymentForm');
            if (paymentForm) {
                paymentForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const user = auth.currentUser;
                    if (!user) {
                        showNotification('Please sign in to upgrade your subscription', 'error');
                        return;
                    }
                    
                    const plan = currentPaymentPlan;
                    const amount = parseFloat(document.getElementById('totalAmount').textContent.replace(', ', ''));
                    
                    showLoadingOverlay();
                    
                    try {
                        const paymentData = {
                            transactionId: 'txn_' + Date.now(),
                            amount: amount,
                            plan: plan,
                            timestamp: new Date().toISOString(),
                            status: 'completed'
                        };
                        
                        await upgradeSubscription(user.uid, plan, paymentData);
                        
                        document.getElementById('successPlanName').textContent = plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan';
                        document.getElementById('successAmount').textContent = amount.toFixed(2);
                        
                        closeModal('paymentModal');
                        openModal('successModal');
                        
                    } catch (error) {
                        // Error handled in upgradeSubscription
                    } finally {
                        hideLoadingOverlay();
                    }
                });
            }

            // Modal Controls
            document.addEventListener('click', (e) => {
                // Open login modal
                if (e.target.id === 'loginBtn') {
                    openModal('loginModal');
                }
                
                // Open signup modal
                if (e.target.id === 'signupBtn') {
                    openModal('signupModal');
                }
                
                // Switch between login and signup
                if (e.target.id === 'switchToSignup') {
                    e.preventDefault();
                    closeModal('loginModal');
                    openModal('signupModal');
                }
                
                if (e.target.id === 'switchToLogin') {
                    e.preventDefault();
                    closeModal('signupModal');
                    openModal('loginModal');
                }
                
                // Close modals
                if (e.target.classList.contains('close-btn')) {
                    const modalId = e.target.getAttribute('data-modal');
                    closeModal(modalId);
                }
                
                // Close modal when clicking outside
                if (e.target.classList.contains('modal')) {
                    e.target.classList.add('hidden');
                }
                
                // Action buttons
                if (e.target.getAttribute('data-action') === 'personalize') {
                    openModal('personalizationModal');
                }
                
                // Navigation
                if (e.target.classList.contains('nav-link')) {
                    e.preventDefault();
                    const section = e.target.getAttribute('data-section');
                    showSection(section);
                }
                
                // Close notifications
                if (e.target.id === 'closeNotification') {
                    document.getElementById('notification').classList.add('hidden');
                }
            });

            // Plan selection buttons
            document.querySelectorAll('[data-plan]').forEach(button => {
                button.addEventListener('click', (e) => {
                    currentPaymentPlan = e.target.dataset.plan;
                    const price = e.target.dataset.price;
                    
                    document.getElementById('planName').textContent = currentPaymentPlan.charAt(0).toUpperCase() + currentPaymentPlan.slice(1) + ' Plan';
                    document.getElementById('planPrice').textContent = `${price}.00`;
                    document.getElementById('totalAmount').textContent = `${price}.00`;
                    document.getElementById('payButtonAmount').textContent = `${price}.00`;
                    
                    openModal('paymentModal');
                });
            });

            // Navigation function
            function showSection(sectionName) {
                // Hide all sections
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show selected section
                const targetSection = document.getElementById(sectionName + 'Section');
                if (targetSection) {
                    targetSection.classList.remove('hidden');
                }
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                
                const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }

            // Generate learning path based on preferences
            function generateLearningPath(preferences) {
                const learningPaths = {
                    mathematics: {
                        beginner: ['Basic Arithmetic', 'Introduction to Algebra', 'Geometry Basics'],
                        intermediate: ['Advanced Algebra', 'Trigonometry', 'Statistics'],
                        advanced: ['Calculus', 'Linear Algebra', 'Advanced Statistics']
                    },
                    programming: {
                        beginner: ['Programming Fundamentals', 'HTML/CSS Basics', 'JavaScript Introduction'],
                        intermediate: ['Web Development', 'Python Programming', 'Database Basics'],
                        advanced: ['Advanced JavaScript', 'Full Stack Development', 'Data Structures']
                    },
                    business: {
                        beginner: ['Business Fundamentals', 'Basic Accounting', 'Marketing Basics'],
                        intermediate: ['Business Strategy', 'Financial Management', 'Operations Management'],
                        advanced: ['Advanced Strategy', 'International Business', 'Entrepreneurship']
                    }
                };
                
                const selectedPaths = learningPaths[preferences.subjectInterest]?.[preferences.currentLevel] || [];
                
                const user = auth.currentUser;
                if (user && selectedPaths.length > 0) {
                    selectedPaths.forEach(async (courseName, index) => {
                        await saveLearningProgress(user.uid, `${preferences.subjectInterest}_${index}`, 0);
                    });
                    
                    showNotification(`Created your personalized learning path with ${selectedPaths.length} courses!`, 'success');
                }
            }

            // Utility functions
            function showLoadingOverlay() {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) overlay.classList.remove('hidden');
            }

            function hideLoadingOverlay() {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) overlay.classList.add('hidden');
            }

            function openModal(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) modal.classList.remove('hidden');
            }

            // Global variables
            window.currentPaymentPlan = '';
            window.generateLearningPath = generateLearningPath;
            window.showLoadingOverlay = showLoadingOverlay;
            window.hideLoadingOverlay = hideLoadingOverlay;
            window.openModal = openModal;
            window.showSection = showSection;
        });

        // /**
//  * EduBridge AI Chatbot
//  * Powered by Groq API
//  */

/**
 * EduBridge AI Chatbot
 * Powered by Groq API with improved error handling and fallbacks
 */

class EduBridgeChatbot {
    constructor() {
        // API Configuration
        this.API_URL = "https://api.groq.com/openai/v1/chat/completions";
        
        
        // Chat state
        this.isOpen = false;
        this.isTyping = false;
        this.conversationHistory = [];
        this.useOfflineMode = false;
        
        // DOM elements - check if they exist
        this.elements = this.initializeElements();
        
        // Fallback responses for offline mode
        this.fallbackResponses = {
            greetings: [
                "Hello! I'm your EduBridge AI assistant. How can I help you with your learning journey today?",
                "Hi there! Ready to explore educational opportunities in Africa? What would you like to know?",
                "Welcome! I'm here to help with learning recommendations, career guidance, and educational support."
            ],
            
            learning: [
                "Our AI-powered learning paths adapt to your pace and style. What subject interests you most?",
                "We offer courses in mathematics, programming, business, sciences, agriculture, and languages. Which would you like to explore?",
                "Based on your location in Africa, I can recommend learning paths that align with local job markets and opportunities."
            ],
            
            careers: [
                "Africa's tech sector is booming! Skills in programming, digital marketing, and data analysis are in high demand.",
                "Consider entrepreneurship opportunities in agriculture, fintech, or e-commerce - these sectors are growing rapidly across Africa.",
                "Our career assessment can help identify skills gaps and recommend training programs. Would you like to start one?"
            ],
            
            default: [
                "That's an interesting question! Our AI-powered platform can help you explore that topic. Would you like me to recommend some learning paths?",
                "I'd be happy to help with that! Our content is designed specifically for African learners with local context and practical applications.",
                "Let me help you with that! Our platform offers personalized learning experiences that adapt to your pace and learning style."
            ]
        };
        
        // System prompt for educational context
        this.systemPrompt = `You are EduBridge AI, a helpful educational assistant focused on African education, learning opportunities, career guidance, and skill development. You provide:

1. Learning recommendations and study tips
2. Career guidance and job market insights in Africa
3. Information about educational institutions and programs
4. Skill development advice
5. Academic support and motivation

Keep responses informative, encouraging, and culturally relevant to African contexts. Be concise but helpful (max 200 words), and always maintain a friendly, supportive tone.`;
        
        this.init();
    }
    
    initializeElements() {
        const elements = {};
        const ids = ['chatbotToggle', 'chatbotContainer', 'chatbotMinimize', 'chatbotMessages', 'chatbotInput', 'chatbotSend', 'chatbotTyping', 'chatbotNotification'];
        
        ids.forEach(id => {
            elements[id.replace('chatbot', '').toLowerCase()] = document.getElementById(id);
        });
        
        return elements;
    }
    
    init() {
        // Check if essential elements exist
        if (!this.elements.toggle || !this.elements.container) {
            console.error('EduBridge Chatbot: Essential DOM elements not found');
            return;
        }
        
        this.bindEvents();
        this.showWelcomeNotification();
        
        // Initialize conversation history with system prompt
        this.conversationHistory = [{
            role: "system",
            content: this.systemPrompt
        }];
        
        // Check network connectivity
        this.checkConnectivity();
    }
    
    bindEvents() {
        // Toggle chatbot
        if (this.elements.toggle) {
            this.elements.toggle.addEventListener('click', () => this.toggleChat());
        }
        
        // Minimize chatbot
        if (this.elements.minimize) {
            this.elements.minimize.addEventListener('click', () => this.closeChat());
        }
        
        // Send message on button click
        if (this.elements.send) {
            this.elements.send.addEventListener('click', () => this.sendMessage());
        }
        
        // Send message on Enter key
        if (this.elements.input) {
            this.elements.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize input and handle input events
            this.elements.input.addEventListener('input', () => {
                this.updateSendButtonState();
            });
        }
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.elements.container.contains(e.target) && 
                !this.elements.toggle.contains(e.target)) {
                this.closeChat();
            }
        });
    }
    
    showWelcomeNotification() {
        if (this.elements.notification) {
            setTimeout(() => {
                this.elements.notification.classList.remove('hidden');
            }, 2000);
        }
    }
    
    hideNotification() {
        if (this.elements.notification) {
            this.elements.notification.classList.add('hidden');
        }
    }
    
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        this.isOpen = true;
        // Fixed: Use 'active' class to match CSS
        this.elements.container.classList.add('active');
        if (this.elements.input) {
            this.elements.input.focus();
        }
        this.hideNotification();
        this.scrollToBottom();
    }
    
    closeChat() {
        this.isOpen = false;
        // Fixed: Use 'active' class to match CSS
        this.elements.container.classList.remove('active');
    }
    
    updateSendButtonState() {
        if (this.elements.input && this.elements.send) {
            const hasText = this.elements.input.value.trim().length > 0;
            this.elements.send.disabled = !hasText || this.isTyping;
        }
    }
    
    async sendMessage() {
        if (!this.elements.input) return;
        
        const message = this.elements.input.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Clear input
        this.elements.input.value = '';
        this.updateSendButtonState();
        
        // Add user message to UI
        this.addMessage(message, 'user');
        
        // Add to conversation history
        this.conversationHistory.push({
            role: "user",
            content: message
        });
        
        // Show typing indicator
        this.showTyping();
        
        try {
            let response;
            
            if (this.useOfflineMode || !navigator.onLine) {
                // Use fallback responses when offline or API fails
                response = this.generateFallbackResponse(message);
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            } else {
                // Try to get AI response from Groq API
                response = await this.callGroqAPI();
            }
            
            // Hide typing indicator
            this.hideTyping();
            
            // Add AI response to UI
            this.addMessage(response, 'bot');
            
            // Add to conversation history
            this.conversationHistory.push({
                role: "assistant",
                content: response
            });
            
            // Keep conversation history manageable (last 10 messages + system prompt)
            if (this.conversationHistory.length > 21) {
                this.conversationHistory = [
                    this.conversationHistory[0], // Keep system prompt
                    ...this.conversationHistory.slice(-20) // Keep last 20 messages
                ];
            }
            
        } catch (error) {
            this.hideTyping();
            console.warn('Groq API failed, falling back to offline mode:', error);
            
            // Fall back to offline responses
            this.useOfflineMode = true;
            const fallbackResponse = this.generateFallbackResponse(message);
            this.addMessage(fallbackResponse, 'bot');
            
            // Add to conversation history
            this.conversationHistory.push({
                role: "assistant",
                content: fallbackResponse
            });
        }
    }
    
    async callGroqAPI() {
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "llama3-8b-8192",
                    messages: this.conversationHistory,
                    max_tokens: 300,
                    temperature: 0.7,
                    top_p: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || this.generateFallbackResponse();
            
        } catch (error) {
            console.error('Groq API Error:', error);
            throw error;
        }
    }
    
    generateFallbackResponse(userMessage = '') {
        const message = userMessage.toLowerCase();
        
        // Greeting patterns
        if (this.matchesPatterns(message, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
            return this.getRandomResponse('greetings');
        }
        
        // Learning-related queries
        if (this.matchesPatterns(message, ['learn', 'course', 'study', 'subject', 'mathematics', 'programming', 'business'])) {
            return this.getRandomResponse('learning');
        }
        
        // Career-related queries
        if (this.matchesPatterns(message, ['career', 'job', 'work', 'employment', 'skill', 'tech', 'business'])) {
            return this.getRandomResponse('careers');
        }
        
        // Default response
        return this.getRandomResponse('default');
    }
    
    matchesPatterns(message, patterns) {
        return patterns.some(pattern => message.includes(pattern));
    }
    
    getRandomResponse(category) {
        const responses = this.fallbackResponses[category] || this.fallbackResponses.default;
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    addMessage(content, type, isError = false) {
        if (!this.elements.messages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        if (isError) {
            contentDiv.style.background = '#ffe6e6';
            contentDiv.style.color = '#d63384';
        }
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        this.elements.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTyping() {
        this.isTyping = true;
        if (this.elements.typing) {
            this.elements.typing.classList.remove('hidden');
        }
        this.updateSendButtonState();
        this.scrollToBottom();
    }
    
    hideTyping() {
        this.isTyping = false;
        if (this.elements.typing) {
            this.elements.typing.classList.add('hidden');
        }
        this.updateSendButtonState();
    }
    
    scrollToBottom() {
        if (this.elements.messages) {
            requestAnimationFrame(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            });
        }
    }
    
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    checkConnectivity() {
        // Check if online and test API connectivity
        if (!navigator.onLine) {
            this.useOfflineMode = true;
            console.log('EduBridge Chatbot: Running in offline mode');
        }
        
        // Listen for connectivity changes
        window.addEventListener('online', () => {
            this.useOfflineMode = false;
            console.log('EduBridge Chatbot: Back online');
        });
        
        window.addEventListener('offline', () => {
            this.useOfflineMode = true;
            console.log('EduBridge Chatbot: Now offline');
        });
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons first
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Then initialize the chatbot
    window.eduBridgeBot = new EduBridgeChatbot();
    console.log('EduBridge Chatbot initialized successfully');
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EduBridgeChatbot;
}


      