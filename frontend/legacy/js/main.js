// House Matters Frontend Application
class HouseMattersApp {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        console.log('🏠 House Matters App initialized');
    }

    setupEventListeners() {
        // Navigation toggle for mobile
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Add scroll effect to navbar
        this.setupScrollEffects();

        // Auth buttons
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }

        // Hero action buttons
        const findPropertyBtn = document.getElementById('find-property-btn');
        const listPropertyBtn = document.getElementById('list-property-btn');
        
        if (findPropertyBtn) {
            findPropertyBtn.addEventListener('click', () => this.handleFindProperty());
        }
        
        if (listPropertyBtn) {
            listPropertyBtn.addEventListener('click', () => this.handleListProperty());
        }

        // Modal overlay click to close
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add intersection observer for animations
        this.setupIntersectionObserver();

        // Add button hover effects
        this.setupButtonEffects();

        // Add parallax effect to hero
        this.setupParallaxEffect();

        // Setup property search functionality
        this.setupPropertySearch();

        // Setup property card interactions
        this.setupPropertyCards();

        // Setup CTA buttons
        this.setupCTAButtons();

        // Setup image loading
        this.setupImageLoading();
    }

    setupImageLoading() {
        // Add loading states to all images
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading class initially
            img.classList.add('image-loading');
            
            // Handle successful load
            img.addEventListener('load', () => {
                img.classList.remove('image-loading');
                img.classList.add('loaded');
            });
            
            // Handle load error
            img.addEventListener('error', () => {
                img.classList.remove('image-loading');
                console.warn('Failed to load image:', img.src);
                
                // Create fallback element
                const fallback = document.createElement('div');
                fallback.className = 'image-fallback';
                fallback.innerHTML = `
                    <div class="fallback-icon">📷</div>
                    <div class="fallback-text">${img.alt || 'Image unavailable'}</div>
                `;
                
                // Replace image with fallback
                if (img.parentNode) {
                    img.parentNode.replaceChild(fallback, img);
                }
            });
            
            // If image is already loaded (cached)
            if (img.complete && img.naturalHeight !== 0) {
                img.classList.remove('image-loading');
                img.classList.add('loaded');
            }
        });
    }

    setupParallaxEffect() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        try {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.2; // Reduced parallax effect
                
                if (scrolled < window.innerHeight) {
                    hero.style.transform = `translateY(${rate}px)`;
                }
            });
        } catch (error) {
            console.warn('Parallax effect disabled due to error:', error);
        }
    }

    setupPropertySearch() {
        const searchForm = document.getElementById('property-search-form');
        if (!searchForm) return;

        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(searchForm);
            const searchParams = {
                location: formData.get('location'),
                propertyType: formData.get('propertyType'),
                priceRange: formData.get('priceRange')
            };

            console.log('Search parameters:', searchParams);
            this.performPropertySearch(searchParams);
        });
    }

    async performPropertySearch(params) {
        try {
            // Show loading state
            const searchBtn = document.querySelector('.search-btn');
            const originalText = searchBtn.innerHTML;
            searchBtn.innerHTML = '<span>⏳</span> Searching...';
            searchBtn.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Reset button
            searchBtn.innerHTML = originalText;
            searchBtn.disabled = false;

            // Show results notification
            this.showNotification(
                `Found ${Math.floor(Math.random() * 50) + 10} properties matching your criteria!`, 
                'success'
            );

            // Scroll to properties section
            document.getElementById('properties').scrollIntoView({ 
                behavior: 'smooth' 
            });

        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('Search failed. Please try again.', 'error');
        }
    }

    setupPropertyCards() {
        const propertyCards = document.querySelectorAll('.property-card');
        
        propertyCards.forEach((card, index) => {
            // Add click handler
            card.addEventListener('click', () => {
                this.showPropertyDetails(index);
            });

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Setup "View all properties" button
        const viewAllBtn = document.getElementById('view-all-properties');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.showAllProperties();
            });
        }
    }

    showPropertyDetails(propertyIndex) {
        const properties = [
            {
                title: 'Modern 2BR Apartment',
                price: '$2,500/month',
                location: 'Downtown, New York',
                features: ['2 bed', '1 bath', '900 sqft'],
                description: 'Beautiful modern apartment with city views, updated kitchen, and in-unit laundry. Walking distance to restaurants, shopping, and public transportation.'
            },
            {
                title: 'Cozy Studio Near Campus',
                price: '$1,800/month',
                location: 'University District, Boston',
                features: ['Studio', '1 bath', '450 sqft'],
                description: 'Perfect for students or young professionals. Quiet neighborhood with easy access to campus and downtown. Recently renovated with modern appliances.'
            },
            {
                title: 'Family Home with Yard',
                price: '$3,200/month',
                location: 'Suburbs, Austin',
                features: ['3 bed', '2 bath', '1,200 sqft'],
                description: 'Large family home with backyard, garage, and updated kitchen. Great neighborhood with excellent schools. Perfect for families.'
            },
            {
                title: 'Luxury Penthouse',
                price: '$4,800/month',
                location: 'Manhattan, New York',
                features: ['2 bed', '2 bath', '1,400 sqft'],
                description: 'Stunning penthouse with panoramic city views, high-end finishes, and premium amenities. Located in the heart of Manhattan with concierge service.'
            },
            {
                title: 'Industrial Loft',
                price: '$2,100/month',
                location: 'Arts District, Los Angeles',
                features: ['1 bed', '1 bath', '800 sqft'],
                description: 'Unique industrial loft with exposed brick walls, high ceilings, and modern fixtures. Perfect for creatives in the vibrant Arts District.'
            },
            {
                title: 'Historic Townhouse',
                price: '$2,800/month',
                location: 'Georgetown, Washington DC',
                features: ['3 bed', '2.5 bath', '1,100 sqft'],
                description: 'Charming historic townhouse with original architectural details, updated amenities, and prime Georgetown location near shops and restaurants.'
            },
            {
                title: 'Contemporary Villa',
                price: '$3,500/month',
                location: 'Beverly Hills, California',
                features: ['4 bed', '3 bath', '2,200 sqft'],
                description: 'Stunning contemporary villa with modern design, spacious rooms, and beautiful outdoor space. Located in prestigious Beverly Hills neighborhood.'
            },
            {
                title: 'Shared Apartment Room',
                price: '$1,200/month',
                location: 'Mission District, San Francisco',
                features: ['1 room', 'Shared bath', '200 sqft'],
                description: 'Comfortable private room in shared apartment with friendly roommates. Great location in Mission District with easy access to public transportation.'
            },
            {
                title: 'Luxury Condo',
                price: '$4,200/month',
                location: 'River North, Chicago',
                features: ['2 bed', '2 bath', '1,300 sqft'],
                description: 'Luxury condominium with floor-to-ceiling windows, premium finishes, and building amenities including gym, pool, and rooftop deck.'
            },
            {
                title: 'Garden House',
                price: '$2,900/month',
                location: 'Pearl District, Portland',
                features: ['3 bed', '2 bath', '1,500 sqft'],
                description: 'Beautiful house with private garden, modern kitchen, and spacious living areas. Located in trendy Pearl District with great walkability.'
            }
        ];

        const property = properties[propertyIndex] || properties[0];

        const modalContent = `
            <div class="modal-header">
                <h2>${property.title}</h2>
                <button class="modal-close" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="property-details">
                <div class="property-detail-image">
                    <div class="property-placeholder">🏠</div>
                </div>
                <div class="property-detail-info">
                    <div class="property-price">${property.price}</div>
                    <p class="property-location">📍 ${property.location}</p>
                    <div class="property-features">
                        ${property.features.map(feature => `<span class="feature">${feature}</span>`).join('')}
                    </div>
                    <p class="property-description">${property.description}</p>
                    <div class="property-actions">
                        <button class="btn btn-primary" onclick="app.contactLandlord()">Contact Landlord</button>
                        <button class="btn btn-outline" onclick="app.scheduleViewing()">Schedule Viewing</button>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalContent);
    }

    contactLandlord() {
        this.closeModal();
        this.showNotification('Messaging feature will be available soon!', 'info');
    }

    scheduleViewing() {
        this.closeModal();
        this.showNotification('Booking feature will be available soon!', 'info');
    }

    showAllProperties() {
        const allProperties = [
            {
                title: 'Modern 2BR Apartment',
                price: '$2,500',
                location: 'Downtown, New York',
                features: ['2 bed', '1 bath', '900 sqft'],
                image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                badge: 'Featured'
            },
            {
                title: 'Cozy Studio Near Campus',
                price: '$1,800',
                location: 'University District, Boston',
                features: ['Studio', '1 bath', '450 sqft'],
                image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            },
            {
                title: 'Family Home with Yard',
                price: '$3,200',
                location: 'Suburbs, Austin',
                features: ['3 bed', '2 bath', '1,200 sqft'],
                image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            },
            {
                title: 'Luxury Penthouse',
                price: '$4,800',
                location: 'Manhattan, New York',
                features: ['2 bed', '2 bath', '1,400 sqft'],
                image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            },
            {
                title: 'Industrial Loft',
                price: '$2,100',
                location: 'Arts District, Los Angeles',
                features: ['1 bed', '1 bath', '800 sqft'],
                image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            },
            {
                title: 'Historic Townhouse',
                price: '$2,800',
                location: 'Georgetown, Washington DC',
                features: ['3 bed', '2.5 bath', '1,100 sqft'],
                image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                badge: 'New'
            },
            {
                title: 'Contemporary Villa',
                price: '$3,500',
                location: 'Beverly Hills, California',
                features: ['4 bed', '3 bath', '2,200 sqft'],
                image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            },
            {
                title: 'Shared Apartment Room',
                price: '$1,200',
                location: 'Mission District, San Francisco',
                features: ['1 room', 'Shared bath', '200 sqft'],
                image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            },
            {
                title: 'Luxury Condo',
                price: '$4,200',
                location: 'River North, Chicago',
                features: ['2 bed', '2 bath', '1,300 sqft'],
                image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                badge: 'Hot'
            },
            {
                title: 'Garden House',
                price: '$2,900',
                location: 'Pearl District, Portland',
                features: ['3 bed', '2 bath', '1,500 sqft'],
                image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            },
            // Additional properties for browsing
            {
                title: 'Beachfront Condo',
                price: '$3,800',
                location: 'Santa Monica, California',
                features: ['2 bed', '2 bath', '1,100 sqft'],
                image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            },
            {
                title: 'Downtown Loft',
                price: '$2,400',
                location: 'SoHo, New York',
                features: ['1 bed', '1 bath', '750 sqft'],
                image: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            }
        ];

        const modalContent = `
            <div class="modal-header">
                <h2>All Properties</h2>
                <button class="modal-close" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="properties-browser">
                <div class="browser-filters">
                    <div class="filter-group">
                        <select id="sort-properties" onchange="app.sortProperties(this.value)">
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="newest">Newest First</option>
                            <option value="popular">Most Popular</option>
                        </select>
                    </div>
                    <div class="results-count">
                        <span>${allProperties.length} properties found</span>
                    </div>
                </div>
                <div class="properties-list" id="properties-list">
                    ${allProperties.map((property, index) => `
                        <div class="property-item" onclick="app.showPropertyDetails(${index})">
                            <div class="property-item-image">
                                ${property.badge ? `<div class="property-badge">${property.badge}</div>` : ''}
                                <img src="${property.image}" alt="${property.title}" loading="lazy">
                            </div>
                            <div class="property-item-info">
                                <div class="property-item-price">${property.price}<span>/month</span></div>
                                <h4 class="property-item-title">${property.title}</h4>
                                <p class="property-item-location">📍 ${property.location}</p>
                                <div class="property-item-features">
                                    ${property.features.map(feature => `<span class="feature">${feature}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="browser-pagination">
                    <button class="btn btn-outline" onclick="app.loadMoreProperties()">
                        Load More Properties
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalContent);
    }

    sortProperties(sortBy) {
        // This would normally sort the properties and re-render
        this.showNotification(`Sorting by: ${sortBy.replace('-', ' ')}`, 'info');
    }

    loadMoreProperties() {
        this.showNotification('Loading more properties...', 'info');
        // This would normally load more properties from the API
    }

    setupCTAButtons() {
        // CTA section buttons
        const ctaSearchBtn = document.getElementById('cta-search-btn');
        const ctaListBtn = document.getElementById('cta-list-btn');

        if (ctaSearchBtn) {
            ctaSearchBtn.addEventListener('click', () => {
                document.getElementById('search').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            });
        }

        if (ctaListBtn) {
            ctaListBtn.addEventListener('click', () => {
                this.showRegisterModal();
            });
        }
    }

    setupScrollEffects() {
        const navbar = document.getElementById('navbar');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (navbar) {
                if (currentScrollY > 100) {
                    navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                    navbar.style.backdropFilter = 'blur(20px)';
                } else {
                    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                }

                // Hide/show navbar on scroll
                if (currentScrollY > lastScrollY && currentScrollY > 200) {
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateY(0)';
                }
            }

            lastScrollY = currentScrollY;
        });
    }

    setupIntersectionObserver() {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, skipping animations');
            return;
        }

        try {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);

            // Observe feature cards
            document.querySelectorAll('.feature-card').forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
                observer.observe(card);
            });
        } catch (error) {
            console.warn('Intersection observer setup failed:', error);
        }
    }

    setupButtonEffects() {
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px) scale(1.05)';
            });

            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });

            button.addEventListener('mousedown', function() {
                this.style.transform = 'translateY(0) scale(0.98)';
            });

            button.addEventListener('mouseup', function() {
                this.style.transform = 'translateY(-2px) scale(1.05)';
            });
        });
    }

    async checkAuthStatus() {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                // Verify token with backend (will be implemented later)
                console.log('Checking auth status...');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }

    showLoginModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>Welcome Back</h2>
                <button class="modal-close" onclick="app.closeModal()">&times;</button>
            </div>
            <form id="login-form" class="auth-form">
                <div class="form-group">
                    <label for="login-email">Email Address</label>
                    <input type="email" id="login-email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary btn-large">Sign In</button>
                <p class="auth-switch">
                    Don't have an account? 
                    <a href="#" onclick="app.showRegisterModal()">Sign up here</a>
                </p>
            </form>
        `;
        
        this.showModal(modalContent);
        
        // Add form submission handler
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    showRegisterModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>Join House Matters</h2>
                <button class="modal-close" onclick="app.closeModal()">&times;</button>
            </div>
            <form id="register-form" class="auth-form">
                <div class="form-group">
                    <label for="user-type">I am a:</label>
                    <select id="user-type" name="role" required>
                        <option value="">Select your role</option>
                        <option value="tenant">Tenant (Looking for property)</option>
                        <option value="landlord">Landlord (Have property to rent)</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="first-name">First Name</label>
                        <input type="text" id="first-name" name="firstName" required>
                    </div>
                    <div class="form-group">
                        <label for="last-name">Last Name</label>
                        <input type="text" id="last-name" name="lastName" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="register-email">Email Address</label>
                    <input type="email" id="register-email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="register-password">Password</label>
                    <input type="password" id="register-password" name="password" required>
                    <small>Must be at least 8 characters long</small>
                </div>
                <div class="form-group">
                    <label for="confirm-password">Confirm Password</label>
                    <input type="password" id="confirm-password" name="confirmPassword" required>
                </div>
                <button type="submit" class="btn btn-primary btn-large">Create Account</button>
                <p class="auth-switch">
                    Already have an account? 
                    <a href="#" onclick="app.showLoginModal()">Sign in here</a>
                </p>
            </form>
        `;
        
        this.showModal(modalContent);
        
        // Add form submission handler
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    showModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        
        if (modalOverlay && modalContent) {
            modalContent.innerHTML = content;
            
            // Add large class for properties browser
            if (content.includes('properties-browser')) {
                modalContent.classList.add('large');
            } else {
                modalContent.classList.remove('large');
            }
            
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            console.log('Login attempt:', { email: loginData.email });
            // TODO: Implement actual login API call
            this.showNotification('Login functionality will be implemented in the next phase', 'info');
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        const registerData = {
            role: formData.get('role'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: password
        };

        try {
            console.log('Registration attempt:', { 
                email: registerData.email, 
                role: registerData.role 
            });
            // TODO: Implement actual registration API call
            this.showNotification('Registration functionality will be implemented in the next phase', 'info');
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
        }
    }

    handleFindProperty() {
        console.log('Find property clicked');
        this.showNotification('Property search will be available soon!', 'info');
    }

    handleListProperty() {
        console.log('List property clicked');
        this.showNotification('Property listing will be available soon!', 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility method for API calls (will be expanded later)
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HouseMattersApp();
});

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 320px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
        animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        transform-origin: right center;
    }
    
    .notification-info { 
        background-color: #FF385C;
    }
    .notification-success { 
        background-color: #00A699;
    }
    .notification-error { 
        background-color: #C13515;
    }
    .notification-warning { 
        background-color: #FFAA00;
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    @keyframes slideInRight {
        from { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
        }
        to { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
        }
    }
    
    .auth-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    
    .form-group label {
        font-weight: 500;
        color: var(--gray-700);
    }
    
    .form-group input,
    .form-group select {
        padding: 14px 16px;
        border: 1px solid var(--gray-300);
        border-radius: var(--radius-lg);
        font-size: var(--font-size-base);
        background-color: var(--white);
        transition: var(--transition-fast);
        width: 100%;
    }
    
    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(255, 56, 92, 0.1);
    }
    
    .form-group small {
        color: var(--gray-500);
        font-size: var(--font-size-sm);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--gray-200);
    }
    
    .modal-header h2 {
        color: var(--gray-900);
        font-size: var(--font-size-2xl);
        font-weight: 700;
        letter-spacing: -0.02em;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--gray-500);
        padding: 4px;
        line-height: 1;
    }
    
    .modal-close:hover {
        color: var(--gray-700);
    }
    
    .auth-switch {
        text-align: center;
        color: var(--gray-600);
        margin-top: 16px;
    }
    
    .auth-switch a {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 500;
    }
    
    .auth-switch a:hover {
        text-decoration: underline;
    }
    
    .property-details {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
    }
    
    .property-detail-image {
        height: 200px;
        background: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-50) 100%);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        opacity: 0.6;
    }
    
    .property-detail-info .property-price {
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: var(--spacing-3);
    }
    
    .property-detail-info .property-location {
        font-size: var(--font-size-lg);
        color: var(--gray-600);
        margin-bottom: var(--spacing-4);
    }
    
    .property-detail-info .property-features {
        display: flex;
        gap: var(--spacing-2);
        margin-bottom: var(--spacing-6);
        flex-wrap: wrap;
    }
    
    .property-description {
        font-size: var(--font-size-base);
        color: var(--gray-700);
        line-height: var(--line-height-relaxed);
        margin-bottom: var(--spacing-8);
    }
    
    .property-actions {
        display: flex;
        gap: var(--spacing-4);
        flex-wrap: wrap;
    }
    
    .property-actions .btn {
        flex: 1;
        min-width: 150px;
    }
    
    /* Properties Browser Styles */
    .properties-browser {
        max-width: 800px;
        max-height: 70vh;
        overflow-y: auto;
    }
    
    .browser-filters {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-6);
        padding-bottom: var(--spacing-4);
        border-bottom: 1px solid var(--gray-200);
    }
    
    .filter-group select {
        padding: 8px 12px;
        border: 1px solid var(--gray-300);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        background-color: var(--white);
    }
    
    .results-count {
        font-size: var(--font-size-sm);
        color: var(--gray-600);
        font-weight: 500;
    }
    
    .properties-list {
        display: grid;
        gap: var(--spacing-4);
        margin-bottom: var(--spacing-6);
    }
    
    .property-item {
        display: flex;
        gap: var(--spacing-4);
        padding: var(--spacing-4);
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: var(--transition-fast);
        background-color: var(--white);
    }
    
    .property-item:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(255, 56, 92, 0.1);
        transform: translateY(-1px);
    }
    
    .property-item-image {
        width: 120px;
        height: 80px;
        border-radius: var(--radius-md);
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
    }
    
    .property-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .property-item-image .property-badge {
        position: absolute;
        top: 4px;
        left: 4px;
        font-size: 10px;
        padding: 2px 6px;
    }
    
    .property-item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    
    .property-item-price {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: var(--spacing-1);
    }
    
    .property-item-price span {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--gray-600);
    }
    
    .property-item-title {
        font-size: var(--font-size-base);
        font-weight: 600;
        color: var(--gray-900);
        margin-bottom: var(--spacing-1);
        line-height: var(--line-height-tight);
    }
    
    .property-item-location {
        font-size: var(--font-size-sm);
        color: var(--gray-600);
        margin-bottom: var(--spacing-2);
    }
    
    .property-item-features {
        display: flex;
        gap: var(--spacing-2);
        flex-wrap: wrap;
    }
    
    .property-item-features .feature {
        background-color: var(--gray-100);
        color: var(--gray-700);
        padding: 2px var(--spacing-2);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 500;
    }
    
    .browser-pagination {
        text-align: center;
        padding-top: var(--spacing-4);
        border-top: 1px solid var(--gray-200);
    }
    
    /* Mobile responsive for properties browser */
    @media (max-width: 600px) {
        .properties-browser {
            max-height: 80vh;
        }
        
        .browser-filters {
            flex-direction: column;
            gap: var(--spacing-3);
            align-items: stretch;
        }
        
        .property-item {
            flex-direction: column;
        }
        
        .property-item-image {
            width: 100%;
            height: 150px;
        }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);