particlesJS("particles-js", {
  "particles": {
    "number": {
      "value": 80,
      "density": { "enable": true, "value_area": 800 }
    },
    "color": { "value": "#ffffff" },
    "shape": {
      "type": "circle",
      "stroke": { "width": 0, "color": "#000000" }
    },
    "opacity": {
      "value": 0.5,
      "random": false
    },
    "size": {
      "value": 3,
      "random": true
    },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#ffffff",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 2,
      "direction": "none",
      "straight": false,
      "out_mode": "bounce"
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": { "enable": true, "mode": "grab" },
      "onclick": { "enable": true, "mode": "push" }
    },
    "modes": {
      "grab": { "distance": 200, "line_linked": { "opacity": 1 } },
      "push": { "particles_nb": 4 }
    }
  },
  "retina_detect": true
});

// Animate progress bars when skills section is in view
function animateProgressBars() {
  const skillsSection = document.getElementById('skills');
  const progressBars = document.querySelectorAll('.progress-bar');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        progressBars.forEach(bar => {
          const targetWidth = bar.style.width;
          bar.style.width = '0';
          setTimeout(() => {
            bar.style.width = targetWidth;
          }, 100);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  if (skillsSection) {
    observer.observe(skillsSection);
  }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', animateProgressBars);

