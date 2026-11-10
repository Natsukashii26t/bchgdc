const session = JSON.parse(localStorage.getItem("echoesSession"));
const postForm = document.getElementById("post-form");
const postsContainer = document.getElementById("posts-container");
const accountLink = document.getElementById("account-link");

if (session && accountLink) {
    accountLink.textContent = "@" + session.username;
    accountLink.href = "#";
}

function getPosts() {
    return JSON.parse(localStorage.getItem("echoesPosts")) || [];
}

function savePosts(posts) {
    localStorage.setItem("echoesPosts", JSON.stringify(posts));
}

function getProfiles() {
    return JSON.parse(localStorage.getItem("echoesProfiles")) || {};
}

function getUserProfile(userId, username) {
    const profiles = getProfiles();
    const profile = profiles[userId] || {};

    return {
        username: username || "usuario",
        displayName: profile.displayName || username || "Usuario",
        photo: profile.photo || ""
    };
}

function escapeHTML(text) {
    return String(text ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function profileLink(userId, username) {
    const user = getUserProfile(userId, username);

    const avatar = user.photo
        ? `<img class="user-avatar" src="${escapeHTML(user.photo)}" alt="">`
        : `<span class="user-avatar avatar-placeholder">${escapeHTML(user.displayName.charAt(0).toUpperCase())}</span>`;

    if (!userId) {
        return `
            <div class="user-identity">
                ${avatar}
                <span class="user-names">
                    <strong>${escapeHTML(user.displayName)}</strong>
                    <small>@${escapeHTML(user.username)}</small>
                </span>
            </div>
        `;
    }

    return `
        <a class="profile-link user-identity"
            href="profile.html?user=${encodeURIComponent(userId)}">
            ${avatar}
            <span class="user-names">
                <strong>${escapeHTML(user.displayName)}</strong>
                <small>@${escapeHTML(user.username)}</small>
            </span>
        </a>
    `;
}

function renderComments(post) {
    const comments = post.comments || [];

    if (comments.length === 0) {
        return `<p class="no-comments">Todavía no hay comentarios.</p>`;
    }

    return comments.map(comment => `
        <div class="comment">

            <div class="comment-heading">
                ${profileLink(comment.userId, comment.username)}

                ${session && String(comment.userId) === String(session.id) ? `
                    <button class="delete-button"
                        data-delete-comment="${escapeHTML(comment.id)}"
                        data-post="${escapeHTML(post.id)}">
                        Eliminar
                    </button>
                ` : ""}
            </div>

            <p>${escapeHTML(comment.content)}</p>

            ${session ? `
                <button class="reply-button"
                    data-reply="${escapeHTML(comment.id)}"
                    data-post="${escapeHTML(post.id)}">
                    Responder
                </button>

                <form class="reply-form"
                    data-reply-form="${escapeHTML(comment.id)}"
                    data-post="${escapeHTML(post.id)}"
                    hidden>

                    <textarea placeholder="Escribe una respuesta..." required maxlength="500"></textarea>

                    <button type="submit" class="button small-button">
                        Responder
                    </button>
                </form>
            ` : ""}

            ${(comment.replies || []).map(reply => `
                <div class="reply">

                    <div class="comment-heading">
                        ${profileLink(reply.userId, reply.username)}

                        ${session && String(reply.userId) === String(session.id) ? `
                            <button class="delete-button"
                                data-delete-reply="${escapeHTML(reply.id)}"
                                data-comment="${escapeHTML(comment.id)}"
                                data-post="${escapeHTML(post.id)}">
                                Eliminar
                            </button>
                        ` : ""}
                    </div>

                    <p>${escapeHTML(reply.content)}</p>
                </div>
            `).join("")}

        </div>
    `).join("");
}

function renderPosts() {
    if (!postsContainer) return;

    const posts = getPosts();

    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="empty-state">
                <p>Todavía no hay publicaciones.</p>
                <p>¡Sé el primero en compartir algo!</p>
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = posts.map(post => {
        const likes = post.likes || [];
        const liked = session && likes.includes(session.id);
        const comments = post.comments || [];

        return `
            <article class="post-card">

                <div class="post-top">
                    ${profileLink(post.userId, post.username)}
                    <span class="post-date">${escapeHTML(post.date)}</span>
                </div>

                <span class="post-category">
                    ${escapeHTML(post.category)}
                </span>

                <h3>${escapeHTML(post.title)}</h3>

                <p>${escapeHTML(post.content)}</p>

                <div class="post-actions">
                    <button class="like-button ${liked ? "liked" : ""}"
                        data-like="${escapeHTML(post.id)}">
                        ♡ ${likes.length} Me gusta
                    </button>

                    <span class="comment-count">
                        ${comments.length} comentarios
                    </span>
                </div>

                <section class="comments-section">

                    <h4>Comentarios</h4>

                    ${session ? `
                        <form class="comment-form"
                            data-comment-form="${escapeHTML(post.id)}">

                            <textarea placeholder="Escribe un comentario..."
                                required maxlength="500"></textarea>

                            <button type="submit" class="button small-button">
                                Comentar
                            </button>
                        </form>
                    ` : `
                        <p class="no-comments">
                            Inicia sesión para participar en la conversación.
                        </p>
                    `}

                    <div class="comments-list">
                        ${renderComments(post)}
                    </div>

                </section>
            </article>
        `;
    }).join("");
}

if (postForm) {
    postForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const message = document.getElementById("post-message");

        if (!session) {
            if (message) message.textContent = "Inicia sesión para publicar.";
            return;
        }

        const category = document.getElementById("post-category").value;
        const title = document.getElementById("post-title").value.trim();
        const content = document.getElementById("post-content").value.trim();

        if (!title || !content) return;

        const posts = getPosts();

        posts.unshift({
            id: Date.now().toString(),
            userId: session.id,
            username: session.username,
            category,
            title,
            content,
            date: new Date().toLocaleDateString("es-BO"),
            likes: [],
            comments: []
        });

        savePosts(posts);
        postForm.reset();

        if (message) message.textContent = "¡Publicación creada!";

        renderPosts();
    });
}

if (postsContainer) {
    postsContainer.addEventListener("click", function(event) {
        const likeButton = event.target.closest("[data-like]");
        const replyButton = event.target.closest("[data-reply]");
        const deleteCommentButton = event.target.closest("[data-delete-comment]");
        const deleteReplyButton = event.target.closest("[data-delete-reply]");

        if (likeButton) {
            if (!session) {
                alert("Inicia sesión para dar Me gusta.");
                return;
            }

            const posts = getPosts();
            const post = posts.find(item => item.id === likeButton.dataset.like);

            if (!post) return;

            if (!post.likes) post.likes = [];

            const index = post.likes.indexOf(session.id);

            if (index === -1) {
                post.likes.push(session.id);
            } else {
                post.likes.splice(index, 1);
            }

            savePosts(posts);
            renderPosts();
            return;
        }

        if (replyButton) {
            const form = postsContainer.querySelector(
                `[data-reply-form="${replyButton.dataset.reply}"]`
            );

            if (form) form.hidden = !form.hidden;
            return;
        }

        if (deleteCommentButton) {
            if (!session) return;

            if (!confirm("¿Quieres eliminar este comentario y todas sus respuestas?")) {
                return;
            }

            const posts = getPosts();
            const post = posts.find(item => item.id === deleteCommentButton.dataset.post);

            if (!post) return;

            const comment = (post.comments || []).find(item =>
                item.id === deleteCommentButton.dataset.deleteComment
            );

            if (!comment || String(comment.userId) !== String(session.id)) return;

            post.comments = post.comments.filter(item =>
                item.id !== comment.id
            );

            savePosts(posts);
            renderPosts();
            return;
        }

        if (deleteReplyButton) {
            if (!session) return;

            if (!confirm("¿Quieres eliminar esta respuesta?")) {
                return;
            }

            const posts = getPosts();
            const post = posts.find(item => item.id === deleteReplyButton.dataset.post);

            if (!post) return;

            const comment = (post.comments || []).find(item =>
                item.id === deleteReplyButton.dataset.comment
            );

            if (!comment) return;

            const reply = (comment.replies || []).find(item =>
                item.id === deleteReplyButton.dataset.deleteReply
            );

            if (!reply || String(reply.userId) !== String(session.id)) return;

            comment.replies = comment.replies.filter(item =>
                item.id !== reply.id
            );

            savePosts(posts);
            renderPosts();
        }
    });

    postsContainer.addEventListener("submit", function(event) {
        const commentForm = event.target.closest("[data-comment-form]");
        const replyForm = event.target.closest("[data-reply-form]");

        if (!commentForm && !replyForm) return;

        event.preventDefault();

        if (!session) {
            alert("Inicia sesión para participar.");
            return;
        }

        const posts = getPosts();

        if (commentForm) {
            const post = posts.find(item =>
                item.id === commentForm.dataset.commentForm
            );

            if (!post) return;

            if (!post.comments) post.comments = [];

            const content = commentForm.querySelector("textarea").value.trim();

            if (!content) return;

            post.comments.push({
                id: Date.now().toString(),
                userId: session.id,
                username: session.username,
                content,
                replies: []
            });
        }

        if (replyForm) {
            const post = posts.find(item =>
                item.id === replyForm.dataset.post
            );

            if (!post) return;

            const comment = (post.comments || []).find(item =>
                item.id === replyForm.dataset.replyForm
            );

            if (!comment) return;

            const content = replyForm.querySelector("textarea").value.trim();

            if (!content) return;

            if (!comment.replies) comment.replies = [];

            comment.replies.push({
                id: Date.now().toString(),
                userId: session.id,
                username: session.username,
                content
            });
        }

        savePosts(posts);
        renderPosts();
    });
}

if (accountLink && session) {
    accountLink.addEventListener("click", function(event) {
        event.preventDefault();

        if (confirm("¿Quieres cerrar sesión?")) {
            localStorage.removeItem("echoesSession");
            window.location.href = "portada.html";
        }
    });
}

renderPosts();