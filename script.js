document.addEventListener("DOMContentLoaded", () => {
  const bandList = document.getElementById("bandList");
  const addBandForm = document.getElementById("addBandForm");
  const searchInput = document.querySelector("#searchInput");
  const themeToggle = document.getElementById("themeToggle");
  const registerForm = document.getElementById("registerForm");
  const genreFilter = document.getElementById("genreFilter");

  const sampleBands = [
    {
      name: "Imagine Dragons",
      year: 2008,
      genre: "Поп-рок",
      description:
        "Американський гурт із Лас-Вегаса, відомий хітами Believer, Demons та Thunder.",
      image: "images/default_band.png",
      video: "https://www.youtube.com/embed/7wtfhZwyrcc",
    },
    {
      name: "Coldplay",
      year: 1996,
      genre: "Альтернативний рок",
      description:
        "Британський гурт із мелодійним звучанням та піснями Yellow, Viva La Vida, Paradise.",
      image: "images/default_band.png",
      video: "https://www.youtube.com/embed/dvgZkm1xWPE",
    },
  ];

  function getBands() {
    const data = localStorage.getItem("bands");
    return data ? JSON.parse(data) : sampleBands;
  }

  function saveBands(bands) {
    localStorage.setItem("bands", JSON.stringify(bands));
  }

  // Фільтрація і рендер
  function renderBandList(searchText = "") {
    if (!bandList) return;
    const bands = getBands();

    let filtered = bands;

    // фільтр по жанру
    if (genreFilter && genreFilter.value !== "all") {
      filtered = filtered.filter((b) => b.genre === genreFilter.value);
    }

    // пошук
    if (searchText) {
      filtered = filtered.filter((b) =>
        b.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    bandList.innerHTML = "";

    if (filtered.length === 0) {
      bandList.innerHTML = "<p>Нічого не знайдено 😔</p>";
      return;
    }

    filtered.forEach((band) => {
      const card = document.createElement("div");
      card.className = "band-card";
      card.innerHTML = `
        <img src="${band.image}" alt="${band.name}">
        <h3>${band.name}</h3>
        <p><strong>Жанр:</strong> ${band.genre}</p>
        <p><strong>Рік створення:</strong> ${band.year}</p>
        <p>${
          band.description.length > 100
            ? band.description.slice(0, 100) + "..."
            : band.description
        }</p>

        <a href="${
          band.video
        }" target="_blank" class="btn">Перейти на сторінку гурту</a>
      `;

      // --- робимо картку клікабельною для перегляду детальної сторінки ---
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        const url = `band.html?name=${encodeURIComponent(band.name)}`;
        window.location.href = url;
      });

      bandList.appendChild(card);
    });
  }

  // заповнення списку жанрів
  function populateGenreFilter() {
    if (!genreFilter) return;
    const bands = getBands();
    const genres = [...new Set(bands.map((b) => b.genre))];
    genreFilter.innerHTML = '<option value="all">🎧 Всі жанри</option>';
    genres.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      genreFilter.appendChild(opt);
    });
  }

  // додавання гурту
  if (addBandForm) {
    addBandForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("bandName").value.trim();
      const year = document.getElementById("bandYear").value.trim();
      const genre = document.getElementById("genre").value.trim();
      const description = document.getElementById("bandDesc").value.trim();
      const video = document.getElementById("bandVideo").value.trim();
      const imageFile = document.getElementById("bandImage").files[0];

      if (!name || !year || !genre || !description || !video || !imageFile) {
        alert("Будь ласка, заповніть усі поля!");
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const imageBase64 = ev.target.result;
        const newBand = {
          name,
          year,
          genre,
          description,
          image: imageBase64,
          video,
        };

        const bands = getBands();
        bands.push(newBand);
        saveBands(bands);

        alert("✅ Гурт успішно додано!");
        window.location.href = "groups.html";
      };
      reader.readAsDataURL(imageFile);
    });
  }

  // Реєстрація користувача
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!username || !email || !password) {
        alert("Заповніть усі поля!");
        return;
      }

      const users = JSON.parse(localStorage.getItem("users") || "[]");
      if (users.some((u) => u.email === email)) {
        alert("Користувач з таким email вже існує!");
        return;
      }

      users.push({ username, email, password });
      localStorage.setItem("users", JSON.stringify(users));
      alert("Реєстрація успішна!");
      window.location.href = "index.html";
    });
  }

  // Темна тема
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const dark = document.body.classList.contains("dark-theme");
      themeToggle.textContent = dark ? "🌙" : "🌞";
      localStorage.setItem("theme", dark ? "dark" : "light");
    });
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-theme");
      themeToggle.textContent = "🌙";
    }
  }

  // ініціалізація
  populateGenreFilter();
  renderBandList();

  if (searchInput) {
    searchInput.addEventListener("input", () =>
      renderBandList(searchInput.value)
    );
  }
  if (genreFilter) {
    genreFilter.addEventListener("change", () =>
      renderBandList(searchInput.value)
    );
  }
});
