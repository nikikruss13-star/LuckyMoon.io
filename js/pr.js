let modal = document.querySelector(".modal");
let modal1 = document.querySelector(".modal1");
let trigger = document.querySelector(".trigger");
let closeButton = document.querySelector(".close-button");
let closeButton1 = document.querySelector(".close-button1");

let a = undefined;

function toggleModal() {
    let i = Math.random();

    if (a === undefined) {
        if (i < 0.5) {
            modal1.classList.toggle("show-modal");
            a = 0;
        } else {
            modal.classList.toggle("show-modal");
            a = 1;
        }
    } else {
        if (a < 0.5) {
            modal1.classList.toggle("show-modal");
            a = undefined;
        } else {
            modal.classList.toggle("show-modal");
            a = undefined;
        }
    }
}

function windowOnClick(event) {
    if (event.target === modal) {
        toggleModal();
    }
    if (event.target === modal1) {
        toggleModal();
    }
}

trigger.addEventListener("click", toggleModal);
closeButton.addEventListener("click", toggleModal);
closeButton1.addEventListener("click", toggleModal);
window.addEventListener("click", windowOnClick);

//Деньги
function balance1() {
    balanceManager.addToBalance(500);
}

//Переходы
function clickcoist() {
    window.location.href = "cost.html"
}

function clickpr() {
    window.location.href = "pr.html"
}