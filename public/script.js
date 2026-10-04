let allPapers = [];


// -------------------------
// LOAD PAPERS
// -------------------------

async function loadPapers() {

    try {

        const response =
            await fetch("/api/papers");


        allPapers =
            await response.json();


        displayPapers(
            allPapers
        );

    }

    catch (error) {

        console.log(error);

    }

}



// -------------------------
// DISPLAY PAPERS
// -------------------------

function displayPapers(papers) {

    const container =
        document.getElementById(
            "papersContainer"
        );


    container.innerHTML = "";


    if (papers.length === 0) {

        container.innerHTML = `

            <p class="no-papers">

                No question papers found.

            </p>

        `;

        return;

    }


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
                    <strong>
                        Subject:
                    </strong>

                    ${paper.subject}
                </p>


                <p>
                    <strong>
                        Branch:
                    </strong>

                    ${paper.branch}
                </p>


                <p>
                    <strong>
                        Semester:
                    </strong>

                    ${paper.semester}
                </p>


                <p>
                    <strong>
                        Year:
                    </strong>

                    ${paper.year}
                </p>


                <div class="paper-buttons">

                    <a
                        class="view-button"
                        href="/uploads/${paper.filename}"
                        target="_blank"
                    >
                        View PDF
                    </a>


                    <a
                        class="download-button"
                        href="/uploads/${paper.filename}"
                        download="${paper.originalName}"
                    >
                        Download
                    </a>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}



// -------------------------
// FILTER
// -------------------------

function filterPapers() {

    const search =
        document
        .getElementById("search")
        .value
        .toLowerCase();


    const semester =
        document
        .getElementById("semesterFilter")
        .value;


    const branch =
        document
        .getElementById("branchFilter")
        .value;


    const year =
        document
        .getElementById("yearFilter")
        .value;


    const filtered =
        allPapers.filter(
            paper => {


                const matchesSearch =

                    paper.title
                    .toLowerCase()
                    .includes(search)

                    ||

                    paper.subject
                    .toLowerCase()
                    .includes(search)

                    ||

                    paper.branch
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        paper.year
                    ).includes(search);


                const matchesSemester =

                    !semester ||
                    paper.semester === semester;


                const matchesBranch =

                    !branch ||
                    paper.branch === branch;


                const matchesYear =

                    !year ||
                    String(
                        paper.year
                    ) === year;


                return (

                    matchesSearch &&

                    matchesSemester &&

                    matchesBranch &&

                    matchesYear

                );

            }
        );


    displayPapers(
        filtered
    );

}



// -------------------------
// EVENTS
// -------------------------

document
    .getElementById("search")
    .addEventListener(
        "input",
        filterPapers
    );


document
    .getElementById("semesterFilter")
    .addEventListener(
        "change",
        filterPapers
    );


document
    .getElementById("branchFilter")
    .addEventListener(
        "change",
        filterPapers
    );


document
    .getElementById("yearFilter")
    .addEventListener(
        "change",
        filterPapers
    );



// -------------------------
// START
// -------------------------

loadPapers();