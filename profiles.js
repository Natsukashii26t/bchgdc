const session = JSON.parse(localStorage.getItem("echoesSession"));
const params = new URLSearchParams(window.location.search);
const requestedId = params.get("user");

const users = JSON.parse(localStorage.getItem("echoesUsers")) || [];

const profileUser = requestedId
    ? users.find(user => user.id === requestedId)
    : users.find(user => session && user.id === session.id);

const isOwner = Boolean(
    session && profileUser && session.id === profileUser.id
);

const profileCard = document.querySelector(".profile-card");
const editButton = document.getElementById("edit-profile-button");
const followButton = document.getElementById("follow-button");
const editCard = document.getElementById("edit-profile-card");
const profileForm = document.getElementById("profile-form");

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function getProfiles() {
    return JSON.parse(localStorage.getItem("echoesProfiles")) || {};
}

function saveProfiles(profiles) {
    localStorage.setItem("echoesProfiles", JSON.stringify(profiles));
}

function getPosts() {
    return JSON.parse(localStorage.getItem("echoesPosts")) || [];
}

function getProfileData() {
    const profiles = getProfiles();

    return profiles[profileUser.id] || {
        displayName: profileUser.username,
        bio: "",
        artists: [],
        photo: "",
        followers: [],
        following: [],
        joined: new Date().toLocaleDateString("es-BO")
    };
}

function renderProfile() {
    if (!profileUser) {
        profileCard.innerHTML = `
            <div class="empty-state">
                <p>Este perfil no existe.</p>
                <a href="com.html">Volver a la comunidad</a>
            </div>
        `;

        document.querySelector(".profile-details").hidden = true;
        return;
    }

    const data = getProfileData();
    const displayName = data.displayName || profileUser.username;
    const posts = getPosts().filter(post => post.userId === profileUser.id);

    document.title = displayName + " | ECHOES";

    document.getElementById("profile-name").textContent = displayName;

    document.getElementById("profile-username").textContent =
        "@" + profileUser.username;

    document.getElementById("profile-date").textContent =
        "Miembro desde " + data.joined;

    document.getElementById("profile-bio").textContent =
        data.bio || "Este usuario todavía no tiene una biografía.";

    document.getElementById("profile-post-count").textContent = posts.length;
    document.getElementById("profile-followers").textContent = data.followers.length;
    document.getElementById("profile-following").textContent = data.following.length;

    const avatar = document.getElementById("profile-avatar");

    if (data.photo) {
        avatar.innerHTML = `<img src="${escapeHTML(data.photo)}" alt="Foto de perfil">`;
    } else {
        avatar.innerHTML = `<span>${escapeHTML(displayName.charAt(0).toUpperCase())}</span>`;
    }

    document.getElementById("profile-artists").innerHTML =
        data.artists.length
            ? data.artists.map(artist =>
                `<span class="artist-tag">${escapeHTML(artist)}</span>`
              ).join("")
            : `<span class="muted">Todavía no hay artistas.</span>`;

    const postsContainer = document.getElementById("profile-posts");

    postsContainer.innerHTML = posts.length
        ? posts.map(post => `
            <article class="profile-post">
                <span class="post-category">${escapeHTML(post.category)}</span>
                <h3>${escapeHTML(post.title)}</h3>
                <p>${escapeHTML(post.content)}</p>
                <span class="post-date">${escapeHTML(post.date)}</span>
            </article>
        `).join("")
        : `<p class="muted">Todavía no hay publicaciones.</p>`;

    editButton.hidden = !isOwner;
    followButton.hidden = !session || isOwner;

    if (!isOwner && session) {
        const following = data.followers.includes(session.id);
        followButton.textContent = following ? "Dejar de seguir" : "Seguir";
    }
}

if (profileUser && isOwner) {
    editButton.addEventListener("click", function() {
        const data = getProfileData();

        document.getElementById("edit-name").value =
            data.displayName || profileUser.username;

        document.getElementById("edit-bio").value = data.bio;
        document.getElementById("edit-artists").value = data.artists.join(", ");

        editCard.hidden = false;
        editCard.scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("close-editor").addEventListener("click", function() {
        editCard.hidden = true;
    });

    profileForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const photoFile = document.getElementById("profile-photo").files[0];

        const displayName =
            document.getElementById("edit-name").value.trim() ||
            profileUser.username;

        const bio = document.getElementById("edit-bio").value.trim();

        const artists = document.getElementById("edit-artists").value
            .split(",")
            .map(artist => artist.trim())
            .filter(Boolean)
            .slice(0, 10);

        const profiles = getProfiles();

        const current = profiles[profileUser.id] || {
            followers: [],
            following: [],
            joined: new Date().toLocaleDateString("es-BO")
        };

        function saveProfile(photo) {
            profiles[profileUser.id] = {
                ...current,
                displayName,
                bio,
                artists,
                photo
            };

            saveProfiles(profiles);

            document.getElementById("profile-message").textContent =
                "¡Perfil actualizado!";

            renderProfile();
            editCard.hidden = true;
            profileForm.reset();
        }

        if (photoFile) {
            if (!photoFile.type.startsWith("image/")) {
                document.getElementById("profile-message").textContent =
                    "Selecciona un archivo de imagen.";
                return;
            }

            if (photoFile.size > 1024 * 1024) {
                document.getElementById("profile-message").textContent =
                    "La imagen debe pesar menos de 1 MB.";
                return;
            }

            const reader = new FileReader();

            reader.onload = function() {
                saveProfile(reader.result);
            };

            reader.readAsDataURL(photoFile);
        } else {
            saveProfile(current.photo || "");
        }
    });
}

if (profileUser && followButton && !isOwner && session) {
    followButton.addEventListener("click", function() {
        const profiles = getProfiles();

        const target = profiles[profileUser.id] || {
            bio: "",
            artists: [],
            photo: "",
            followers: [],
            following: [],
            joined: new Date().toLocaleDateString("es-BO")
        };

        const own = profiles[session.id] || {
            bio: "",
            artists: [],
            photo: "",
            followers: [],
            following: [],
            joined: new Date().toLocaleDateString("es-BO")
        };

        if (!target.followers) target.followers = [];
        if (!own.following) own.following = [];

        const alreadyFollowing = target.followers.includes(session.id);

        if (alreadyFollowing) {
            target.followers = target.followers.filter(id => id !== session.id);
            own.following = own.following.filter(id => id !== profileUser.id);
        } else {
            target.followers.push(session.id);
            own.following.push(profileUser.id);
        }

        profiles[profileUser.id] = target;
        profiles[session.id] = own;

        saveProfiles(profiles);
        renderProfile();
    });
}

renderProfile();