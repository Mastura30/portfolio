particlesJS("particles-js", {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 } },
    color: { value: "#90caf9" },
    shape: { type: "circle" },
    opacity: { value: 0.5, random: true },
    size: { value: 3, random: true },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#42a5f5",
      opacity: 0.4,
      width: 1
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: true, mode: "repulse" },
      onclick: { enable: true, mode: "push" },
      resize: true
    }
  },
  retina_detect: true
});

document.querySelectorAll('nav a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId !== '#') {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });
});

let skillsAnimated = false;
let statsAnimated = false;

// Initialize progress bars with correct percentages
const initializeProgressBars = () => {
  const progressBars = document.querySelectorAll('.progress-bar');
  
  progressBars.forEach((bar, index) => {
    const progressValue = bar.parentElement.querySelector('.progress-value');
    
    // Set correct percentage values immediately
    if (progressValue) {
      const percentages = ['90%', '85%', '75%', '70%', '90%'];
      progressValue.textContent = percentages[index] || '0%';
    }
    
    bar.style.width = '0%';
    bar.style.transition = 'width 1.5s ease-in-out';
  });
};

const animateSkillProgressBars = () => {
  const progressBars = document.querySelectorAll('.progress-bar');
  
  progressBars.forEach((bar, index) => {
    const progressValue = bar.parentElement.querySelector('.progress-value');
    const percentages = [90, 85, 75, 70, 90];
    const targetPercent = percentages[index] || 0;
    
    setTimeout(() => {
      bar.style.width = targetPercent + '%';
      
      if (progressValue) {
        animateCounter(progressValue, 0, targetPercent, 1500);
      }
    }, index * 200);
  });
};

const animateCounter = (element, start, end, duration) => {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value + '%';
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
};

const setFinalProgressState = () => {
  const progressBars = document.querySelectorAll('.progress-bar');
  const percentages = [90, 85, 75, 70, 90];
  
  progressBars.forEach((bar, index) => {
    const progressValue = bar.parentElement.querySelector('.progress-value');
    const targetPercent = percentages[index] || 0;
    
    bar.style.width = targetPercent + '%';
    bar.style.transition = 'none';
    
    if (progressValue) {
      progressValue.textContent = targetPercent + '%';
    }
  });
};

const createSkillInteractions = () => {
  const skillItems = document.querySelectorAll('.skill-item');
  
  skillItems.forEach(item => {
    const progressBar = item.querySelector('.progress-bar');
    
    item.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.05)';
      this.style.zIndex = '10';
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.zIndex = '1';
    });
    
    item.addEventListener('click', function() {
      if (progressBar && skillsAnimated) {
        const progressValue = progressBar.parentElement.querySelector('.progress-value');
        const currentPercent = parseInt(progressValue.textContent);
        
        progressBar.style.width = '0%';
        progressValue.textContent = '0%';
        
        setTimeout(() => {
          progressBar.style.width = currentPercent + '%';
          animateCounter(progressValue, 0, currentPercent, 1000);
        }, 100);
      }
    });
  });
};

const initSkillsObserver = () => {
  const skillsSection = document.getElementById('skills');
  
  if (!skillsSection) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !skillsAnimated) {
        skillsAnimated = true;
        animateSkillProgressBars();
        localStorage.setItem('skillsAnimated', 'true');
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
  });
  
  observer.observe(skillsSection);
};

window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 100) {
    header.style.background = 'rgba(13, 37, 63, 0.95)';
    header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
  } else {
    header.style.background = 'rgba(13, 37, 63, 0.9)';
    header.style.boxShadow = 'none';
  }
});

const contactForm = document.querySelector('form');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const message = this.querySelector('textarea').value;
    
    if (!name || !email || !message) {
      alert('Please fill in all fields');
      return;
    }
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
      alert('Thank you for your message! I will get back to you soon.');
      this.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 2000);
  });
}

document.querySelectorAll('.education-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-15px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const savedState = localStorage.getItem('skillsAnimated');
  
  if (savedState === 'true') {
    skillsAnimated = true;
    setFinalProgressState();
  } else {
    initializeProgressBars();
  }
  
  initSkillsObserver();
  createSkillInteractions();
  
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 1s ease';
    document.body.style.opacity = '1';
  }, 100);
});

// Enhanced Scroll-to-Top Button
const scrollToTop = document.createElement('button');
scrollToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollToTop.className = 'scroll-to-top-btn';
scrollToTop.style.cssText = `
  position: fixed;
  bottom: 25px;
  right: 25px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #42a5f5, #1976d2);
  color: white;
  border: none;
  font-size: 20px;
  font-weight: 900;
  cursor: pointer;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(66, 165, 245, 0.8);
  backdrop-filter: blur(10px);
`;

document.body.appendChild(scrollToTop);

scrollToTop.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

scrollToTop.addEventListener('mouseenter', () => {
  scrollToTop.style.transform = 'translateY(-2px) scale(1.1)';
  scrollToTop.style.boxShadow = '0 8px 25px rgba(66, 165, 245, 1)';
  scrollToTop.style.background = 'linear-gradient(135deg, #64b5f6, #42a5f5)';
});

scrollToTop.addEventListener('mouseleave', () => {
  scrollToTop.style.transform = 'translateY(0) scale(1)';
  scrollToTop.style.boxShadow = '0 4px 20px rgba(66, 165, 245, 0.8)';
  scrollToTop.style.background = 'linear-gradient(135deg, #42a5f5, #1976d2)';
});

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    scrollToTop.style.opacity = '1';
    scrollToTop.style.transform = 'translateY(0)';
  } else {
    scrollToTop.style.opacity = '0';
    scrollToTop.style.transform = 'translateY(20px)';
  }
});

// New Reload Button
const reloadButton = document.createElement('button');
reloadButton.innerHTML = '<i class="fas fa-redo"></i>';
reloadButton.className = 'reload-btn';
reloadButton.style.cssText = `
  position: fixed;
  bottom: 90px;
  right: 25px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  backdrop-filter: blur(10px);
`;

document.body.appendChild(reloadButton);

reloadButton.addEventListener('click', () => {
  location.reload();
});

reloadButton.addEventListener('mouseenter', () => {
  reloadButton.style.transform = 'translateY(-2px) scale(1.1)';
  reloadButton.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.6)';
  reloadButton.style.background = 'linear-gradient(135deg, #ff8a8a, #ff6b6b)';
});

reloadButton.addEventListener('mouseleave', () => {
  reloadButton.style.transform = 'translateY(0) scale(1)';
  reloadButton.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
  reloadButton.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
});

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    reloadButton.style.opacity = '1';
    reloadButton.style.transform = 'translateY(0)';
  } else {
    reloadButton.style.opacity = '0';
    reloadButton.style.transform = 'translateY(20px)';
  }
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('nav');
  
  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      nav.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        mobileMenuToggle.classList.remove('active');
        nav.classList.remove('active');
      });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!event.target.closest('header')) {
        mobileMenuToggle.classList.remove('active');
        nav.classList.remove('active');
      }
    });
  }
});

// Enhanced Typing Effect - Immediate Start
function initTypingEffect() {
  const heroTitle = document.querySelector('.hero-left span');
  if (heroTitle) {
    const originalText = heroTitle.textContent;
    
    if (originalText && !heroTitle.classList.contains('typed')) {
      heroTitle.textContent = '';
      heroTitle.style.borderRight = 'none'; // Remove cursor
      
      let i = 0;
      const typeWriter = () => {
        if (i < originalText.length) {
          heroTitle.textContent += originalText.charAt(i);
          i++;
          setTimeout(typeWriter, 60); // Faster typing speed
        } else {
          heroTitle.classList.add('typed');
        }
      };
      
      // Start immediately without delay
      typeWriter();
    }
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const publicationCards = document.querySelectorAll('.publication-card:not(.template)');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            publicationCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const experienceCards = document.querySelectorAll('.experience-card:not(.template)');
    
    experienceCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
            this.classList.toggle('active');
        });
        
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateY(-3px)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });
});

window.addEventListener('load', function() {
  const projectsContainer = document.getElementById('projects-container');
  if (projectsContainer) {
    const staticProjects = projectsContainer.querySelectorAll('.static-project');
    staticProjects.forEach(project => {
      project.style.display = 'flex';
    });
  }
});

// Start typing effect immediately when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initTypingEffect();
});

document.addEventListener('DOMContentLoaded', function() {
  initializeProgressBars();
  initSkillsObserver();
  createSkillInteractions();
  document.body.style.opacity = '1';
});