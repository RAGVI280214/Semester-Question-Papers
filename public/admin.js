// -------------------------
// CHECK LOGIN STATUS
// -------------------------

async function checkLogin() {

    const response =
        await fetch(
            "/api/admin/status"
        );


    const data =
        await response.json();


    if (data.loggedIn) {

        showAdminPanel();

    }

}



// -------------------------
// SHOW ADMIN PANEL
// -------------------------

function showAdminPanel() {

    document
        .getElementById(
            "loginSection"
        )
        .style.display = "none";


    document
        .getElementById(
            "adminSection"
        )
        .style.display = "block";


    loadAdminPapers();

}



// -------------------------
// LOGIN
// -------------------------

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const password =
                document
                .getElementById(
                    "password"
                )
                .value;


            const response =
                await fetch(
                    "/api/admin/login",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            password:
                                password

                        })

                    }
                );


            const data =
                await response.json();


            const message =
                document
                .getElementById(
                    "loginMessage"
                );


            if (
                response.ok &&
                data.success
            ) {

                message.textContent =
                    "Login successful!";


                showAdminPanel();

            }

            else {

                message.textContent =
                    data.message;

            }

        }
    );



// -------------------------
// LOGOUT
// -------------------------

document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        async function() {


            await fetch(
                "/api/admin/logout",
                {
                    method: "POST"
                }
            );


            location.reload();

        }
    );



// -------------------------
// UPLOAD
// -------------------------

document
    .getElementById(
        "uploadForm"
    )
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const form =
                document.getElementById(
                    "uploadForm"
                );


            const formData =
                new FormData(form);


            const message =
                document.getElementById(
                    "uploadMessage"
                );


            message.textContent =
                "Uploading...";


            try {

                const response =
                    await fetch(
                        "/api/upload",
                        {

                            method: "POST",

                            body:
                                formData

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    message.textContent =
                        data.message;

                    return;

                }


                message.textContent =
                    "Paper uploaded successfully!";


                form.reset();


                loadAdminPapers();

            }

            catch (error) {

                message.textContent =
                    "Upload failed.";

            }

        }
    );



// -------------------------
// LOAD ADMIN PAPERS
// -------------------------

async function loadAdminPapers() {

    const response =
        await fetch(
            "/api/papers"
        );


    const papers =
        await response.json();


    const container =
        document.getElementById(
            "adminPapers"
        );


    container.innerHTML = "";


    papers.forEach(
        paper => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "paper-card";


            card.innerHTML = `

                <h3>
                    ${paper.title}
                </h3>

                <p>
                    Subject:
                    ${paper.subject}
                </p>

                <p>
                    Branch:
                    ${paper.branch}
                </p>

                <p>
                    Semester:
                    ${paper.semester}
                </p>

                <p>
                    Year:
                    ${paper.year}
                </p>


                <div class="paper-buttons">

                    <a
                        class="view-button"
                        href="${paper.url}"
                        target="_blank"
                    >
                        View
                    </a>


                    <button
                        class="delete-button"
                        onclick="deletePaper(${paper.id})"
                    >
                        Delete
                    </button>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}



// -------------------------
// DELETE
// -------------------------

async function deletePaper(id) {

    const answer =
        confirm(
            "Are you sure you want to delete this paper?"
        );


    if (!answer) {

        return;

    }


    const response =
        await fetch(
            `/api/papers/${id}`,
            {

                method: "DELETE"

            }
        );


    const data =
        await response.json();


    alert(
        data.message
    );


    loadAdminPapers();

}



// -------------------------
// START
// -------------------------

checkLogin();