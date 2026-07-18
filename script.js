/* ==========================================================================
   Bayu Seafood - Premium Interactivity Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Sticky Navigation, Scroll Canvas Track & Image Preloading
    const header = document.querySelector('header');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const canvas = document.getElementById('scroll-canvas');
    const videoWrapper = document.getElementById('home');
    const videoText = document.getElementById('video-text');

    let context = null;
    if (canvas) {
        context = canvas.getContext('2d');
    }

    const frameCount = 101;
    const currentFramePath = index => `scrollImage/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;
    const images = [];

    // Preload all 101 images
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFramePath(i);
        images.push(img);
    }

    let targetFrameIndex = 1;
    let currentFrameIndex = 1;
    let isAnimating = false;
    let lastWidth = 0;
    let lastHeight = 0;

    function resizeCanvas() {
        if (!canvas) return;
        const widthDiff = Math.abs(window.innerWidth - lastWidth);
        const heightDiff = Math.abs(window.innerHeight - lastHeight);
        
        // Skip minor height-only changes (like mobile address bar toggle) to prevent flickering
        if (widthDiff === 0 && heightDiff < 100 && canvas.width > 0) return;
        
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawFrame(Math.round(currentFrameIndex));
    }

    function drawFrame(index) {
        if (!canvas || !context) return;
        const img = images[index - 1];
        if (!img || !img.complete) return;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, drawX, drawY;

        if (canvasRatio > imgRatio) {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        } else {
            drawWidth = canvasHeight * imgRatio;
            drawHeight = canvasHeight;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        }

        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    // Set first frame drawing on load (handles both cached and slow loading cases)
    if (images[0]) {
        if (images[0].complete) {
            drawFrame(1);
        } else {
            images[0].onload = () => {
                drawFrame(1);
            };
        }
    }
    // Size canvas immediately on DOM load to prevent default 300x150 sizing gap
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Toggle header visibility based on scroll position in video track (always visible from start on mobile/tablet)
        const triggerHeight = window.innerWidth <= 768 ? 0 : window.innerHeight * 1.2;
        const stickyHeight = window.innerHeight * 2.0;

        if (scrollY >= triggerHeight) {
            header.classList.add('visible');
        } else {
            header.classList.remove('visible');
        }

        if (scrollY >= stickyHeight) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Active Navigation Link on scroll
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });

        // Scroll progress calculation for canvas frame selection
        if (videoWrapper) {
            const maxScroll = videoWrapper.offsetHeight - window.innerHeight;
            if (maxScroll > 0) {
                let progress = scrollY / maxScroll;
                progress = Math.max(0, Math.min(1, progress));
                
                // Map progress to [1, 101] frame range
                targetFrameIndex = 1 + progress * (frameCount - 1);

                // Start animation loop if not already running
                if (!isAnimating) {
                    isAnimating = true;
                    requestAnimationFrame(renderCanvasFrame);
                }

                // Smoothly fade out text overlay
                if (videoText) {
                    const textOpacity = Math.max(0, 1 - progress * 2.5);
                    videoText.style.opacity = textOpacity.toString();
                    if (textOpacity <= 0) {
                        videoText.style.visibility = 'hidden';
                    } else {
                        videoText.style.visibility = 'visible';
                    }
                }
            }
        }
    });

    // Dispatch scroll event on load to initialize header visibility
    window.dispatchEvent(new Event('scroll'));

    // Smooth frame seek loop using animation frames (only runs when active)
    function renderCanvasFrame() {
        const diff = targetFrameIndex - currentFrameIndex;
        if (Math.abs(diff) > 0.01) {
            currentFrameIndex += diff * 0.12;
            drawFrame(Math.round(currentFrameIndex));
            requestAnimationFrame(renderCanvasFrame);
            isAnimating = true;
        } else {
            currentFrameIndex = targetFrameIndex;
            drawFrame(Math.round(currentFrameIndex));
            isAnimating = false;
        }
    }
    // Render initial frame
    isAnimating = true;
    requestAnimationFrame(renderCanvasFrame);

    // 2. Scroll Reveal Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px', // Trigger slightly before element enters viewport
        threshold: 0.15
    };
    
    const scrollRevealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const elementsToReveal = document.querySelectorAll('.scroll-reveal');
    elementsToReveal.forEach(element => {
        scrollRevealObserver.observe(element);
    });

    // 3. Mobile Navigation Toggle
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            mobileNavToggle.classList.toggle('active');
        });
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                mobileNavToggle.classList.remove('active');
            });
        });
    }

    // 4. Artisan Culinary Highlights Interactive Carousel
    const carouselContainer = document.querySelector('.culinary-carousel-container');
    const carouselSlides = Array.from(document.querySelectorAll('.carousel-slide'));
    const infoTitle = document.getElementById('infoTitle');
    const infoDesc = document.getElementById('infoDesc');
    const carouselInfoBox = document.getElementById('carouselInfoBox');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const carouselTrackWrapper = document.getElementById('carouselTrackWrapper');

    if (carouselContainer && carouselSlides.length > 0) {
        let currentIndex = 1; // Start with the second image (index 1: Siakap Sambal Petai) as active
        let isTransitioning = false;

        // Set initial state class on load
        carouselContainer.classList.add('init-intro');

        // Intersection Observer to trigger entrance animation once
        const menuSection = document.getElementById('menu');
        if (menuSection) {
            const menuObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        carouselContainer.classList.remove('init-intro');
                        carouselContainer.classList.add('animate-intro');
                        
                        // Clean up animation class after it completes to allow smooth interactive transitions
                        setTimeout(() => {
                            carouselContainer.classList.remove('animate-intro');
                        }, 2600);
                        
                        menuObserver.unobserve(entry.target);
                    }
                });
            }, {
                root: null,
                threshold: 0.15
            });
            menuObserver.observe(menuSection);
        }

        // State update function
        function updateCarousel(index) {
            if (isTransitioning) return;
            isTransitioning = true;

            currentIndex = (index + carouselSlides.length) % carouselSlides.length;

            const activeIndex = currentIndex;
            const prevIndex = (currentIndex - 1 + carouselSlides.length) % carouselSlides.length;
            const nextIndex = (currentIndex + 1) % carouselSlides.length;

            // Fade out the info text
            if (carouselInfoBox) {
                carouselInfoBox.style.opacity = '0';
                carouselInfoBox.style.transform = 'translateY(10px)';
            }

            // Perform slide changes
            carouselSlides.forEach((slide, i) => {
                slide.className = 'carousel-slide'; // reset class
                if (i === activeIndex) {
                    slide.classList.add('active');
                } else if (i === prevIndex) {
                    slide.classList.add('prev');
                } else if (i === nextIndex) {
                    slide.classList.add('next');
                }
            });

            // Update text after a brief fade-out delay
            setTimeout(() => {
                const activeSlide = carouselSlides[activeIndex];
                if (activeSlide) {
                    const title = activeSlide.getAttribute('data-title');
                    const desc = activeSlide.getAttribute('data-desc');

                    if (infoTitle) infoTitle.textContent = title;
                    if (infoDesc) infoDesc.textContent = desc;
                }

                // Fade back in
                if (carouselInfoBox) {
                    carouselInfoBox.style.opacity = '1';
                    carouselInfoBox.style.transform = 'translateY(0)';
                }
                
                // Release lock
                setTimeout(() => {
                    isTransitioning = false;
                }, 400); // match transition speed
            }, 250);
        }

        // Navigation controls click
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                updateCarousel(currentIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                updateCarousel(currentIndex + 1);
            });
        }

        // Slide clicks: clicking left or right slide selects it
        carouselSlides.forEach((slide, i) => {
            slide.addEventListener('click', () => {
                if (slide.classList.contains('prev')) {
                    updateCarousel(currentIndex - 1);
                } else if (slide.classList.contains('next')) {
                    updateCarousel(currentIndex + 1);
                }
            });
        });

        // Swipe & Drag Gestures
        let dragStartX = 0;
        let dragMinDist = 50; // minimum swipe distance to register
        let isDragging = false;

        function handleDragStart(x) {
            if (carouselContainer.classList.contains('init-intro')) return;
            dragStartX = x;
            isDragging = true;
        }

        function handleDragEnd(x) {
            if (!isDragging) return;
            isDragging = false;
            const diffX = x - dragStartX;

            if (Math.abs(diffX) >= dragMinDist) {
                if (diffX > 0) {
                    // Swipe right -> Prev slide
                    updateCarousel(currentIndex - 1);
                } else {
                    // Swipe left -> Next slide
                    updateCarousel(currentIndex + 1);
                }
            }
        }

        // Touch event listeners
        if (carouselTrackWrapper) {
            carouselTrackWrapper.addEventListener('touchstart', (e) => {
                handleDragStart(e.touches[0].clientX);
            }, { passive: true });

            carouselTrackWrapper.addEventListener('touchend', (e) => {
                handleDragEnd(e.changedTouches[0].clientX);
            }, { passive: true });

            // Mouse event listeners for desktop drag feel
            carouselTrackWrapper.addEventListener('mousedown', (e) => {
                handleDragStart(e.clientX);
                // Prevent selection dragging on images
                e.preventDefault();
            });

            window.addEventListener('mouseup', (e) => {
                if (isDragging) {
                    handleDragEnd(e.clientX);
                }
            });
        }
    }

    // 5. WhatsApp Booking Form Generator (English Default)
    const bookingForm = document.getElementById('seafoodBookingForm');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Extract inputs
            const name = document.getElementById('bookName').value.trim();
            const date = document.getElementById('bookDate').value;
            const time = document.getElementById('bookTime').value;
            const guests = document.getElementById('bookGuests').value;
            const liveCatch = document.getElementById('bookLiveCatch').value;
            const specialRequests = document.getElementById('bookRequests').value.trim();
            
            if (!name || !date || !time || !guests) {
                alert('Please fill out all required fields (Name, Date, Time, and Guest Count).');
                return;
            }
            
            // Format dates for friendly reading (YYYY-MM-DD -> DD/MM/YYYY)
            let formattedDate = date;
            try {
                const dateParts = date.split('-');
                if (dateParts.length === 3) {
                    formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }
            } catch (err) {}
            
            // Format time for 12h format
            let formattedTime = time;
            try {
                const timeParts = time.split(':');
                if (timeParts.length === 2) {
                    let hour = parseInt(timeParts[0], 10);
                    const minute = timeParts[1];
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    hour = hour % 12;
                    hour = hour ? hour : 12;
                    formattedTime = `${hour}:${minute} ${ampm}`;
                }
            } catch (err) {}
            
            // Build polite English message
            let messageText = `Hello Bayu Seafood! I would like to reserve a table:\n\n`;
            messageText += `👤 Name: ${name}\n`;
            messageText += `📅 Date: ${formattedDate}\n`;
            messageText += `⏰ Time: ${formattedTime}\n`;
            messageText += `👥 Guests: ${guests} pax\n`;
            
            if (liveCatch && liveCatch !== 'No live catch preference') {
                messageText += `🦞 Aquarium Pick: ${liveCatch}\n`;
            }
            
            if (specialRequests) {
                messageText += `✍️ Special Requests: ${specialRequests}\n`;
            }
            
            messageText += `\nPlease confirm the availability of our table. Thank you!`;
            
            const encodedText = encodeURIComponent(messageText);
            const waNumber = '60177347030';
            const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodedText}`;
            
            window.open(waUrl, '_blank');
        });
    }
});
