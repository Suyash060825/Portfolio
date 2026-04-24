// LOADER
window.onload = () => {
    document.getElementById("loader").style.display = "none";
};

// Typing
const text = "Hi, I'm Yash — Developer";
let i = 0;
function type(){
    if(i < text.length){
        document.getElementById("typing").innerHTML += text[i];
        i++;
        setTimeout(type,40);
    }
}
type();

// Scroll animation
const observer = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
        if(e.isIntersecting){
            e.target.classList.add("show");
        }
    });
});
document.querySelectorAll(".fade").forEach(el=>observer.observe(el));

// Filter
function filterProjects(type){
    let cards = document.querySelectorAll('.project-card');
    cards.forEach(card=>{
        card.style.display =
        (type==='all'||card.classList.contains(type))?"block":"none";
    });
}

// Modal
function openModal(src){
    modal.style.display="block";
    document.getElementById("modal-img").src=src;
}
function closeModal(){
    modal.style.display="none";
}

// Scroll top
function scrollTop(){
    window.scrollTo({top:0,behavior:'smooth'});
}

// Mobile menu
function toggleMenu(){
    document.getElementById("nav-links").classList.toggle("show");
}