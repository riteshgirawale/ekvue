// =====================
// DATA MANAGEMENT UTILITIES
// =====================

// Save demo request to localStorage
function saveDemoRequest(data) {
    const demoRequests = JSON.parse(localStorage.getItem('ekvue_demo_requests')) || [];
    data.submittedAt = new Date().toISOString();
    data.id = Date.now(); // Unique ID for each request
    demoRequests.push(data);
    localStorage.setItem('ekvue_demo_requests', JSON.stringify(demoRequests));
    console.log('Demo request saved:', data);
    return demoRequests;
}

// Get all demo requests
function getDemoRequests() {
    return JSON.parse(localStorage.getItem('ekvue_demo_requests')) || [];
}

// Export all data to a JSON file for backup
function exportAllData() {
    const data = {
        users: JSON.parse(localStorage.getItem('ekvue_users')) || [],
        currentUser: JSON.parse(localStorage.getItem('ekvue_user')) || null,
        demoRequests: JSON.parse(localStorage.getItem('ekvue_demo_requests')) || [],
        resume: JSON.parse(localStorage.getItem('ekvue_resume')) || null,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ekvue-backup-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    console.log('Data exported successfully');
    return data;
}

// Import data from a JSON file
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.users) {
                localStorage.setItem('ekvue_users', JSON.stringify(data.users));
            }
            if (data.demoRequests) {
                localStorage.setItem('ekvue_demo_requests', JSON.stringify(data.demoRequests));
            }
            if (data.resume) {
                localStorage.setItem('ekvue_resume', JSON.stringify(data.resume));
            }
            
            alert('Data imported successfully! Please refresh the page.');
            console.log('Data imported:', data);
        } catch (error) {
            alert('Error importing data: ' + error.message);
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// Clear all stored data (for testing/reset)
function clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
        localStorage.clear();
        alert('All data cleared! Please refresh the page.');
        window.location.href = 'index.html';
    }
}

// =====================
// MOBILE NAVIGATION
// =====================
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navButtons = document.querySelector('.nav-buttons');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    navButtons.classList.toggle('active');
});

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth Scroll for Navigation Links
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
        // Close mobile menu if open
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        navButtons.classList.remove('active');
    });
});

// Form Submission
const demoForm = document.getElementById('demoForm');
const successModal = document.getElementById('successMessage');

demoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(demoForm);
    const data = Object.fromEntries(formData.entries());
    
    console.log('Form submitted:', data);
    
    // Save demo request data to localStorage
    saveDemoRequest(data);
    
    // Show success message
    successModal.classList.add('show');
    
    // Reset form
    demoForm.reset();
    
    // Close modal after 5 seconds
    setTimeout(() => {
        closeSuccessMessage();
    }, 5000);
});

// Close Success Message
function closeSuccessMessage() {
    successModal.classList.remove('show');
}

// Close modal when clicking outside
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        closeSuccessMessage();
    }
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Add animation class styles
const style = document.createElement('style');
style.textContent = `
    .feature-card.animate {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// Parallax Effect for Hero Shapes
window.addEventListener('scroll', () => {
    const shapes = document.querySelectorAll('.hero-shape');
    const scrolled = window.pageYOffset;
    
    shapes.forEach((shape, index) => {
        const speed = (index + 1) * 0.1;
        shape.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Button Ripple Effect
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple styles
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        transform: scale(0);
        animation: ripple-anim 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-anim {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyle);

// Typing Effect for Hero Title (Optional Enhancement)
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    heroTitle.style.opacity = '0';
    heroTitle.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        heroTitle.style.transition = 'all 0.8s ease';
        heroTitle.style.opacity = '1';
        heroTitle.style.transform = 'translateY(0)';
    }, 200);
}

// Lazy Loading Images (if any added later)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Add loading state to buttons on form submit
demoForm.addEventListener('submit', function() {
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

// Counter Animation for Stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + '+';
        }
    }, 16);
}

// Observe stats for animation
const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.textContent);
            animateCounter(entry.target, target);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(stat => statsObserver.observe(stat));

// Keyboard Accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close mobile menu
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        navButtons.classList.remove('active');
        
        // Close modal
        closeSuccessMessage();
    }
});

// Form Validation
const inputs = demoForm.querySelectorAll('input, textarea');

inputs.forEach(input => {
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.style.borderColor = '#EF4444';
        } else {
            this.style.borderColor = '#E5E7EB';
        }
    });
    
    input.addEventListener('input', function() {
        this.style.borderColor = '#E5E7EB';
    });
});

// Console welcome message
console.log('%c🎉 Welcome to EkVue!', 'font-size: 24px; font-weight: bold; color: #4F46E5;');
console.log('%cBuilt with ❤️ for developers', 'font-size: 14px; color: #6B7280;');
