/*
=========================================
Fruit AI
script.js
Bagian 1
=========================================
*/

const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const analyzeBtn = document.getElementById("analyzeBtn");
const resetBtn = document.getElementById("resetBtn");

const loadingSection = document.getElementById("loadingSection");
const progressBar = document.getElementById("progressBar");

const resultTable = document.getElementById("resultTable");

let selectedImages = [];

/*=========================================
Pilih Gambar
=========================================*/

imageInput.addEventListener("change", function () {
  selectedImages = [...this.files];

  showPreview();
});

/*=========================================
Preview
=========================================*/

function showPreview() {
  previewContainer.innerHTML = "";

  if (selectedImages.length === 0) {
    previewContainer.innerHTML = `
            <div class="col-12 text-center text-muted">
                Belum ada gambar dipilih.
            </div>
        `;

    return;
  }

  selectedImages.forEach((file) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      previewContainer.innerHTML += `

            <div class="col-md-3 col-sm-6">

                <div class="preview-item">

                    <img src="${e.target.result}" class="img-fluid">

                    <div class="preview-name">

                        ${file.name}

                    </div>

                </div>

            </div>

            `;
    };

    reader.readAsDataURL(file);
  });
}

/*=========================================
Reset
=========================================*/

resetBtn.addEventListener("click", resetApp);

function resetApp() {
  imageInput.value = "";

  selectedImages = [];

  previewContainer.innerHTML = "";

  loadingSection.classList.add("d-none");

  progressBar.style.width = "0%";

  progressBar.innerHTML = "0%";

  resultTable.innerHTML = `

        <tr>

            <td colspan="8" class="text-center text-muted">

                Belum ada hasil analisis.

            </td>

        </tr>

    `;
}

/*=========================================
Progress Bar
=========================================*/

function updateProgress(current, total) {
  const percent = Math.round((current / total) * 100);

  progressBar.style.width = percent + "%";

  progressBar.innerHTML = `${percent}%`;
}

/*=========================================
Loading
=========================================*/

function showLoading() {
  loadingSection.classList.remove("d-none");

  updateProgress(0, 1);
}

function hideLoading() {
  loadingSection.classList.add("d-none");
}

/*=========================================
Base64 Converter
=========================================*/

function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(",")[1];

      resolve(base64);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/*=========================================
Prompt Gemini
=========================================*/

const AI_PROMPT = `
Kamu adalah pakar Pengolahan Citra Digital dan identifikasi kematangan buah.

Analisis gambar yang diberikan.

Jawab HANYA dalam format JSON valid berikut.

{
  "nama_buah":"",
  "warna_dominan":"",
  "tekstur":"",
  "tingkat_kematangan":"",
  "keyakinan":0,
  "analisis":"",
  "rekomendasi":""
}

Kategori kematangan hanya boleh:

- Mentah
- Matang
- Terlalu Matang

Jangan memberikan markdown.
Jangan menggunakan \`\`\`json.
Jangan memberikan penjelasan selain JSON.
`;
async function analyzeImage(file) {
  try {
    const base64 = await imageToBase64(file);

    const body = {
      contents: [
        {
          parts: [
            {
              text: AI_PROMPT,
            },

            {
              inline_data: {
                mime_type: file.type,
                data: base64,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Gagal menghubungi Gemini API");
    }

    const data = await response.json();

    const text = data.candidates[0].content.parts[0].text;

    return cleanJSON(text);
  } catch (error) {
    console.error(error);

    return {
      nama_buah: "-",

      warna_dominan: "-",

      tekstur: "-",

      tingkat_kematangan: "Gagal",

      keyakinan: 0,

      analisis: error.message,

      rekomendasi: "-",
    };
  }
}
function cleanJSON(text) {
  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}

function getBadge(status) {
  switch (status) {
    case "Mentah":
      return "bg-primary";

    case "Matang":
      return "bg-success";

    case "Terlalu Matang":
      return "bg-danger";

    default:
      return "bg-secondary";
  }
}
/*=========================================
 Menampilkan Hasil ke Tabel
=========================================*/

function addResultToTable(no, file, imageSrc, data) {
  if (no === 1) {
    resultTable.innerHTML = "";
  }

  const row = document.createElement("tr");

  row.innerHTML = `
        <td>${no}</td>

        <td>
            <img src="${imageSrc}" class="result-image" width="80">
        </td>

        <td>${file.name}</td>

        <td>${data.nama_buah}</td>

        <td>${data.warna_dominan}</td>

        <td>
            <span class="badge ${getBadge(data.tingkat_kematangan)}">
                ${data.tingkat_kematangan}
            </span>
        </td>

        <td>${data.keyakinan}%</td>

        <td>
            <button class="btn btn-success btn-sm detail-btn">
                Detail
            </button>
        </td>
    `;

  const btn = row.querySelector(".detail-btn");

  btn.addEventListener("click", () => {
    showDetail(data);
  });

  resultTable.appendChild(row);
}
/*=========================================
 Modal Detail
=========================================*/

function showDetail(data) {
  const detailContent = document.getElementById("detailContent");

  detailContent.innerHTML = `

        <table class="table table-bordered">

            <tr>
                <th>Nama Buah</th>
                <td>${data.nama_buah}</td>
            </tr>

            <tr>
                <th>Warna Dominan</th>
                <td>${data.warna_dominan}</td>
            </tr>

            <tr>
                <th>Tekstur</th>
                <td>${data.tekstur}</td>
            </tr>

            <tr>
                <th>Tingkat Kematangan</th>
                <td>${data.tingkat_kematangan}</td>
            </tr>

            <tr>
                <th>Keyakinan AI</th>
                <td>${data.keyakinan}%</td>
            </tr>

        </table>

        <div class="alert alert-info">

            <h5>Analisis AI</h5>

            <p>${data.analisis}</p>

        </div>

        <div class="alert alert-success">

            <h5>Rekomendasi</h5>

            <p>${data.rekomendasi}</p>

        </div>

    `;

  const modal = new bootstrap.Modal(document.getElementById("detailModal"));

  modal.show();
}
/*=========================================
 Analisis Semua Gambar
=========================================*/

analyzeBtn.addEventListener("click", async () => {
  const apiKey = document.getElementById("apiKey").value.trim();

  if (!apiKey) {
    alert("Masukkan Gemini API Key terlebih dahulu.");
    return;
  }

  API_URL = `${CONFIG.ENDPOINT}/${CONFIG.MODEL}:generateContent?key=${apiKey}`;
  if (selectedImages.length === 0) {
    alert("Silakan pilih gambar terlebih dahulu.");
    return;
  }

  showLoading();

  resultTable.innerHTML = "";

  for (let i = 0; i < selectedImages.length; i++) {
    updateProgress(i + 1, selectedImages.length);

    const file = selectedImages[i];

    const imageSrc = URL.createObjectURL(file);

    const data = await analyzeImage(file);

    addResultToTable(i + 1, file, imageSrc, data);
  }

  hideLoading();

  alert("Analisis selesai.");
});
