document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Interactive Geometric Background
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];

    // Resize handling
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 5 + 1; // Square size 1-6px
            this.speedX = Math.random() * 1 - 0.5; // Slow movement
            this.speedY = Math.random() * 1 - 0.5;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off edges
            if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        }

        draw() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // Slightly more transparent (0.5 -> 0.35)
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    // Initialize Particles
    function initParticles() {
        particles = [];
        const numParticles = 60;
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }
    initParticles();

    // Mouse tracking
    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw();

            // Connect to mouse
            if (mouse.x != null) {
                let dx = particle.x - mouse.x;
                let dy = particle.y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // reduced from 0.4
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }

            // Connect to nearby particles
            particles.forEach(p2 => {
                let dx = particle.x - p2.x;
                let dy = particle.y - p2.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; // reduced from 0.2
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }
    animate(); // Restart animation loop

    // Scroll Animation Observer (With Reverse Effect)
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (entry.target.classList.contains('count-up')) {
                    startCountAnimation(entry.target);
                }
            } else {
                // Remove class to play animation again when re-entering
                entry.target.classList.remove('active');
            }
        });
    }, observerOptions);

    const scrollElements = document.querySelectorAll('.scroll-reveal, .slide-left, .slide-right, .scale-up');
    scrollElements.forEach(el => observer.observe(el));

    // Counter Animation
    function startCountAnimation(el) {
        if (el.dataset.animated) return; // Prevent re-running
        el.dataset.animated = "true";

        const target = parseInt(el.dataset.target);
        const duration = 2000; // ms
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.innerText = target;
                clearInterval(timer);
            } else {
                el.innerText = Math.ceil(current);
            }
        }, 16);
    }

    // Dynamic Background Opacity for About Hero
    const aboutHero = document.querySelector('.about-hero-section');
    if (aboutHero) {
        // Create thresholds array [0, 0.05, 0.1, ... 1.0]
        const thresholds = [];
        for (let i = 0; i <= 1.0; i += 0.05) {
            thresholds.push(i);
        }

        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const canvas = document.getElementById('bg-canvas');
                // Calculate opacity: Base 0.2 + (Ratio * 0.7)
                // When 100% visible: 0.2 + 0.7 = 0.9
                // When 0% visible: 0.2 + 0 = 0.2
                const newOpacity = 0.2 + (entry.intersectionRatio * 0.7);
                canvas.style.opacity = newOpacity.toFixed(2);
                // Remove CSS transition to avoid lag with rapid JS updates
                canvas.style.transition = 'none';
            });
        }, { threshold: thresholds });
        heroObserver.observe(aboutHero);
    } // Close aboutHero block

    // Horizontal Scroll Logic for Education Page
    const scrollContainer = document.querySelector('.education-scroll-container');
    const timelineHorizontal = document.querySelector('.timeline-horizontal');
    const timelineCards = document.querySelectorAll('.timeline-card');

    if (scrollContainer && timelineHorizontal) {
        // Show cards immediately on load to prevent visibility issues
        timelineCards.forEach(card => card.classList.add('visible'));

        window.addEventListener('scroll', () => {
            const containerTop = scrollContainer.offsetTop;
            const containerHeight = scrollContainer.offsetHeight;
            const viewportHeight = window.innerHeight;
            const scrollY = window.scrollY;

            // Start scrolling when container hits top of viewport
            const start = containerTop;
            const end = containerTop + containerHeight - viewportHeight;

            if (scrollY >= start && scrollY <= end) {
                // Calculate progress (0 to 1)
                const progress = (scrollY - start) / (end - start);

                // Dynamic Calculation: How much content is hiding off-screen?
                // Total Width - Viewport Width + Padding
                const maxTranslate = timelineHorizontal.scrollWidth - window.innerWidth + 100;

                const moveAmount = progress * -maxTranslate;
                timelineHorizontal.style.transform = `translateX(${moveAmount}px)`;
            } else if (scrollY < start) {
                timelineHorizontal.style.transform = `translateX(0)`;
            } else if (scrollY > end) {
                // Snap to end
                const maxTranslate = timelineHorizontal.scrollWidth - window.innerWidth + 100;
                timelineHorizontal.style.transform = `translateX(${-maxTranslate}px)`;
            }
        });
    }

}); // Close DOMContentLoaded


/* Counter Animation */
const observerOptions = { threshold: 0.5 };
const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        const counter = entry.target;
        const target = parseFloat(counter.getAttribute('data-target'));
        const isDecimal = target % 1 !== 0;

        if (entry.isIntersecting) {
            const duration = 2000;
            const start = 0;
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

                const current = start + (target - start) * ease;
                counter.textContent = isDecimal ? current.toFixed(2) : Math.floor(current);

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counter.textContent = isDecimal ? target.toFixed(2) : target;
                }
            }
            requestAnimationFrame(update);
            // observer.unobserve(counter); // Removed to allow re-animation
        } else {
            // Reset when out of view
            counter.textContent = isDecimal ? "0.00" : "0";
        }
    });
}, observerOptions);

document.querySelectorAll('.counter-value').forEach(counter => {
    counterObserver.observe(counter);
});
