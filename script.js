<h1 id="title"></h1>
<div id="content"></div>

<script>
const slug = new URLSearchParams(location.search).get("slug");
const API = "PASTE_YOUR_GAS_URL_HERE";

fetch(`${API}?action=getArticle&slug=${slug}`)
.then(r => r.json())
.then(d => {
  title.innerText = d.title;
  content.innerHTML = d.content;
});
</script>
