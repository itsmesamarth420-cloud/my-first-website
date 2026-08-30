// =========================================================
// 1. IMAGE DATA
// =========================================================

const images = [
    "/images/bird.jpg",
    "/images/bird2.jpg",
    "/images/mountain.jpg"
];



// =========================================================
// 2. GALLERY STATE
// =========================================================

let currentImage = 0;

let slideshow = null;



// =========================================================
// 3. FIND HTML ELEMENTS
// =========================================================

const gallery =
    document.querySelector("#gallery");

const counter =
    document.querySelector("#gallery-counter");

const nextButton =
    document.querySelector("#next-image");

const previousButton =
    document.querySelector("#previous-image");

const slideshowButton =
    document.querySelector("#slideshow-button");


const lightbox =
    document.querySelector("#lightbox");

const lightboxImage =
    document.querySelector("#lightbox-image");

const closeLightbox =
    document.querySelector("#close-lightbox");

const previousLightbox =
    document.querySelector("#previous-lightbox");

const nextLightbox =
    document.querySelector("#next-lightbox");



const profileImage =
    document.querySelector(".profile-image");



// =========================================================
// 4. SHOW CURRENT IMAGE
// =========================================================

function showImage() {

    // Stop if this page does not have a gallery

    if (!gallery) {
        return;
    }


    gallery.innerHTML = `
        <img
            id="main-gallery-image"
            src="${images[currentImage]}"
            alt="Gallery image"
        >
    `;


    // Update counter

    if (counter) {

        counter.textContent =
            `${currentImage + 1} / ${images.length}`;

    }


    // Find the newly created image

    const mainImage =
        document.querySelector("#main-gallery-image");


    // Make image clickable

    if (mainImage && lightbox && lightboxImage) {

        mainImage.addEventListener("click", function() {

            lightboxImage.src =
                images[currentImage];

            lightbox.style.display =
                "flex";

        });

    }

}



// =========================================================
// 5. NEXT IMAGE
// =========================================================

function nextImage() {

    currentImage =
        currentImage + 1;


    if (currentImage >= images.length) {

        currentImage = 0;

    }


    showImage();

}



// =========================================================
// 6. PREVIOUS IMAGE
// =========================================================

function previousImage() {

    currentImage =
        currentImage - 1;


    if (currentImage < 0) {

        currentImage =
            images.length - 1;

    }


    showImage();

}



// =========================================================
// 7. MAIN GALLERY BUTTONS
// =========================================================

if (nextButton) {

    nextButton.addEventListener("click", function() {

        nextImage();

    });

}


if (previousButton) {

    previousButton.addEventListener("click", function() {

        previousImage();

    });

}



// =========================================================
// 8. LIGHTBOX NEXT / PREVIOUS
// =========================================================

if (nextLightbox) {

    nextLightbox.addEventListener("click", function() {

        nextImage();


        if (lightboxImage) {

            lightboxImage.src =
                images[currentImage];

        }

    });

}


if (previousLightbox) {

    previousLightbox.addEventListener("click", function() {

        previousImage();


        if (lightboxImage) {

            lightboxImage.src =
                images[currentImage];

        }

    });

}



// =========================================================
// 9. CLOSE LIGHTBOX
// =========================================================

if (closeLightbox) {

    closeLightbox.addEventListener("click", function() {

        if (lightbox) {

            lightbox.style.display =
                "none";

        }

    });

}



// =========================================================
// 10. ESCAPE KEY
// =========================================================

document.addEventListener("keydown", function(event) {

    if (
        event.key === "Escape" &&
        lightbox &&
        lightbox.style.display === "flex"
    ) {

        lightbox.style.display =
            "none";

    }

});



// =========================================================
// 11. SLIDESHOW
// =========================================================

if (slideshowButton) {

    slideshowButton.addEventListener("click", function() {


        // Start slideshow

        if (slideshow === null) {


            slideshow =
                setInterval(function() {

                    nextImage();


                    if (lightboxImage) {

                        lightboxImage.src =
                            images[currentImage];

                    }

                }, 3000);


            slideshowButton.textContent =
                "Stop Slideshow";

        }


        // Stop slideshow

        else {


            clearInterval(slideshow);

            slideshow = null;


            slideshowButton.textContent =
                "Start Slideshow";

        }

    });

}



// =========================================================
// 12. INITIALIZE GALLERY
// =========================================================

showImage();



// =========================================================
// 13. PROFILE PHOTO INTERACTION
// =========================================================

if (profileImage) {

    profileImage.addEventListener("click", function() {


        if (lightbox && lightboxImage) {

            lightboxImage.src =
                profileImage.src;


            lightbox.style.display =
                "flex";

        }

    });

}