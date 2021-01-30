const buttons = document.getElementsByClassName('button');

for (let i = 0; i < buttons.length; i++) {
    let btn = buttons[i];
    console.log(btn);
    btn.onclick = e => {

        let x = e.clientX - e.target.offsetLeft;
        let y = e.clientY - e.target.offsetTop;

        let ripples = document.createElement('span');

        ripples.className = 'ripple';
        ripples.style.left = `${x}px`;
        ripples.style.top = `${y}px`;

        btn.appendChild(ripples);

        setTimeout(() => {
            ripples.remove();
        }, 520);
    };
}
