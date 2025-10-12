// Chart.js CDN will be loaded dynamically
function loadChartJS() {
    return new Promise((resolve) => {
        if (window.Chart) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Load Chart.js
    await loadChartJS();

    // Initialize charts
    initializePopulationChart();
    initializeBarChart();

    // Add interactive animations
    addInteractiveAnimations();

    // Initialize market value animations
    animateMarketValues();

    // Add weather icon animations
    animateWeatherIcons();
});

// Population Chart (Area Chart)
function initializePopulationChart() {
    const ctx = document.getElementById('populationChart').getContext('2d');

    const populationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Fish Population',
                data: [300, 250, 280, 350, 320, 400, 380, 420, 350, 300, 320, 280],
                backgroundColor: (ctx) => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.4)');
                    gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.2)');
                    gradient.addColorStop(1, 'rgba(0, 100, 255, 0.05)');
                    return gradient;
                },
                borderColor: '#00d4ff',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#ffffff'
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutCubic'
            }
        }
    });
}

// Bar Chart
function initializeBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');

    const barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['', '', '', '', '', '', '', '', ''],
            datasets: [{
                label: 'Data',
                data: [400, 300, 200, 350, 500, 450, 480, 380, 300],
                backgroundColor: (ctx) => {
                    const colors = [
                        'rgba(0, 212, 255, 0.8)',
                        'rgba(100, 220, 255, 0.8)',
                        'rgba(150, 230, 255, 0.8)',
                        'rgba(0, 212, 255, 0.8)',
                        'rgba(0, 190, 255, 0.8)',
                        'rgba(50, 200, 255, 0.8)',
                        'rgba(0, 212, 255, 0.8)',
                        'rgba(120, 225, 255, 0.8)',
                        'rgba(80, 210, 255, 0.8)'
                    ];
                    return colors[ctx.dataIndex] || 'rgba(0, 212, 255, 0.8)';
                },
                borderColor: '#00d4ff',
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: {
                            size: 10
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutBounce',
                delay: (context) => context.dataIndex * 100
            }
        }
    });
}

// Interactive Animations
function addInteractiveAnimations() {
    // Animate navigation buttons on hover
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach((button, index) => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });

        // Stagger initial animation
        button.style.animationDelay = `${index * 0.1}s`;
    });

    // Add click ripple effect
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Animate market values with counting effect
function animateMarketValues() {
    const marketItems = document.querySelectorAll('.fish-value');
    const targetValues = ['145', '1.465', '1.465', '1.465'];

    marketItems.forEach((item, index) => {
        const target = parseFloat(targetValues[index]) || 0;
        const isDecimal = targetValues[index].includes('.');
        let current = 0;
        const increment = target / 50;
        const duration = 1500 + (index * 200);

        const counter = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(counter);
            }

            if (isDecimal) {
                item.textContent = current.toFixed(3);
            } else {
                item.textContent = Math.floor(current).toString();
            }
        }, duration / 50);
    });
}

// Weather icon animations
function animateWeatherIcons() {
    const weatherItems = document.querySelectorAll('.weather-item');

    weatherItems.forEach((item, index) => {
        // Stagger entrance animation
        item.style.animationDelay = `${index * 0.1}s`;

        // Add hover pulse effect
        item.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.weather-icon');
            icon.style.animation = 'pulse 0.6s ease-in-out';
        });

        item.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.weather-icon');
            icon.style.animation = '';
        });
    });
}

// Add CSS for ripple effect and additional animations
const additionalStyles = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: rippleEffect 0.6s linear;
        pointer-events: none;
    }

    @keyframes rippleEffect {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }

    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }

    .market-item {
        animation: fadeInUp 0.6s ease-out both;
    }

    .market-item:nth-child(1) { animation-delay: 0.1s; }
    .market-item:nth-child(2) { animation-delay: 0.2s; }
    .market-item:nth-child(3) { animation-delay: 0.3s; }
    .market-item:nth-child(4) { animation-delay: 0.4s; }

    .weather-item {
        animation: fadeInUp 0.6s ease-out both;
    }

    .nav-btn {
        animation: fadeInDown 0.6s ease-out both;
    }

    @keyframes fadeInDown {
        from {
            transform: translateY(-30px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;

// Add the additional styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-btn[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';

    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

function googleTranslateElementInit() {
            new google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'hi,ta,te,gu,bn,mr,ml,kn,or,pa', // Indian languages
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                }, 
                'google_translate_element'
            );
        }