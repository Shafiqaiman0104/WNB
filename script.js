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
                    // Mobile narrow: larger 2-page spread
                    return { width: 175, height: 240, minW: 135, maxW: 200, minH: 180, maxH: 275 };
                } else if (w <= 600) {
                    // Mobile medium: larger 2-page spread
                    return { width: 210, height: 285, minW: 160, maxW: 240, minH: 215, maxH: 330 };
                } else if (w <= 900) {
                    // Tablet: larger 2-page spread
                    return { width: 270, height: 365, minW: 200, maxW: 320, minH: 270, maxH: 430 };
                } else {
                    // Desktop: significantly larger 2-page spread (~680px total width)
                    return { width: 340, height: 460, minW: 260, maxW: 420, minH: 350, maxH: 570 };
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

            // Scroll reveal observer: Table slides up, Menu emerges small from table surface and rises to top while scaling up
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
                const refWidth = isMobile ? 440 : 950;

                let scale = currentWidth / refWidth;
                scale = Math.min(1.15, Math.max(0.62, scale));
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

    // ==========================================================================
    // Room & Facilities Interactive 3D VR Spherical Panorama Controller
    // ==========================================================================
    function initRoomVRController() {
        const roomCardPrivate = document.getElementById('roomCardPrivate');
        const roomCardBallroom = document.getElementById('roomCardBallroom');
        const vrBtnPrivate = document.getElementById('vrBtnPrivate');
        const vrBtnBallroom = document.getElementById('vrBtnBallroom');
        const vrRoomTitle = document.getElementById('vrRoomTitle');
        const vrRoomDesc = document.getElementById('vrRoomDesc');
        const vrContainer = document.getElementById('vrContainer');
        const vrFullscreenBtn = document.getElementById('vrFullscreenBtn');
        const floorplanContainer = document.getElementById('floorplanContainer');
        const floorplanZoomBtn = document.getElementById('floorplanZoomBtn');
        const floorplanModal = document.getElementById('floorplanModal');
        const floorplanModalClose = document.getElementById('floorplanModalClose');
        const floorplanModalImg = document.getElementById('floorplanModalImg');

        let currentRoom = 'private'; // 'private' or 'ballroom'
        let scene, camera, renderer, sphereMesh, textureLoader;
        let isUserInteracting = false;
        let onPointerDownPointerX = 0, onPointerDownPointerY = 0;
        let lon = 0, onPointerDownLon = 0;
        let lat = 0, onPointerDownLat = 0;
        let phi = 0, theta = 0;

        const roomData = {
            private: {
                title: '360° VR View: Private Room',
                img: 'panorama1.jpg',
                layoutImg: '3dprivateroom.png',
                desc: 'Currently viewing 3D spherical VR panorama for <strong>Private Room</strong> (Up to 18 Pax, TV screen & Mic provided).'
            },
            ballroom: {
                title: '360° VR View: Ballroom',
                img: 'panorama2.jpg',
                layoutImg: '3dballroom.png',
                desc: 'Currently viewing 3D spherical VR panorama for <strong>Ballroom</strong> (40–80 Pax, Stage & Split Dining).'
            },
            surau: {
                title: '360° VR View: Surau',
                img: 'panorama3.jpg',
                layoutImg: '3dsurau.png',
                desc: 'Currently viewing 3D spherical VR panorama for <strong>Surau</strong> (Pristine Prayer Room with Dedicated Wuduk Facilities).'
            },
            cigar: {
                title: '360° VR View: Cigar Room',
                img: 'panorama4.jpg',
                layoutImg: '3dcigar.png',
                desc: 'Currently viewing 3D spherical VR panorama for <strong>Cigar Room</strong> (Exclusive Private Lounge & Smoking Sanctuary).'
            },
            lounge: {
                title: '360° VR View: Lounge',
                img: 'panorama5.jpg',
                layoutImg: '3dlounge.png',
                desc: 'Currently viewing 3D spherical VR panorama for <strong>Lounge</strong> (Plush Seating for Pre-Dinner & Social Relaxation).'
            }
        };

        // 1. Initialize Three.js 3D VR Spherical Scene
        function setup3DVRScene() {
            if (!vrContainer || typeof THREE === 'undefined') return;

            const width = vrContainer.clientWidth || 500;
            const height = vrContainer.clientHeight || 380;

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
            camera.target = new THREE.Vector3(0, 0, 0);

            // Inverted sphere for 360 degree 3D panoramic environment
            const geometry = new THREE.SphereGeometry(500, 60, 40);
            geometry.scale(-1, 1, 1);

            textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load(roomData[currentRoom].img, () => {
                animate();
            });

            const material = new THREE.MeshBasicMaterial({ map: texture });
            sphereMesh = new THREE.Mesh(geometry, material);
            scene.add(sphereMesh);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(width, height);
            vrContainer.appendChild(renderer.domElement);

            function animate() {
                requestAnimationFrame(animate);

                if (!isUserInteracting) {
                    lon += 0.05; // Gentle auto pan
                }

                lat = Math.max(-85, Math.min(85, lat)); // Up/Down pitch constraint
                phi = THREE.MathUtils.degToRad(90 - lat);
                theta = THREE.MathUtils.degToRad(lon);

                camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
                camera.target.y = 500 * Math.cos(phi);
                camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

                camera.lookAt(camera.target);
                renderer.render(scene, camera);
            }

            // Pointer event listeners for full 3D Up, Down, Left, Right swiping!
            function onPointerDown(e) {
                isUserInteracting = true;
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                onPointerDownPointerX = clientX;
                onPointerDownPointerY = clientY;
                onPointerDownLon = lon;
                onPointerDownLat = lat;
            }

            function onPointerMove(e) {
                if (!isUserInteracting) return;
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                lon = (onPointerDownPointerX - clientX) * 0.18 + onPointerDownLon; // Left / Right Yaw
                lat = (clientY - onPointerDownPointerY) * 0.18 + onPointerDownLat; // Up / Down Pitch
            }

            function onPointerUp() {
                isUserInteracting = false;
            }

            function onTouchStart(e) {
                if (e.cancelable) e.preventDefault();
                isUserInteracting = true;
                if (e.touches && e.touches[0]) {
                    onPointerDownPointerX = e.touches[0].clientX;
                    onPointerDownPointerY = e.touches[0].clientY;
                    onPointerDownLon = lon;
                    onPointerDownLat = lat;
                }
            }

            function onTouchMove(e) {
                if (!isUserInteracting) return;
                if (e.cancelable) e.preventDefault();
                if (e.touches && e.touches[0]) {
                    const clientX = e.touches[0].clientX;
                    const clientY = e.touches[0].clientY;
                    lon = (onPointerDownPointerX - clientX) * 0.18 + onPointerDownLon;
                    lat = (clientY - onPointerDownPointerY) * 0.18 + onPointerDownLat;
                }
            }

            function onTouchEnd() {
                isUserInteracting = false;
            }

            vrContainer.addEventListener('mousedown', onPointerDown);
            window.addEventListener('mousemove', onPointerMove);
            window.addEventListener('mouseup', onPointerUp);

            vrContainer.addEventListener('touchstart', onTouchStart, { passive: false });
            vrContainer.addEventListener('touchmove', onTouchMove, { passive: false });
            vrContainer.addEventListener('touchend', onTouchEnd, { passive: false });

            const handleResize = () => {
                if (!vrContainer || !renderer || !camera) return;
                const w = vrContainer.clientWidth;
                const h = vrContainer.clientHeight;
                if (w > 0 && h > 0) {
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                }
            };

            window.addEventListener('resize', handleResize);
            if ('ResizeObserver' in window) {
                const resizeObserver = new ResizeObserver(handleResize);
                resizeObserver.observe(vrContainer);
            }
        }

        function switchRoom(room) {
            if (!roomData[room]) return;
            currentRoom = room;

            if (sphereMesh && textureLoader) {
                textureLoader.load(roomData[room].img, (newTexture) => {
                    sphereMesh.material.map = newTexture;
                    sphereMesh.material.needsUpdate = true;
                });
            }
            lat = 0;
            lon = 0;

            const vr3dImg = document.getElementById('vr3dImg');
            if (vr3dImg && roomData[room].layoutImg) {
                vr3dImg.style.opacity = '0.3';
                setTimeout(() => {
                    vr3dImg.src = roomData[room].layoutImg;
                    vr3dImg.style.opacity = '1';
                }, 150);
            }

            if (roomCardPrivate) roomCardPrivate.classList.toggle('active', room === 'private');
            if (roomCardBallroom) roomCardBallroom.classList.toggle('active', room === 'ballroom');

            document.querySelectorAll('.vr-switch-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-room') === room);
            });

            if (vrRoomTitle) {
                vrRoomTitle.textContent = roomData[room].title;
            }
            if (vrRoomDesc) {
                vrRoomDesc.innerHTML = `<i class="fa-solid fa-circle-info gold-text"></i> ${roomData[room].desc}`;
            }
        }

        // Room Card Click Listeners
        if (roomCardPrivate) {
            roomCardPrivate.addEventListener('click', () => switchRoom('private'));
        }
        if (roomCardBallroom) {
            roomCardBallroom.addEventListener('click', () => switchRoom('ballroom'));
        }

        // VR Header Switcher Buttons
        document.querySelectorAll('.vr-switch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const room = btn.getAttribute('data-room');
                if (room) {
                    switchRoom(room);
                    if (btn.classList.contains('facility-vr-btn')) {
                        const vrViewer = document.getElementById('vrContainer');
                        if (vrViewer) {
                            vrViewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }
            });
        });

        // ==========================================
        // Inline Card VR Scene Manager
        // ==========================================
        const cardVrInstances = {};

        function createInlineCardVR(containerEl, imgPath) {
            if (!containerEl || typeof THREE === 'undefined') return null;

            let width = containerEl.clientWidth || 400;
            let height = containerEl.clientHeight || 320;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
            camera.target = new THREE.Vector3(0, 0, 0);

            const geometry = new THREE.SphereGeometry(500, 60, 40);
            geometry.scale(-1, 1, 1);

            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load(imgPath, () => {
                render();
            });

            const material = new THREE.MeshBasicMaterial({ map: texture });
            const sphereMesh = new THREE.Mesh(geometry, material);
            scene.add(sphereMesh);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(width, height);
            containerEl.appendChild(renderer.domElement);

            let isUserInteracting = false;
            let onPointerDownPointerX = 0, onPointerDownPointerY = 0;
            let lon = 0, onPointerDownLon = 0;
            let lat = 0, onPointerDownLat = 0;
            let phi = 0, theta = 0;
            let animId = null;

            function render() {
                if (!isUserInteracting) {
                    lon += 0.08;
                }
                lat = Math.max(-85, Math.min(85, lat));
                phi = THREE.MathUtils.degToRad(90 - lat);
                theta = THREE.MathUtils.degToRad(lon);

                camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
                camera.target.y = 500 * Math.cos(phi);
                camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

                camera.lookAt(camera.target);
                renderer.render(scene, camera);
            }

            function animate() {
                animId = requestAnimationFrame(animate);
                render();
            }
            animate();

            function onPointerDown(e) {
                isUserInteracting = true;
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                onPointerDownPointerX = clientX;
                onPointerDownPointerY = clientY;
                onPointerDownLon = lon;
                onPointerDownLat = lat;
            }

            function onPointerMove(e) {
                if (!isUserInteracting) return;
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                lon = (onPointerDownPointerX - clientX) * 0.2 + onPointerDownLon;
                lat = (clientY - onPointerDownPointerY) * 0.2 + onPointerDownLat;
            }

            function onPointerUp() {
                isUserInteracting = false;
            }

            function onTouchStartCard(e) {
                if (e.cancelable) e.preventDefault();
                isUserInteracting = true;
                if (e.touches && e.touches[0]) {
                    onPointerDownPointerX = e.touches[0].clientX;
                    onPointerDownPointerY = e.touches[0].clientY;
                    onPointerDownLon = lon;
                    onPointerDownLat = lat;
                }
            }

            function onTouchMoveCard(e) {
                if (!isUserInteracting) return;
                if (e.cancelable) e.preventDefault();
                if (e.touches && e.touches[0]) {
                    const clientX = e.touches[0].clientX;
                    const clientY = e.touches[0].clientY;
                    lon = (onPointerDownPointerX - clientX) * 0.2 + onPointerDownLon;
                    lat = (clientY - onPointerDownPointerY) * 0.2 + onPointerDownLat;
                }
            }

            function onTouchEndCard() {
                isUserInteracting = false;
            }

            containerEl.addEventListener('mousedown', onPointerDown);
            window.addEventListener('mousemove', onPointerMove);
            window.addEventListener('mouseup', onPointerUp);

            containerEl.addEventListener('touchstart', onTouchStartCard, { passive: false });
            containerEl.addEventListener('touchmove', onTouchMoveCard, { passive: false });
            containerEl.addEventListener('touchend', onTouchEndCard, { passive: false });

            function resize() {
                if (!containerEl || !renderer || !camera) return;
                const w = containerEl.clientWidth;
                const h = containerEl.clientHeight;
                if (w > 0 && h > 0) {
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                }
            }

            return { resize };
        }

        // Room Card Action Buttons (View VR inside Card)
        const vrRoomBtns = document.querySelectorAll('.btn-room-vr');
        vrRoomBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const roomTarget = btn.getAttribute('data-room-vr');
                const roomItem = btn.closest('.room-row-item');
                if (!roomItem || !roomTarget) return;

                const collageGrid = roomItem.querySelector('.viewer-4collage-grid');
                const vrContainer = roomItem.querySelector('.card-vr-container');

                const isVRActive = roomItem.classList.contains('vr-mode-active');

                if (!isVRActive) {
                    // Activate Inline VR Mode inside Room Card
                    roomItem.classList.add('vr-mode-active');
                    if (collageGrid) collageGrid.style.display = 'none';
                    if (vrContainer) vrContainer.style.display = 'block';

                    btn.classList.add('active');
                    btn.innerHTML = '<i class="fa-solid fa-images"></i> View Photos';

                    const imgPath = roomData[roomTarget] ? roomData[roomTarget].img : 'panorama1.jpg';

                    if (!cardVrInstances[roomTarget]) {
                        cardVrInstances[roomTarget] = createInlineCardVR(vrContainer, imgPath);
                    } else {
                        setTimeout(() => {
                            if (cardVrInstances[roomTarget]) cardVrInstances[roomTarget].resize();
                        }, 60);
                    }
                } else {
                    // Restore Photo View on Room Card
                    roomItem.classList.remove('vr-mode-active');
                    if (collageGrid) collageGrid.style.display = 'flex';
                    if (vrContainer) vrContainer.style.display = 'none';

                    btn.classList.remove('active');
                    btn.innerHTML = '<i class="fa-solid fa-vr-cardboard"></i> View VR';
                }
            });
        });

        // Collage Lightbox Expansion for specific clicked image
        function closeFloorplanModal() {
            if (!floorplanModal) return;
            floorplanModal.classList.remove('active');
            document.body.style.overflow = '';
        }

        const collageBoxes = document.querySelectorAll('.v-collage-box');
        collageBoxes.forEach((box) => {
            box.addEventListener('click', (e) => {
                e.stopPropagation();
                const img = box.querySelector('img');
                if (img && floorplanModal && floorplanModalImg) {
                    floorplanModalImg.src = img.src;
                    floorplanModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        if (floorplanZoomBtn) {
            floorplanZoomBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!floorplanModal || !floorplanModalImg) return;
                floorplanModalImg.src = 'e1.jpg';
                floorplanModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (floorplanModalClose) floorplanModalClose.addEventListener('click', closeFloorplanModal);
        if (floorplanModal) {
            floorplanModal.addEventListener('click', (e) => {
                if (e.target === floorplanModal) closeFloorplanModal();
            });
        }

        // Interactive 3D VR Fullscreen Mode
        function resizeVRCanvas() {
            if (!vrContainer || !renderer || !camera) return;
            setTimeout(() => {
                const w = vrContainer.clientWidth || window.innerWidth;
                const h = vrContainer.clientHeight || window.innerHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            }, 100);
        }

        window.addEventListener('resize', resizeVRCanvas);
        document.addEventListener('fullscreenchange', resizeVRCanvas);
        document.addEventListener('webkitfullscreenchange', resizeVRCanvas);

        if (vrFullscreenBtn) {
            vrFullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (vrContainer) {
                    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                        if (vrContainer.requestFullscreen) {
                            vrContainer.requestFullscreen();
                        } else if (vrContainer.webkitRequestFullscreen) {
                            vrContainer.webkitRequestFullscreen();
                        } else {
                            vrContainer.classList.toggle('vr-fullscreen-active');
                        }
                    } else {
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.webkitExitFullscreen) {
                            document.webkitExitFullscreen();
                        }
                    }
                    resizeVRCanvas();
                }
            });
        }

        // URL Hash Hook Listener (#privateroom & #ballroom)
        function checkRoomHashHook() {
            const hash = window.location.hash.toLowerCase();
            if (hash === '#privateroom' || hash === '#private-room' || hash === '#private') {
                switchRoom('private');
                const target = document.getElementById('privateroom') || document.getElementById('roomCardPrivate');
                if (target) {
                    setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
                }
            } else if (hash === '#ballroom') {
                switchRoom('ballroom');
                const target = document.getElementById('ballroom') || document.getElementById('roomCardBallroom');
                if (target) {
                    setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
                }
            }
        }

        checkRoomHashHook();
        window.addEventListener('hashchange', checkRoomHashHook);

        // URL Hash Hook Listener (#campaign, #campaigns, #voucher, #vouchers & #voucher-campaign)
        function checkCampaignHashHook() {
            const hash = window.location.hash.toLowerCase();
            if (hash === '#campaign' || hash === '#campaigns' || hash === '#voucher' || hash === '#vouchers' || hash === '#voucher-campaign') {
                const target = document.getElementById('campaign') || document.getElementById('voucher-campaign');
                if (target) {
                    setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
                }
            }
        }

        checkCampaignHashHook();
        window.addEventListener('hashchange', checkCampaignHashHook);

        setup3DVRScene();
    }

    // Instagram Slider Track Controls
    const instaContainer = document.querySelector('.insta-slider-container');
    const instaPrevBtn = document.getElementById('instaPrevBtn');
    const instaNextBtn = document.getElementById('instaNextBtn');

    if (instaContainer && instaPrevBtn && instaNextBtn) {
        instaPrevBtn.addEventListener('click', () => {
            instaContainer.scrollBy({ left: -320, behavior: 'smooth' });
        });
        instaNextBtn.addEventListener('click', () => {
            instaContainer.scrollBy({ left: 320, behavior: 'smooth' });
        });
    }

    // Voucher Campaign PDF Generation & Claim Handler
    const voucherClaimForm = document.getElementById('voucherClaimForm');
    const voucherSuccessBox = document.getElementById('voucherSuccessBox');
    const btnRedownloadPdf = document.getElementById('btnRedownloadPdf');
    const btnWhatsappVoucher = document.getElementById('btnWhatsappVoucher');

    let currentVoucherData = null;
    let activeVoucherValText = "RM50";
    let activeVoucherNameText = "EXCLUSIVE CAMPAIGN DINING VOUCHER";
    let activeVoucherEndDateStr = "";
    let activeVoucherRawEndDateIso = "";

    // Helper function to load image to base64 for jsPDF
    function getBase64ImageFromUrl(imgUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg'));
                } catch (e) {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = imgUrl;
        });
    }

    async function generateVoucherPdf(name, phone, voucherId, issueDateStr, expiryDateStr, customVoucherName) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('PDF Generator is initializing, please try again in a moment.');
            return;
        }

        const btnClaim = document.getElementById('btnClaimVoucher');
        let oldBtnHtml = '';
        if (btnClaim) {
            oldBtnHtml = btnClaim.innerHTML;
            btnClaim.disabled = true;
            btnClaim.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF Voucher...';
        }

        const logoUrl = 'bayu-logo.jpg';
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(voucherId)}&size=150x150`;

        const [logoBase64, qrBase64] = await Promise.all([
            getBase64ImageFromUrl(logoUrl),
            getBase64ImageFromUrl(qrUrl)
        ]);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

        // 1. Modern Light Mode Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 148, 210, 'F');

        // Outer Gold Accent Border
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(1.2);
        doc.rect(6, 6, 136, 198, 'S');

        // Inner Light Border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.rect(9, 9, 130, 192, 'S');

        // 2. Header Section (Bayu Seafood Logo + Title)
        let headerTextLeft = 74;
        if (logoBase64) {
            doc.addImage(logoBase64, 'JPEG', 16, 16, 16, 16);
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(0.5);
            doc.circle(24, 24, 8.2, 'S');
            headerTextLeft = 82;
        }

        doc.setTextColor(15, 23, 42); // Deep Navy
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text("BAYU SEAFOOD", headerTextLeft, 22, { align: "center" });

        doc.setTextColor(180, 83, 9); // Gold Accent
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text("PREMIUM HALAL LAKESIDE DINING & EVENTS", headerTextLeft, 27, { align: "center" });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(16, 36, 132, 36);

        // 3. Voucher Box Banner Graphic (Modern Light Gold Box)
        doc.setFillColor(254, 243, 199);
        doc.rect(16, 40, 116, 32, 'F');
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.8);
        doc.rect(16, 40, 116, 32, 'S');

        // Voucher Value Text
        doc.setTextColor(180, 83, 9);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        const pdfValText = (activeVoucherValText.toLowerCase().includes('off') || activeVoucherValText.includes('%')) ? activeVoucherValText : `${activeVoucherValText} OFF`;
        doc.text(pdfValText, 74, 54, { align: "center" });

        // Dynamic Voucher Name (voucherName text)
        const vName = (customVoucherName || activeVoucherNameText || "EXCLUSIVE CAMPAIGN DINING VOUCHER").toUpperCase();
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(vName, 74, 63, { align: "center" });

        // 4. Customer Details Section Header
        doc.setTextColor(180, 83, 9);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("VOUCHER & CUSTOMER DETAILS", 16, 82);
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.4);
        doc.line(16, 85, 132, 85);

        // Details Fields
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);

        doc.setFont('helvetica', 'bold');
        doc.text("Customer Name:", 16, 94);
        doc.setFont('helvetica', 'normal');
        doc.text(name, 48, 94);

        doc.setFont('helvetica', 'bold');
        doc.text("Customer Phone:", 16, 102);
        doc.setFont('helvetica', 'normal');
        doc.text(phone, 48, 102);

        doc.setFont('helvetica', 'bold');
        doc.text("Voucher Code:", 16, 110);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text(voucherId, 48, 110);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text("Issued Date:", 16, 118);
        doc.setFont('helvetica', 'normal');
        doc.text(issueDateStr, 48, 118);

        doc.setFont('helvetica', 'bold');
        doc.text("Expiry Date:", 16, 126);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(expiryDateStr, 48, 126);

        // Embed QR Code on the Right
        if (qrBase64) {
            doc.setFillColor(255, 255, 255);
            doc.rect(96, 88, 36, 40, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.4);
            doc.rect(96, 88, 36, 40, 'S');

            doc.addImage(qrBase64, 'PNG', 99, 90, 30, 30);
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text("SCAN QR TO VERIFY", 114, 125, { align: "center" });
        }

        // 5. How to Redeem Section Header
        doc.setTextColor(180, 83, 9);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("HOW TO REDEEM YOUR VOUCHER", 16, 142);
        doc.setDrawColor(212, 175, 55);
        doc.line(16, 145, 132, 145);

        // Exactly 3 Steps Requested by User
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`1. Fill details & generate your unique ${activeVoucherValText} PDF Voucher.`, 16, 153);
        doc.text("2. WhatsApp this PDF voucher or Voucher Code to Bayu Seafood staff.", 16, 161);
        doc.text(`3. Our staff will verify your code to deduct ${activeVoucherValText} off your total bill.`, 16, 169);

        // 6. Footer
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(16, 182, 132, 182);

        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Bayu Seafood Lakeside Dining • Bukit Aman, Tasik Perdana, KL", 74, 188, { align: "center" });
        doc.text("Reservations / WhatsApp Inquiry: +60 17-734 7030", 74, 193, { align: "center" });

        doc.save('Bayu_Seafood_Voucher_' + voucherId + '.pdf');

        if (btnClaim) {
            btnClaim.disabled = false;
            btnClaim.innerHTML = oldBtnHtml || '<i class="fa-solid fa-file-pdf"></i> Claim &amp; Download PDF Voucher';
        }
    }

    if (voucherClaimForm) {
        voucherClaimForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('voucherName');
            const phoneInput = document.getElementById('voucherPhone');

            const name = nameInput ? nameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';

            if (!name || !phone) return;

            const btnSubmit = document.getElementById('btnClaimVoucher');
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting &amp; Verifying Claim...';
            }

            const now = new Date();
            const issueDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            let expiryDateStr = activeVoucherEndDateStr;
            if (!expiryDateStr) {
                const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                expiryDateStr = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            }

            const randomNum = Math.floor(100000 + Math.random() * 900000);
            const voucherId = 'BSV-' + randomNum;

            const claimExpiryIso = activeVoucherRawEndDateIso 
                ? activeVoucherRawEndDateIso 
                : (activeVoucherEndDateStr && !isNaN(new Date(activeVoucherEndDateStr).getTime()) 
                    ? new Date(activeVoucherEndDateStr).toISOString() 
                    : new Date(now.getTime() + 30 * 86400000).toISOString());

            const claimPayload = {
                "voucherId": voucherId,
                "nameVoucher": activeVoucherNameText,
                "valueVoucher": activeVoucherValText,
                "customerName": name,
                "customerPhone": phone,
                "issuedDate": now.toISOString(),
                "expiryDate": claimExpiryIso,
                "redeemStatus": "Pending",
                "claimStatus": "Pending",
                "claimAt": now.toISOString(),
                "remark": "Generated via Bayu Seafood Website"
            };

            // STEP 1: Send data to PocketBase database FIRST & verify receipt
            let createdRecord = null;
            if (window.PocketBase) {
                try {
                    const pb = new window.PocketBase('https://pocketbase2.venturerushtech.com');
                    createdRecord = await pb.collection('WNBMFJGROUP_BAYUSEAFOOD_VOUCHER_CLAIMS_DATABASE').create(claimPayload, { requestKey: null });
                } catch (pbErr) {
                    console.warn('PocketBase voucher claim creation error:', pbErr);
                }
            }

            // STEP 2: Verify if database received the record
            if (!createdRecord || !createdRecord.id) {
                alert('Claim Failed: Unable to save your voucher claim due to a network connection issue or server timeout. Please check your internet connection and try again.');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Claim &amp; Download PDF Voucher';
                }
                return;
            }

            // STEP 3: Database confirmed! Store local backup & generate PDF
            currentVoucherData = {
                name,
                phone,
                voucherId,
                issueDateStr,
                expiryDateStr,
                voucherName: activeVoucherNameText
            };

            try {
                let claims = [];
                const localStr = localStorage.getItem('mfj_bayuseafood_db_claims');
                if (localStr) claims = JSON.parse(localStr);
                claims.unshift({ ...createdRecord });
                localStorage.setItem('mfj_bayuseafood_db_claims', JSON.stringify(claims));
            } catch (e) { }

            // Generate PDF with QR Code & Logo
            await generateVoucherPdf(name, phone, voucherId, issueDateStr, expiryDateStr, activeVoucherNameText);

            // Update UI success state
            document.getElementById('resVoucherId').textContent = voucherId;
            document.getElementById('resVoucherName').textContent = name;
            document.getElementById('resVoucherExpiry').textContent = expiryDateStr;

            // Configure WhatsApp button text and URL
            if (btnWhatsappVoucher) {
                const waMsg = `Hi Bayu Seafood! 👋 I have generated my ${activeVoucherValText} Dining Voucher.\n\n` +
                    `🎟️ Voucher Code: ${voucherId}\n` +
                    `👤 Customer Name: ${name}\n` +
                    `📱 Phone Number: ${phone}\n` +
                    `📅 Valid Until: ${expiryDateStr}\n\n` +
                    `I am attaching my PDF voucher here for verification. Please verify my voucher code! Thank you!`;
                const waUrl = `https://api.whatsapp.com/send?phone=60177347030&text=${encodeURIComponent(waMsg)}`;
                btnWhatsappVoucher.setAttribute('href', waUrl);
            }

            voucherClaimForm.style.display = 'none';
            if (voucherSuccessBox) {
                voucherSuccessBox.style.display = 'block';
            }
        });
    }

    if (btnRedownloadPdf) {
        btnRedownloadPdf.addEventListener('click', async () => {
            if (currentVoucherData) {
                await generateVoucherPdf(
                    currentVoucherData.name,
                    currentVoucherData.phone,
                    currentVoucherData.voucherId,
                    currentVoucherData.issueDateStr,
                    currentVoucherData.expiryDateStr,
                    currentVoucherData.voucherName
                );
            }
        });
    }

    /* ==========================================================================
       Bayu Seafood - Dynamic Instagram Reels from PocketBase Database
       Collection: WNBMFJGROUP_BAYUSEAFOOD_INSTAGRAM_DATABASE
       ========================================================================== */
    async function loadDynamicInstagramReels() {
        const instaTopContainer = document.getElementById('instaTopReelsContainer');
        const instaSliderTrack = document.getElementById('instaSliderTrack');

        if (!instaTopContainer || !instaSliderTrack) return;

        let reels = [];
        const REELS_COLLECTION = 'WNBMFJGROUP_BAYUSEAFOOD_INSTAGRAM_DATABASE';

        // 1. Fetch from PocketBase Database
        if (window.PocketBase) {
            try {
                const pb = new window.PocketBase('https://pocketbase2.venturerushtech.com');
                const list = await pb.collection(REELS_COLLECTION).getFullList({
                    sort: 'positionNumber'
                });
                if (list && list.length > 0) {
                    reels = list;
                }
            } catch (err) {
                console.warn('PocketBase Instagram Reels fetch notice:', err);
            }
        }

        // 2. Fallback to localStorage if offline / empty
        if (reels.length === 0) {
            const localStr = localStorage.getItem('mfj_bayuseafood_reels');
            if (localStr) {
                try { reels = JSON.parse(localStr); } catch (e) {}
            }
        }

        // 3. Fallback defaults if still empty
        if (reels.length === 0) {
            reels = [
                { positionNumber: 1, instagramReelUrl: 'https://www.instagram.com/reel/DaPG0H3R-Vq/' },
                { positionNumber: 2, instagramReelUrl: 'https://www.instagram.com/reel/DbNJxA_Rq_5/' },
                { positionNumber: 3, instagramReelUrl: 'https://www.instagram.com/reel/DbNKp4ERGes/' },
                { positionNumber: 4, instagramReelUrl: 'https://www.instagram.com/reel/DbiWBTWRR6J/' },
                { positionNumber: 5, instagramReelUrl: 'https://www.instagram.com/reel/DbNDvGvR5qo/' },
                { positionNumber: 6, instagramReelUrl: 'https://www.instagram.com/reel/Da5MPlDTFou/' },
                { positionNumber: 7, instagramReelUrl: 'https://www.instagram.com/reel/Da5MRQyzTJV/' }
            ];
        }

        // Sort reels strictly by positionNumber ascending
        reels.sort((a, b) => Number(a.positionNumber || 0) - Number(b.positionNumber || 0));

        // Helper function to build clean, valid Instagram embed URL
        function buildEmbedUrl(rawUrl) {
            if (!rawUrl) return '';
            let str = rawUrl.trim();

            const match = str.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
            let code = '';
            if (match && match[2]) {
                code = match[2];
            } else if (/^[A-Za-z0-9_-]+$/.test(str)) {
                code = str;
            }

            if (code) {
                return `https://www.instagram.com/p/${code}/embed/captioned/`;
            }

            if (str.includes('/embed')) {
                return str;
            }

            str = str.split('?')[0];
            if (!str.endsWith('/')) str += '/';
            return str + 'embed/captioned/';
        }

        // Top 2 Reels (Position 1 and Position 2)
        const top2Reels = reels.slice(0, 2);
        let topHtml = '';
        top2Reels.forEach((reel, idx) => {
            const embedUrl = buildEmbedUrl(reel.instagramReelUrl);
            topHtml += `
                <div class="insta-embed-card white-card">
                    <iframe src="${embedUrl}" class="instagram-media instagram-media-rendered insta-iframe" allowtransparency="true" allowfullscreen="true" frameborder="0" scrolling="no" title="Featured Reel ${idx + 1}"></iframe>
                </div>
            `;
        });
        instaTopContainer.innerHTML = topHtml;

        // Remaining Reels (Position 3, 4, 5, 6... and beyond)
        const remainingReels = reels.slice(2);
        let sliderHtml = '';
        if (remainingReels.length > 0) {
            remainingReels.forEach((reel, idx) => {
                const embedUrl = buildEmbedUrl(reel.instagramReelUrl);
                sliderHtml += `
                    <div class="insta-slide-item">
                        <div class="insta-embed-card white-card">
                            <iframe src="${embedUrl}" class="instagram-media instagram-media-rendered insta-iframe" allowtransparency="true" allowfullscreen="true" frameborder="0" scrolling="no" title="Recent Post ${idx + 3}"></iframe>
                        </div>
                    </div>
                `;
            });
        } else {
            // Show top reels in slider if total count <= 2
            reels.forEach((reel, idx) => {
                const embedUrl = buildEmbedUrl(reel.instagramReelUrl);
                sliderHtml += `
                    <div class="insta-slide-item">
                        <div class="insta-embed-card white-card">
                            <iframe src="${embedUrl}" class="instagram-media instagram-media-rendered insta-iframe" allowtransparency="true" allowfullscreen="true" frameborder="0" scrolling="no" title="Reel Post ${idx + 1}"></iframe>
                        </div>
                    </div>
                `;
            });
        }
        instaSliderTrack.innerHTML = sliderHtml;

        // Initialize slider scroll button handlers
        initInstaSlider();
    }

    function initInstaSlider() {
        const track = document.getElementById('instaSliderTrack');
        const prevBtn = document.getElementById('instaPrevBtn');
        const nextBtn = document.getElementById('instaNextBtn');
        if (!track) return;

        const cardWidth = 300;

        if (cardWidth) {
            if (prevBtn) {
                prevBtn.onclick = () => {
                    track.scrollBy({ left: -cardWidth * 2, behavior: 'smooth' });
                };
            }

            if (nextBtn) {
                nextBtn.onclick = () => {
                    track.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
                };
            }
        }
    }

    /* ==========================================================================
       Bayu Seafood - Dynamic Voucher Campaign Data from PocketBase Database
       Collection: WNBMFJGROUP_BAYUSEAFOOD_VOUCHER_DATABASE
       ========================================================================== */
    let countdownIntervalId = null;
    let fetchTimeoutId = null;

    async function loadDynamicVoucherData() {
        if (countdownIntervalId) {
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
        }
        if (fetchTimeoutId) {
            clearTimeout(fetchTimeoutId);
            fetchTimeoutId = null;
        }

        const VOUCHERS_COLLECTION = 'WNBMFJGROUP_BAYUSEAFOOD_VOUCHER_DATABASE';
        let allVouchers = [];

        // DOM Wrappers
        const loadingWrap = document.getElementById('campaignLoadingWrap');
        const errorWrap = document.getElementById('campaignErrorWrap');
        const activeWrap = document.getElementById('activeVoucherCampaignWrap');
        const noActiveWrap = document.getElementById('noActiveCampaignWrap');
        const sideBySideWrap = document.getElementById('sideBySideCampaignWrap');
        const historyOnlyWrap = document.getElementById('historyOnlyCampaignWrap');

        const sideHistoryList = document.getElementById('sideHistoryCardsList');
        const sideUpcomingContainer = document.getElementById('sideUpcomingCardContainer');
        const historyOnlyGrid = document.getElementById('historyOnlyCardsGrid');

        // Show Loading Progress initially
        if (loadingWrap) loadingWrap.style.display = 'block';
        if (errorWrap) errorWrap.style.display = 'none';
        if (activeWrap) activeWrap.style.display = 'none';
        if (noActiveWrap) noActiveWrap.style.display = 'none';
        if (sideBySideWrap) sideBySideWrap.style.display = 'none';
        if (historyOnlyWrap) historyOnlyWrap.style.display = 'none';

        let hasTimedOut = false;

        // Set 30-second error timeout timer
        fetchTimeoutId = setTimeout(() => {
            hasTimedOut = true;
            if (loadingWrap) loadingWrap.style.display = 'none';
            if (activeWrap) activeWrap.style.display = 'none';
            if (noActiveWrap) noActiveWrap.style.display = 'none';
            if (sideBySideWrap) sideBySideWrap.style.display = 'none';
            if (historyOnlyWrap) historyOnlyWrap.style.display = 'none';
            if (errorWrap) errorWrap.style.display = 'block';
        }, 30000);

        // 1. Fetch from PocketBase Database
        if (window.PocketBase) {
            try {
                const pb = new window.PocketBase('https://pocketbase2.venturerushtech.com');
                const list = await pb.collection(VOUCHERS_COLLECTION).getFullList({
                    sort: '-created'
                });
                if (list && list.length > 0) {
                    allVouchers = list;
                }
            } catch (err) {
                console.warn('PocketBase Vouchers fetch notice:', err);
            }
        }

        // 2. Fallback to localStorage if offline or empty
        if (allVouchers.length === 0) {
            const localStr = localStorage.getItem('mfj_bayuseafood_db_vouchers');
            if (localStr) {
                try {
                    allVouchers = JSON.parse(localStr);
                } catch (e) {}
            }
        }

        if (hasTimedOut) return;

        // Clear 30-second error timeout timer since fetch completed
        if (fetchTimeoutId) {
            clearTimeout(fetchTimeoutId);
            fetchTimeoutId = null;
        }

        // Hide loading progress animation
        if (loadingWrap) loadingWrap.style.display = 'none';

        function escapeHtmlText(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        const now = new Date();

        const activeVouchers = [];
        const upcomingVouchers = [];
        const historyVouchers = [];

        allVouchers.forEach(v => {
            const isStatusTrue = v.voucherStatus === true || v.voucherStatus === 'true';
            const startDate = v.voucherStartDate ? new Date(v.voucherStartDate) : null;
            const endDate = v.voucherEndDate ? new Date(v.voucherEndDate) : null;

            const isStartFuture = startDate && startDate > now;
            const isEndPast = endDate && endDate < now;

            if (isStatusTrue) {
                if (isStartFuture) {
                    upcomingVouchers.push(v);
                } else if (isEndPast) {
                    historyVouchers.push(v);
                } else {
                    activeVouchers.push(v);
                }
            } else {
                // If voucherStatus = false, ONLY show in history if voucherEndDate has ALREADY passed (isEndPast)
                // If voucherEndDate is not end yet, DO NOT show in history campaign
                if (isEndPast) {
                    historyVouchers.push(v);
                }
            }
        });

        // Sort historyVouchers strictly by voucherEndDate descending (latest end date first)
        historyVouchers.sort((a, b) => {
            const dateA = a.voucherEndDate ? new Date(a.voucherEndDate).getTime() : (a.created ? new Date(a.created).getTime() : 0);
            const dateB = b.voucherEndDate ? new Date(b.voucherEndDate).getTime() : (b.created ? new Date(b.created).getTime() : 0);
            return dateB - dateA;
        });

        // RULE 1: If there is an Active Campaign (voucherStatus = true & startDate <= now & endDate >= now)
        if (activeVouchers.length > 0) {
            // ONLY show the 1 active campaign! Do NOT show upcoming and history campaign!
            if (activeWrap) activeWrap.style.display = 'grid';
            if (noActiveWrap) noActiveWrap.style.display = 'none';
            if (sideBySideWrap) sideBySideWrap.style.display = 'none';
            if (historyOnlyWrap) historyOnlyWrap.style.display = 'none';

            const v = activeVouchers[0];
            populateActiveVoucherUI(v);
            return;
        }

        // NO active campaign is live!
        if (activeWrap) activeWrap.style.display = 'none';

        // RULE 2 & 5: If got upcoming campaign (voucherStartDate > now & voucherStatus = true)
        if (upcomingVouchers.length > 0) {
            if (noActiveWrap) noActiveWrap.style.display = 'none';
            if (historyOnlyWrap) historyOnlyWrap.style.display = 'none';
            if (sideBySideWrap) sideBySideWrap.style.display = 'block';

            // Pick ONLY 1 upcoming campaign—the one with voucherStartDate closest to now!
            upcomingVouchers.sort((a, b) => {
                const dateA = new Date(a.voucherStartDate).getTime();
                const dateB = new Date(b.voucherStartDate).getTime();
                return dateA - dateB;
            });
            const nearestUpcoming = upcomingVouchers[0];

            // Render Right Column: Upcoming Campaign (70% space) with Countdown Timer
            if (sideUpcomingContainer) {
                const name = escapeHtmlText(nearestUpcoming.voucherName || 'Upcoming Dining Privilege');
                const value = escapeHtmlText(nearestUpcoming.voucherValue || 'RM50');
                const startDateObj = new Date(nearestUpcoming.voucherStartDate);
                const startStr = startDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                sideUpcomingContainer.innerHTML = `
                    <div class="upcoming-feature-box">
                        <div class="upcoming-feature-header">
                            <span class="campaign-badge upcoming"><i class="fa-solid fa-clock"></i> UPCOMING CAMPAIGN</span>
                            <span style="font-size: 0.85rem; color: #b45309; font-weight: 700;"><i class="fa-solid fa-calendar-day"></i> Launches ${startStr}</span>
                        </div>
                        <h4 class="upcoming-feature-title">${name}</h4>
                        <div class="upcoming-feature-value">${value}</div>

                        <!-- Live Countdown Timer Widget -->
                        <div class="upcoming-countdown-widget">
                            <span class="countdown-label"><i class="fa-solid fa-stopwatch gold-text"></i> Campaign Countdown Timer</span>
                            <div class="countdown-timer-grid">
                                <div class="timer-box">
                                    <span class="timer-number" id="cdDays">00</span>
                                    <span class="timer-unit">DAYS</span>
                                </div>
                                <div class="timer-colon">:</div>
                                <div class="timer-box">
                                    <span class="timer-number" id="cdHours">00</span>
                                    <span class="timer-unit">HOURS</span>
                                </div>
                                <div class="timer-colon">:</div>
                                <div class="timer-box">
                                    <span class="timer-number" id="cdMins">00</span>
                                    <span class="timer-unit">MINS</span>
                                </div>
                                <div class="timer-colon">:</div>
                                <div class="timer-box">
                                    <span class="timer-number" id="cdSecs">00</span>
                                    <span class="timer-unit">SECS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Start Live Countdown Timer Interval
                function updateCountdown() {
                    const currentTime = new Date().getTime();
                    const targetTime = startDateObj.getTime();
                    const diff = targetTime - currentTime;

                    if (diff <= 0) {
                        if (countdownIntervalId) clearInterval(countdownIntervalId);
                        loadDynamicVoucherData();
                        return;
                    }

                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                    const elDays = document.getElementById('cdDays');
                    const elHours = document.getElementById('cdHours');
                    const elMins = document.getElementById('cdMins');
                    const elSecs = document.getElementById('cdSecs');

                    if (elDays) elDays.textContent = String(days).padStart(2, '0');
                    if (elHours) elHours.textContent = String(hours).padStart(2, '0');
                    if (elMins) elMins.textContent = String(minutes).padStart(2, '0');
                    if (elSecs) elSecs.textContent = String(seconds).padStart(2, '0');
                }

                updateCountdown();
                countdownIntervalId = setInterval(updateCountdown, 1000);
            }

            // Render Left Column: History Campaign (30% space) - Top 3 Latest Only
            if (sideHistoryList) {
                if (historyVouchers.length > 0) {
                    const top3History = historyVouchers.slice(0, 3);
                    sideHistoryList.innerHTML = top3History.map(v => {
                        const name = escapeHtmlText(v.voucherName || 'Concluded Campaign');
                        const value = escapeHtmlText(v.voucherValue || 'RM50');
                        const endStr = v.voucherEndDate ? new Date(v.voucherEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Concluded';
                        return `
                            <div class="history-item-mini-card">
                                <h5 class="history-mini-name">${name}</h5>
                                <div class="history-mini-bottom" style="display: flex; align-items: flex-end; justify-content: space-between; margin-top: 6px;">
                                    <div class="history-mini-value">${value}</div>
                                    <span class="history-mini-enddate" style="font-size: 0.75rem; color: #64748b; font-weight: 600;"><i class="fa-solid fa-calendar-xmark" style="font-size: 0.7rem; color: #94a3b8; margin-right: 3px;"></i> Ended ${endStr}</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    sideHistoryList.innerHTML = `
                        <div style="font-size: 0.85rem; color: #94a3b8; font-style: italic; text-align: center; padding: 20px 0;">
                            No past campaigns recorded.
                        </div>
                    `;
                }
            }

        } else {
            // RULE 3: No Active Campaign AND No Upcoming Campaign exists
            if (sideBySideWrap) sideBySideWrap.style.display = 'none';

            // Show "Currently No Active Campaign" banner
            if (noActiveWrap) noActiveWrap.style.display = 'block';

            // Show History Campaign below if history exists - Top 3 Latest Only
            if (historyVouchers.length > 0) {
                if (historyOnlyWrap) historyOnlyWrap.style.display = 'block';
                if (historyOnlyGrid) {
                    const top3History = historyVouchers.slice(0, 3);
                    historyOnlyGrid.innerHTML = top3History.map(v => {
                        const name = escapeHtmlText(v.voucherName || 'Dining Campaign');
                        const value = escapeHtmlText(v.voucherValue || 'RM50');
                        const endStr = v.voucherEndDate ? new Date(v.voucherEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Concluded';
                        return `
                            <div class="campaign-item-card history-card">
                                <div>
                                    <div class="campaign-card-header">
                                        <span class="campaign-badge history"><i class="fa-solid fa-box-archive"></i> Concluded</span>
                                    </div>
                                    <h4 class="campaign-card-name">${name}</h4>
                                    <div class="campaign-card-value">${value}</div>
                                </div>
                                <div class="campaign-card-subtext" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                                    <span><i class="fa-solid fa-circle-check"></i> Official Campaign Ended</span>
                                    <span style="font-size: 0.78rem; color: #64748b; font-weight: 600;"><i class="fa-solid fa-calendar-xmark" style="font-size: 0.72rem; color: #94a3b8; margin-right: 3px;"></i> Ended ${endStr}</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } else {
                if (historyOnlyWrap) historyOnlyWrap.style.display = 'none';
            }
        }

        // Internal Helper Function to populate Active Voucher Banner UI
        function populateActiveVoucherUI(v) {
            let colorConfig = v.voucherColorConfig;
            if (typeof colorConfig === 'string') {
                try { colorConfig = JSON.parse(colorConfig); } catch (e) { colorConfig = null; }
            }

            function compileSegments(segments, defaultText) {
                if (!segments || !Array.isArray(segments) || segments.length === 0) {
                    return escapeHtmlText(defaultText || '');
                }
                return segments.map(seg => {
                    const txt = escapeHtmlText(seg.text || '');
                    if (seg.gradient) {
                        return `<span style="background: ${seg.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; display: inline-block;">${txt}</span>`;
                    } else if (seg.color) {
                        return `<span style="color: ${seg.color};">${txt}</span>`;
                    }
                    return txt;
                }).join(' ');
            }

            // Update voucherTitle
            const elTitle = document.getElementById('dynVoucherTitle');
            if (elTitle && (v.voucherTittle || v.title)) {
                const rawTitle = v.voucherTittle || v.title;
                if (colorConfig && colorConfig.voucherTitle && colorConfig.voucherTitle.length > 0) {
                    elTitle.innerHTML = compileSegments(colorConfig.voucherTitle, rawTitle);
                } else {
                    elTitle.textContent = rawTitle;
                }
            }

            // Update voucherDescription
            const elDesc = document.getElementById('dynVoucherDescription');
            if (elDesc && (v.voucherDescription || v.description)) {
                const rawDesc = v.voucherDescription || v.description;
                if (colorConfig && colorConfig.voucherDescription && colorConfig.voucherDescription.length > 0) {
                    elDesc.innerHTML = compileSegments(colorConfig.voucherDescription, rawDesc);
                } else {
                    elDesc.textContent = rawDesc;
                }
            }

            // Update voucherName
            const elName = document.getElementById('dynVoucherName');
            if (v.voucherName) {
                activeVoucherNameText = v.voucherName;
                if (elName) {
                    if (colorConfig && colorConfig.voucherName && colorConfig.voucherName.length > 0) {
                        elName.innerHTML = compileSegments(colorConfig.voucherName, v.voucherName);
                    } else {
                        elName.textContent = v.voucherName;
                    }
                }
            }

            if (v.voucherEndDate) {
                const d = new Date(v.voucherEndDate);
                if (!isNaN(d.getTime())) {
                    activeVoucherEndDateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    activeVoucherRawEndDateIso = d.toISOString();
                } else {
                    activeVoucherEndDateStr = "";
                    activeVoucherRawEndDateIso = "";
                }
            } else {
                activeVoucherEndDateStr = "";
                activeVoucherRawEndDateIso = "";
            }

            // Update voucherValue
            const elValue = document.getElementById('dynVoucherValue');
            const valText = v.voucherValue !== undefined ? String(v.voucherValue).trim() : 'RM50';
            activeVoucherValText = valText;

            if (elValue) {
                const hasOffAlready = valText.toLowerCase().includes('off');

                if (colorConfig && colorConfig.voucherValue && colorConfig.voucherValue.length > 0) {
                    const segs = colorConfig.voucherValue;
                    const lastSeg = segs[segs.length - 1];

                    let offStyle = '';
                    if (lastSeg && lastSeg.gradient) {
                        offStyle = `style="background: ${lastSeg.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; display: inline-block;"`;
                    } else if (lastSeg && lastSeg.color) {
                        offStyle = `style="color: ${lastSeg.color};"`;
                    }

                    const offHtml = hasOffAlready ? '' : ` <span class="ticket-off-tag" ${offStyle}>OFF</span>`;
                    elValue.innerHTML = compileSegments(segs, valText) + offHtml;
                } else {
                    if (hasOffAlready) {
                        elValue.textContent = valText;
                    } else {
                        elValue.innerHTML = `${escapeHtmlText(valText)} <span class="ticket-off-tag">OFF</span>`;
                    }
                }
            }

            // Update Step 1 & Step 3 descriptions with active voucherValue
            const step1 = document.getElementById('voucherStep1Desc');
            if (step1) {
                step1.textContent = `Fill in your Name & Phone number below to generate your personalized ${valText} PDF voucher and code.`;
            }

            const step3 = document.getElementById('voucherStep3Desc');
            if (step3) {
                step3.textContent = `Our Bayu Seafood staff will verify your voucher code so you can enjoy ${valText} off your total dining bill!`;
            }

            // Update Section Background (voucherBackground / voucherColorConfig.voucherBackground)
            const sectionEl = document.getElementById('voucher-campaign') || document.getElementById('campaign');
            if (sectionEl) {
                let bgApplied = false;

                if (v.voucherBackground) {
                    let imgUrl = v.voucherBackground;
                    if (typeof v.voucherBackground === 'string') {
                        if (window.PocketBase && v.id && !v.id.startsWith('vouch_')) {
                            const pb = new window.PocketBase('https://pocketbase2.venturerushtech.com');
                            imgUrl = pb.getFileUrl(v, v.voucherBackground);
                        }
                        sectionEl.style.backgroundImage = `url('${imgUrl}')`;
                        sectionEl.style.backgroundSize = 'cover';
                        sectionEl.style.backgroundPosition = 'center center';
                        sectionEl.style.backgroundRepeat = 'no-repeat';
                        bgApplied = true;
                    }
                }

                if (!bgApplied && colorConfig && colorConfig.voucherBackground) {
                    const bgConf = colorConfig.voucherBackground;
                    if (bgConf.type === 'gradient' && bgConf.gradient) {
                        sectionEl.style.background = bgConf.gradient;
                    } else if (bgConf.color) {
                        sectionEl.style.background = bgConf.color;
                    }
                }
            }

            // Helper function to find element within active voucher campaign wrap
            function getCampaignEl(selector) {
                return document.querySelector('#activeVoucherCampaignWrap ' + selector) || document.querySelector('#voucher-campaign ' + selector) || document.querySelector('#campaign ' + selector);
            }
            function getCampaignEls(selector) {
                const list0 = Array.from(document.querySelectorAll('#activeVoucherCampaignWrap ' + selector));
                if (list0.length > 0) return list0;
                const list1 = Array.from(document.querySelectorAll('#voucher-campaign ' + selector));
                const list2 = Array.from(document.querySelectorAll('#campaign ' + selector));
                return list1.length > 0 ? list1 : list2;
            }

            // Update Ticket Header Background (voucherColorConfig.voucherTicket)
            if (colorConfig && colorConfig.voucherTicket) {
                const tConf = colorConfig.voucherTicket;
                const ticketHeader = getCampaignEl('.ticket-header');
                if (ticketHeader) {
                    if (tConf.type === 'gradient' && tConf.gradient) {
                        ticketHeader.style.background = tConf.gradient;
                    } else if (tConf.color) {
                        ticketHeader.style.background = tConf.color;
                    }
                }
            }

            // Update Start Date & End Date
            const expiryNotice = document.getElementById('voucherExpiryNotice');
            if (expiryNotice && (v.voucherStartDate || v.voucherEndDate)) {
                const startFormatted = v.voucherStartDate ? new Date(v.voucherStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                const endFormatted = v.voucherEndDate ? new Date(v.voucherEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                expiryNotice.innerHTML = `<i class="fa-solid fa-clock-rotate-left gold-text"></i> <span>Note: Voucher valid from <strong>${startFormatted}</strong> to <strong>${endFormatted}</strong>.</span>`;
            }

            // Lock Claim Check & Form Field Blur/Disable Handling
            const isLocked = v.lockClaim === true || v.lockClaim === 'true';
            const lockNoticeEl = document.getElementById('voucherLockClaimNotice');
            const lockReasonTextEl = document.getElementById('voucherLockClaimReasonText');
            const inputName = document.getElementById('voucherName');
            const inputPhone = document.getElementById('voucherPhone');
            const btnClaim = document.getElementById('btnClaimVoucher');

            if (isLocked) {
                const reasonText = v.lockClaimReason || 'Campaign Update in Progress...';
                if (lockReasonTextEl) lockReasonTextEl.textContent = reasonText;
                if (lockNoticeEl) lockNoticeEl.style.display = 'block';

                if (inputName) {
                    inputName.disabled = true;
                    inputName.style.filter = 'blur(3px)';
                    inputName.style.opacity = '0.5';
                    inputName.style.cursor = 'not-allowed';
                }
                if (inputPhone) {
                    inputPhone.disabled = true;
                    inputPhone.style.filter = 'blur(3px)';
                    inputPhone.style.opacity = '0.5';
                    inputPhone.style.cursor = 'not-allowed';
                }
                if (btnClaim) {
                    btnClaim.disabled = true;
                    btnClaim.style.filter = 'blur(3px)';
                    btnClaim.style.opacity = '0.5';
                    btnClaim.style.cursor = 'not-allowed';
                }
            } else {
                if (lockNoticeEl) lockNoticeEl.style.display = 'none';

                if (inputName) {
                    inputName.disabled = false;
                    inputName.style.filter = 'none';
                    inputName.style.opacity = '1';
                    inputName.style.cursor = 'text';
                }
                if (inputPhone) {
                    inputPhone.disabled = false;
                    inputPhone.style.filter = 'none';
                    inputPhone.style.opacity = '1';
                    inputPhone.style.cursor = 'text';
                }
                if (btnClaim) {
                    btnClaim.disabled = false;
                    btnClaim.style.filter = 'none';
                    btnClaim.style.opacity = '1';
                    btnClaim.style.cursor = 'pointer';
                }
            }

            // Update Voucher Theme Accent Color / Gradient (voucherColorConfig.voucherTheme)
            if (colorConfig && colorConfig.voucherTheme) {
                const theme = colorConfig.voucherTheme;
                const themeColor = theme.color || '#d4af37';
                const themeGradient = (theme.type === 'gradient' && theme.gradient) ? theme.gradient : null;

                function applyThemeText(el) {
                    if (!el) return;
                    if (themeGradient) {
                        el.style.background = themeGradient;
                        el.style.webkitBackgroundClip = 'text';
                        el.style.webkitTextFillColor = 'transparent';
                        el.style.backgroundClip = 'text';
                        el.style.display = 'inline-block';
                    } else {
                        el.style.background = 'none';
                        el.style.webkitTextFillColor = 'initial';
                        el.style.color = themeColor;
                        el.style.setProperty('color', themeColor, 'important');
                    }
                }

                function applyThemeBackground(el) {
                    if (!el) return;
                    if (themeGradient) {
                        el.style.background = themeGradient;
                    } else {
                        el.style.background = themeColor;
                    }
                    el.style.color = '#ffffff';
                }

                function applyThemeBorder(el, borderWidth = '2px') {
                    if (!el) return;
                    if (themeGradient) {
                        el.style.borderStyle = 'solid';
                        el.style.borderWidth = borderWidth;
                        el.style.borderColor = 'transparent';
                        el.style.backgroundImage = `linear-gradient(#ffffff, #ffffff), ${themeGradient}`;
                        el.style.backgroundOrigin = 'border-box';
                        el.style.backgroundClip = 'padding-box, border-box';
                    } else {
                        el.style.borderStyle = 'solid';
                        el.style.borderWidth = borderWidth;
                        el.style.borderColor = themeColor;
                        el.style.backgroundImage = 'none';
                        el.style.backgroundClip = 'border-box';
                    }
                }

                const subTitle = getCampaignEl('.section-subtitle');
                applyThemeText(subTitle);
                const subTitleIcon = getCampaignEl('.section-subtitle i');
                applyThemeText(subTitleIcon);

                const ticketTag = getCampaignEl('.ticket-tag');
                applyThemeText(ticketTag);
                const ticketTagIcon = getCampaignEl('.ticket-tag i');
                applyThemeText(ticketTagIcon);

                const stepsHeadingIcon = getCampaignEl('.voucher-steps-heading i');
                applyThemeText(stepsHeadingIcon);

                getCampaignEls('.step-badge').forEach(badge => {
                    applyThemeBackground(badge);
                });

                const expiryIcon = getCampaignEl('.voucher-expiry-notice i');
                applyThemeText(expiryIcon);

                const btnClaim = document.getElementById('btnClaimVoucher');
                applyThemeBackground(btnClaim);

                document.querySelectorAll('#voucherClaimForm label i').forEach(icon => {
                    applyThemeText(icon);
                });

                const ticketBody = getCampaignEl('.ticket-body');
                applyThemeBorder(ticketBody, '2px');

                const resId = document.getElementById('resVoucherId');
                applyThemeText(resId);
                const resExpiry = document.getElementById('resVoucherExpiry');
                applyThemeText(resExpiry);

                const btnRedownload = document.getElementById('btnRedownloadPdf');
                if (btnRedownload) {
                    applyThemeBorder(btnRedownload, '1px');
                    applyThemeText(btnRedownload);
                }
            }
        }
    }

    window.loadDynamicVoucherData = loadDynamicVoucherData;

    loadDynamicInstagramReels();
    loadDynamicVoucherData();

    initPanoramaGallery();
    initRoomVRController();
});

// Live Preview Sync Event Listener for Split Screen Mode
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'LIVE_VOUCHER_PREVIEW_UPDATE') {
        const draft = event.data.voucherData;
        if (draft && typeof loadDynamicVoucherData === 'function') {
            loadDynamicVoucherData(draft);
        }
    }
});


