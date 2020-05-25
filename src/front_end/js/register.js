function goHome() {
    window.location.href = "./index.html";
}


function register() {
    let emailInput = document.querySelector('#input-email');
    let email = emailInput.value;
    let usernameInput = document.querySelector('#input-username');
    let username = usernameInput.value;
    let passwordInput = document.querySelector('#input-password');
    let password = passwordInput.value;
    let validated = true;
    if (!email.length) {
        /*
        let p = document.createElement('p');
        p.innerText = '*E-mail is required.';
        emailInput.after(p);
        */
       document.getElementById("input-email").placeholder = "E-mail is Required";
        validated = false;
    }
    if (!username.length) {
        /*
        let p = document.createElement('p');
        p.innerText = '*Username is required.';
        usernameInput.after(p);
        */
        document.getElementById("input-username").placeholder = "Username is Required";
        validated = false;
    }
    if (!password.length) {
        /*
        let p = document.createElement('p');
        p.innerText = '*Password is required.';
        passwordInput.after(p);
        */
        document.getElementById("input-password").placeholder = "Password is Required";
        validated = false;
    }
    if (validated) {
        fetch('http://localhost:5000/create_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'email': email,
                'username': username,
                'password': password
            })
        })
        .then((res) => {
            if (!res.ok) {
                throw Error(res.statusText);
            }
            else {
                fetch('http://localhost:5000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'username': username,
                        'password': password
                    })
                })
                .then((res) => {
                    return res.json();
                })
                .then((data) => {
                    localStorage.setItem('currUser', JSON.stringify(data));
                    goHome();
                });
            }
        })
        .catch((err) => {
            alert('Username/email already in use.');
        });
    }
}

function showPassword() {
    var pass = document.getElementById("input-password");
    var icon = document.getElementById("pass-icon");
    if(pass.type === "password") {
        pass.type = "text";
        icon.src = "./images/show_pass.png";
    } else {
        pass.type = "password";
        icon.src = "./images/hide_pass.png";
    }
}