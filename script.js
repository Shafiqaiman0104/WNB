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
    const text1 = document.getElementById('scroll-text-1');
    const text2 = document.getElementById('scroll-text-2');
    const text3 = document.getElementById('scroll-text-3');

    let context = null;
    if (canvas) {
        context = canvas.getContext('2d');
    }

    const frameCount = 101;
    const currentFramePath = index => `scrollImage/frame-${index.toString().padStart(3, '0')}.webp`;
    const images = [];

    // Precreate all image objects first
    for (let i = 1; i <= frameCount; i++) {
        images.push(new Image());
    }

    const initialLoadCount = 40;
    let loadedInitialCount = 0;
    let backgroundLoadStarted = false;

    function startBackgroundLoad() {
        if (backgroundLoadStarted) return;
        backgroundLoadStarted = true;
        for (let i = initialLoadCount + 1; i <= frameCount; i++) {
            images[i - 1].src = currentFramePath(i);
        }
    }

    // Load initial 40 images
    for (let i = 1; i <= initialLoadCount; i++) {
        images[i - 1].onload = () => {
            loadedInitialCount++;
            if (i === 1) {
                drawFrame(1);
            }
            if (loadedInitialCount >= initialLoadCount) {
                startBackgroundLoad();
            }
        };
        images[i - 1].onerror = () => {
            loadedInitialCount++;
            if (loadedInitialCount >= initialLoadCount) {
                startBackgroundLoad();
            }
        };
        images[i - 1].src = currentFramePath(i);
    }

    // Backup to ensure background images start loading even if some initial images fail/hang
    setTimeout(startBackgroundLoad, 3000);

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
    if (images[0] && images[0].complete) {
        drawFrame(1);
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
            updateScrollTextOpacity(currentFrameIndex);
            requestAnimationFrame(renderCanvasFrame);
            isAnimating = true;
        } else {
            currentFrameIndex = targetFrameIndex;
            drawFrame(Math.round(currentFrameIndex));
            updateScrollTextOpacity(currentFrameIndex);
            isAnimating = false;
        }
    }

    function getOpacity(frame, startFadeIn, endFadeIn, startFadeOut, endFadeOut) {
        if (frame < startFadeIn) return 0;
        if (frame <= endFadeIn) {
            return (frame - startFadeIn) / (endFadeIn - startFadeIn);
        }
        if (frame < startFadeOut) return 1;
        if (frame <= endFadeOut) {
            return 1 - (frame - startFadeOut) / (endFadeOut - startFadeOut);
        }
        return 0;
    }

    function updateScrollTextOpacity(frame) {
        if (!text1 || !text2 || !text3) return;

        const op1 = getOpacity(frame, 30, 36, 48, 54);
        const op2 = getOpacity(frame, 54, 60, 72, 78);
        const op3 = getOpacity(frame, 78, 84, 96, 101);

        applyOpacityAndVisibility(text1, op1);
        applyOpacityAndVisibility(text2, op2);
        applyOpacityAndVisibility(text3, op3);
    }

    function applyOpacityAndVisibility(element, opacity) {
        element.style.opacity = opacity.toFixed(3);
        if (opacity > 0) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
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
            } catch (err) { }

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
            } catch (err) { }

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

    // 6. Live Seafood Showcase Slider (Boston Lobster, Alaskan King Crab, Tiger Prawns)
    const catchesData = [
        {
            id: 'crab',
            title: 'Alaskan King Crab',
            desc: "The king of crabs. Sweet, succulent, and incredibly meaty. Perfect when wok-tossed in our signature Singapore Chili Sauce or Creamy Salted Egg.",
            img: 'lc1.png',
            bgImg: 'https://www.unileverfoodsolutions.lk/dam/global-ufs/mcos/meps/sri-lanka/calcmenu/recipes/LK-recipes/general/singaporean-style-chilli-crab/main-header.jpg',
            dropdownVal: 'Live Alaskan King Crab',
            badge: 'Chef\'s Pick'
        },
        {
            id: 'lobster',
            title: 'Boston Lobster',
            desc: 'Cold-water North Atlantic lobsters with plump claws and rich meat. Sublime when garlic-butter baked or topped with herb cheese.',
            img: 'lc2.png',
            bgImg: 'https://seafooddishrecipes.com/wp-content/uploads/2025/07/garlic-butter-lobster.webp',
            dropdownVal: 'Live Boston Lobster',
            badge: 'Premium Selection'
        },
        {
            id: 'prawns',
            title: 'Tiger Prawns',
            desc: 'Large-sized local prawns featuring a firm texture and natural sweetness. Best enjoyed cooked Kam Heong style or signature Dry Butter.',
            img: 'lc3.png',
            bgImg: 'https://static.vecteezy.com/system/resources/previews/042/370/075/large_2x/top-view-of-kam-heong-prawns-on-white-plate-delicious-asian-food-concept-photo.jpg',
            dropdownVal: 'Live Tiger Prawns',
            badge: 'Fresh Harvest'
        }
    ];

    let activeAqIndex = 1; // Boston Lobster is index 1
    let isAqTransitioning = false;

    const showcaseContainer = document.getElementById('aquariumShowcase');
    const aqTitleEl = document.getElementById('aqTitle');
    const aqDescEl = document.getElementById('aqDesc');
    const aqBadgeTextEl = document.getElementById('aqBadgeText');
    const aqInfoBoxEl = document.getElementById('aqInfoBox');
    const aqTopImgEl = document.getElementById('aqTopImg');
    const aqCenterImgEl = document.getElementById('aqCenterImg');
    const aqBottomImgEl = document.getElementById('aqBottomImg');
    const aqTopImgWrap = document.getElementById('aqTopImgWrap');
    const aqBottomImgWrap = document.getElementById('aqBottomImgWrap');
    const centerImgWrap = document.getElementById('aqCenterImgWrap');

    const aqPrevBtn = document.getElementById('aqPrevBtn');
    const aqNextBtn = document.getElementById('aqNextBtn');

    if (showcaseContainer) {
        // Enable initial hidden states via JS
        showcaseContainer.classList.add('js-enabled');

        // Set initial background image of the right info box using bgImg property
        if (aqInfoBoxEl) {
            aqInfoBoxEl.style.backgroundImage = `url('${catchesData[activeAqIndex].bgImg}')`;
        }

        // Coordinate calculations for the cinematic intro
        const setupIntroCoordinates = () => {
            if (!centerImgWrap || !showcaseContainer) return;

            // Clear current custom property variables for correct recalculation
            centerImgWrap.style.removeProperty('--center-x');
            centerImgWrap.style.removeProperty('--center-y');

            const showcaseRect = showcaseContainer.getBoundingClientRect();
            const imgRect = centerImgWrap.getBoundingClientRect();

            // Center points
            const showcaseCenterX = showcaseRect.left + showcaseRect.width / 2;
            const showcaseCenterY = showcaseRect.top + showcaseRect.height / 2;
            const imgCenterX = imgRect.left + imgRect.width / 2;
            const imgCenterY = imgRect.top + imgRect.height / 2;

            // Offset distance
            const translateX = showcaseCenterX - imgCenterX;
            const translateY = showcaseCenterY - imgCenterY;

            centerImgWrap.style.setProperty('--center-x', `${translateX}px`);
            centerImgWrap.style.setProperty('--center-y', `${translateY}px`);
        };

        // Initialize positions
        setupIntroCoordinates();
        window.addEventListener('resize', setupIntroCoordinates);

        // Intersection Observer to trigger scroll-linked start
        const aqObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setupIntroCoordinates();
                    showcaseContainer.classList.add('animate-intro');
                    aqObserver.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.15
        });
        aqObserver.observe(showcaseContainer);

        // Slider updating function
        const updateAquariumShowcase = (targetIndex) => {
            if (isAqTransitioning) return;
            isAqTransitioning = true;

            activeAqIndex = (targetIndex + catchesData.length) % catchesData.length;
            const activeData = catchesData[activeAqIndex];
            const topIndex = (activeAqIndex - 1 + catchesData.length) % catchesData.length;
            const bottomIndex = (activeAqIndex + 1) % catchesData.length;

            // Step 1: Fade out details
            if (aqInfoBoxEl) {
                aqInfoBoxEl.style.opacity = '0';
                aqInfoBoxEl.style.transform = 'translateX(-20px)'; // Shift left to animate left-to-right on fade-in
            }
            if (centerImgWrap) {
                centerImgWrap.style.transform = 'scale(0.85)';
                centerImgWrap.style.opacity = '0.3';
            }
            if (aqTopImgWrap) {
                aqTopImgWrap.style.transform = 'scale(0.7)';
                aqTopImgWrap.style.opacity = '0';
            }
            if (aqBottomImgWrap) {
                aqBottomImgWrap.style.transform = 'scale(0.7)';
                aqBottomImgWrap.style.opacity = '0';
            }

            // Step 2: Swap sources and contents after fade out completes
            setTimeout(() => {
                if (aqTopImgEl) {
                    aqTopImgEl.src = catchesData[topIndex].img;
                    aqTopImgEl.alt = catchesData[topIndex].title;
                }
                if (aqCenterImgEl) {
                    aqCenterImgEl.src = activeData.img;
                    aqCenterImgEl.alt = activeData.title;
                }
                if (aqBottomImgEl) {
                    aqBottomImgEl.src = catchesData[bottomIndex].img;
                    aqBottomImgEl.alt = catchesData[bottomIndex].title;
                }

                if (aqTitleEl) aqTitleEl.textContent = activeData.title;
                if (aqDescEl) aqDescEl.textContent = activeData.desc;
                if (aqBadgeTextEl) aqBadgeTextEl.textContent = activeData.badge;

                // Set background image of the right info box using bgImg property
                if (aqInfoBoxEl) {
                    aqInfoBoxEl.style.backgroundImage = `url('${activeData.bgImg}')`;
                }

                // Step 3: Fade in elements with new information
                if (centerImgWrap) {
                    centerImgWrap.style.transform = '';
                    centerImgWrap.style.opacity = '';
                }
                if (aqTopImgWrap) {
                    aqTopImgWrap.style.transform = '';
                    aqTopImgWrap.style.opacity = '';
                }
                if (aqBottomImgWrap) {
                    aqBottomImgWrap.style.transform = '';
                    aqBottomImgWrap.style.opacity = '';
                }

                if (aqInfoBoxEl) {
                    aqInfoBoxEl.style.opacity = '';
                    aqInfoBoxEl.style.transform = '';
                }

                setTimeout(() => {
                    isAqTransitioning = false;
                }, 500);
            }, 350);
        };

        // Navigation button bindings
        if (aqPrevBtn) {
            aqPrevBtn.addEventListener('click', () => {
                updateAquariumShowcase(activeAqIndex - 1);
            });
        }
        if (aqNextBtn) {
            aqNextBtn.addEventListener('click', () => {
                updateAquariumShowcase(activeAqIndex + 1);
            });
        }

        // Click previews directly to navigate
        if (aqTopImgWrap) {
            aqTopImgWrap.addEventListener('click', () => {
                updateAquariumShowcase(activeAqIndex - 1);
            });
        }
        if (aqBottomImgWrap) {
            aqBottomImgWrap.addEventListener('click', () => {
                updateAquariumShowcase(activeAqIndex + 1);
            });
        }

        // Swipes / Drag gestures on image column (animating center-img-holder only)
        const imagesStack = document.querySelector('.showcase-images-stack');
        if (imagesStack) {
            let dragStartY = 0;
            let currentDragY = 0;
            let dragMinDist = 45;
            let isDragging = false;

            const handleDragStart = (y) => {
                dragStartY = y;
                currentDragY = y;
                isDragging = true;
                if (centerImgWrap) {
                    const centerHolder = centerImgWrap.querySelector('.center-img-holder');
                    if (centerHolder) {
                        centerHolder.style.transition = 'none';
                        centerHolder.style.animation = 'none'; // Disable breath animation during drag to allow translateY transforms
                    }
                }
            };

            const handleDragMove = (y, event) => {
                if (!isDragging) return;
                currentDragY = y;
                const diffY = currentDragY - dragStartY;

                if (event && event.cancelable) {
                    event.preventDefault();
                }

                // Apply dampened visual translation ONLY to the active center image holder
                const displacement = diffY * 0.5;
                if (centerImgWrap) {
                    const centerHolder = centerImgWrap.querySelector('.center-img-holder');
                    if (centerHolder) {
                        centerHolder.style.transform = `translateY(${displacement}px)`;
                    }
                }
            };

            const handleDragEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                const diffY = currentDragY - dragStartY;

                if (centerImgWrap) {
                    const centerHolder = centerImgWrap.querySelector('.center-img-holder');
                    if (centerHolder) {
                        // Smooth snap back with spring cubic-bezier transition
                        centerHolder.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        centerHolder.style.transform = '';

                        // Clear inline transition after transition completes
                        setTimeout(() => {
                            if (!isDragging) {
                                centerHolder.style.transition = '';
                                centerHolder.style.animation = ''; // Restore breath animation
                            }
                        }, 500);
                    }
                }

                if (Math.abs(diffY) >= dragMinDist) {
                    if (diffY > 0) {
                        // Swipe down -> show previous catch
                        updateAquariumShowcase(activeAqIndex - 1);
                    } else {
                        // Swipe up -> show next catch
                        updateAquariumShowcase(activeAqIndex + 1);
                    }
                }
            };

            // Touch events for mobile swiping
            imagesStack.addEventListener('touchstart', (e) => {
                if (e.touches.length > 0) {
                    handleDragStart(e.touches[0].clientY);
                }
            }, { passive: false });

            imagesStack.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    handleDragMove(e.touches[0].clientY, e);
                }
            }, { passive: false }); // Lock page scroll

            imagesStack.addEventListener('touchend', (e) => {
                handleDragEnd();
            }, { passive: true });

            // Mouse events for desktop dragging
            imagesStack.addEventListener('mousedown', (e) => {
                handleDragStart(e.clientY);
                e.preventDefault(); // Prevents default ghost outline drag
            });

            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    handleDragMove(e.clientY);
                }
            });

            window.addEventListener('mouseup', (e) => {
                if (isDragging) {
                    handleDragEnd();
                }
            });
        }

        // WhatsApp Booking Portal auto-selection and scroll integration
        const aqSelectBtn = document.getElementById('aqSelectBtn');
        const aqNavTabBtn = document.getElementById('aqNavTabBtn');
        const bookLiveCatchDropdown = document.getElementById('bookLiveCatch');

        const handleSelectionAndScroll = (e) => {
            e.preventDefault();
            const activeData = catchesData[activeAqIndex];
            if (bookLiveCatchDropdown && activeData) {
                bookLiveCatchDropdown.value = activeData.dropdownVal;
            }
            const targetSec = document.getElementById('reservation');
            if (targetSec) {
                targetSec.scrollIntoView({ behavior: 'smooth' });
            }
        };

        if (aqSelectBtn) aqSelectBtn.addEventListener('click', handleSelectionAndScroll);
        if (aqNavTabBtn) aqNavTabBtn.addEventListener('click', handleSelectionAndScroll);

        // 7. Executive Chef Orbital Certificates & Lightbox Modal Popup System
        const certOrbitSystem = document.getElementById('certOrbitSystem');
        const certCards = document.querySelectorAll('.cert-card-orbit');
        const certModal = document.getElementById('certModal');
        const certModalImg = document.getElementById('certModalImg');
        const certModalTitle = document.getElementById('certModalTitle');
        const certModalClose = document.getElementById('certModalClose');

        if (certOrbitSystem && certCards.length > 0) {
            let currentAngle = 0;
            let isHoveringOrbit = false;
            const orbitSpeed = 0.007; // Smooth continuous flying speed

            // Pause orbit animation on mouse hover over any certificate
            certCards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    isHoveringOrbit = true;
                });
                card.addEventListener('mouseleave', () => {
                    isHoveringOrbit = false;
                });

                // Click certificate to open Lightbox Modal
                card.addEventListener('click', () => {
                    const certUrl = card.getAttribute('data-cert-url');
                    const certTitle = card.getAttribute('data-cert-title') || 'Official Certification';

                    if (certModal && certModalImg) {
                        certModalImg.src = certUrl;
                        if (certModalTitle) certModalTitle.textContent = certTitle;
                        certModal.classList.add('active');
                        document.body.style.overflow = 'hidden'; // Lock scroll when modal is active
                    }
                });
            });

            // Achievement Modal System
            const achievementBtn = document.getElementById('achievementBtn');
            const achievementModal = document.getElementById('achievementModal');
            const achievementModalClose = document.getElementById('achievementModalClose');

            if (achievementBtn && achievementModal) {
                achievementBtn.addEventListener('click', () => {
                    achievementModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            }

            function closeAchievementModal() {
                if (achievementModal) {
                    achievementModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }

            if (achievementModalClose) {
                achievementModalClose.addEventListener('click', closeAchievementModal);
            }

            if (achievementModal) {
                achievementModal.addEventListener('click', (e) => {
                    if (e.target === achievementModal) {
                        closeAchievementModal();
                    }
                });
            }

            // Modal Close Triggers
            function closeCertModal() {
                if (certModal) {
                    certModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }

            if (certModalClose) {
                certModalClose.addEventListener('click', closeCertModal);
            }

            if (certModal) {
                certModal.addEventListener('click', (e) => {
                    if (e.target === certModal) {
                        closeCertModal();
                    }
                });
            }

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (certModal && certModal.classList.contains('active')) {
                        closeCertModal();
                    }
                    if (achievementModal && achievementModal.classList.contains('active')) {
                        closeAchievementModal();
                    }
                }
            });

            // Continuous 3D Elliptical Orbit Loop
            function animateCertOrbit() {
                if (!isHoveringOrbit) {
                    currentAngle += orbitSpeed;
                }

                const isMobile = window.innerWidth <= 768;
                // Responsive orbit radii
                const rx = isMobile ? 120 : 250; // Horizontal radius
                const ry = isMobile ? 40 : 75;    // Vertical 3D perspective tilt

                const totalCards = certCards.length;
                certCards.forEach((card, idx) => {
                    // Angular offset for each certificate
                    const angleOffset = (idx * (2 * Math.PI / totalCards));
                    const angle = currentAngle + angleOffset;

                    const x = Math.cos(angle) * rx;
                    const y = Math.sin(angle) * ry;

                    // Depth & scale physics (sin value ranges from -1 to 1)
                    const sinVal = Math.sin(angle);

                    // In front (sinVal > 0): larger, z-index 20 (in front of chef)
                    // Behind (sinVal <= 0): z-index 2 (occluded behind chef.png)
                    const scale = isMobile ? (0.7 + 0.3 * (sinVal + 1) / 2) : (0.75 + 0.35 * (sinVal + 1) / 2);
                    const opacity = sinVal > 0 ? 1 : 0.85;
                    const zIndex = sinVal > 0 ? 20 : 2;

                    card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
                    card.style.opacity = opacity.toFixed(3);
                    card.style.zIndex = zIndex;
                });

                requestAnimationFrame(animateCertOrbit);
            }

            // Launch orbit loop
            requestAnimationFrame(animateCertOrbit);
        }
    }

    // ==========================================================================
    // Standalone Interactive PDF Menu Flipbook on Wood Table (table.png)
    // ==========================================================================
    async function initStandaloneMenuFlipbook() {
        const flipContainer = document.getElementById('menuFlipbook');
        if (!flipContainer) return;

        if (typeof pdfjsLib === 'undefined' || typeof St === 'undefined') {
            console.error('PDF.js or StPageFlip library not loaded');
            return;
        }

        // Configure PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        try {
            const loadingTask = pdfjsLib.getDocument('bayu-menu.pdf');
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            // Clear loading spinner
            flipContainer.innerHTML = '';

            const pageItems = [];

            for (let i = 1; i <= totalPages; i++) {
                const pageDiv = document.createElement('div');
                pageDiv.className = 'flipbook-page-item';
                if (i === 1 || i === totalPages) {
                    pageDiv.setAttribute('data-density', 'hard');
                } else {
                    pageDiv.setAttribute('data-density', 'soft');
                }

                const canvas = document.createElement('canvas');
                pageDiv.appendChild(canvas);
                flipContainer.appendChild(pageDiv);

                pageItems.push({
                    div: pageDiv,
                    canvas: canvas,
                    pageNum: i
                });
            }

            const getDimensions = () => {
                const w = window.innerWidth;
                if (w <= 400) {
                    // Mobile narrow: 2-page spread ~230px wide total
                    return { width: 115, height: 158, minW: 90, maxW: 130, minH: 120, maxH: 180 };
                } else if (w <= 600) {
                    // Mobile medium: 2-page spread ~260px wide total
                    return { width: 130, height: 178, minW: 100, maxW: 150, minH: 140, maxH: 210 };
                } else if (w <= 900) {
                    // Tablet: 2-page spread ~360px wide total
                    return { width: 180, height: 245, minW: 140, maxW: 210, minH: 190, maxH: 290 };
                } else {
                    // Desktop: 2-page spread ~440px wide total (compact POV on 1000px table.png)
                    return { width: 220, height: 300, minW: 180, maxW: 260, minH: 240, maxH: 360 };
                }
            };

            const dims = getDimensions();

            const pageFlip = new St.PageFlip(flipContainer, {
                width: dims.width,
                height: dims.height,
                size: "stretch",
                minWidth: dims.minW,
                maxWidth: dims.maxW,
                minHeight: dims.minH,
                maxHeight: dims.maxH,
                drawShadow: true,
                showCover: true,
                usePortrait: false, // Force 2-page spread (left & right) on ALL devices including mobile
                autoCenter: true,
                maxShadowOpacity: 0.7,
                mobileScrollSupport: false,
                clickEventForward: true
            });

            pageFlip.loadFromHTML(flipContainer.querySelectorAll('.flipbook-page-item'));

            // Smooth cover-centering position update & unopened breathing loop
            function updateCoverPosition(pageIndex) {
                if (pageIndex === 0) {
                    // Closed front cover (page 1): shift stage left by 25% to center front cover
                    flipContainer.style.setProperty('--cover-x', '-25%');
                    flipContainer.style.transform = 'translateX(-25%)';
                    flipContainer.classList.add('is-breathing');
                } else if (pageIndex >= totalPages - 1) {
                    // Closed back cover (last page): shift stage right by 25% to center back cover
                    flipContainer.style.setProperty('--cover-x', '25%');
                    flipContainer.style.transform = 'translateX(25%)';
                    flipContainer.classList.add('is-breathing');
                } else {
                    // Open 2-page spread: center spread & pause breathing animation for reading
                    flipContainer.style.setProperty('--cover-x', '0');
                    flipContainer.style.transform = 'translateX(0)';
                    flipContainer.classList.remove('is-breathing');
                }
            }

            // Set initial position & breathing for closed cover
            updateCoverPosition(0);

            // Scroll reveal observer: Table slides up from bottom to top, Menu slides down from top to bottom
            const tableStage = document.querySelector('.table-stage');
            if (tableStage && typeof IntersectionObserver !== 'undefined') {
                const revealObs = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            tableStage.classList.add('in-view');
                            revealObs.unobserve(tableStage);
                        }
                    });
                }, { threshold: 0.15 });
                revealObs.observe(tableStage);
            } else if (tableStage) {
                tableStage.classList.add('in-view');
            }

            // Dynamically scale flipbook and table action buttons as table.png resizes on mobile
            function updateFlipbookScale() {
                const stage = document.querySelector('.table-stage');
                const overlay = document.querySelector('.flipbook-overlay');
                const actionsBar = document.querySelector('.table-actions-bar');
                if (!stage || !overlay) return;

                const currentWidth = stage.offsetWidth;
                const isMobile = window.innerWidth <= 600;
                const refWidth = isMobile ? 520 : 950;

                let scale = currentWidth / refWidth;
                scale = Math.min(1.0, Math.max(0.42, scale));
                overlay.style.setProperty('--flipbook-scale', scale.toFixed(3));

                if (actionsBar) {
                    let btnScale = isMobile ? Math.min(1.0, Math.max(0.70, currentWidth / 480)) : Math.min(1.0, Math.max(0.80, currentWidth / 850));
                    actionsBar.style.setProperty('--table-btn-scale', btnScale.toFixed(3));
                }
            }

            updateFlipbookScale();
            window.addEventListener('resize', updateFlipbookScale);
            if (typeof ResizeObserver !== 'undefined') {
                const ro = new ResizeObserver(() => updateFlipbookScale());
                if (tableStage) ro.observe(tableStage);
            }

            // Share PDF Button Interaction
            const shareBtn = document.getElementById('shareMenuBtn');
            if (shareBtn) {
                shareBtn.addEventListener('click', async () => {
                    const shareData = {
                        title: 'Bayu Seafood Menu',
                        text: 'Explore our exquisite live seafood menu at Bayu Seafood Restaurant!',
                        url: 'https://whitenblack.my/flipbook/wnb-bayu/'
                    };

                    if (navigator.share) {
                        try {
                            await navigator.share(shareData);
                        } catch (err) {
                            if (err.name !== 'AbortError') {
                                copyMenuLink();
                            }
                        }
                    } else {
                        copyMenuLink();
                    }
                });
            }

            function copyMenuLink() {
                const url = 'https://whitenblack.my/flipbook/wnb-bayu/';
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(() => {
                        showToast('Menu link copied to clipboard!');
                    }).catch(() => {
                        showToast('Menu Link: ' + url);
                    });
                } else {
                    showToast('Menu Link: ' + url);
                }
            }

            function showToast(msg) {
                let toast = document.getElementById('tableToast');
                if (!toast) {
                    toast = document.createElement('div');
                    toast.id = 'tableToast';
                    toast.style.cssText = `
                        position: fixed;
                        bottom: 30px;
                        left: 50%;
                        transform: translateX(-50%) translateY(10px);
                        background: #d4af37;
                        color: #0d1727;
                        padding: 12px 24px;
                        border-radius: 30px;
                        font-weight: 600;
                        font-size: 0.9rem;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.4);
                        z-index: 10000;
                        transition: opacity 0.4s ease, transform 0.4s ease;
                        opacity: 0;
                    `;
                    document.body.appendChild(toast);
                }
                toast.textContent = msg;
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) translateY(0)';
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(-50%) translateY(10px)';
                }, 2500);
            }

            const renderedPages = new Set();

            async function renderPageCanvas(pageNum) {
                if (renderedPages.has(pageNum) || pageNum < 1 || pageNum > totalPages) return;
                renderedPages.add(pageNum);

                const item = pageItems[pageNum - 1];
                if (!item) return;

                try {
                    const page = await pdf.getPage(pageNum);
                    // Scale 1.6 provides crisp typography while optimizing memory and rendering performance
                    const viewport = page.getViewport({ scale: 1.6 });
                    const canvas = item.canvas;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true }) || canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({
                        canvasContext: ctx,
                        viewport: viewport
                    }).promise;
                } catch (err) {
                    console.error('Error rendering page ' + pageNum, err);
                }
            }

            // Render initial visible cover and first spread
            for (let p = 1; p <= Math.min(4, totalPages); p++) {
                await renderPageCanvas(p);
            }

            // On-demand rendering: Render surrounding pages when user turns a page
            pageFlip.on('flip', (e) => {
                const activeIndex = e.data; // 0-indexed page
                updateCoverPosition(activeIndex);

                const activePage = activeIndex + 1; // 1-indexed page
                for (let p = Math.max(1, activePage - 2); p <= Math.min(totalPages, activePage + 3); p++) {
                    renderPageCanvas(p);
                }
            });

        } catch (err) {
            console.error('Failed to initialize PDF menu flipbook:', err);
            flipContainer.innerHTML = '<div class="flipbook-loading-state"><p>Unable to load menu PDF.</p></div>';
        }
    }

    // Lazy load the PDF flipbook ONLY when user scrolls near the menu section
    let pdfFlipbookInitialized = false;
    function triggerFlipbookInit() {
        if (pdfFlipbookInitialized) return;
        pdfFlipbookInitialized = true;
        initStandaloneMenuFlipbook();
    }

    const menuElement = document.getElementById('menu') || document.querySelector('.menu-flipbook-wrapper');
    if (menuElement && typeof IntersectionObserver !== 'undefined') {
        const initObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                triggerFlipbookInit();
                initObserver.disconnect();
            }
        }, { rootMargin: '350px' });
        initObserver.observe(menuElement);
    } else {
        // Fallback: Delay loading by 2.5s so hero image sequence loads first without competition
        setTimeout(triggerFlipbookInit, 2500);
    }

    // ==========================================================================
    // 3D Curved Panorama Arch Gallery (Auto-Moving Infinite & Clickable Lightbox)
    // ==========================================================================
    function initPanoramaGallery() {
        const wrapper = document.getElementById('panoramaWrapper');
        const track = document.getElementById('panoramaTrack');

        // Modal Elements
        const modal = document.getElementById('galleryModal');
        const modalImg = document.getElementById('galleryModalImg');
        const modalCounter = document.getElementById('galleryModalCounter');
        const modalClose = document.getElementById('galleryModalClose');
        const modalPrev = document.getElementById('galleryModalPrev');
        const modalNext = document.getElementById('galleryModalNext');

        if (!wrapper || !track) return;

        const galleryData = [
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkL5B8pFaXACIElitVZeU5PvxDqopfILrH6y8Io-ZMAjXq-6FXquW6TmV3xO4mTUDj_xdhX1nq83wLRVyvZ6lyy6olqvQeKqcTLSnFIOpTEbsU6r8OSsX-1PesNdddKSTM-l_j_eUAU4ww=s1360-w1360-h1020-rw" },
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWm4N3JkhY6e6vzJUcq3S5Hxll5kiIQDoEEfRpfRifoRhWBv2fZZG5uL8HqYCQonFsCbRS5ulcg_XAUGxtlp_FjG7wwJODeWK_us3JxSN65yP-7Wh-Ysktnk2EX0yoXbZIakPuwq1ad29ARX=s1360-w1360-h1020-rw" },
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnuGWG7dsPuiHVgSJm92p4rop1wYBOJJOh0Hv326jraVb0JegddiY6Dr_Mpw4deZcE3OnjEQwkl5lyUi4gNpYzsdBcbOz8G4Xsb8YTO4otrApUCOob2tc-dWygjNAsZNfTwRloRIQYPpPE=s1360-w1360-h1020-rw" },
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnBaJ-aH2YtkxeKOdR_KxES4T76hGfxM3pPXMxQUWFWGD72K144QpYYlj1tk61egfLD6SYI0R8etcNn5uCPZSZm4kiHFxPKqETreU9Z3_wf0--y7erJy4XkHFY1YFf20zWewHhdmmV0yZ5A=s1360-w1360-h1020-rw" },
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnKju6v9qLbYoaGHcFIjS3N3IQvwQBxfpiaCcgzknAG0EINwopC0FTtJGXkRLH9vGwY7ScfAjhCh4MOCjuBuazymIQmM081VDN2haUaZXVyJTyu24xvHgSipY64r8Qzs__unNB9ncsNHVwX=s1360-w1360-h1020-rw" },
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnoYKZ98XqGIJzWPN0DczFVZw3e_pfbmQehjMIhaCAt52AwbQWSiPGIUO0p5x9YBwu3jXBpEmtdEjQAsW_SBTb5oyMzhOqGe6gtXYSq7nx23OF-lm7dDXmtPXffx6c4bnFr5346KT7lrrPm=s1360-w1360-h1020-rw" },
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWn9AnMu3oAEjVMTUWSZcQz7X5tvkVM6-Av_dzqYmm5kCLNiwbXeCCe5EbcRDFbiybl4k5ZaUGEbw64-ShpC47CocSRIwlPEsaG9g_fFvIKs6tLM6QloxMbOfeJ35levRzWWL1yBLvAtTXE=s1360-w1360-h1020-rw" },
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkGL3OKUXpSOQ8vd3YwxsI8Io2E_XskKZB_syrYd5QgFNIz5bj9fqguU3QyxdBkCv-7H-dHnNFa2j9Y0ZiJx_VU4X9W7ZPshUQUYT3rceBk8BBmEd-ruQqBwTGLy4AfQs-Y0Ic9yCvUCGFi=s1360-w1360-h1020-rw" },
            { url: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWklCGaHNG4xX2Vtn4yzz1FoSzjdVEhey96UH_dDsly1U3qpm3m5L17NAqwGRXjIi_bLahQX0e3LXIBXAbNrW0OauxkdqCE3GO64RPAN4WdiTtio8VZGuE-YuwZBa5fjLrw3P14sDa9Qnw0=s1360-w1360-h1020-rw" }
        ];

        let items = [];
        let itemWidths = [];
        let totalWidth = 0;
        let singleSetWidth = 0;
        let currentTranslateX = 0;
        let targetTranslateX = 0;

        let autoSpeed = 0.8; // Slow infinite horizontal movement speed
        let isHovered = false;
        let isModalActive = false;
        let currentModalIndex = 0;

        const loops = 3;
        let rafId = null;

        function buildGallery() {
            track.innerHTML = '';
            items = [];
            itemWidths = [];
            totalWidth = 0;
            singleSetWidth = 0;

            for (let l = 0; l < loops; l++) {
                galleryData.forEach((item, dataIdx) => {
                    const div = document.createElement('div');
                    div.className = 'panorama-item';
                    div.dataset.index = dataIdx;

                    const img = document.createElement('img');
                    img.src = item.url;
                    img.draggable = false;
                    img.alt = item.title;

                    div.appendChild(img);
                    track.appendChild(div);
                    items.push(div);

                    // Click image to open Lightbox Modal
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openGalleryModal(dataIdx);
                    });
                });
            }

            const updateMeasurements = () => {
                itemWidths = [];
                totalWidth = 0;
                singleSetWidth = 0;
                items.forEach((item, i) => {
                    const rect = item.getBoundingClientRect();
                    const width = rect.width || item.offsetWidth || 300;
                    const margin = 30; // 15px left + 15px right
                    const fullWidth = width + margin;
                    itemWidths.push(fullWidth);
                    totalWidth += fullWidth;
                    if (i < galleryData.length) {
                        singleSetWidth += fullWidth;
                    }
                });

                if (singleSetWidth > 0 && (currentTranslateX === 0 || isNaN(currentTranslateX))) {
                    currentTranslateX = -singleSetWidth;
                    targetTranslateX = currentTranslateX;
                    track.style.transform = `translate3d(${currentTranslateX}px, 0, 0)`;
                    updatePerspective();
                }
            };

            requestAnimationFrame(updateMeasurements);

            let loadedCount = 0;
            const allImgs = track.querySelectorAll('img');
            allImgs.forEach(img => {
                if (img.complete) {
                    loadedCount++;
                } else {
                    img.addEventListener('load', () => {
                        loadedCount++;
                        if (loadedCount >= Math.min(6, galleryData.length)) {
                            updateMeasurements();
                        }
                    });
                }
            });
        }

        function updatePerspective() {
            if (items.length === 0) return;
            const wrapperRect = wrapper.getBoundingClientRect();
            const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;

            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const itemCenterX = rect.left + rect.width / 2;

                let distFromCenter = (itemCenterX - wrapperCenterX) / (wrapperRect.width / 2);
                distFromCenter = Math.max(-1, Math.min(1, distFromCenter));

                const scale = 0.88 + (Math.abs(distFromCenter) * 0.18);
                const rotateY = distFromCenter * -4;
                const translateZ = (1 - Math.abs(distFromCenter)) * -35;

                item.style.transform = `scale(${scale}) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
            });
        }

        function animate() {
            // Auto move infinitely slowly if not hovered and modal is closed
            if (!isHovered && !isModalActive) {
                targetTranslateX -= autoSpeed;
            }

            // Smooth spring dampening towards targetTranslateX
            currentTranslateX += (targetTranslateX - currentTranslateX) * 0.12;

            // Infinite loop wrapping checks (Set 1 visible from -singleSetWidth to -2*singleSetWidth)
            if (singleSetWidth > 0) {
                const maxScroll = -(singleSetWidth * 2);
                const minScroll = 0;

                if (currentTranslateX < maxScroll) {
                    currentTranslateX += singleSetWidth;
                    targetTranslateX += singleSetWidth;
                } else if (currentTranslateX > minScroll) {
                    currentTranslateX -= singleSetWidth;
                    targetTranslateX -= singleSetWidth;
                }
            }

            track.style.transform = `translate3d(${currentTranslateX}px, 0, 0)`;
            updatePerspective();

            rafId = requestAnimationFrame(animate);
        }

        // Hover events to pause slow auto-scroll for easy clicking
        wrapper.addEventListener('mouseenter', () => { isHovered = true; });
        wrapper.addEventListener('mouseleave', () => { isHovered = false; });

        // ==========================================
        // Lightbox Modal Functions & Events
        // ==========================================
        function openGalleryModal(index) {
            if (!modal || !modalImg) return;
            currentModalIndex = (index + galleryData.length) % galleryData.length;
            updateModalContent();

            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent main page scroll
            isModalActive = true;
        }

        function closeGalleryModal() {
            if (!modal) return;
            modal.classList.remove('active');
            document.body.style.overflow = '';
            isModalActive = false;
        }

        function updateModalContent() {
            const data = galleryData[currentModalIndex];
            if (!data) return;
            modalImg.src = data.url;
            if (modalCounter) modalCounter.textContent = `${currentModalIndex + 1} / ${galleryData.length}`;
        }

        if (modalClose) modalClose.addEventListener('click', closeGalleryModal);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeGalleryModal();
            });
        }

        if (modalPrev) {
            modalPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                currentModalIndex = (currentModalIndex - 1 + galleryData.length) % galleryData.length;
                updateModalContent();
            });
        }

        if (modalNext) {
            modalNext.addEventListener('click', (e) => {
                e.stopPropagation();
                currentModalIndex = (currentModalIndex + 1) % galleryData.length;
                updateModalContent();
            });
        }

        // Global Keydown Listeners for ESC and Arrow Keys inside Modal
        window.addEventListener('keydown', (e) => {
            if (!isModalActive) return;
            if (e.key === 'Escape') {
                closeGalleryModal();
            } else if (e.key === 'ArrowLeft') {
                currentModalIndex = (currentModalIndex - 1 + galleryData.length) % galleryData.length;
                updateModalContent();
            } else if (e.key === 'ArrowRight') {
                currentModalIndex = (currentModalIndex + 1) % galleryData.length;
                updateModalContent();
            }
        });

        // Window Resize Handler
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                itemWidths = [];
                totalWidth = 0;
                singleSetWidth = 0;
                items.forEach((item, i) => {
                    const width = item.offsetWidth || 300;
                    itemWidths.push(width);
                    totalWidth += width;
                    if (i < galleryData.length) singleSetWidth += width;
                });
                currentTranslateX = -singleSetWidth;
                targetTranslateX = currentTranslateX;
                updatePerspective();
            }, 200);
        });

        buildGallery();
        animate();
    }

    initPanoramaGallery();
});


