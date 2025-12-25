const GAS_URL =
  "https://script.google.com/macros/s/AKfycbwM263dREny57y2nXBCrAvgesWLdITWPHJLjqv2NmALXkCMIK016bZ819bMwzX0hn4t2g/exec";

const grid = document.getElementById("projectsGrid");

fetch(`${GAS_URL}?action=projects`)
  .then(res => res.json())
  .then(json => {
    grid.innerHTML = "";

    if (!json.success || json.data.length === 0) {
      grid.innerHTML = "<p>No projects found.</p>";
      return;
    }

    json.data.forEach(p => {
      const card = document.createElement("div");
      card.className = "project-card";

      card.innerHTML = `
        <h3>${p.title}</h3>
        <p>${p.description || ""}</p>
        ${p.link ? `<a href="${p.link}" target="_blank">View Project →</a>` : ""}
      `;

      grid.appendChild(card);
    });
  })
  .catch(err => {
    grid.innerHTML = "<p>Error loading projects</p>";
    console.error(err);
  });

/* ===== SKILLS ===== */
const skillsBox = document.getElementById("skillsList");

fetch(`${GAS_URL}?action=skills`)
  .then(res => res.json())
  .then(json => {
    skillsBox.innerHTML = "";
    json.data.forEach(s => {
      const div = document.createElement("div");
      div.className = "skill";
      div.innerHTML = `
        <div class="skill-title">
          <span>${s.title}</span>
          <span>${s.percent}%</span>
        </div>
        <div class="bar">
          <span style="width:${s.percent}%"></span>
        </div>
      `;
      skillsBox.appendChild(div);
    });
  });

/* ===== CERTIFICATES ===== */
const certBox = document.getElementById("certList");

fetch(`${GAS_URL}?action=certificates`)
  .then(res => res.json())
  .then(json => {
    certBox.innerHTML = "";
    json.data.forEach(c => {
      const div = document.createElement("div");
      div.className = "cert";
      div.innerHTML = `
        <h4>${c.title}</h4>
        <p>${c.issuer}</p>
        <a href="${c.link}" target="_blank">Verify →</a>
      `;
      certBox.appendChild(div);
    });
  });
const articleList = document.getElementById("articleList");
const modal = document.getElementById("articleModal");

fetch(`${GAS_URL}?action=articles`)
  .then(r => r.json())
  .then(j => {
    j.data.forEach(a => {
      const div = document.createElement("div");
      div.className = "article-item";
      div.innerText = a.title;
      div.onclick = () => openArticle(a.id);
      articleList.appendChild(div);
    });
  });

function openArticle(id) {
  fetch(`${GAS_URL}?action=article&id=${id}`)
    .then(r => r.json())
    .then(a => {
      document.getElementById("articleTitle").innerText = a.title;
      document.getElementById("articleBody").innerHTML = a.content;
      modal.classList.remove("hidden");
    });
}

function closeArticle() {
  modal.classList.add("hidden");
}

