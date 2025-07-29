let trees = [];
function loadFromLocalStorage() {
  const data = localStorage.getItem('trees');
  if (data) trees = JSON.parse(data);
}
function saveToLocalStorage() {
  localStorage.setItem('trees', JSON.stringify(trees));
}
loadFromLocalStorage();

const nameMap = {
  peepal: "Ficus religiosa",
  neem: "Azadirachta indica",
  banyan: "Ficus benghalensis",
  mango: "Mangifera indica",
  tulsi: "Ocimum sanctum",
  ashoka: "Saraca asoca",
  jamun: "Syzygium cumini",
  lemon: "Citrus limon",
  guava: "Psidium guajava",
  palm: "Arecaceae"
};
document.getElementById('common-name').addEventListener('input', function(e) {
  let cname = e.target.value.trim().toLowerCase();
  let sname = nameMap[cname] || '';
  document.getElementById('species').value = sname;
});

document.getElementById('photos').addEventListener('change', function(e) {
  let preview = document.getElementById('preview');
  preview.innerHTML = '';
  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = function(evt) {
      let img = document.createElement('img');
      img.src = evt.target.result;
      img.className = "miniimg";
      preview.appendChild(img);
    }
    reader.readAsDataURL(file);
  });
});

// Map setup
let selectMap = L.map('select-map').setView([28.6101, 77.2301], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(selectMap);
let marker = null;
selectMap.on('click', function(e) {
  let {lat, lng} = e.latlng;
  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng], {draggable: true}).addTo(selectMap);
    marker.on('dragend', function(e) {
      let pos = e.target.getLatLng();
      document.getElementById('lat').value = pos.lat.toFixed(6);
      document.getElementById('lng').value = pos.lng.toFixed(6);
    });
  }
  document.getElementById('lat').value = lat.toFixed(6);
  document.getElementById('lng').value = lng.toFixed(6);
});

document.getElementById('add-tree-form').onsubmit = function(e) {
  e.preventDefault();
  let imgData = [];
  let fileInput = document.getElementById('photos');
  if (fileInput.files.length > 0) {
    for(let f of fileInput.files){
      let reader = new FileReader();
      reader.onload = function(event){
        imgData.push(event.target.result);
        if(imgData.length===fileInput.files.length){
          saveTree(imgData);
        }
      }
      reader.readAsDataURL(f);
    }
  } else {
    saveTree([]);
  }
  function saveTree(imgs) {
    let pd = document.getElementById('plantedDate').value;
    let lastInsp = document.getElementById('lastInspection').value;
    let tree = {
      id: document.getElementById('tree-id').value,
      species: document.getElementById('species').value,
      commonName: document.getElementById('common-name').value,
      lat: parseFloat(document.getElementById('lat').value),
      lng: parseFloat(document.getElementById('lng').value),
      plantedDate: pd,
      lastInspection: lastInsp,
      health: document.getElementById('health').value,
      adoptedBy: document.getElementById('adoptedBy').value.trim(),
      observation: document.getElementById('observation').value.trim(),
      photos: imgs // Array of data urls
    };
    trees.push(tree);
    saveToLocalStorage();
    alert('Tree added successfully!');
    document.getElementById('add-tree-form').reset();
    document.getElementById('preview').innerHTML = '';
    if (marker) { selectMap.removeLayer(marker); marker = null;}
  }
};

function calcAge(plantingDate) {
  if(!plantingDate) return "-";
  let pd = new Date(plantingDate);
  let today = new Date();
  let yearDiff = today.getFullYear() - pd.getFullYear();
  let m = today.getMonth() - pd.getMonth();
  if(m<0||(m===0&&today.getDate()<pd.getDate())) yearDiff--;
  return yearDiff >= 0 ? yearDiff + " years" : "-";
}

function renderTable() {
  let tbody = document.querySelector('#tree-table tbody');
  tbody.innerHTML = '';
  trees.forEach(tree => {
    let tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tree.id}</td>
      <td>${tree.species}</td>
      <td>${tree.commonName}</td>
      <td>${tree.lat}</td>
      <td>${tree.lng}</td>
      <td>${tree.plantedDate || '-'}</td>
      <td>${calcAge(tree.plantedDate)}</td>
      <td>${tree.lastInspection || '-'}</td>
      <td>${tree.observation || '-'}</td>
      <td>${tree.health}</td>
      <td>${tree.adoptedBy ? tree.adoptedBy : '-'}</td>
      <td>
        ${ (tree.photos && tree.photos.length) 
            ? tree.photos.map(src=>`<img src="${src}" class="miniimg">`).join("")
            : '-'
        }
      </td>
      <td>
        <button class="del-btn" data-id="${tree.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners to delete buttons
  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      let idToDelete = this.getAttribute('data-id');
      if (confirm(`Are you sure you want to delete Tree ID: ${idToDelete}?`)) {
        deleteTreeById(idToDelete);
      }
    });
  });
}
function deleteTreeById(treeId) {
  trees = trees.filter(tree => tree.id !== treeId);
  saveToLocalStorage();
  renderTable();
  alert(`Tree ID ${treeId} deleted successfully.`);
}

function showTrees() {
  renderTable();
  document.getElementById('add-tree-section').style.display = 'none';
  document.getElementById('trees-list-section').style.display = 'block';
}
function hideTrees() {
  document.getElementById('add-tree-section').style.display = 'block';
  document.getElementById('trees-list-section').style.display = 'none';
}
document.getElementById('add-tree-section').style.display = 'block';
document.getElementById('trees-list-section').style.display = 'none';
// TREE ID SEARCH FEATURE
document.getElementById('search-form').onsubmit = function(e) {
  e.preventDefault();
  let searchId = document.getElementById('search-id').value.trim();
  let tree = trees.find(t => t.id === searchId);
  let resDiv = document.getElementById('search-result');

  if (!tree) {
    resDiv.innerHTML = `<p style="color:red;font-weight:bold;">No tree found with ID: ${searchId}</p>`;
  } else {
    // Calculate age (re-use function from table)
    let age = calcAge(tree.plantedDate);
    // Photo thumbnails
    let imgs = (tree.photos && tree.photos.length)
      ? tree.photos.map(src=>`<img src="${src}" class="miniimg">`).join("")
      : "-";
    resDiv.innerHTML = `
      <div class="tree-detail-card">
        <b>ID:</b> ${tree.id} <br>
        <b>Scientific Name:</b> ${tree.species} <br>
        <b>Common Name:</b> ${tree.commonName} <br>
        <b>Latitude:</b> ${tree.lat} <br>
        <b>Longitude:</b> ${tree.lng} <br>
        <b>Planting Date:</b> ${tree.plantedDate || "-"} <br>
        <b>Age:</b> ${age}<br>
        <b>Last Inspection:</b> ${tree.lastInspection || "-"} <br>
        <b>Observation:</b> ${tree.observation || "-"} <br>
        <b>Health:</b> ${tree.health} <br>
        <b>Adopted By:</b> ${tree.adoptedBy || "-"} <br>
        <b>Photos:</b> ${imgs}
      </div>
    `;
  }
};
