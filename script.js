import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = window.auth;
  const db = window.db;

  // ------------------------------------------------------------------------UI елементи
  const searchInputs = Array.from(document.querySelectorAll("#searchInput"));
  const themeToggle = document.getElementById("themeToggle");
  const bandList = document.getElementById("bandList");
  const genreFilter = document.getElementById("genreFilter");
  const addBandForm = document.getElementById("addBandForm");
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  let currentRenderOptions = {
    page: "bands",
    search: "",
    genre: "all",
    sortByLikes: false,
    randomCount: 0,
    onlyLiked: false,
  };

  // -----------------------------------------------------------------------аутентифікація
  function registerUser(username, email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const usersRef = doc(db, "users", user.uid);
        return setDoc(usersRef, { username, email }).then(() => ({ ok: true }));
      })
      .catch((err) => ({ ok: false, message: err.message }));
  }

  function loginUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => ({ ok: true, user: userCredential.user }))
      .catch((err) => ({ ok: false, message: err.message }));
  }

  function logoutUser() {
    return signOut(auth);
  }

  // --------------------------------------------------------------------дані Firestore
  const bandsCol = collection(db, "bands");
  const likesCol = collection(db, "likes");
  const usersCol = collection(db, "users");

  async function getAllBands() {
    const snap = await getDocs(bandsCol);
    return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  }

  async function getBandByName(name) {
    const q = query(bandsCol, where("name", "==", name));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }

  async function addBand(bandObj) {
    await addDoc(bandsCol, bandObj);
  }

  async function updateBandLikes(bandId, newLikes) {
    const bdoc = doc(db, "bands", bandId);
    await updateDoc(bdoc, { likes: newLikes });
  }

  async function getUserLikes(uid) {
    const q = query(likesCol, where("uid", "==", uid));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    const docSnap = snap.docs[0];
    return { id: docSnap.id, data: docSnap.data() };
  }

  async function setUserLikes(uid, likedBandNames) {
    const existing = await getUserLikes(uid);
    if (existing && existing.id) {
      const likeDoc = doc(db, "likes", existing.id);
      await updateDoc(likeDoc, { likedBands: likedBandNames });
    } else {
      await addDoc(likesCol, { uid, likedBands: likedBandNames });
    }
  }

  // ---------------------------------------------------------------------------UI
  function updateHeaderUI(userData) {
    const headerNav = document.querySelector(".main-nav");
    if (!headerNav) return;
    document.getElementById("headerUserInfo")?.remove();
    document.getElementById("navLiked")?.remove();

    const likedA = document.createElement("a");
    likedA.href = "liked.html";
    likedA.id = "navLiked";
    likedA.textContent = "Вподобані";
    headerNav.appendChild(likedA);

    const container = document.createElement("div");
    container.id = "headerUserInfo";
    container.style.display = "inline-flex";
    container.style.alignItems = "center";
    container.style.gap = "10px";
    container.style.marginLeft = "12px";

    if (userData) {
      const nameSpan = document.createElement("span");
      nameSpan.textContent = userData.username || userData.email;
      nameSpan.style.fontWeight = "600";
      nameSpan.style.color = "var(--accent)";

      const logoutLink = document.createElement("a");
      logoutLink.href = "#";
      logoutLink.textContent = "Вийти";
      logoutLink.style.marginLeft = "8px";
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser().then(() => (location.href = "index.html"));
      });

      container.appendChild(nameSpan);
      container.appendChild(logoutLink);
    } else {
      const loginA = document.createElement("a");
      loginA.href = "login.html";
      loginA.textContent = "Увійти";

      const regA = document.createElement("a");
      regA.href = "register.html";
      regA.textContent = "Реєстрація";

      container.appendChild(loginA);
      container.appendChild(regA);
    }

    document.querySelector(".header-inner")?.appendChild(container);
  }

  function createBandCardElement(band, userLiked = false) {
    const card = document.createElement("div");
    card.className = "band-card";
    card.innerHTML = `
    <img src="${band.image}" alt="${band.name}">
    <h3>${escapeHtml(band.name)}</h3>
    <p><strong>Жанр:</strong> ${escapeHtml(band.genre)}</p>
    <p><strong>Рік:</strong> ${escapeHtml(String(band.year))}</p>
    <p>${escapeHtml(
      band.description.length > 100
        ? band.description.slice(0, 100) + "..."
        : band.description
    )}</p>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;">
      <a class="btn" href="band.html?name=${encodeURIComponent(
        band.name
      )}">Деталі</a>
      <button class="like-btn" data-band="${escapeHtml(
        band.name
      )}" aria-label="like"
        style="background:none;border:none;font-size:20px;cursor:pointer;">
        <span class="heart">${userLiked ? "❤️" : "🤍"}</span>
        <small class="like-count" style="margin-left:6px;">${
          band.likes || 0
        }</small>
      </button>
    </div>
  `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".like-btn")) return;
      window.location.href = `band.html?name=${encodeURIComponent(band.name)}`;
    });

    const likeBtn = card.querySelector(".like-btn");
    likeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!auth.currentUser) {
        alert("Увійдіть у акаунт, щоб ставити лайки!!!!!!!!!!!!!!");
        window.location.href = "login.html";
        return;
      }
      const bandName = likeBtn.dataset.band;
      const bandData = await getBandByName(bandName);
      if (!bandData) return;

      const userLikeObj = await getUserLikes(auth.currentUser.uid);
      const likedBands = userLikeObj.data?.likedBands || [];
      const isLiked = likedBands.includes(bandName);

      let newLikedBands, newLikesCount;
      if (isLiked) {
        newLikedBands = likedBands.filter((n) => n !== bandName);
        newLikesCount = (bandData.likes || 1) - 1;
      } else {
        newLikedBands = [...likedBands, bandName];
        newLikesCount = (bandData.likes || 0) + 1;
      }

      await setUserLikes(auth.currentUser.uid, newLikedBands);
      await updateBandLikes(bandData.id, newLikesCount);
      renderBandList(currentRenderOptions);
    });

    return card;
  }

  async function populateGenreFilter() {
    if (!genreFilter) return;
    const bands = await getAllBands();
    const genres = Array.from(new Set(bands.map((b) => b.genre))).sort();
    genreFilter.innerHTML = `<option value="all">Усі жанри</option>`;
    genres.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      genreFilter.appendChild(opt);
    });
  }

  async function renderBandList(options = {}) {
    currentRenderOptions = { ...currentRenderOptions, ...options };
    if (window.onlyLikedPage) {
      currentRenderOptions.onlyLiked = true;
    }
    if (!bandList) return;

    let bands = await getAllBands();

    if (currentRenderOptions.onlyLiked && auth.currentUser) {
      const userLikeObj = await getUserLikes(auth.currentUser.uid);
      const likedBands = userLikeObj.data?.likedBands || [];
      bands = bands.filter((b) => likedBands.includes(b.name));
    }

    if (currentRenderOptions.genre && currentRenderOptions.genre !== "all") {
      bands = bands.filter((b) => b.genre === currentRenderOptions.genre);
    }

    if (currentRenderOptions.search.trim() !== "") {
      const q = currentRenderOptions.search.toLowerCase();
      bands = bands.filter((b) => b.name.toLowerCase().includes(q));
    }

    if (currentRenderOptions.sortByLikes) {
      bands.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    bandList.innerHTML = "";
    if (bands.length === 0) {
      bandList.innerHTML = "<p>Нічого не знайдено 😔</p>";
      return;
    }

    const likedArr =
      (auth.currentUser &&
        (await getUserLikes(auth.currentUser.uid)).data?.likedBands) ||
      [];

    bands.forEach((b) => {
      const userLiked = likedArr.includes(b.name);
      bandList.appendChild(createBandCardElement(b, userLiked));
    });
  }

  searchInputs.forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const q = e.target.value;
      searchInputs.forEach((other) => (other.value = q));
      renderBandList({ search: q });
    });
  });

  if (genreFilter) {
    populateGenreFilter().then(() => {
      genreFilter.addEventListener("change", () => {
        renderBandList({ genre: genreFilter.value });
      });
    });

    const sortBtn = document.createElement("button");
    sortBtn.className = "btn";
    sortBtn.id = "sortByLikesBtn";
    sortBtn.textContent = "Сортувати за популярністю";
    sortBtn.style.marginLeft = "10px";
    genreFilter.parentNode?.appendChild(sortBtn);
    sortBtn.addEventListener("click", () => {
      const current = currentRenderOptions.sortByLikes || false;
      renderBandList({ sortByLikes: !current });
      sortBtn.style.opacity = !current ? "1" : "0.6";
    });
  }

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

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("regUsername").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value.trim();
      if (!username || !email || !password) {
        alert("Будь ласка, заповніть усі поля!!!!!");
        return;
      }
      const res = await registerUser(username, email, password);
      if (!res.ok) {
        alert(res.message);
        return;
      }
      alert("Реєстрація успішна!");
      window.location.href = "login.html";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      if (!email || !password) {
        alert("Будь ласка, заповніть усі поля!!!!!!");
        return;
      }
      const res = await loginUser(email, password);
      if (!res.ok) {
        alert(res.message);
        return;
      }
      alert("Вхід успішний!");
      window.location.href = "index.html";
    });
  }

  if (addBandForm) {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        alert("Увійдіть, щоб додавати гурт!!!!!");
        window.location.href = "login.html";
        return;
      }

      addBandForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("bandName").value.trim();
        const year = document.getElementById("bandYear").value.trim();
        const genre = document.getElementById("genre").value.trim();
        const description = document.getElementById("bandDesc").value.trim();
        const spotify = document.getElementById("bandSpotify").value.trim();
        const imageInput = document.getElementById("bandImage");

        if (
          !name ||
          !year ||
          !genre ||
          !description ||
          !spotify ||
          !imageInput
        ) {
          alert("Будь ласка, заповніть усі поля!!!!!!");
          return;
        }

        const file = imageInput.files[0];
        const finishAdd = async (imageSrc) => {
          const allBands = await getAllBands();
          if (allBands.some((b) => b.name === name)) {
            alert("Гурт з такою назвою вже існує");
            return;
          }
          await addBand({
            name,
            year,
            genre,
            description,
            image: imageSrc,
            spotify,
            likes: 0,
          });
          alert("Гурт успішно додано!");
          window.location.href = "bands.html";
        };

        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => finishAdd(ev.target.result);
          reader.readAsDataURL(file);
        } else {
          finishAdd("");
        }
      });
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const udoc = await getDoc(doc(db, "users", user.uid));
      const userData = udoc.exists() ? udoc.data() : { email: user.email };
      updateHeaderUI(userData);
    } else {
      updateHeaderUI(null);
    }
    renderBandList(currentRenderOptions);
  });

  renderBandList(currentRenderOptions);

  function escapeHtml(text) {
    if (typeof text !== "string") return text;
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
