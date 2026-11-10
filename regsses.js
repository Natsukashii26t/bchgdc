const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const message = document.getElementById("auth-message");
async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}
if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const users = JSON.parse(localStorage.getItem("echoesUsers")) || [];
        const exists = users.some(user =>
            user.email === email || user.username.toLowerCase() === username.toLowerCase()
        );
        if (exists) {
            message.textContent = "Ese correo o nombre de usuario ya existe.";
            return;
        }
        const passwordHash = await hashPassword(password);
        const newUser = {
            id: Date.now().toString(),
            username: username,
            email: email,
            password: passwordHash
        };
        users.push(newUser);
        localStorage.setItem("echoesUsers", JSON.stringify(users));
        localStorage.setItem("echoesSession", JSON.stringify({
            id: newUser.id,
            username: newUser.username
        }));
        window.location.href = "com.html";
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        const users = JSON.parse(localStorage.getItem("echoesUsers")) || [];

        const passwordHash = await hashPassword(password);

        const user = users.find(user =>
            user.email === email && user.password === passwordHash
        );

        if (!user) {
            message.textContent = "Correo o contraseña incorrectos.";
            return;
        }

        localStorage.setItem("echoesSession", JSON.stringify({
            id: user.id,
            username: user.username
        }));

        window.location.href = "com.html";
    });
}

