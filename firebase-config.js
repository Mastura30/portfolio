// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB3E7hYyclpj_prctkWJwU8lgu1bDkM078",
    authDomain: "portfolio-31bfc.firebaseapp.com",
    projectId: "portfolio-31bfc",
    storageBucket: "portfolio-31bfc.firebasestorage.app",
    messagingSenderId: "335829279085",
    appId: "1:335829279085:web:bfa62a99a423dfb3b4fa64"
};

// Initialize Firebase
let firebaseInitialized = false;
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSyB3E7hYyclpj_prctkWJwU8lgu1bDkM078") {
        firebase.initializeApp(firebaseConfig);
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
    } else {
        console.log('Firebase not configured - using local storage only');
    }
} catch (error) {
    console.log('Firebase initialization failed - using local storage');
}

// Enhanced Portfolio Manager Class
class PortfolioManager {
    constructor() {
        this.isAdmin = false;
        this.isEditing = false;
        this.originalContent = {};
        this.currentContent = {
            projects: [],
            publications: [],
            experiences: [],
            achievements: []
        };
        this.contentVersion = '2.0';
        this.firebaseEnabled = firebaseInitialized;
        this.init();
    }

    init() {
        this.createNotificationStyles();
        this.loadContent();
        this.setupAutoSave();
    }

    createNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideInFromRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
    }

    setupAutoSave() {
        document.addEventListener('focusout', (e) => {
            if (this.isEditing && e.target.hasAttribute('data-editable')) {
                setTimeout(() => this.saveContent(), 1000);
            }
        });
    }

    // Admin Authentication
    async loginAdmin(password) {
        try {
            if (password === '2202030') {
                this.isAdmin = true;
                this.showAdminPanel();
                await this.loadContent();
                this.showNotification('Admin login successful!', 'success');
                return true;
            } else {
                this.showNotification('Invalid password!', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed!', 'error');
            return false;
        }
    }

    logoutAdmin() {
        this.isAdmin = false;
        this.isEditing = false;
        this.hideAdminPanel();
        this.disableEditing();
        this.showNotification('Logged out successfully!', 'info');
    }

    showAdminPanel() {
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
            setTimeout(() => {
                adminPanel.classList.add('active');
            }, 10);
        }
        this.hideAdminModal();
    }

    hideAdminPanel() {
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.remove('active');
            setTimeout(() => {
                adminPanel.style.display = 'none';
            }, 300);
        }
    }

    showAdminModal() {
        const adminModal = document.getElementById('admin-modal');
        if (adminModal) {
            adminModal.style.display = 'block';
        }
    }

    hideAdminModal() {
        const adminModal = document.getElementById('admin-modal');
        if (adminModal) {
            adminModal.style.display = 'none';
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) passwordInput.value = '';
        }
    }

    // Enhanced Content Management
    async loadContent() {
        try {
            let loadedFrom = 'default';
            
            // Try Firebase first
            if (this.firebaseEnabled) {
                try {
                    const db = firebase.firestore();
                    
                    // Load main content
                    const contentDoc = await db.collection('portfolio').doc('content').get();
                    if (contentDoc.exists) {
                        const data = contentDoc.data();
                        if (data.version === this.contentVersion) {
                            this.currentContent = { ...this.currentContent, ...data.data };
                            this.applyContent(this.currentContent);
                            loadedFrom = 'firebase';
                        }
                    }
                    
                    // Load dynamic items
                    await this.loadDynamicItems();
                    console.log('Content loaded from Firebase');
                    return;
                    
                } catch (firebaseError) {
                    console.warn('Firebase load failed:', firebaseError);
                    this.firebaseEnabled = false;
                }
            }
            
            // Fallback to local storage
            const saved = localStorage.getItem('portfolioContent');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.version === this.contentVersion) {
                        this.currentContent = { ...this.currentContent, ...parsed.data };
                        this.applyContent(this.currentContent);
                        await this.loadDynamicItemsFromLocal();
                        loadedFrom = 'localStorage';
                        console.log('Content loaded from Local Storage');
                        return;
                    }
                } catch (e) {
                    console.warn('Local storage parse failed:', e);
                }
            }

            // Initialize with default content
            this.initializeDefaultContent();
            await this.saveContent();
            console.log('Content loaded from default HTML');
            
        } catch (error) {
            console.error('Error loading content:', error);
            this.initializeDefaultContent();
            this.applyContent(this.currentContent);
        }
    }

    initializeDefaultContent() {
        // Get static content from HTML
        const staticContent = this.getDefaultContent();
        this.currentContent = { ...this.currentContent, ...staticContent };
        
        // Extract static projects from HTML
        this.extractStaticProjects();
    }

    extractStaticProjects() {
        const projectCards = document.querySelectorAll('.static-project');
        this.currentContent.projects = [];
        
        projectCards.forEach((card, index) => {
            const title = card.querySelector('h3')?.textContent || '';
            const description = card.querySelector('.project-desc')?.textContent || '';
            const link = card.querySelector('a')?.href || '';
            
            if (title) {
                this.currentContent.projects.push({
                    id: 'static_project_' + index,
                    title: title,
                    description: description,
                    link: link,
                    order: index,
                    isStatic: true
                });
            }
        });
    }

    async loadDynamicItems() {
        if (!this.firebaseEnabled) return;

        const db = firebase.firestore();
        const collections = ['projects', 'publications', 'experiences', 'achievements'];
        
        for (const collection of collections) {
            try {
                const snapshot = await db.collection(collection).orderBy('order', 'asc').get();
                // Only replace content for non-projects collections
                // For projects, we'll merge with static ones
                if (collection !== 'projects') {
                    this.currentContent[collection] = [];
                } else {
                    // Keep static projects and add dynamic ones
                    const staticProjects = this.currentContent.projects.filter(p => p.isStatic);
                    this.currentContent.projects = staticProjects;
                }
                
                snapshot.forEach(doc => {
                    this.currentContent[collection].push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                this.renderDynamicItems(collection);
            } catch (error) {
                console.warn(`Failed to load ${collection}:`, error);
                // Fallback to local storage
                await this.loadDynamicItemsFromLocal();
            }
        }
    }

    async loadDynamicItemsFromLocal() {
        const collections = ['projects', 'publications', 'experiences', 'achievements'];
        for (const collection of collections) {
            const saved = localStorage.getItem(`portfolio_${collection}`);
            if (saved) {
                try {
                    const parsedData = JSON.parse(saved);
                    if (collection === 'projects') {
                        // Merge dynamic projects with static ones
                        const staticProjects = this.currentContent.projects.filter(p => p.isStatic);
                        const dynamicProjects = parsedData.filter(p => !p.isStatic);
                        this.currentContent[collection] = [...staticProjects, ...dynamicProjects];
                    } else {
                        this.currentContent[collection] = parsedData;
                    }
                    this.renderDynamicItems(collection);
                } catch (e) {
                    console.warn(`Failed to load ${collection} from local:`, e);
                }
            }
        }
    }

    renderDynamicItems(collection) {
        const container = document.getElementById(`${collection}-container`);
        if (!container) return;

        // Only clear dynamically added items (not static ones)
        const existingDynamicItems = container.querySelectorAll('.dynamic-item');
        existingDynamicItems.forEach(item => item.remove());

        // Render dynamic items
        const dynamicItems = this.currentContent[collection].filter(item => !item.isStatic);
        
        dynamicItems.forEach((item, index) => {
            const template = this.getTemplate(collection);
            if (template) {
                const newItem = template.cloneNode(true);
                newItem.classList.remove('template');
                newItem.classList.add('dynamic-item');
                newItem.style.display = 'block';
                
                this.populateItem(newItem, item, collection);
                this.addEditControls(newItem, collection, item.id);
                
                container.appendChild(newItem);
            }
        });

        // Add edit controls to static items if admin
        if (this.isAdmin && collection === 'projects') {
            this.addEditControlsToStaticProjects();
        }
    }

    addEditControlsToStaticProjects() {
        const staticProjects = document.querySelectorAll('.static-project');
        staticProjects.forEach((project, index) => {
            const projectId = 'static_project_' + index;
            this.addEditControls(project, 'projects', projectId);
        });
    }

    getTemplate(collection) {
        const template = document.querySelector(`.${collection.slice(0, -1)}-card.template`);
        return template ? template.cloneNode(true) : null;
    }

    populateItem(element, data, collection) {
        // Update element content based on data
        const fields = element.querySelectorAll('[data-field]');
        fields.forEach(field => {
            const fieldName = field.getAttribute('data-field');
            if (data[fieldName] !== undefined && data[fieldName] !== null) {
                if (field.tagName === 'IMG') {
                    field.src = data[fieldName];
                } else if (field.hasAttribute('data-html')) {
                    field.innerHTML = data[fieldName];
                } else {
                    field.textContent = data[fieldName];
                }
            }
        });

        // Update links
        const links = element.querySelectorAll('[data-link]');
        links.forEach(link => {
            const linkType = link.getAttribute('data-link');
            if (data[linkType] !== undefined && data[linkType] !== null) {
                link.href = data[linkType];
                if (data[linkType].startsWith('http')) {
                    link.target = '_blank';
                }
            } else {
                link.style.display = 'none';
            }
        });
    }

    addEditControls(element, collection, itemId) {
        if (!this.isAdmin) return;

        // Remove existing controls if any
        const existingControls = element.querySelector('.item-controls');
        if (existingControls) {
            existingControls.remove();
        }

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-warning btn-sm edit-item-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit Item';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            this.editItem(collection, itemId);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm delete-item-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete Item';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteItem(collection, itemId);
        };

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'item-controls';
        
        controlsDiv.appendChild(editBtn);
        controlsDiv.appendChild(deleteBtn);
        element.style.position = 'relative';
        element.appendChild(controlsDiv);
    }

    // CRUD Operations
    async addItem(collection, data) {
        if (!this.isAdmin) {
            this.showNotification('Admin access required!', 'error');
            return;
        }

        try {
            // Validate required fields
            if (!data.title && !data.role) {
                this.showNotification('Please provide at least a title/role!', 'error');
                return;
            }

            data.order = this.currentContent[collection].length;
            data.createdAt = new Date().toISOString();
            
            let itemId;
            
            if (this.firebaseEnabled) {
                try {
                    const db = firebase.firestore();
                    const docRef = await db.collection(collection).add(data);
                    itemId = docRef.id;
                    console.log(`Item added to Firebase with ID: ${itemId}`);
                } catch (firebaseError) {
                    console.error('Firebase add error:', firebaseError);
                    this.firebaseEnabled = false;
                    throw new Error('Firebase failed, switching to local storage');
                }
            } else {
                itemId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            const newItem = {
                id: itemId,
                ...data
            };
            
            this.currentContent[collection].push(newItem);
            await this.saveDynamicItems();
            this.renderDynamicItems(collection);
            this.showNotification(`${this.capitalizeFirst(collection.slice(0, -1))} added successfully!`, 'success');
            
        } catch (error) {
            console.error('Error adding item:', error);
            if (error.message.includes('Firebase failed')) {
                // Retry with local storage
                const itemId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const newItem = {
                    id: itemId,
                    ...data
                };
                this.currentContent[collection].push(newItem);
                await this.saveDynamicItems();
                this.renderDynamicItems(collection);
                this.showNotification(`${this.capitalizeFirst(collection.slice(0, -1))} added to local storage!`, 'success');
            } else {
                this.showNotification('Failed to add item! Please check console for details.', 'error');
            }
        }
    }

    async editItem(collection, itemId) {
        const item = this.currentContent[collection].find(item => item.id === itemId);
        if (!item) {
            this.showNotification('Item not found!', 'error');
            return;
        }

        // Create a simple form for editing
        const newTitle = prompt(`Enter new title (current: ${item.title || item.role || 'No title'}):`, item.title || item.role || '');
        if (newTitle === null) return;

        const newDescription = prompt(`Enter new description:`, item.description || item.details || '');
        if (newDescription === null) return;

        try {
            const updates = {};
            if (newTitle) updates.title = newTitle;
            if (newDescription !== null) updates.description = newDescription;

            Object.assign(item, updates);
            
            if (this.firebaseEnabled) {
                try {
                    const db = firebase.firestore();
                    await db.collection(collection).doc(itemId).update(updates);
                } catch (firebaseError) {
                    console.error('Firebase update error:', firebaseError);
                    this.firebaseEnabled = false;
                }
            }
            
            await this.saveDynamicItems();
            this.renderDynamicItems(collection);
            this.showNotification(`${this.capitalizeFirst(collection.slice(0, -1))} updated successfully!`, 'success');
            
        } catch (error) {
            console.error('Error updating item:', error);
            this.showNotification('Failed to update item!', 'error');
        }
    }

    async deleteItem(collection, itemId) {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            this.currentContent[collection] = this.currentContent[collection].filter(item => item.id !== itemId);
            
            if (this.firebaseEnabled) {
                try {
                    const db = firebase.firestore();
                    await db.collection(collection).doc(itemId).delete();
                } catch (firebaseError) {
                    console.error('Firebase delete error:', firebaseError);
                    this.firebaseEnabled = false;
                }
            }
            
            await this.saveDynamicItems();
            this.renderDynamicItems(collection);
            this.showNotification(`${this.capitalizeFirst(collection.slice(0, -1))} deleted successfully!`, 'success');
            
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showNotification('Failed to delete item!', 'error');
        }
    }

    async saveDynamicItems() {
        const collections = ['projects', 'publications', 'experiences', 'achievements'];
        
        for (const collection of collections) {
            // For projects, only save dynamic ones
            let itemsToSave = this.currentContent[collection];
            if (collection === 'projects') {
                itemsToSave = itemsToSave.filter(item => !item.isStatic);
            }
            
            // Save to localStorage as backup
            localStorage.setItem(`portfolio_${collection}`, JSON.stringify(itemsToSave));
        }
    }

    async saveContent() {
        if (!this.isAdmin && this.isEditing) {
            console.log('Not authorized to save content');
            return;
        }

        try {
            // Collect static content
            const content = {};
            const editableElements = document.querySelectorAll('[data-editable]');
            editableElements.forEach(element => {
                const key = element.getAttribute('data-editable');
                content[key] = element.innerHTML;
            });

            const contentToSave = {
                version: this.contentVersion,
                data: content,
                lastUpdated: new Date().toISOString()
            };

            // Save to Firebase
            if (this.firebaseEnabled) {
                try {
                    const db = firebase.firestore();
                    await db.collection('portfolio').doc('content').set(contentToSave);
                    console.log('Content saved to Firebase');
                } catch (firebaseError) {
                    console.warn('Firebase save failed:', firebaseError);
                    this.firebaseEnabled = false;
                }
            }
            
            // Save to local storage
            localStorage.setItem('portfolioContent', JSON.stringify(contentToSave));
            await this.saveDynamicItems();
            
            this.currentContent = { ...this.currentContent, ...content };
            this.showNotification('Changes saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving content:', error);
            this.showNotification('Changes saved to local storage only!', 'warning');
        }
    }

    // Form handlers for adding new items
    showAddForm(collection) {
        const formHtml = this.getAddFormHtml(collection);
        const formContainer = document.getElementById('add-form-container');
        if (formContainer) {
            formContainer.innerHTML = formHtml;
            formContainer.style.display = 'block';
            
            // Add event listener for Enter key
            const inputs = formContainer.querySelectorAll('.form-input');
            inputs.forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.submitAddForm(collection);
                    }
                });
            });
        }
    }

    getAddFormHtml(collection) {
        const forms = {
            projects: `
                <div class="add-form">
                    <h3>Add New Project</h3>
                    <input type="text" id="project-title" placeholder="Project Title *" class="form-input" required>
                    <textarea id="project-desc" placeholder="Project Description" class="form-input"></textarea>
                    <input type="text" id="project-link" placeholder="Project Link (optional)" class="form-input">
                    <div class="form-buttons">
                        <button onclick="portfolioManager.submitAddForm('projects')" class="btn btn-primary">Add Project</button>
                        <button onclick="portfolioManager.hideAddForm()" class="btn btn-outline">Cancel</button>
                    </div>
                </div>
            `,
            publications: `
                <div class="add-form">
                    <h3>Add New Publication</h3>
                    <input type="text" id="pub-title" placeholder="Publication Title *" class="form-input" required>
                    <input type="text" id="pub-journal" placeholder="Journal/Conference" class="form-input">
                    <input type="text" id="pub-date" placeholder="Publication Date" class="form-input">
                    <textarea id="pub-desc" placeholder="Description" class="form-input"></textarea>
                    <input type="text" id="pub-link" placeholder="Publication Link (optional)" class="form-input">
                    <div class="form-buttons">
                        <button onclick="portfolioManager.submitAddForm('publications')" class="btn btn-primary">Add Publication</button>
                        <button onclick="portfolioManager.hideAddForm()" class="btn btn-outline">Cancel</button>
                    </div>
                </div>
            `,
            experiences: `
                <div class="add-form">
                    <h3>Add New Experience</h3>
                    <input type="text" id="exp-role" placeholder="Role/Position *" class="form-input" required>
                    <input type="text" id="exp-company" placeholder="Company/Organization" class="form-input">
                    <input type="text" id="exp-duration" placeholder="Duration" class="form-input">
                    <textarea id="exp-details" placeholder="Details (one per line)" class="form-input"></textarea>
                    <div class="form-buttons">
                        <button onclick="portfolioManager.submitAddForm('experiences')" class="btn btn-primary">Add Experience</button>
                        <button onclick="portfolioManager.hideAddForm()" class="btn btn-outline">Cancel</button>
                    </div>
                </div>
            `,
            achievements: `
                <div class="add-form">
                    <h3>Add New Achievement</h3>
                    <input type="text" id="ach-title" placeholder="Achievement Title *" class="form-input" required>
                    <input type="text" id="ach-org" placeholder="Organization" class="form-input">
                    <input type="text" id="ach-desc" placeholder="Description" class="form-input">
                    <input type="text" id="ach-date" placeholder="Date" class="form-input">
                    <input type="text" id="ach-link" placeholder="Certificate Link (optional)" class="form-input">
                    <div class="form-buttons">
                        <button onclick="portfolioManager.submitAddForm('achievements')" class="btn btn-primary">Add Achievement</button>
                        <button onclick="portfolioManager.hideAddForm()" class="btn btn-outline">Cancel</button>
                    </div>
                </div>
            `
        };
        return forms[collection] || '';
    }

    async submitAddForm(collection) {
        const data = this.getFormData(collection);
        if (data) {
            await this.addItem(collection, data);
            this.hideAddForm();
        }
    }

    getFormData(collection) {
        const fields = {
            projects: {
                title: 'project-title',
                description: 'project-desc',
                link: 'project-link'
            },
            publications: {
                title: 'pub-title',
                journal: 'pub-journal',
                date: 'pub-date',
                description: 'pub-desc',
                link: 'pub-link'
            },
            experiences: {
                role: 'exp-role',
                company: 'exp-company',
                duration: 'exp-duration',
                details: 'exp-details'
            },
            achievements: {
                title: 'ach-title',
                organization: 'ach-org',
                description: 'ach-desc',
                date: 'ach-date',
                certificate: 'ach-link'
            }
        };

        const collectionFields = fields[collection];
        const data = {};

        for (const [key, fieldId] of Object.entries(collectionFields)) {
            const element = document.getElementById(fieldId);
            if (element) {
                if (element.hasAttribute('required') && !element.value.trim()) {
                    this.showNotification(`Please fill in the required field: ${element.placeholder}`, 'error');
                    element.focus();
                    return null;
                }
                if (element.value.trim()) {
                    data[key] = element.value.trim();
                }
            }
        }

        if (Object.keys(data).length === 0) {
            this.showNotification('Please fill in at least one field!', 'error');
            return null;
        }

        return data;
    }

    hideAddForm() {
        const formContainer = document.getElementById('add-form-container');
        if (formContainer) {
            formContainer.style.display = 'none';
            formContainer.innerHTML = '';
        }
    }

    // Utility methods
    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Existing methods (keep them as they are)
    getDefaultContent() {
        const content = {};
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            const key = element.getAttribute('data-editable');
            content[key] = element.innerHTML.trim();
        });
        return content;
    }

    applyContent(content) {
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            const key = element.getAttribute('data-editable');
            if (content[key] !== undefined && content[key] !== null) {
                element.innerHTML = content[key];
            }
        });
    }

    enableEditing() {
        if (!this.isAdmin) {
            this.showNotification('Please login as admin first!', 'error');
            return;
        }
        
        this.isEditing = true;
        this.originalContent = JSON.parse(JSON.stringify(this.currentContent));
        
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            element.contentEditable = true;
            element.classList.add('editing');
            
            element.addEventListener('focus', () => {
                element.classList.add('editing-focus');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('editing-focus');
                this.onContentChange(element);
            });
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    element.blur();
                }
                if (e.key === 'Escape') {
                    element.blur();
                }
            });
        });
        
        this.showNotification('Editing enabled! Click on any text to edit. Changes auto-save when you click away.', 'info');
    }

    disableEditing() {
        this.isEditing = false;
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
            element.contentEditable = false;
            element.classList.remove('editing', 'editing-focus');
        });
    }

    onContentChange(element) {
        const key = element.getAttribute('data-editable');
        this.currentContent[key] = element.innerHTML;
    }

    async saveAllChanges() {
        await this.saveContent();
        this.disableEditing();
    }

    resetToOriginal() {
        if (confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
            this.applyContent(this.originalContent);
            this.showNotification('Changes reset to original!', 'warning');
        }
    }

    resetToDefault() {
        if (confirm('Are you sure you want to reset to default content? This will erase all saved changes.')) {
            localStorage.removeItem('portfolioContent');
            ['projects', 'publications', 'experiences', 'achievements'].forEach(collection => {
                localStorage.removeItem(`portfolio_${collection}`);
            });
            location.reload();
        }
    }

    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; margin-left: 10px;">&times;</button>
        `;
        
        const bgColor = type === 'success' ? '#28a745' : 
                       type === 'error' ? '#dc3545' : 
                       type === 'warning' ? '#ffc107' : '#17a2b8';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: space-between;
            animation: slideIn 0.3s ease;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 400px;
            word-break: break-word;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global portfolio manager instance
const portfolioManager = new PortfolioManager();

// Admin Modal Functions
function showAdminModal() {
    portfolioManager.showAdminModal();
}

function hideAdminModal() {
    portfolioManager.hideAdminModal();
}

async function loginAdmin() {
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput) {
        const password = passwordInput.value;
        if (!password) {
            portfolioManager.showNotification('Please enter a password', 'error');
            return;
        }
        const success = await portfolioManager.loginAdmin(password);
        if (success) {
            hideAdminModal();
        }
    }
}

function logoutAdmin() {
    portfolioManager.logoutAdmin();
}

function enableEditing() {
    portfolioManager.enableEditing();
}

function saveAllChanges() {
    portfolioManager.saveAllChanges();
}

function resetToOriginal() {
    portfolioManager.resetToOriginal();
}

function resetToDefault() {
    portfolioManager.resetToDefault();
}

// New CRUD functions
function showAddForm(collection) {
    portfolioManager.showAddForm(collection);
}

function hideAddForm() {
    portfolioManager.hideAddForm();
}

// Initialize admin functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const adminToggle = document.getElementById('admin-toggle');
    if (adminToggle) {
        adminToggle.addEventListener('click', showAdminModal);
    }
    
    document.addEventListener('click', function(event) {
        const adminModal = document.getElementById('admin-modal');
        if (adminModal && adminModal.style.display === 'block' && event.target === adminModal) {
            hideAdminModal();
        }
        
        const addFormContainer = document.getElementById('add-form-container');
        if (addFormContainer && addFormContainer.style.display === 'block' && event.target === addFormContainer) {
            hideAddForm();
        }
    });
    
    const adminPassword = document.getElementById('admin-password');
    if (adminPassword) {
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginAdmin();
            }
        });
    }
    
    console.log('Enhanced Portfolio Manager initialized!');
});

// Make functions globally available
window.showAdminModal = showAdminModal;
window.hideAdminModal = hideAdminModal;
window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;
window.enableEditing = enableEditing;
window.saveAllChanges = saveAllChanges;
window.resetToOriginal = resetToOriginal;
window.resetToDefault = resetToDefault;
window.showAddForm = showAddForm;
window.hideAddForm = hideAddForm;